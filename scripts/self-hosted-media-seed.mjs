import { createHash, randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, lstat, readFile, open, rename, chmod, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';

// Original Drive connector download streams rotate between provider regions.
const isDriveStream = hostname => /^sdmnt[a-z0-9-]+\.oaiusercontent\.com$/.test(hostname);
const isGoogle = hostname => ['drive.google.com', 'drive.usercontent.google.com', 'www.googleapis.com', 'drive.googleapis.com'].includes(hostname) || hostname === 'googleusercontent.com' || hostname.endsWith('.googleusercontent.com');
const sha = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const MAX_SOURCE_BYTES = 256 * 1024 * 1024;
const FILES = Object.freeze({ video: 'testimonials.mp4', poster: 'poster.jpg', manifest: '.testimonial-manifest.json' });
export class MediaSeedError extends Error {
  constructor(code) { super(`Approved testimonial media preparation failed (${code}).`); this.name = 'MediaSeedError'; this.code = code; }
}
function sourceUrl(value) {
  try { const url = new URL(value); if (url.protocol === 'https:' && !url.username && !url.password && (isDriveStream(url.hostname) || isGoogle(url.hostname))) return url; } catch { /* Do not include a signed URL in any error. */ }
  throw new MediaSeedError('SOURCE_NOT_ALLOWED');
}
async function fileHash(path, maxBytes = MAX_SOURCE_BYTES) {
  const info = await lstat(path); if (!info.isFile() || info.size < 1 || info.size > maxBytes) throw new MediaSeedError('INVALID_MEDIA_FILE');
  const hash = createHash('sha256'); for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest('hex');
}
async function validFile(path, expected, maxBytes) { try { return sha(expected) && await fileHash(path, maxBytes) === expected.toLowerCase(); } catch { return false; } }
async function alreadyReady(directory, expectedSource) {
  try {
    const manifestPath = resolve(directory, FILES.manifest);
    const info = await lstat(manifestPath); if (!info.isFile() || info.size > 4096) return false;
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    return manifest.version === 1 && manifest.sourceSha256 === expectedSource && manifest.video?.file === FILES.video && manifest.poster?.file === FILES.poster && await validFile(resolve(directory, FILES.video), manifest.video.sha256) && await validFile(resolve(directory, FILES.poster), manifest.poster.sha256, 10 * 1024 * 1024);
  } catch { return false; }
}
async function remove(path) { try { await unlink(path); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
async function syncPath(path) { const file = await open(path, 'r'); try { await file.sync(); } finally { await file.close(); } }

async function downloadOriginal({ directory, url, expectedSha, fetchImpl, timeoutMs }) {
  const temporary = resolve(directory, `.download-${randomUUID()}.mp4`);
  const original = resolve(directory, `.original-${expectedSha}.mp4`);
  if (await validFile(original, expectedSha)) return { path: original, downloaded: false };
  const first = sourceUrl(url); let current = first; const streamSource = isDriveStream(first.hostname);
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), timeoutMs);
  let handle;
  try {
    let response;
    for (let count = 0; count <= 4; count++) {
      response = await fetchImpl(current.href, { redirect: 'manual', signal: controller.signal });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (count === 4) throw new MediaSeedError('TOO_MANY_REDIRECTS');
        const location = response.headers.get('location'); if (!location) throw new MediaSeedError('DOWNLOAD_FAILED');
        const next = sourceUrl(new URL(location, current).href);
        if (streamSource ? next.hostname !== first.hostname : !isGoogle(next.hostname)) throw new MediaSeedError('REDIRECT_NOT_ALLOWED');
        await response.body?.cancel(); current = next; continue;
      }
      break;
    }
    if (!response?.ok || !response.body || response.redirected) throw new MediaSeedError('DOWNLOAD_FAILED');
    const declared = Number(response.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_SOURCE_BYTES) throw new MediaSeedError('SOURCE_TOO_LARGE');
    handle = await open(temporary, 'wx', 0o600);
    let bytes = 0; const hash = createHash('sha256');
    for await (const part of response.body) {
      const chunk = Buffer.from(part); bytes += chunk.length;
      if (bytes > MAX_SOURCE_BYTES) throw new MediaSeedError('SOURCE_TOO_LARGE');
      hash.update(chunk); let offset = 0;
      while (offset < chunk.length) { const written = await handle.write(chunk, offset, chunk.length - offset); if (written.bytesWritten < 1) throw new MediaSeedError('DOWNLOAD_FAILED'); offset += written.bytesWritten; }
    }
    if (bytes < 1 || hash.digest('hex') !== expectedSha) throw new MediaSeedError('SOURCE_HASH_MISMATCH');
    await handle.sync(); await handle.close(); handle = undefined;
    await rename(temporary, original); await chmod(original, 0o600);
    return { path: original, downloaded: true };
  } catch (error) {
    if (error instanceof MediaSeedError) throw error;
    throw new MediaSeedError(controller.signal.aborted ? 'DOWNLOAD_TIMEOUT' : 'DOWNLOAD_FAILED');
  } finally { clearTimeout(timer); if (handle) await handle.close(); await remove(temporary); }
}

export function runMediaProcess(command, args, { timeoutMs = 20 * 60_000 } = {}) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    // Consume diagnostics without printing source metadata or signed locations.
    child.stderr.resume(); const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.once('error', () => { clearTimeout(timer); reject(new MediaSeedError('TRANSCODER_UNAVAILABLE')); });
    child.once('close', code => { clearTimeout(timer); if (code === 0) resolvePromise(); else reject(new MediaSeedError('TRANSCODE_FAILED')); });
  });
}

/** Direct original source -> this project's private named volume. No uploads.
 * Only two approved public files are published; transient source/manifest names
 * start with a dot and the standalone HTTP server never serves dot paths.
 */
export async function seedTestimonialMedia({ directory = '/media', source, sourceSha256, fetchImpl = globalThis.fetch, runProcess = runMediaProcess, timeoutMs = 180_000 } = {}) {
  if (!sha(sourceSha256) || typeof fetchImpl !== 'function' || typeof runProcess !== 'function' || !Number.isSafeInteger(timeoutMs) || timeoutMs < 1) throw new MediaSeedError('INVALID_CONFIGURATION');
  const expected = sourceSha256.toLowerCase(); await mkdir(directory, { recursive: true, mode: 0o755 }); await chmod(directory, 0o755);
  // A valid persisted output is sufficient even after the original URL expires.
  if (await alreadyReady(directory, expected)) { await remove(resolve(directory, `.original-${expected}.mp4`)); return { status: 'ready', downloaded: false, transcoded: false }; }
  const original = await downloadOriginal({ directory, url: source, expectedSha: expected, fetchImpl, timeoutMs });
  const id = randomUUID(); const video = resolve(directory, `.video-${id}.mp4`); const poster = resolve(directory, `.poster-${id}.jpg`); const manifestPath = resolve(directory, `.manifest-${id}.json`);
  try {
    await runProcess('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-protocol_whitelist', 'file,pipe', '-i', original.path, '-map', '0:v:0', '-map', '0:a:0?', '-vf', 'scale=-2:min(720\\,ih)', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '26', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-threads', '1', '-sn', '-dn', video]);
    await runProcess('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-ss', '15', '-protocol_whitelist', 'file,pipe', '-i', video, '-frames:v', '1', '-q:v', '3', poster]);
    const videoSha = await fileHash(video); const posterSha = await fileHash(poster, 10 * 1024 * 1024);
    await syncPath(video); await syncPath(poster);
    await chmod(video, 0o644); await chmod(poster, 0o644);
    const manifest = { version: 1, sourceSha256: expected, video: { file: FILES.video, sha256: videoSha }, poster: { file: FILES.poster, sha256: posterSha } };
    const file = await open(manifestPath, 'wx', 0o644); try { await file.writeFile(JSON.stringify(manifest)); await file.sync(); } finally { await file.close(); }
    await rename(video, resolve(directory, FILES.video)); await rename(poster, resolve(directory, FILES.poster));
    await rename(manifestPath, resolve(directory, FILES.manifest));
    await syncPath(directory);
    await remove(original.path); await syncPath(directory);
    return { status: 'ready', downloaded: original.downloaded, transcoded: true };
  } catch (error) { if (error instanceof MediaSeedError) throw error; throw new MediaSeedError('MEDIA_PUBLISH_FAILED'); }
  finally { await remove(video); await remove(poster); await remove(manifestPath); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { const result = await seedTestimonialMedia({ source: process.env.ACADEMY_TESTIMONIAL_SOURCE, sourceSha256: process.env.ACADEMY_TESTIMONIAL_SOURCE_SHA256 }); console.log(`Approved testimonial media ${result.status}; downloaded=${result.downloaded}; transcoded=${result.transcoded}.`); }
  catch (error) { console.error(`Approved testimonial media unavailable (${error instanceof MediaSeedError ? error.code : 'MEDIA_SEED_FAILED'}).`); process.exitCode = 1; }
}

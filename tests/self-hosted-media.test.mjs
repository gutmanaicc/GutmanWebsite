import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, writeFile, readdir, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { seedTestimonialMedia, runMediaProcess } from '../scripts/self-hosted-media-seed.mjs';

const source = 'https://sdmntprnortheu.oaiusercontent.com/original-drive-stream?private-token=must-not-log';
const original = Buffer.from('verified original fixture bytes');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const encodeMock = async (_command, args) => { await writeFile(args.at(-1), args.includes('-frames:v') ? Buffer.from('approved poster fixture') : Buffer.from('approved video fixture')); };
async function folder(t) { const directory = await mkdtemp(join(tmpdir(), 'academy-media-')); t.after(() => rm(directory, { recursive: true, force: true })); return directory; }

test('wrong source hash and unapproved redirect never publish or overwrite existing testimonial files or expose the signed source', async t => {
  const directory = await folder(t); await writeFile(join(directory, 'testimonials.mp4'), 'existing video'); await writeFile(join(directory, 'poster.jpg'), 'existing poster');
  let encoded = false;
  await assert.rejects(seedTestimonialMedia({ directory, source, sourceSha256: hash(original), fetchImpl: async () => new Response('wrong original bytes'), runProcess: async () => { encoded = true; } }), error => error.code === 'SOURCE_HASH_MISMATCH' && !error.message.includes('must-not-log') && !error.message.includes('oaiusercontent'));
  assert.equal(encoded, false); assert.equal(await readFile(join(directory, 'testimonials.mp4'), 'utf8'), 'existing video'); assert.equal(await readFile(join(directory, 'poster.jpg'), 'utf8'), 'existing poster');
  assert.deepEqual((await readdir(directory)).sort(), ['poster.jpg', 'testimonials.mp4']);
  let redirects = 0;
  await assert.rejects(seedTestimonialMedia({ directory, source, sourceSha256: hash(original), fetchImpl: async () => { redirects++; return new Response(null, { status: 302, headers: { location: 'https://unapproved-artifact.example.test/original' } }); }, runProcess: encodeMock }), error => error.code === 'SOURCE_NOT_ALLOWED' || error.code === 'REDIRECT_NOT_ALLOWED');
  assert.equal(redirects, 1); assert.equal(await readFile(join(directory, 'testimonials.mp4'), 'utf8'), 'existing video');
  await assert.rejects(seedTestimonialMedia({ directory, source, sourceSha256: hash(original), fetchImpl: async () => new Response(null, { status: 302, headers: { location: 'https://sdmntprukwest.oaiusercontent.com/original' } }), runProcess: encodeMock }), error => error.code === 'REDIRECT_NOT_ALLOWED');
});

test('successful preparation publishes only two files with manifest checksums/permissions; restart needs neither expired URL nor network', async t => {
  const directory = await folder(t); let downloads = 0;
  const regionalSource = source.replace('northeu', 'ukwest');
  const result = await seedTestimonialMedia({ directory, source: regionalSource, sourceSha256: hash(original), fetchImpl: async (_url, options) => { downloads++; assert.equal(_url, regionalSource); assert.equal(options.redirect, 'manual'); return new Response(original); }, runProcess: encodeMock });
  assert.deepEqual(result, { status: 'ready', downloaded: true, transcoded: true });
  const manifest = JSON.parse(await readFile(join(directory, '.testimonial-manifest.json'), 'utf8'));
  assert.equal(manifest.sourceSha256, hash(original)); assert.equal(manifest.video.sha256, hash(await readFile(join(directory, 'testimonials.mp4')))); assert.equal(manifest.poster.sha256, hash(await readFile(join(directory, 'poster.jpg'))));
  assert.ok(!JSON.stringify(manifest).includes('must-not-log')); assert.equal((await stat(join(directory, 'testimonials.mp4'))).mode & 0o777, 0o644); assert.equal((await stat(directory)).mode & 0o777, 0o755);
  assert.deepEqual((await readdir(directory)).sort(), ['.testimonial-manifest.json', 'poster.jpg', 'testimonials.mp4']);
  assert.deepEqual(await seedTestimonialMedia({ directory, source: undefined, sourceSha256: hash(original), fetchImpl: async () => assert.fail('Valid media must not redownload an expired private source'), runProcess: async () => assert.fail('Valid media must not retranscode') }), { status: 'ready', downloaded: false, transcoded: false });
  assert.equal(downloads, 1);
  await writeFile(join(directory, 'testimonials.mp4'), 'tampered output');
  await assert.rejects(seedTestimonialMedia({ directory, source: undefined, sourceSha256: hash(original), fetchImpl: async () => assert.fail('No allowed source supplied'), runProcess: encodeMock }), error => error.code === 'SOURCE_NOT_ALLOWED');
});

test('an interrupted encode retains only the hidden verified original, then recovers offline and removes original after atomic publication', async t => {
  const directory = await folder(t); await writeFile(join(directory, 'testimonials.mp4'), 'old public video');
  await assert.rejects(seedTestimonialMedia({ directory, source, sourceSha256: hash(original), fetchImpl: async () => new Response(original), runProcess: async (_command, args) => { await writeFile(args.at(-1), 'incomplete encode'); throw Error('private diagnostic'); } }), error => error.code === 'MEDIA_PUBLISH_FAILED' && !error.message.includes('private diagnostic'));
  assert.equal(await readFile(join(directory, 'testimonials.mp4'), 'utf8'), 'old public video');
  const cached = join(directory, `.original-${hash(original)}.mp4`); assert.equal(hash(await readFile(cached)), hash(original)); assert.equal((await stat(cached)).mode & 0o777, 0o600);
  assert.ok(!(await readdir(directory)).some(name => name.startsWith('.video-')));
  const recovered = await seedTestimonialMedia({ directory, source: undefined, sourceSha256: hash(original), fetchImpl: async () => assert.fail('The verified cached source must be reused'), runProcess: encodeMock });
  assert.equal(recovered.downloaded, false); assert.equal(recovered.transcoded, true); assert.ok(!(await readdir(directory)).includes(`.original-${hash(original)}.mp4`));
});

test('native ffmpeg generates playable 720-height H264/AAC faststart and a real JPEG from a synthetic local fixture without supplier calls', async t => {
  const directory = await folder(t); const fixture = join(directory, '.synthetic-input.mp4');
  await runMediaProcess('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-f', 'lavfi', '-i', 'color=c=blue:s=1280x1080:r=1', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=48000', '-t', '16', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-threads', '1', fixture]);
  const bytes = await readFile(fixture);
  const result = await seedTestimonialMedia({ directory, source, sourceSha256: hash(bytes), fetchImpl: async () => new Response(bytes) }); assert.equal(result.transcoded, true);
  const exec = promisify(execFile); const { stdout } = await exec('ffprobe', ['-v', 'error', '-show_streams', '-of', 'json', join(directory, 'testimonials.mp4')]);
  const streams = JSON.parse(stdout).streams; assert.equal(streams.find(stream => stream.codec_type === 'video').codec_name, 'h264'); assert.equal(streams.find(stream => stream.codec_type === 'video').height, 720); assert.equal(streams.find(stream => stream.codec_type === 'audio').codec_name, 'aac');
  const video = await readFile(join(directory, 'testimonials.mp4')); assert.ok(video.indexOf('moov') < video.indexOf('mdat'));
  const poster = await readFile(join(directory, 'poster.jpg')); assert.equal(poster.readUInt16BE(0), 0xffd8);
});

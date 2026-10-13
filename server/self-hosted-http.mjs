import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { extname, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.vtt': 'text/vtt; charset=utf-8', '.ico': 'image/x-icon', '.ics': 'text/calendar; charset=utf-8', '.webmanifest': 'application/manifest+json' };
function send(res, status, value) { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(value)); }
function responseShim(res) {
  res.status = status => { res.statusCode = status; return res; };
  res.json = value => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(value)); return res; };
  return res;
}
async function jsonBody(req) {
  if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) return { error: 415 };
  const chunks = []; let size = 0;
  for await (const chunk of req) { size += chunk.length; if (size > 16384) return { error: 413 }; chunks.push(chunk); }
  try { const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 400 }; return { body }; }
  catch { return { error: 400 }; }
}
const inside = (root, path) => path === root || (!relative(root, path).startsWith(`..${sep}`) && relative(root, path) !== '..' && !relative(root, path).startsWith(sep));
const PUBLIC_PAGES = new Set(['/', '/courses', '/courses/social-media-ai', '/courses/ai-video-content', '/courses/ai-business-owners', '/about', '/reviews', '/privacy', '/accessibility', '/terms', '/booking-terms']);

export async function loadSelfHostedApiHandlers(directory) {
  const handlers = new Map();
  for (const filename of await readdir(directory)) {
    if (!filename.endsWith('.js') || filename.startsWith('_') || filename === 'academy.js') continue;
    const module = await import(pathToFileURL(resolve(directory, filename)).href);
    if (typeof module.default !== 'function') throw new Error('A compiled API entry does not export a handler.');
    handlers.set(`/api/${filename.slice(0, -3)}`, module.default);
  }
  if (!handlers.has('/api/lead')) throw new Error('The existing lead API must be compiled before startup.');
  return handlers;
}

/** Serves only built public assets; native API paths can never fall back to HTML. */
export async function createSelfHostedServer({ runtime, staticDirectory, apiHandlers, preview = true, productionOrigin } = {}) {
  const root = await realpath(staticDirectory);
  if (!(await stat(root)).isDirectory() || !apiHandlers?.has('/api/lead')) throw new Error('A built public directory and compiled lead handler are required.');
  let canonical;
  if (!preview) {
    canonical = new URL(productionOrigin);
    if (canonical.protocol !== 'https:' || canonical.origin !== productionOrigin || canonical.username || canonical.password) throw new Error('Production hosting requires an exact canonical HTTPS origin.');
  }
  const serveStatic = async (req, res, pathname, indexable) => {
    let decoded;
    try { decoded = decodeURIComponent(pathname); } catch { send(res, 400, { error: 'invalid_path' }); return; }
    if (decoded.includes('\0') || decoded.includes('\\') || decoded.split('/').some(part => part.startsWith('.') || part === '..')) { send(res, 404, { error: 'not_found' }); return; }
    let candidate = resolve(root, `.${decoded === '/' ? '/index.html' : decoded}`);
    if (!inside(root, candidate)) { send(res, 404, { error: 'not_found' }); return; }
    let file; let metadata;
    try { file = await realpath(candidate); if (!inside(root, file)) { send(res, 404, { error: 'not_found' }); return; } metadata = await stat(file); if (!metadata.isFile()) { send(res, 404, { error: 'not_found' }); return; } }
    catch {
      if (pathname.startsWith('/assets/') || extname(decoded)) { send(res, 404, { error: 'not_found' }); return; }
      candidate = resolve(root, 'index.html'); file = await realpath(candidate);
      if (!inside(root, file)) { send(res, 404, { error: 'not_found' }); return; }
      metadata = await stat(file); if (!metadata.isFile()) { send(res, 404, { error: 'not_found' }); return; }
    }
    const headers = { 'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': relative(root, file).startsWith(`assets${sep}`) ? 'public, max-age=31536000, immutable' : extname(file) === '.html' ? 'no-cache' : 'public, max-age=3600', 'Accept-Ranges': 'bytes' };
    // One app serves production and its preview; previews and private routes
    // must remain noindex even when the image contains production HTML.
    if (extname(file) === '.html') {
      const body = (await readFile(file, 'utf8')).replace(/(<meta name="robots" content=")[^"]*("\s*\/?>)/, `$1${indexable ? 'index, follow' : 'noindex, nofollow'}$2`);
      res.writeHead(200, { ...headers, 'Content-Length': Buffer.byteLength(body) });
      res.end(req.method === 'HEAD' ? undefined : body); return;
    }
    // Browsers seek video files. A single byte range is served without loading the file into memory.
    let start = 0; let end = metadata.size - 1; let status = 200;
    if (req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      if (!match || (!match[1] && !match[2])) { res.writeHead(416, { 'Content-Range': `bytes */${metadata.size}` }); res.end(); return; }
      if (!match[1]) { const suffix = Number(match[2]); start = Math.max(0, metadata.size - suffix); } else start = Number(match[1]);
      if (match[1] && match[2]) end = Math.min(end, Number(match[2]));
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start > end || start >= metadata.size) { res.writeHead(416, { 'Content-Range': `bytes */${metadata.size}` }); res.end(); return; }
      status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${metadata.size}`;
    }
    headers['Content-Length'] = metadata.size === 0 ? 0 : end - start + 1;
    res.writeHead(status, headers);
    if (req.method === 'HEAD' || metadata.size === 0) { res.end(); return; }
    const stream = createReadStream(file, { start, end });
    stream.on('error', () => res.destroy()); res.on('close', () => stream.destroy()); stream.pipe(res);
  };
  return createServer({ requestTimeout: 60_000, headersTimeout: 15_000 }, async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff'); res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    try {
      const url = new URL(req.url, 'http://localhost'); const path = url.pathname;
      const host = String(req.headers.host ?? '').toLowerCase();
      const productionHost = !preview && host === canonical.host;
      if (!preview && host === `www.${canonical.hostname}`) {
        res.writeHead(308, { Location: `${canonical.origin}${url.pathname}${url.search}`, 'Cache-Control': 'no-store' }); res.end(); return;
      }
      const indexable = productionHost && PUBLIC_PAGES.has(path);
      if (!indexable) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
      if (path === '/robots.txt' && ['GET', 'HEAD'].includes(req.method)) {
        const body = productionHost ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nSitemap: ${canonical.origin}/sitemap.xml\n` : 'User-agent: *\nDisallow: /\n';
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache', 'Content-Length': Buffer.byteLength(body) }); res.end(req.method === 'HEAD' ? undefined : body); return;
      }
      if (path === '/healthz' && ['GET', 'HEAD'].includes(req.method)) { send(res, 200, { status: 'ok' }); return; }
      if (path === '/api/academy' || path.startsWith('/api/academy/')) { await runtime.handler(req, res); return; }
      if (path.startsWith('/api/')) {
        const handler = apiHandlers.get(path);
        if (!handler) { send(res, 404, { error: 'api_not_found' }); return; }
        if (req.headers.origin && !runtime.allowedOrigins.includes(req.headers.origin)) { send(res, 403, { error: 'origin_rejected' }); return; }
        res.setHeader('Cache-Control', 'no-store');
        req.query = Object.fromEntries(url.searchParams);
        if (req.method === 'POST') { const parsed = await jsonBody(req); if (parsed.error) { send(res, parsed.error, { error: parsed.error === 413 ? 'body_too_large' : 'invalid_json' }); return; } req.body = parsed.body; }
        await handler(req, responseShim(res)); return;
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); send(res, 405, { error: 'method_not_allowed' }); return; }
      await serveStatic(req, res, path === '/payment-thanks' ? '/payment-thanks.html' : path, indexable);
    } catch { if (!res.headersSent) send(res, 503, { error: 'service_unavailable' }); else res.destroy(); }
  });
}

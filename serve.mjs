import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stampFromRequestUrl, stampHtmlAssets, stampModuleSpecifiers } from './cachebust.mjs';

const ROOT = fileURLToPath(new URL('./', import.meta.url));
const PORT = Number(process.env.PORT) || 4173;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.json': 'application/json',
};

function safePath(urlPath) {
  const raw = decodeURIComponent(urlPath.split('?')[0]);
  const rel = raw === '/' ? 'index.html' : raw.replace(/^\//, '');
  const root = normalize(ROOT);
  const full = normalize(join(root, rel));
  if (full !== root && !full.startsWith(root.endsWith(sep) ? root : root + sep)) return null;
  return full;
}

const server = createServer(async (req, res) => {
  try {
    const file = safePath(req.url || '/');
    if (!file) {
      res.writeHead(403);
      res.end();
      return;
    }
    const info = await stat(file).catch(() => null);
    if (!info || !info.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }
    const ext = extname(file);
    let body = await readFile(file);
    if (ext === '.js' || ext === '.html') {
      const stamp = stampFromRequestUrl(req.url || '/', String(Date.now()));
      const text = body.toString('utf8');
      body = Buffer.from(ext === '.js' ? stampModuleSpecifiers(text, stamp) : stampHtmlAssets(text, stamp));
    }
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    });
    res.end(body);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(String(err));
  }
});

server.listen(PORT, () => {
  console.log(`SkyFire-MVP http://localhost:${PORT} （模組快取破壞 + Cache-Control: no-store）`);
});

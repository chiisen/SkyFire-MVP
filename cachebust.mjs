import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';

// 為相對模組路徑加上 ?v=指紋，讓瀏覽器把每次建置當成新 URL。
export function stampModuleSpecifiers(code, stamp) {
  return code
    .replace(
      /(from\s*)(['"])(\.{1,2}\/[^'"]+\.(?:js|json))(?:\?[^'"]*)?\2/g,
      (_, kw, q, spec) => `${kw}${q}${spec}?v=${stamp}${q}`
    )
    .replace(
      /(import\s*)(['"])(\.{1,2}\/[^'"]+\.(?:js|json))(?:\?[^'"]*)?\2/g,
      (_, kw, q, spec) => `${kw}${q}${spec}?v=${stamp}${q}`
    );
}

// 為 HTML 的模組與樣式連結加上同一指紋。
export function stampHtmlAssets(html, stamp) {
  return html.replace(
    /((?:src|href)=)(['"])(\.\/(?:src\/)?[^'"]+\.(?:js|css))(?:\?[^'"]*)?\2/g,
    (_, attr, q, spec) => `${attr}${q}${spec}?v=${stamp}${q}`
  );
}

async function listFiles(dir, prefix = '') {
  const names = await readdir(dir);
  const out = [];
  for (const name of names) {
    const rel = prefix ? `${prefix}/${name}` : name;
    const file = new URL(name, dir);
    if ((await stat(file)).isDirectory()) out.push(...(await listFiles(new URL(name + '/', dir), rel)));
    else out.push({ rel, file });
  }
  return out;
}

// 依 src 與入口 HTML 內容算出短指紋（檔案順序固定）。
export async function contentStamp(root = new URL('./', import.meta.url)) {
  const hash = createHash('sha256');
  const srcDir = new URL('./src/', root);
  const files = await listFiles(srcDir, 'src');
  files.push({ rel: 'index.html', file: new URL('./index.html', root) });
  files.sort((a, b) => a.rel.localeCompare(b.rel));
  for (const { rel, file } of files) {
    if (!/\.(js|css|html|json)$/.test(rel)) continue;
    hash.update(rel);
    hash.update('\0');
    hash.update(await readFile(file));
    hash.update('\0');
  }
  return hash.digest('hex').slice(0, 10);
}

import { mkdir, copyFile, rm, readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { contentStamp, stampHtmlAssets, stampModuleSpecifiers } from './cachebust.mjs';

// 零依賴 minify：字串感知（單/雙引號、模板字面量含 ${} 巢狀），只剝註解並壓空白。
// 約束：原始碼不得含正則字面量（已驗證無）與 `+ +` / `- -` 相鄰運算（以空白守衛保留）。
function stripMinify(src, { lineComment }) {
  let out = '',
    i = 0;
  const n = src.length;
  const stack = []; // ' or " or ` （模板內 ${} 以 { 計數回到模板）
  let braces = 0;
  const isWord = (c) => /[\w$]/.test(c);
  while (i < n) {
    const c = src[i],
      next = i + 1 < n ? src[i + 1] : '';
    const mode = stack.length ? stack[stack.length - 1] : null;
    if (mode === "'" || mode === '"') {
      out += c;
      if (c === '\\') {
        out += next;
        i += 2;
        continue;
      }
      if (c === mode) stack.pop();
      i++;
      continue;
    }
    if (mode === '`') {
      out += c;
      if (c === '\\') {
        out += next;
        i += 2;
        continue;
      }
      if (c === '`') stack.pop();
      else if (c === '$' && next === '{') {
        out += next;
        stack.push('{');
        braces = 1;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (mode === '{') {
      if (c === "'" || c === '"' || c === '`') {
        stack.push(c);
        out += c;
        i++;
        continue;
      }
      if (c === '{') braces++;
      if (c === '}') {
        if (--braces === 0) stack.pop();
      }
      // 落到下方一般處理（含註解判斷）。
    } else if (c === "'" || c === '"' || c === '`') {
      stack.push(c);
      out += c;
      i++;
      continue;
    }
    if (c === '/' && next === '/' && lineComment) {
      while (i < n && src[i] !== '\n') i++;
      continue;
    }
    if (c === '/' && next === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }
    if (/\s/.test(c)) {
      let j = i + 1;
      while (j < n && /\s/.test(src[j])) j++;
      const last = out[out.length - 1] || '',
        ahead = j < n ? src[j] : '';
      if (isWord(last) && isWord(ahead)) out += ' ';
      else if ((last === '+' || last === '-') && ahead === last) out += ' ';
      i = j;
      continue;
    }
    out += c;
    i++;
  }
  return out;
}

const minifyJs = (src) => stripMinify(src, { lineComment: true });
const minifyCss = (src) => stripMinify(src, { lineComment: false });

// 遞迴鏡像 src/：.js/.css 走 minify，其餘原樣複製；回傳 [原始位元組, 輸出位元組]。
async function mirrorDir(from, to) {
  let raw = 0,
    out = 0;
  await mkdir(to, { recursive: true });
  for (const name of await readdir(from)) {
    const src = new URL(name, from + '/'),
      dest = new URL(name, to + '/');
    if ((await stat(src)).isDirectory()) {
      const [r, o] = await mirrorDir(src, dest);
      raw += r;
      out += o;
      continue;
    }
    const text = await readFile(src, 'utf8');
    raw += text.length;
    let built = text;
    if (name.endsWith('.js')) built = minifyJs(text);
    else if (name.endsWith('.css')) built = minifyCss(text);
    out += built.length;
    await writeFile(dest, built);
  }
  return [raw, out];
}

// dist 鏡像原始碼佈局（index.html 參照 ./src/ 路徑不變，檔名不變）。
const output = new URL('./dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'icon.svg']) {
  await copyFile(new URL(file, import.meta.url), new URL(file, output));
}
const [raw, min] = await mirrorDir(new URL('./src/', import.meta.url), new URL('./dist/src/', import.meta.url));
// 每個輸出 JS 都過 node --check，minify 壞了立刻失敗。
async function checkDir(dir) {
  for (const name of await readdir(dir)) {
    const file = new URL(name, dir + '/');
    if ((await stat(file)).isDirectory()) {
      await checkDir(file);
      continue;
    }
    if (name.endsWith('.js')) execFileSync(process.execPath, ['--check', fileURLToPath(file)]);
  }
}
const stamp = await contentStamp();
async function stampDir(dir) {
  for (const name of await readdir(dir)) {
    const file = new URL(name, dir + '/');
    if ((await stat(file)).isDirectory()) {
      await stampDir(file);
      continue;
    }
    if (!name.endsWith('.js')) continue;
    await writeFile(file, stampModuleSpecifiers(await readFile(file, 'utf8'), stamp));
  }
}
await stampDir(new URL('./dist/src/', import.meta.url));
const distIndex = new URL('./dist/index.html', import.meta.url);
await writeFile(distIndex, stampHtmlAssets(await readFile(distIndex, 'utf8'), stamp));
await checkDir(new URL('./dist/src/', import.meta.url));
console.log(
  `Built SkyFire-MVP: no runtime dependencies, src ${((1 - min / raw) * 100).toFixed(1)}% smaller after minify, cache stamp ${stamp}.`
);

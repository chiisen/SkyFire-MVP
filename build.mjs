import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
// dist 鏡像原始碼佈局（index.html 參照 ./src/ 路徑不變）。
const output = new URL('./dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'icon.svg']) {
  await copyFile(new URL(file, import.meta.url), new URL(file, output));
}
// 整個 src/ 遞迴複製（含 render/ 子模組）。
await cp(new URL('./src/', import.meta.url), new URL('./dist/src/', import.meta.url), { recursive: true });
console.log('Built SkyFire-MVP: local files mirrored, no runtime dependencies.');

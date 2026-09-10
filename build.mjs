import { mkdir, copyFile, rm } from 'node:fs/promises';
// dist 鏡像原始碼佈局（index.html 參照 ./src/ 路徑不變）。
const output = new URL('./dist/', import.meta.url);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
await mkdir(new URL('./dist/src/', import.meta.url), { recursive: true });
for (const file of ['index.html', 'icon.svg']) {
  await copyFile(new URL(file, import.meta.url), new URL(file, output));
}
for (const file of ['style.css', 'app.js', 'engine.js', 'data.js', 'render.js', 'airframes.js', 'audio.js']) {
  await copyFile(new URL(`./src/${file}`, import.meta.url), new URL(`./src/${file}`, output));
}
console.log('Built SkyFire-MVP: 9 local files, no runtime dependencies.');

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { contentStamp, stampFromRequestUrl, stampHtmlAssets, stampModuleSpecifiers } from '../cachebust.mjs';

describe('模組快取破壞', () => {
  it('相對 from／export 與 side-effect import 都加上指紋', () => {
    const js = stampModuleSpecifiers(
      `import { a } from './a.js';\nexport { b } from '../b.js?v=old';\nimport './c.js';`,
      'deadbeef'
    );
    assert.equal(js.includes("from './a.js?v=deadbeef'"), true);
    assert.equal(js.includes("from '../b.js?v=deadbeef'"), true);
    assert.equal(js.includes("import './c.js?v=deadbeef'"), true);
    assert.equal(js.includes('?v=old'), false);
    const min = stampModuleSpecifiers(`export{drawAirframe}from'./airframes/project.js';`, 'cafebabe');
    assert.equal(min.includes("from'./airframes/project.js?v=cafebabe'"), true);
    const json = stampModuleSpecifiers(`import SHIPS from './data/ships.json' with { type: 'json' };`, 'aa11bb22cc');
    assert.equal(json.includes("from './data/ships.json?v=aa11bb22cc'"), true);
  });

  it('HTML 的 script 與 stylesheet 加上指紋', () => {
    const html = stampHtmlAssets(
      `<link rel="stylesheet" href="./src/style.css" />\n<script type="module" src="./src/app.js"></script>`,
      'abc123'
    );
    assert.equal(html.includes('href="./src/style.css?v=abc123"'), true);
    assert.equal(html.includes('src="./src/app.js?v=abc123"'), true);
  });

  it('請求 URL 的 ?v= 作為整條模組鏈指紋', () => {
    assert.equal(stampFromRequestUrl('/src/app.js?v=1712000000000', 'fallback'), '1712000000000');
    assert.equal(stampFromRequestUrl('/src/app.js', 'fallback'), 'fallback');
  });

  it('內容指紋為十碼十六進位且穩定', async () => {
    const a = await contentStamp();
    const b = await contentStamp();
    assert.equal(a, b);
    assert.match(a, /^[0-9a-f]{10}$/);
  });
});

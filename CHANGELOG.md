# 變更日誌

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 格式，
所有內容以繁體中文撰寫。

## [Unreleased]

### 變更

- 新增結構化 AI Agent 診斷紀錄：保留最近 2,000 筆事件、固定步驟與遊戲狀態快照，並透過 `window.__SKYFIRE_DEBUG__` 匯出 JSON

- 戰役固定表改由 JSON 載入：戰機、武器、關卡、升級卡與畫布／計時常數（`src/data/*.json`，`data.js` 再匯出原名稱）
- 三台可操作戰機固定資料改由 `src/data/ships.json` 載入
- 三台可操作戰機名稱改為金、銀、銅
- 可操作戰機電能兩道由機身接到左右翼尖（過載加亮；金／銀／銅各有對應色；減動畫則改靜態）
- 三台可操作戰機塗裝改為可辨識的金、銀、銅：主色平塗、機庫光環隨選機
- 介面色調改為深綠夜色：頁面、機櫃、HUD 外框與對話框由藍灰改綠灰，金色強調與戰鬥內彈幕／掉落色不變
- 三份專案規範 §2 新增模組快取規則：開發每次載入換新 `?v=` 並沿 import 鏈傳遞，建置產物用內容指紋

- `SPEC.md` §2：複用出處以規格書清單為準，README 不另行註明

### 優化

- 開發以 `npm start` 每次載入換新 `?v=` 並沿 import 鏈傳遞，避免一般分頁卡舊模組；建置產物仍用內容指紋
- 背景靜層預渲染：底色按關快取、遮罩＋掃描線五關共用，每幀兩次貼圖取代漸層新建與 200 次描邊，無 DOM 時自動退回舊路徑；附 `tests/background.test.mjs` 3 項回歸測試
- 碰撞與小修：子彈/敵彈先距離平方粗排再精確計算（分裂排程不受影響）、`segmentDistance` 改 `sqrt` 並增平方版、敵機規格表移模組常量、掉落磁吸只在圈內開根號；觸控矩形一次快取、血條/充能/進度改 `transform` 避重排；附 `tests/perf.test.mjs` 8 項回歸測試
- 自動駕駛全戰役模擬 `tests/autopilot.test.mjs`：固定步長真打通關（標準＋堡壘，732 秒、0 續戰、五首領擊破），驗證 600 秒下限與關卡推進
- 零配置容器：子彈命中集改小陣列、六處每幀過濾原地化、特效與掉落定額輪寫；附 `tests/perf.test.mjs` 6 項回歸測試
- 敵彈體 sprite 預渲染：圓彈本體按色按徑烘焙、每顆一次貼圖（2 倍超採樣，拖尾與詭雷維持向量）；附 `tests/sprite.test.mjs` 5 項回歸測試
- 尾焰 sprite 預渲染：同規格尾焰烘焙一次、每朵一次貼圖（縱向隨閃爍縮放，首領維持向量）；`tests/sprite.test.mjs` 追加 3 項回歸測試
- 圖片與建置：`demo.png`（136K）轉 `demo.webp`（16K）；`build.mjs` 零依賴 minify（JS/CSS 剝註解壓空白，佈局檔名不變，約小 29%，逐檔 `node --check`）；附 `tests/build.test.mjs` 3 項回歸測試（產物存在、更小、與源碼行為一致）

### 新增

- 完整規格書 `SPEC.md`：1:1 對標 Thunderfall，三戰機、五關戰役、四色武器、雙模式
- 專案規範 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md`（三份同步）
- 中文註解 `.gitignore`：建置輸出、Node、覆蓋率、環境變數、Vercel、OS 與編輯器雜檔
- `README.md` 簡介：玩法、技術棧與規格連結
- 可遊玩 MVP：`index.html`、`app.js`、`engine.js`、`data.js`、`render.js`、`airframes.js`、`audio.js`、`style.css`、`icon.svg`（Thunderfall CC0-1.0 程式碼級複用，繁中在地化並換 SkyFire 品牌）
- 引擎單元測試 `tests/engine.test.mjs`：27 項全綠；`build.mjs` 零依賴建置輸出 `dist/`
- Prettier：`.prettierrc`、`.prettierignore`、`format` / `format:check` 指令；三份規範同步要求註解一律繁體中文
- 程式碼搬進 `src/`（`index.html` 參照改 `./src/`，`build.mjs` 輸出鏡像佈局，測試 import 同步）
- 測試與註解繁中化；`README.md` 補啟動、玩法、操作表、建置說明與檔案用途表
- `src/` 全檔函式級繁中註解（113 行，零邏輯改動）
- `render.js` 拆分為 `render/` 子模組（`shared`／`background`／`units`／`combat`），`render.js` 留筒倉；`build.mjs` 改遞迴鏡像；附無頭渲染煙測 `tests/render.smoke.mjs`
- `engine.js` 拆分為 `engine/` 子模組（`utils`／`lifecycle`／`combat`／`enemies`／`progression`，混入組裝，對外 API 不變）
- `airframes.js` 拆分為 `airframes/` 子模組（`math`／`parts`／`ships`／`project`）
- `app.js` 拆分為 `app/` 子模組（顯式狀態物件 `S`：`state`／`hud`／`screens`／`input`／`frame`），附 DOM-stub 開機煙測 `tests/app.boot.mjs`
- 清除子模組多餘 import；新增 `.gitattributes` 統一 LF 斷行

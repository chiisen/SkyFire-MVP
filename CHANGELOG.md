# 變更日誌

本文件遵循 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/) 格式，
所有內容以繁體中文撰寫。

## [Unreleased]

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

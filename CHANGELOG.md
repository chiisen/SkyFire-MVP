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
- 引擎單元測試 `tests/engine.test.mjs`：27 項全綠；`build.mjs` 零依賴建置輸出 `dist/`；`metadata.json` 結構化資訊
- Prettier：`.prettierrc`、`.prettierignore`、`format` / `format:check` 指令；三份規範同步要求註解一律繁體中文

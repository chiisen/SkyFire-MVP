# SkyFire-MVP 專案規範（Gemini 專用）

> 與 `AGENTS.md`、`CLAUDE.md` 保持同步；三份內容一致，僅檔名對應不同 Agent。
> 本文件為專案級規則，優先權高於全域指南。

## 1. 專案概述

- 縱向彈幕射擊遊戲 MVP，1:1 對標 Thunderfall（CC0-1.0）。
- 完整規格見 [SPEC.md](./SPEC.md)； Thunderfall 資源採**程式碼級複用**（`airframes.js` / `render.js` / `audio.js` / `icon.svg`），倉庫內無二進位圖檔音檔。

## 2. 技術棧與約束

- 原生 JavaScript（ES Modules）+ Canvas 2D + Web Audio；**零第三方運行依賴**。
- 邏輯畫布 480×800；手機與桌面共用碰撞邏輯與戰鬥計時。
- 建置與測試僅用 Node.js 內建模組。

## 3. 常用指令

- 本機遊玩：`python3 -m http.server 4173` → `http://localhost:4173`
- 測試：`npm test`｜建置：`npm run build`（輸出 `dist/`）
- 檢查：`git diff --check`

## 4. 程式碼原則

- 簡潔至上（KISS）、微創異動：只改與任務直接相關的程式碼，不重構無關部分。
- 實作前先陳述假設；模糊處列方案與使用者確認，不擅自通靈。
- 修 Bug 附 Regression Test；異動後執行 `npx prettier --check .`（Prettier 設定見 `.prettierrc`）。
- 程式碼註解、文件說明一律使用**繁體中文**（禁簡體字）。

## 5. 協作與輸出

- 回覆、任務、Commit 一律使用**繁體中文**。
- Git Commit 格式：`<type>(<scope>): <subject>`，主旨與內容皆繁體中文。
- 提交前提問「是否開始 Git 提交流程？」經核准後執行。
- 根目錄 `CHANGELOG.md`（Keep a Changelog 格式，繁體中文）隨異動更新。

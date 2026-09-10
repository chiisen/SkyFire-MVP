# SkyFire-MVP

縱向彈幕射擊遊戲 MVP，原生 JavaScript + Canvas 2D + Web Audio，零第三方運行依賴。

- 三種戰機、四色武器、五關戰役（至少 10 分鐘有效戰鬥）
- 手機觸控與桌面鍵鼠皆可遊玩
- 完整規格見 [SPEC.md](./SPEC.md)

![demo](./images/demo.png)

## 啟動遊戲

需經 HTTP 伺服器開啟（ES Modules 不支援 `file://` 雙擊直開）：

```powershell
cd D:\github\chiisen\SkyFire-MVP
python -m http.server 4173
```

再以瀏覽器開啟 `http://localhost:4173`（若無 `python` 改用 `py`；port 被佔用可換數字）。

## 玩法說明

- 全程自動開火，玩家專注移動走位。
- 開局選一架戰機：**鷹隼**（均衡靈活）、**稜鏡**（高傷薄甲，雷射起步）、**堡壘**（重裝多炸彈）。
- 五關戰役，每關至少 120 秒；第 88 秒出首領，擊破才能前進；完整通關至少 10 分鐘。
- 擊落敵機掉四色武器：藍 P 散射、綠 L 穿透、紫 A 追蹤、金 N 爆裂；補給漂浮約 10 秒，同款拾取升級（最高 Lv.5）。
- 中央小光點才是受擊核心；貼近子彈可擦彈充能，蓄滿開 8 秒雷霆爆發（E）。
- 炸彈清彈保命（空白鍵）；標準模式致命一擊會自動炸彈，街機模式須手動。
- 關間三選一強化；戰機被擊毀最多續戰 3 次。

### 操作

| 動作     | 桌面                     | 手機                 |
| -------- | ------------------------ | -------------------- |
| 移動     | WASD / 方向鍵 / 滑鼠拖動 | 戰場任意位置按住拖動 |
| 精密低速 | Shift 或按鈕             | 「精密移動」按鈕     |
| 震盪炸彈 | 空白鍵或按鈕             | 「震盪炸彈」按鈕     |
| 雷霆爆發 | E 或按鈕（滿充能）       | 「雷霆爆發」按鈕     |
| 暫停     | P / Esc 或按鈕           | 暫停按鈕             |

## 開發指令

- 測試：`npm test`（27 項引擎單元測試）
- 格式：`npx prettier --check .`

### 建置（`npm run build`）

`build.mjs` 只用 Node.js 內建模組，把運行檔鏡像複製到 `dist/`（`index.html` 的 `./src/` 參照不變）：

```powershell
npm run build
```

```text
dist/
├── index.html
├── icon.svg
└── src/
    ├── app.js  engine.js  data.js  render.js
    ├── airframes.js  audio.js  style.css
    └── render/
        ├── shared.js  background.js
        └── units.js  combat.js
```

- 每次執行先清空 `dist/` 再重建；`dist/` 不進版控，發佈前重跑一次即可。
- 產物是純靜態站，任何靜態託管（Vercel、GitHub Pages、Nginx）皆可發佈；僅需 Node.js，不需安裝第三方套件。

## 檔案說明

| 檔案                                  | 用途                                                         |
| ------------------------------------- | ------------------------------------------------------------ |
| `index.html`                          | 遊戲入口：機庫、戰場畫布、HUD、覆蓋層、說明對話框的 DOM 結構 |
| `src/style.css`                       | 全站樣式：機庫、HUD、按鈕、手機版面                          |
| `src/app.js`                          | 頁面控制：輸入（鍵盤／觸控）、場景切換、HUD 更新、音效接線   |
| `src/engine.js`                       | 遊戲引擎：主迴圈、碰撞、敵機波次、彈幕、掉落、計時、暫停凍結 |
| `src/data.js`                         | 數值資料：戰機、武器、關卡、首領、升級卡                     |
| `src/render.js`                       | 繪製筒倉：轉出口 `drawShip`＋組幀 `drawFrame`                |
| `src/render/shared.js`                | 繪圖圖元與共用常數：多邊形／圓／光暈／裝甲板、色票、雜湊     |
| `src/render/background.js`            | 五關背景：海港／峽谷／工廠／軌道／晝夜調度                   |
| `src/render/units.js`                 | 作戰單位：尾焰、敵機、首領                                   |
| `src/render/combat.js`                | 戰鬥物件：雷射光束、彈丸、補給、特效                         |
| `src/airframes.js`                    | 戰機三維網格：建模、投影、九種側傾姿態快取                   |
| `src/audio.js`                        | 合成聲音：Web Audio 即時合成音效與背景音樂步進器，無音檔     |
| `icon.svg`                            | 瀏覽器分頁圖示                                               |
| `build.mjs`                           | 零依賴建置：複製 9 個運行檔至 `dist/`                        |
| `tests/engine.test.mjs`               | 引擎單元測試：27 項（Node 內建 `node:test`）                 |
| `package.json`                        | 專案資訊與 `test`／`build`／`format` 指令                    |
| `SPEC.md`                             | 完整規格書（對標 Thunderfall 1:1）                           |
| `CHANGELOG.md`                        | 變更日誌（Keep a Changelog，繁體中文）                       |
| `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` | 三份同步的 AI Agent 專案規範                                 |
| `.prettierrc`、`.prettierignore`      | Prettier 格式設定與排除路徑                                  |
| `.gitattributes`                      | 統一 LF 斷行，二進位圖檔聲明                                 |
| `dist/`                               | 建置輸出（不進版控）                                         |

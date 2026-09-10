# SkyFire-MVP

縱向彈幕射擊遊戲 MVP：1:1 對標 [Thunderfall](https://github.com/MartinDelophy/awesome-gpt-6-astra/tree/main/works/thunderfall)（CC0-1.0），原生 JavaScript + Canvas 2D + Web Audio，零第三方運行依賴。

- 三種戰機、四色武器、五關戰役（至少 10 分鐘有效戰鬥）
- 手機觸控與桌面鍵鼠皆可遊玩
- 完整規格見 [SPEC.md](./SPEC.md)

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

| 動作 | 桌面 | 手機 |
|---|---|---|
| 移動 | WASD / 方向鍵 / 滑鼠拖動 | 戰場任意位置按住拖動 |
| 精密低速 | Shift 或按鈕 | 「精密移動」按鈕 |
| 震盪炸彈 | 空白鍵或按鈕 | 「震盪炸彈」按鈕 |
| 雷霆爆發 | E 或按鈕（滿充能） | 「雷霆爆發」按鈕 |
| 暫停 | P / Esc 或按鈕 | 暫停按鈕 |

## 開發指令

- 測試：`npm test`（27 項引擎單元測試）
- 建置：`npm run build`（輸出 `dist/`，靜態託管即可發佈）
- 格式：`npx prettier --check .`

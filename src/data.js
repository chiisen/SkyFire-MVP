// SkyFire-MVP 戰役與數值資料入口：固定表由 src/data/*.json 載入後再匯出原名稱。
// 衍生自 Thunderfall（CC0-1.0）：數值 1:1 對標，文字改為繁體中文並換上 SkyFire 品牌。
// 武器 weight 是「已經掉落武器後」的條件機率，並非每次擊殺的掉落率。
import SHIPS from './data/ships.json' with { type: 'json' };
import WEAPONS from './data/weapons.json' with { type: 'json' };
import STAGES from './data/stages.json' with { type: 'json' };
import UPGRADES from './data/upgrades.json' with { type: 'json' };
import CONSTANTS from './data/constants.json' with { type: 'json' };

export { SHIPS, WEAPONS, STAGES, UPGRADES };
export const WIDTH = CONSTANTS.WIDTH;
export const HEIGHT = CONSTANTS.HEIGHT;
export const STAGE_SECONDS = CONSTANTS.STAGE_SECONDS;
export const BOSS_AT = CONSTANTS.BOSS_AT;
export const DROP_TTL = CONSTANTS.DROP_TTL;

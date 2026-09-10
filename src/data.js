// SkyFire-MVP 戰役與數值資料。
// 衍生自 Thunderfall（CC0-1.0）：數值 1:1 對標，文字改為繁體中文並換上 SkyFire 品牌。
// 運行機制見 engine.js。
export const WIDTH = 480;
export const HEIGHT = 800;
export const STAGE_SECONDS = 120;
export const BOSS_AT = 88;
export const DROP_TTL = 10;

export const SHIPS = [
  {
    id: 0,
    name: '鷹隼',
    code: 'F-01',
    role: '高速均衡型',
    description: '靈活轉向，均衡火力。適合穿梭彈幕、追逐補給。',
    color: '#ff756c',
    health: 5,
    shield: 2,
    speed: 330,
    damage: 1,
    fireRate: 1,
    bombStock: 2,
  },
  {
    id: 1,
    name: '稜鏡',
    code: 'P-02',
    role: '高能突擊型',
    description: '火力更強，裝甲較輕。把握攻擊窗口擊穿機群。',
    color: '#89b8ff',
    health: 4,
    shield: 2,
    speed: 300,
    damage: 1.08,
    fireRate: 1,
    bombStock: 2,
  },
  {
    id: 2,
    name: '堡壘',
    code: 'B-03',
    role: '重裝生存型',
    description: '厚重裝甲，額外炸彈。用持久生存換取反擊機會。',
    color: '#ffc875',
    health: 7,
    shield: 3,
    speed: 260,
    damage: 0.9,
    fireRate: 0.95,
    bombStock: 3,
  },
];

// 權重描述的是「已經掉落武器後」的條件機率，並非每次擊殺的掉落率。
// 是否掉落由運行時另行判定。
export const WEAPONS = {
  pulse: {
    name: '風暴脈衝',
    rarity: '藍色',
    color: '#69b9ff',
    label: 'P',
    description: '扇形散射覆蓋寬闊空域，適合清理分散敵機。',
    weight: 0.48,
  },
  laser: {
    name: '翡翠光束',
    rarity: '綠色',
    color: '#7af0b8',
    label: 'L',
    description: '高能雷射穿透前後目標，適合縱向機群與首領。',
    weight: 0.28,
  },
  arc: {
    name: '紫電追獵',
    rarity: '紫色',
    color: '#c795ff',
    label: 'A',
    description: '追蹤彈轉向尋找敵機，讓閃避時也能持續輸出。',
    weight: 0.18,
  },
  nova: {
    name: '日冕新星',
    rarity: '金色',
    color: '#ffd36b',
    label: 'N',
    description: '爆裂彈製造範圍傷害，適合擊破密集陣列。',
    weight: 0.06,
  },
};

export const STAGES = [
  {
    name: '晨曦海港',
    enName: 'DAWN HARBOR',
    bossName: '裂翼巡航艦',
    color: '#68ced9',
    description: '從深青色海港升空，在斥候編隊與扇形彈幕中打開航路。',
    bossHp: 6000,
    theme: 'coast',
    tip: '機身中央的小光點才是受擊核心。自動開火時專注移動。',
  },
  {
    name: '翡翠峽谷',
    enName: 'EMERALD CANYON',
    bossName: '峽谷織網者',
    color: '#87e4a7',
    description: '穿越層疊綠谷，辨認會橫向漂移的電弧彈。',
    bossHp: 10500,
    theme: 'canyon',
    tip: '漂移彈會改變橫向位置。保留側向空間，避免貼死邊緣。',
  },
  {
    name: '冰川陣列',
    enName: 'FROST ARRAY',
    bossName: '寒霜裁決者',
    color: '#a7e6ff',
    description: '掠過冰藍色陣列，在預警線亮起時躲開雷射封鎖。',
    bossHp: 16500,
    theme: 'ice',
    tip: '雷射先預警再發射；預警期間離開射線，別等光束點亮。',
  },
  {
    name: '熔核工廠',
    enName: 'MOLTEN FOUNDRY',
    bossName: '熔核雙生體',
    color: '#ff946b',
    description: '衝入橘紅色熔核工廠，在加速彈陣與交錯漂移彈之間尋路。',
    bossHp: 22000,
    theme: 'foundry',
    tip: '本關首領的雷射會掃動。預警後繼續觀察光束方向，保留側移空間。',
  },
  {
    name: '天穹核心',
    enName: 'SKY REACTOR',
    bossName: '天穹·終焉引擎',
    color: '#ffd277',
    description: '駛入暗金色深空核心，應對雷射、漂移彈與多階段首領的合圍。',
    bossHp: 28000,
    theme: 'core',
    tip: '炸彈可以解圍。留意充能與護盾，在安全窗口集中輸出。',
  },
];

export const UPGRADES = [
  { id: 'damage', name: '高能彈頭', description: '武器傷害 +15%。', tag: '火力' },
  { id: 'fireRate', name: '超頻砲組', description: '射速 +12%。', tag: '火力' },
  { id: 'hull', name: '複合裝甲', description: '機體上限 +1，並修復 2 點機體。', tag: '生存' },
  { id: 'shield', name: '相位護盾', description: '護盾上限 +1，並補滿護盾。', tag: '生存' },
  { id: 'magnet', name: '牽引力場', description: '補給吸附範圍 +32 像素。', tag: '補給' },
  { id: 'wingmen', name: '僚機編隊', description: '增加 1 架協同射擊的僚機，最多 2 架。', tag: '支援' },
  { id: 'bomb', name: '應急軍備', description: '補充 2 枚炸彈，庫存最多 5 枚。', tag: '支援' },
  { id: 'reactor', name: '聚能反應爐', description: '擦彈與擊殺獲得的充能 +30%。', tag: '充能' },
];

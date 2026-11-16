import * as THREE from 'three'

/**
 * 场景布局：9 个工序站位沿 X 轴一字排开，间距 9 个单位
 */
export const STATION_SPACING = 9
export const STATION_X = Array.from({ length: 9 }, (_, i) => i * STATION_SPACING - 36)

/**
 * 31 个部件的基座变换（位置 / 旋转 / 缩放）
 * 位置为世界坐标，爆炸偏移在 parts.js 的 explode 字段中定义
 */
export const PART_TRANSFORMS = {
  // 0 原料场
  'raw-yard': { position: [-36, 0.15, 0], scale: 1 },
  'ore-pile': { position: [-37.6, 0.15, -2.6], scale: 1 },
  'coal-pile': { position: [-34.4, 0.15, -2.6], scale: 1 },
  'belt-conveyor': { position: [-36, 3.4, 2.9], rotation: [0, 0, 0], scale: 1 },

  // 1 烧结
  'sinter-mixer': { position: [-29.2, 1.7, 1.6], rotation: [0, 0, Math.PI / 2], scale: 1 },
  'sinter-machine': { position: [-27, 0.9, -1.2], scale: 1 },
  'sinter-cooler': { position: [-24.8, 1.4, 1.6], scale: 1 },

  // 2 高炉
  'hot-stove': { position: [-21, 0, 2.2], scale: 1 },
  'blast-furnace-top': { position: [-18, 10.6, 0], scale: 1 },
  'blast-furnace': { position: [-18, 0, 0], scale: 1 },
  tapping: { position: [-18, 0.6, 3.1], rotation: [0, 0, 0], scale: 1 },
  torpedo: { position: [-14.6, 0.9, 3.4], rotation: [0, 0, Math.PI / 2], scale: 1 },

  // 3 转炉
  'scrap-bucket': { position: [-11.4, 0.8, -2.2], scale: 1 },
  converter: { position: [-9, 0, 0], scale: 1 },
  'oxygen-lance': { position: [-9, 7.6, 0], scale: 1 },
  ladle: { position: [-6.6, 0, 2.1], scale: 1 },

  // 4 精炼
  'lf-furnace': { position: [-2, 0, 0], scale: 1 },
  'rh-degasser': { position: [2.2, 0, 0], scale: 1 },
  'alloy-station': { position: [0, 0, -3.1], scale: 1 },

  // 5 连铸
  tundish: { position: [7.6, 3.4, -1.6], scale: 1 },
  mold: { position: [9.4, 2.1, -1.6], scale: 1 },
  'secondary-cooling': { position: [11.6, 1.2, 0.4], scale: 1 },
  'torch-cutter': { position: [13.8, 1.1, 1.6], scale: 1 },

  // 6 加热炉
  'reheat-furnace': { position: [18, 0, 0], scale: 1 },
  'furnace-burner': { position: [15.7, 2.1, 0], scale: 1 },
  'heat-exchanger': { position: [20.8, 0, -2.4], scale: 1 },

  // 7 热轧
  descaling: { position: [23.4, 0, 0], scale: 1 },
  'roughing-mill': { position: [25.6, 0, 0], scale: 1 },
  'finishing-mill': { position: [29.2, 0, 0], scale: 1 },
  'runout-table': { position: [32.4, 0.6, 0], scale: 1 },

  // 8 卷取
  downcoiler: { position: [35.2, 0, 0], scale: 1 },
  'coil-yard': { position: [38.2, 0.1, 2.2], scale: 1 }
}

/**
 * 物料主路径（Catmull-Rom 样条控制点）
 * 从原料场一路经过炉顶、出铁、转炉、精炼、连铸、轧线到钢卷库
 */
const PATH_POINTS = [
  [-40, 1.6, 2.9],
  [-31, 1.6, 2.9],
  [-29.2, 2.4, 1.6],
  [-27, 2.2, -1.2],
  [-24.8, 2.2, 1.6],
  [-21, 4.2, 2.2],
  [-18, 11.2, 0],
  [-18, 1.4, 3.1],
  [-14.6, 1.8, 3.4],
  [-9, 4.2, 1.4],
  [-6.6, 2.4, 2.1],
  [-2, 3.4, 0],
  [2.2, 4.2, 0],
  [7.6, 4, -1.6],
  [9.4, 2.6, -1.6],
  [11.6, 2, 0.4],
  [13.8, 1.8, 1.6],
  [18, 2.4, 0],
  [23.4, 2, 0],
  [25.6, 2.4, 0],
  [29.2, 2.4, 0],
  [32.4, 1.8, 0],
  [35.2, 2.2, 0],
  [38.2, 1.8, 2.2]
].map((p) => new THREE.Vector3(...p))

export const FLOW_CURVE = new THREE.CatmullRomCurve3(PATH_POINTS, false, 'catmullrom', 0.35)

/** 沿路径运动的物料包数量 */
export const PACKET_COUNT = 7

/**
 * 粒子发射点配置
 * stage: 所属工序，仅在该工序播放时段激活；-1 表示常驻环境粒子
 */
export const EMITTERS = [
  { id: 'sinter-ignition', kind: 'flame', stage: 1, position: [-27, 2.6, -1.2], count: 90, spread: 0.5 },
  { id: 'bf-top-vent', kind: 'steam', stage: -1, position: [-18, 12.4, 0], count: 70, spread: 0.4, rate: 0.4 },
  { id: 'tap-spark', kind: 'spark', stage: 2, position: [-16.6, 1.6, 3.3], count: 160, spread: 0.5 },
  { id: 'converter-flame', kind: 'flame', stage: 3, position: [-9, 6.6, 0], count: 150, spread: 0.9 },
  { id: 'lf-arc', kind: 'spark', stage: 4, position: [-2, 4.4, 0], count: 130, spread: 0.7 },
  { id: 'rh-smoke', kind: 'steam', stage: 4, position: [2.2, 6.4, 0], count: 80, spread: 0.5 },
  { id: 'caster-steam', kind: 'steam', stage: 5, position: [11.6, 2.8, 0.4], count: 120, spread: 0.7 },
  { id: 'cut-spark', kind: 'spark', stage: 5, position: [13.8, 2, 1.6], count: 140, spread: 0.5 },
  { id: 'furnace-flame', kind: 'flame', stage: 6, position: [16.2, 3, 0], count: 120, spread: 0.7 },
  { id: 'exchanger-smoke', kind: 'steam', stage: -1, position: [20.8, 5.2, -2.4], count: 60, spread: 0.4, rate: 0.45 },
  { id: 'descale-steam', kind: 'steam', stage: 7, position: [23.4, 2.8, 0], count: 130, spread: 0.7 },
  { id: 'runout-steam', kind: 'steam', stage: 7, position: [32.4, 2.4, 0], count: 110, spread: 0.8 },
  { id: 'coil-heat', kind: 'steam', stage: 8, position: [35.2, 2.8, 0], count: 80, spread: 0.6 }
]

/** 铁水倾浇注光流：出铁口 → 鱼雷罐 */
export const IRON_STREAM = {
  from: new THREE.Vector3(-17.6, 1.25, 3.15),
  to: new THREE.Vector3(-14.9, 1.95, 3.4),
  stage: 2
}

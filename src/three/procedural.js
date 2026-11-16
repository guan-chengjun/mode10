import * as THREE from 'three'
import { THEME } from './theme.js'

/**
 * 程序化降级几何体库
 * 在线/本地 glb 都不可用时，用这些组合几何体拼出设备外形，保证断网可运行。
 * 每个工厂返回一个以原点为基座中心的 Group（底面 y≈0）。
 */

// ---------- 共享材质（减少 GPU 状态切换） ----------
const mat = (color, opts = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.65, metalness: 0.55, ...opts })

const MAT = {
  dark: mat(THEME.steelDark),
  steel: mat(THEME.steel),
  light: mat(THEME.steelLight),
  pipe: mat(THEME.pipe),
  rust: mat(THEME.rust),
  yellow: mat(THEME.safetyYellow, { roughness: 0.5 }),
  hot: mat(THEME.iron, { emissive: THEME.iron, emissiveIntensity: 1.4, roughness: 0.4, metalness: 0.1 }),
  hotSoft: mat(THEME.ironHot, { emissive: THEME.ironHot, emissiveIntensity: 0.9, roughness: 0.4 }),
  roller: mat('#9fb2c4', { roughness: 0.35, metalness: 0.8 })
}

const mesh = (geometry, material, position = [0, 0, 0], rotation = [0, 0, 0]) => {
  const m = new THREE.Mesh(geometry, material)
  m.position.set(...position)
  m.rotation.set(...rotation)
  return m
}

const group = (children) => {
  const g = new THREE.Group()
  children.forEach((c) => g.add(c))
  return g
}

// ---------- 基础工具 ----------
function frameHousing(w, h, d) {
  // 四柱 + 顶梁的简易厂房框架
  const g = new THREE.Group()
  const colGeo = new THREE.BoxGeometry(0.18, h, 0.18)
  const xs = [-w / 2, w / 2]
  const zs = [-d / 2, d / 2]
  xs.forEach((x) =>
    zs.forEach((z) => g.add(mesh(colGeo, MAT.dark, [x, h / 2, z])))
  )
  g.add(mesh(new THREE.BoxGeometry(w + 0.3, 0.18, 0.18), MAT.dark, [0, h, -d / 2]))
  g.add(mesh(new THREE.BoxGeometry(w + 0.3, 0.18, 0.18), MAT.dark, [0, h, d / 2]))
  g.add(mesh(new THREE.BoxGeometry(0.18, 0.18, d + 0.3), MAT.dark, [-w / 2, h, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.18, 0.18, d + 0.3), MAT.dark, [w / 2, h, 0]))
  return g
}

// ---------- 各类型工厂 ----------
function stockpile() {
  // 综合原料场：厂房框架 + 若干料堆 + 皮带
  const g = new THREE.Group()
  g.add(frameHousing(4.6, 3.4, 3.4))
  const pileGeo = new THREE.ConeGeometry(0.95, 1.5, 6)
  g.add(mesh(pileGeo, MAT.rust, [-1.4, 0.75, -0.6]))
  g.add(mesh(pileGeo, MAT.dark, [0.2, 0.75, -0.7]))
  g.add(mesh(pileGeo, MAT.steel, [1.5, 0.75, 0.4]))
  g.add(mesh(new THREE.BoxGeometry(4.2, 0.16, 0.5), MAT.yellow, [0, 0.55, 1.3]))
  return g
}

function cone() {
  const g = new THREE.Group()
  g.add(mesh(new THREE.ConeGeometry(1.35, 2, 7), MAT.rust, [0, 1, 0]))
  g.add(mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.12, 16), MAT.dark, [0, 0.06, 0]))
  return g
}

function conveyor() {
  // 皮带廊道：桁架 + 滚筒 + 暖色皮带
  const g = new THREE.Group()
  g.add(mesh(new THREE.BoxGeometry(5.4, 0.16, 0.55), MAT.rust, [0, 0, 0]))
  const legGeo = new THREE.BoxGeometry(0.14, 1.6, 0.14)
  ;[-2.4, 0, 2.4].forEach((x) =>
    [-0.32, 0.32].forEach((z) => g.add(mesh(legGeo, MAT.dark, [x, -0.85, z])))
  )
  const rollerGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.62, 10)
  ;[-2.6, 2.6].forEach((x) => g.add(mesh(rollerGeo, MAT.roller, [x, 0, 0], [Math.PI / 2, 0, 0])))
  return g
}

function drum() {
  // 圆筒混合机
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(1.15, 1.15, 3.4, 20), MAT.steel, [0, 1.4, 0], [0, 0, Math.PI / 2]))
  g.add(mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.3, 20), MAT.dark, [1.85, 1.4, 0], [0, 0, Math.PI / 2]))
  g.add(mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.3, 20), MAT.dark, [-1.85, 1.4, 0], [0, 0, Math.PI / 2]))
  g.add(mesh(new THREE.BoxGeometry(0.5, 1.4, 0.8), MAT.dark, [-1.2, 0.7, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.5, 1.4, 0.8), MAT.dark, [1.2, 0.7, 0]))
  return g
}

function bed() {
  // 带式烧结机：长床体 + 点火罩 + 台车
  const g = new THREE.Group()
  g.add(mesh(new THREE.BoxGeometry(4.4, 0.5, 1.7), MAT.dark, [0, 0.55, 0]))
  g.add(mesh(new THREE.BoxGeometry(1.1, 1, 1.75), MAT.rust, [-1.4, 1.25, 0]))
  g.add(mesh(new THREE.BoxGeometry(1.1, 0.5, 1.5), MAT.hotSoft, [-1.4, 0.95, 0]))
  for (let i = 0; i < 8; i++) {
    g.add(mesh(new THREE.BoxGeometry(0.42, 0.16, 1.5), MAT.steel, [-1.9 + i * 0.55, 0.92, 0]))
  }
  g.add(mesh(new THREE.BoxGeometry(0.3, 2.2, 0.3), MAT.pipe, [-2, 1.9, 0.6]))
  return g
}

function ring() {
  // 环冷机
  const g = new THREE.Group()
  g.add(mesh(new THREE.TorusGeometry(1.35, 0.32, 10, 28), MAT.steel, [0, 0.7, 0], [Math.PI / 2, 0, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.9, 18), MAT.dark, [0, 0.45, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.4, 0.55, 0.5, 18), MAT.hotSoft, [0, 1.15, 0]))
  return g
}

function stove() {
  // 热风炉：高圆柱 + 穹顶 + 管道
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(1, 1.15, 5.4, 20), MAT.steel, [0, 2.7, 0]))
  g.add(mesh(new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.light, [0, 5.4, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.18, 2.4, 10), MAT.pipe, [0.9, 5.6, 0], [0, 0, Math.PI / 2.6]))
  g.add(mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.25, 20), MAT.dark, [0, 0.12, 0]))
  return g
}

function furnace() {
  // 高炉/加热炉通用：变径炉身 + 炉缸 + 发光料区
  const g = new THREE.Group()
  // 炉缸
  g.add(mesh(new THREE.CylinderGeometry(1.7, 1.9, 1.6, 22), MAT.dark, [0, 0.8, 0]))
  // 炉腹（外扩）
  g.add(mesh(new THREE.CylinderGeometry(1.45, 1.7, 1.4, 22), MAT.steel, [0, 2.3, 0]))
  // 炉身（内收）
  g.add(mesh(new THREE.CylinderGeometry(0.95, 1.45, 4.2, 22), MAT.steel, [0, 5.1, 0]))
  // 炉喉
  g.add(mesh(new THREE.CylinderGeometry(0.85, 0.95, 1.2, 22), MAT.dark, [0, 7.8, 0]))
  // 内部高温辉光（在 xray/clip 模式下可见）
  g.add(mesh(new THREE.CylinderGeometry(0.7, 1.1, 5.6, 18), MAT.hot, [0, 3.4, 0]))
  // 热风围管
  g.add(mesh(new THREE.TorusGeometry(1.85, 0.13, 8, 26), MAT.pipe, [0, 1.5, 0], [Math.PI / 2, 0, 0]))
  // 风口
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    g.add(
      mesh(
        new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8),
        MAT.yellow,
        [Math.cos(a) * 2, 1.2, Math.sin(a) * 2],
        [0, 0, Math.PI / 2]
      )
    )
  }
  return g
}

function cylinder() {
  // 炉顶装料系统：料罐 + 旋转溜槽
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.8, 1.1, 2.2, 18), MAT.steel, [0, 1.1, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.45, 0.8, 0.8, 18), MAT.dark, [0, 2.6, 0]))
  g.add(mesh(new THREE.BoxGeometry(2.6, 0.2, 0.25), MAT.yellow, [0, 3.2, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 10), MAT.pipe, [0, 0.2, 0]))
  return g
}

function trough() {
  // 出铁场/中间包：沟槽 + 支架 + 发光铁水
  const g = new THREE.Group()
  g.add(mesh(new THREE.BoxGeometry(3.2, 0.5, 0.85), MAT.dark, [0, 0.75, 0]))
  g.add(mesh(new THREE.BoxGeometry(2.8, 0.14, 0.5), MAT.hot, [0, 1.04, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.25, 1, 0.25), MAT.steel, [-1.4, 0.45, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.25, 1, 0.25), MAT.steel, [1.4, 0.45, 0]))
  return g
}

function torpedo() {
  // 鱼雷罐车：梭形罐体 + 转向架轮
  const g = new THREE.Group()
  g.add(mesh(new THREE.SphereGeometry(1, 20, 14), MAT.steel, [0, 1.35, 0], [0, 0, 0], [1.9, 1.05, 1.05]))
  g.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.7, 14), MAT.dark, [2, 1.35, 0], [0, 0, Math.PI / 2]))
  g.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.7, 14), MAT.dark, [-2, 1.35, 0], [0, 0, Math.PI / 2]))
  g.add(mesh(new THREE.BoxGeometry(4.4, 0.22, 1.1), MAT.dark, [0, 0.45, 0]))
  const wheelGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.16, 12)
  ;[-1.6, -0.6, 0.6, 1.6].forEach((x) =>
    [-0.5, 0.5].forEach((z) => g.add(mesh(wheelGeo, MAT.dark, [x, 0.22, z], [Math.PI / 2, 0, 0])))
  )
  return g
}

function bucket() {
  // 废钢料槽
  const g = new THREE.Group()
  g.add(mesh(new THREE.BoxGeometry(2, 1.1, 1.4), MAT.steel, [0, 0.65, 0]))
  g.add(mesh(new THREE.BoxGeometry(1.7, 0.5, 1.1), MAT.rust, [0, 1.45, 0]))
  g.add(mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12), MAT.yellow, [0, 1.25, 0]))
  return g
}

function converter() {
  // 转炉：梨形可倾动炉体 + 炉口 + 托圈
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(1.15, 1.55, 2.6, 22), MAT.steel, [0, 1.55, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.62, 1.15, 1.1, 22), MAT.dark, [0, 3.4, 0]))
  g.add(mesh(new THREE.TorusGeometry(1.5, 0.16, 10, 26), MAT.yellow, [0, 1.3, 0], [Math.PI / 2, 0, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.9, 1.2, 1.8, 18), MAT.hot, [0, 1.2, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 1.2), MAT.dark, [1.5, 1.3, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.5, 0.5, 1.2), MAT.dark, [-1.5, 1.3, 0]))
  return g
}

function lance() {
  // 氧枪：长杆 + 喷头 + 升降小车
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 4.6, 10), MAT.light, [0, 2.3, 0]))
  g.add(mesh(new THREE.ConeGeometry(0.22, 0.5, 12), MAT.hot, [0, 0.05, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.7, 0.7, 0.7), MAT.yellow, [0, 4.2, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.2, 10), MAT.pipe, [0, 5.1, 0]))
  return g
}

function ladle() {
  // 钢包
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(1.05, 0.78, 1.7, 20), MAT.steel, [0, 0.95, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.92, 0.92, 0.08, 20), MAT.hot, [0, 1.82, 0]))
  g.add(mesh(new THREE.TorusGeometry(1.05, 0.08, 8, 22), MAT.dark, [0, 1.82, 0], [Math.PI / 2, 0, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.3, 0.5, 0.3), MAT.dark, [1.05, 1.2, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.3, 0.5, 0.3), MAT.dark, [-1.05, 1.2, 0]))
  return g
}

function lf() {
  // LF 精炼炉：钢包 + 三相电极 + 炉盖
  const g = new THREE.Group()
  g.add(ladle().children[0].clone())
  g.add(mesh(new THREE.CylinderGeometry(1.05, 0.78, 1.7, 20), MAT.steel, [0, 0.95, 0]))
  g.add(mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.25, 20), MAT.dark, [0, 2.05, 0]))
  ;[-0.45, 0, 0.45].forEach((x) => {
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 8), MAT.dark, [x, 3.4, 0]))
    g.add(mesh(new THREE.SphereGeometry(0.14, 10, 8), MAT.hot, [x, 2.0, 0]))
  })
  return g
}

function rh() {
  // RH 真空脱气：真空室 + 浸渍管
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.95, 0.95, 3, 18), MAT.steel, [0, 3.1, 0]))
  g.add(mesh(new THREE.SphereGeometry(0.95, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), MAT.light, [0, 4.6, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.7, 12), MAT.rust, [-0.4, 1.05, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.7, 12), MAT.rust, [0.4, 1.05, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.3, 1.4, 10), MAT.hot, [-0.4, 0.85, 0]))
  return g
}

function silos() {
  // 合金料仓组
  const g = new THREE.Group()
  ;[-1.1, 0, 1.1].forEach((x, i) => {
    g.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.8, 14), i === 1 ? MAT.light : MAT.steel, [x, 1.3, 0]))
    g.add(mesh(new THREE.ConeGeometry(0.55, 0.6, 14), MAT.dark, [x, 2.5, 0]))
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8), MAT.pipe, [x, 0.35, 0]))
  })
  return g
}

function mold() {
  // 结晶器：铜色方框 + 振动机构
  const g = new THREE.Group()
  const copper = mat('#b87333', { metalness: 0.85, roughness: 0.3 })
  g.add(mesh(new THREE.BoxGeometry(1.7, 1.5, 0.9), copper, [0, 1.2, 0]))
  g.add(mesh(new THREE.BoxGeometry(1.25, 1.15, 0.55), MAT.hot, [0, 1.2, 0]))
  g.add(mesh(new THREE.BoxGeometry(2, 0.18, 1.2), MAT.dark, [0, 0.25, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 8), MAT.pipe, [0.9, 1.2, 0.55]))
  return g
}

function rollers() {
  // 二冷段/辊道：成排辊子 + 框架 + 发光铸坯/带钢
  const g = new THREE.Group()
  const n = 7
  for (let i = 0; i < n; i++) {
    const x = -2.1 + i * 0.7
    g.add(mesh(new THREE.CylinderGeometry(0.2, 0.2, 1.5, 12), MAT.roller, [x, 0.55, 0], [Math.PI / 2, 0, 0]))
  }
  g.add(mesh(new THREE.BoxGeometry(4.6, 0.12, 0.9), MAT.hotSoft, [0, 0.82, 0]))
  g.add(mesh(new THREE.BoxGeometry(4.8, 0.14, 0.14), MAT.dark, [0, 0.3, -0.8]))
  g.add(mesh(new THREE.BoxGeometry(4.8, 0.14, 0.14), MAT.dark, [0, 0.3, 0.8]))
  return g
}

function cutter() {
  // 火焰切割机：门架 + 割枪 + 火花暗示
  const g = new THREE.Group()
  g.add(mesh(new THREE.BoxGeometry(2.4, 0.18, 0.18), MAT.yellow, [0, 2.1, -0.7]))
  g.add(mesh(new THREE.BoxGeometry(2.4, 0.18, 0.18), MAT.yellow, [0, 2.1, 0.7]))
  g.add(mesh(new THREE.BoxGeometry(0.18, 2.1, 0.18), MAT.yellow, [-1.2, 1.05, -0.7]))
  g.add(mesh(new THREE.BoxGeometry(0.18, 2.1, 0.18), MAT.yellow, [1.2, 1.05, 0.7]))
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.3, 8), MAT.dark, [0, 1.35, 0]))
  g.add(mesh(new THREE.ConeGeometry(0.12, 0.35, 8), MAT.hot, [0, 0.5, 0]))
  g.add(mesh(new THREE.BoxGeometry(2.2, 0.1, 0.6), MAT.hotSoft, [0, 0.25, 0]))
  return g
}

function burner() {
  // 烧嘴排
  const g = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    const x = -1.6 + i * 0.8
    g.add(mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.9, 10), MAT.pipe, [x, 0.7, 0], [Math.PI / 2, 0, 0]))
    g.add(mesh(new THREE.ConeGeometry(0.18, 0.5, 10), MAT.hot, [x, 0.7, 0.65], [Math.PI / 2, 0, 0]))
  }
  g.add(mesh(new THREE.BoxGeometry(3.6, 0.16, 0.16), MAT.dark, [0, 0.7, -0.55]))
  return g
}

function exchanger() {
  // 余热换热器：管束箱体 + 烟囱
  const g = new THREE.Group()
  g.add(mesh(new THREE.BoxGeometry(1.8, 1.6, 1.4), MAT.steel, [0, 1, 0]))
  for (let i = 0; i < 4; i++) {
    g.add(mesh(new THREE.CylinderGeometry(0.09, 0.09, 1.5, 8), MAT.pipe, [-0.6 + i * 0.4, 1, 0.78], [Math.PI / 2, 0, 0]))
  }
  g.add(mesh(new THREE.CylinderGeometry(0.28, 0.38, 2.6, 12), MAT.dark, [0.5, 3, -0.4]))
  return g
}

function descale() {
  // 高压水除鳞：箱体 + 上下集管 + 水雾
  const g = new THREE.Group()
  g.add(frameHousing(2.4, 2.2, 1.6))
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 8), MAT.light, [0, 1.7, 0], [0, 0, Math.PI / 2]))
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 2, 8), MAT.light, [0, 0.5, 0], [0, 0, Math.PI / 2]))
  g.add(mesh(new THREE.BoxGeometry(2, 0.08, 0.8), MAT.hotSoft, [0, 1.05, 0]))
  return g
}

function mill() {
  // 轧机：牌坊 + 工作辊/支撑辊 + 底座
  const g = new THREE.Group()
  g.add(mesh(new THREE.BoxGeometry(0.35, 2.6, 1.7), MAT.dark, [-1.05, 1.5, 0]))
  g.add(mesh(new THREE.BoxGeometry(0.35, 2.6, 1.7), MAT.dark, [1.05, 1.5, 0]))
  g.add(mesh(new THREE.BoxGeometry(2.5, 0.3, 1.9), MAT.dark, [0, 2.85, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.9, 14), MAT.roller, [0, 1.55, 0], [Math.PI / 2, 0, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.32, 0.32, 1.9, 14), MAT.roller, [0, 0.85, 0], [Math.PI / 2, 0, 0]))
  g.add(mesh(new THREE.CylinderGeometry(0.48, 0.48, 1.7, 14), MAT.steel, [0, 2.15, 0], [Math.PI / 2, 0, 0]))
  g.add(mesh(new THREE.BoxGeometry(2.6, 0.2, 2), MAT.dark, [0, 0.1, 0]))
  g.add(mesh(new THREE.BoxGeometry(2.2, 0.08, 0.8), MAT.hotSoft, [0, 1.2, 0]))
  return g
}

function coiler() {
  // 卷取机：卷筒 + 助卷辊 + 侧导板
  const g = new THREE.Group()
  g.add(mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.5, 16), MAT.roller, [0, 1.1, 0], [Math.PI / 2, 0, 0]))
  g.add(mesh(new THREE.TorusGeometry(0.75, 0.12, 10, 20), MAT.hotSoft, [0, 1.1, 0.78]))
  ;[0.5, 2.6, 4.2].forEach((a) => {
    g.add(
      mesh(
        new THREE.CylinderGeometry(0.16, 0.16, 1.2, 10),
        MAT.steel,
        [Math.cos(a) * 0.95, 1.1 + Math.sin(a) * 0.95, 0],
        [Math.PI / 2, 0, 0]
      )
    )
  })
  g.add(mesh(new THREE.BoxGeometry(1.6, 0.15, 0.5), MAT.dark, [0, 0.2, 0.9]))
  return g
}

function coils() {
  // 钢卷库：三个成卷钢卷 + 鞍座
  const g = new THREE.Group()
  ;[-1.3, 0, 1.3].forEach((x, i) => {
    g.add(mesh(new THREE.TorusGeometry(0.7, 0.22, 12, 24), i === 1 ? MAT.hotSoft : MAT.steel, [x, 0.95, 0], [0, Math.PI / 2, 0]))
    g.add(mesh(new THREE.BoxGeometry(1, 0.18, 0.8), MAT.dark, [x, 0.18, 0]))
  })
  return g
}

/** 类型 → 工厂 映射表 */
const FACTORIES = {
  stockpile,
  cone,
  conveyor,
  drum,
  bed,
  ring,
  stove,
  furnace,
  cylinder,
  trough,
  torpedo,
  bucket,
  converter,
  lance,
  ladle,
  lf,
  rh,
  silos,
  mold,
  rollers,
  cutter,
  burner,
  exchanger,
  descale,
  mill,
  coiler,
  coils
}

/**
 * 生成程序化设备
 * @param {string} kind parts.js 中 model.fallback 的类型名
 * @returns {THREE.Group}
 */
export function createProcedural(kind) {
  const factory = FACTORIES[kind] || FACTORIES.cone
  const g = factory()
  g.userData.procedural = true
  return g
}

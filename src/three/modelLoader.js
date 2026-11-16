import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

/**
 * 模型加载策略（保证断网可运行、且默认控制台零报错）
 * ┌ 本地模型：登记在 public/models/manifest.json 中的 glb 直接加载（离线可用、无 404）
 * ┌ 在线模型：默认关闭。在顶部栏打开「在线模型」开关后，才会向 REMOTE_MODEL_BASE 发起探测下载
 * └ 全部不可用时：自动切换内置程序化几何体，断网也能完整运行
 */
export const REMOTE_MODEL_BASE = 'https://cdn.jsdelivr.net/gh/steel-twin/models@main/'

const REMOTE_FLAG_KEY = 'steel-twin-remote-models'

/** 在线模型开关（持久化到 localStorage） */
export function isRemoteEnabled() {
  try {
    return localStorage.getItem(REMOTE_FLAG_KEY) === '1'
  } catch {
    return false
  }
}

export function setRemoteEnabled(on) {
  try {
    localStorage.setItem(REMOTE_FLAG_KEY, on ? '1' : '0')
  } catch {
    /* 隐私模式等场景忽略 */
  }
}

const loader = new GLTFLoader()
const draco = new DRACOLoader()
// DRACO 解码库走 CDN；离线且模型未预载时，catch 后自动走程序化降级
draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/')
loader.setDRACOLoader(draco)

/** 本地模型清单（启动时拉取一次，失败则为空清单） */
let localManifest = null
async function getLocalManifest() {
  if (localManifest) return localManifest
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}models/manifest.json`, { cache: 'no-cache' })
    const json = await res.json()
    localManifest = json.models || {}
  } catch {
    localManifest = {}
  }
  return localManifest
}

/** HEAD 探测资源是否存在；HEAD 不被允许时（405）视为存在，交给加载器验证 */
async function exists(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok || res.status === 405
  } catch {
    return false
  }
}

/** 简单事件总线，用于把模型加载结果同步给 UI 状态栏 */
export const modelStatusBus = {
  listeners: new Set(),
  emit(payload) {
    this.listeners.forEach((fn) => fn(payload))
  },
  subscribe(fn) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}

/**
 * 异步加载一个 glb 模型
 * @param {string} partId 部件 id（仅用于状态上报）
 * @param {string} localPath public 下的相对路径，如 models/blast_furnace.glb
 * @returns {Promise<THREE.Group>}
 */
export async function loadPartModel(partId, localPath) {
  const fileName = localPath.split('/').pop()
  const manifest = await getLocalManifest()
  const candidates = []

  // 1) 本地清单登记了该模型 → 直接加载（无 404）
  if (manifest[fileName] === true) {
    candidates.push({ url: `${import.meta.env.BASE_URL}${localPath}`, type: 'local' })
  }

  // 2) 用户显式开启在线模型后才探测远程源，避免默认情况下刷 404
  if (isRemoteEnabled() && (typeof navigator === 'undefined' || navigator.onLine)) {
    const remoteUrl = `${REMOTE_MODEL_BASE}${fileName}`
    if (await exists(remoteUrl)) {
      candidates.push({ url: remoteUrl, type: 'remote' })
    }
  }

  for (const item of candidates) {
    try {
      const gltf = await loader.loadAsync(item.url)
      modelStatusBus.emit({ partId, ok: true, type: item.type })
      return gltf.scene
    } catch {
      // 当前源损坏则继续尝试下一个源
    }
  }

  modelStatusBus.emit({ partId, ok: false })
  throw new Error(`模型不可用（本地/在线均未命中），已切换程序化几何体: ${fileName}`)
}

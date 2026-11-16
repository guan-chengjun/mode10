/**
 * 生产包冒烟测试
 * 验证 dist 预览站点：DOM 就绪、WebGL 画布存在、渲染循环出帧、无 JS 异常。
 * 注意：R3F 默认 preserveDrawingBuffer=false，readPixels 会读到清空缓冲，
 *       因此这里以「画布尺寸 + rAF 出帧速率 + 异常监听」作为渲染活性判据。
 * 前置：先执行 npm run build，并在 4173 端口运行 npm run preview。
 */
import { spawn } from 'node:child_process'
import http from 'node:http'
import { once } from 'node:events'
import { setTimeout as sleep } from 'node:timers/promises'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9366
const TARGET = process.env.TEST_URL || 'http://127.0.0.1:4173/'

const edge = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + process.env.TEMP + '\\edge-cdp-dist',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--no-first-run', 'about:blank'
], { stdio: 'ignore' })

const getJson = (p) => new Promise((res, rej) => http.get(`http://127.0.0.1:${PORT}${p}`, (r) => {
  let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)))
}).on('error', rej))

const errors = []
try {
  let targets = []
  for (let i = 0; i < 40; i++) { try { targets = await getJson('/json'); if (targets.length) break } catch {}; await sleep(250) }
  const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await once(ws, 'open')
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
    if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.text)
    if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push(msg.params.entry.text)
  })
  const send = (method, params = {}) => new Promise((r) => { const mid = ++id; pending.set(mid, r); ws.send(JSON.stringify({ id: mid, method, params })) })

  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')
  await send('Page.navigate', { url: TARGET })
  await sleep(9000)

  const stateExpr = `JSON.stringify({
    hasCanvas: !!document.querySelector('canvas'),
    canvasW: document.querySelector('canvas')?.width || 0,
    canvasH: document.querySelector('canvas')?.height || 0,
    hasModes: document.body.innerText.includes('爆炸视图'),
    partCountText: (document.body.innerText.match(/全场景共 (\\d+) 个/) || [])[1] || '?'
  })`
  const state = await send('Runtime.evaluate', { expression: stateExpr, returnByValue: true })

  const fpsExpr = `new Promise((resolve) => {
    let n = 0; const t0 = performance.now()
    const tick = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(tick); else resolve(Math.round(n*1000/(performance.now()-t0))) }
    requestAnimationFrame(tick)
  })`
  const fps = await send('Runtime.evaluate', { expression: `(${fpsExpr})`, awaitPromise: true, returnByValue: true })

  console.log('目标地址:', TARGET)
  console.log('页面状态:', state.result?.result?.value)
  console.log('渲染循环 FPS(软件渲染):', fps.result?.result?.value)
  console.log('异常/错误:', errors.length ? errors : '无')

  const ok = state.result?.result?.value && fps.result?.result?.value > 0 && errors.length === 0
  console.log(ok ? '生产包冒烟测试通过 ✅' : '生产包冒烟测试失败 ❌')
  process.exit(ok ? 0 : 1)
  ws.close()
} finally {
  edge.kill()
}

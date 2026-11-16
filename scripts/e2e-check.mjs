/**
 * 基于 Chrome DevTools Protocol 的端到端自测脚本（仅测试用，不参与构建）
 * 收集：控制台错误、页面异常、requestAnimationFrame 帧率、3D 拾取交互
 * 运行：node scripts/e2e-check.mjs
 */
import { spawn } from 'node:child_process'
import http from 'node:http'
import { once } from 'node:events'
import { setTimeout as sleep } from 'node:timers/promises'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9333
const URL = 'http://127.0.0.1:5173/'

const edge = spawn(EDGE, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + process.env.TEMP + '\\edge-cdp-twin',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--no-first-run',
  '--window-size=1600,900',
  'about:blank'
], { stdio: 'ignore' })

async function getJson(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${PORT}${path}`, (res) => {
      let data = ''
      res.on('data', (c) => (data += c))
      res.on('end', () => resolve(JSON.parse(data)))
    }).on('error', reject)
  })
}

async function cdp(target) {
  const ws = new WebSocket(target.webSocketDebuggerUrl)
  await once(ws, 'open')
  let id = 0
  const pending = new Map()
  const events = []
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg)
      pending.delete(msg.id)
    } else if (msg.method) {
      events.push(msg)
    }
  })
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const mid = ++id
      pending.set(mid, resolve)
      ws.send(JSON.stringify({ id: mid, method, params }))
    })
  return {
    ws,
    send,
    events,
    close: () => ws.close()
  }
}

const result = { errors: [], exceptions: [], consoleMessages: [], fps: 0, checks: {} }

try {
  // 等待 DevTools 端口就绪
  let targets = []
  for (let i = 0; i < 40; i++) {
    try {
      targets = await getJson('/json')
      if (targets.length) break
    } catch {}
    await sleep(250)
  }
  const page = targets.find((t) => t.type === 'page')
  const client = await cdp(page)
  const { send, events } = client

  await send('Runtime.enable')
  await send('Log.enable')
  await send('Page.enable')
  await send('Console.enable')

  events.length = 0
  await send('Page.navigate', { url: URL })

  // 等待首屏渲染（≤5s 目标，这里给 8s 余量）
  await sleep(8000)

  // 采集页面就绪状态快照
  const readyExpr = `JSON.stringify({
    href: location.href,
    hasCanvas: !!document.querySelector('canvas'),
    bodyLen: document.body ? document.body.innerText.length : -1,
    rootChildren: document.getElementById('root') ? document.getElementById('root').children.length : -1,
    readyState: document.readyState
  })`
  const readyRes = await send('Runtime.evaluate', { expression: readyExpr, returnByValue: true })
  result.ready = readyRes.result?.result?.value
  if (readyRes.result?.exceptionDetails) result.ready = 'EXC: ' + JSON.stringify(readyRes.result.exceptionDetails)

  // 收集错误
  for (const ev of events) {
    if (ev.method === 'Runtime.exceptionThrown') {
      result.exceptions.push(ev.params.exceptionDetails.text || 'exception')
    }
    if (ev.method === 'Log.entryAdded' && ev.params.entry.level === 'error') {
      result.errors.push(ev.params.entry.text)
    }
    if (ev.method === 'Console.messageAdded') {
      result.consoleMessages.push(`${ev.params.message.level}: ${ev.params.message.text}`)
    }
  }

  // ---------- 帧率测量（2 秒 rAF 计数，排除软件渲染开销后仍应稳定出帧） ----------
  const fpsExpr = `new Promise((resolve) => {
    let n = 0
    const t0 = performance.now()
    function tick() {
      n++
      if (performance.now() - t0 < 2000) requestAnimationFrame(tick)
      else resolve(Math.round(n * 1000 / (performance.now() - t0)))
    }
    requestAnimationFrame(tick)
  })`
  const fpsRes = await send('Runtime.evaluate', {
    expression: `(${fpsExpr})`,
    awaitPromise: true,
    returnByValue: true
  })
  result.fps = fpsRes.result?.result?.value || 0

  // ---------- DOM/场景就绪检查 ----------
  const checks = [
    ['WebGL 画布就绪', '!!document.querySelector("canvas") && document.querySelector("canvas").width > 0'],
    ['顶部四模式', 'document.body.innerText.includes("X 光透视") && document.body.innerText.includes("爆炸视图")'],
    ['左侧九工序', 'document.body.innerText.includes("热轧") && document.body.innerText.includes("卷取")'],
    ['时间轴可交互', '!!document.querySelector(".timeline-range")'],
    ['播放按钮存在', '!!document.querySelector(".play-btn")'],
    ['FPS 徽章存在', 'document.body.innerText.includes("FPS")'],
    ['在线模型开关存在', '!!document.querySelector(".remote-switch input")']
  ]
  for (const [name, expr] of checks) {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true })
    result.checks[name] = !!r.result?.result?.value
  }

  // ---------- 交互：点击「爆炸视图」模式按钮 ----------
  const clickExpr = `(() => {
    const btns = [...document.querySelectorAll('.mode-btn')]
    const b = btns.find((x) => x.innerText.includes('爆炸视图'))
    if (!b) return 'btn-not-found'
    b.click()
    return 'clicked'
  })()`
  const clickRes = await send('Runtime.evaluate', { expression: clickExpr, returnByValue: true })
  await sleep(700) // 等待 React 状态更新与场景动画启动
  const verifyMode = await send('Runtime.evaluate', {
    expression: `document.querySelector('.mode-btn.active').innerText.includes('爆炸视图')`,
    returnByValue: true
  })
  result.checks['切换爆炸视图'] = clickRes.result?.result?.value === 'clicked' && !!verifyMode.result?.result?.value
  await sleep(1200)

  // 切回正常模式
  await send('Runtime.evaluate', {
    expression: `[...document.querySelectorAll('.mode-btn')].find(x=>x.innerText.includes('正常显示')).click()`
  })
  await sleep(700)

  // ---------- 交互：点击工序跳转 ----------
  const seekExpr = `(() => {
    const heads = [...document.querySelectorAll('.stage-head')]
    if (!heads[5]) return 'head-not-found'
    heads[5].click() // 连铸
    return 'clicked'
  })()`
  const seekRes = await send('Runtime.evaluate', { expression: seekExpr, returnByValue: true })
  await sleep(700) // 等待 React 重渲染
  const verifySeek = await send('Runtime.evaluate', {
    expression: `document.querySelectorAll('.stage-item')[5].classList.contains('active')`,
    returnByValue: true
  })
  result.checks['工序跳转连铸'] = seekRes.result?.result?.value === 'clicked' && !!verifySeek.result?.result?.value

  // 交互后再次收集错误
  for (const ev of events) {
    if (ev.method === 'Runtime.exceptionThrown') {
      const t = ev.params.exceptionDetails.text || 'exception'
      if (!result.exceptions.includes(t)) result.exceptions.push(t)
    }
    if (ev.method === 'Log.entryAdded' && ev.params.entry.level === 'error') {
      const t = ev.params.entry.text
      if (!result.errors.includes(t)) result.errors.push(t)
    }
  }

  client.close()
} finally {
  edge.kill()
}

console.log('===== 自测结果 =====')
console.log('页面快照:', result.ready)
console.log('FPS(软件渲染环境):', result.fps)
console.log('控制台错误:', result.errors.length ? result.errors : '无')
console.log('未捕获异常:', result.exceptions.length ? result.exceptions : '无')
if (result.consoleMessages?.length) {
  console.log('Console 消息:', result.consoleMessages.slice(0, 10))
}
for (const [k, v] of Object.entries(result.checks)) {
  console.log(`${v ? '✓' : '✗'} ${k}`)
}
const allPass =
  result.errors.length === 0 &&
  result.exceptions.length === 0 &&
  Object.values(result.checks).every(Boolean) &&
  result.fps > 0
console.log(allPass ? '\n全部通过 ✅（真机 GPU 下帧率更高，目标 ≥45）' : '\n存在失败项 ❌')
process.exit(allPass ? 0 : 1)

/**
 * 四种显示模式截图（测试/文档用）
 * 运行：node scripts/mode-shots.mjs
 * 输出：scripts/shots/{normal,xray,clip,explode}.png
 */
import { spawn } from 'node:child_process'
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { once } from 'node:events'
import { setTimeout as sleep } from 'node:timers/promises'

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
const PORT = 9355
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(__dirname, 'shots') + path.sep
fs.mkdirSync(OUT, { recursive: true })

const edge = spawn(EDGE, [
  '--headless=new', `--remote-debugging-port=${PORT}`,
  '--user-data-dir=' + process.env.TEMP + '\\edge-cdp-shots',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--no-first-run', '--window-size=1600,900', 'about:blank'
], { stdio: 'ignore' })

const getJson = (p) => new Promise((res, rej) => http.get(`http://127.0.0.1:${PORT}${p}`, (r) => {
  let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d)))
}).on('error', rej))

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
  })
  const send = (method, params = {}) => new Promise((r) => { const mid = ++id; pending.set(mid, r); ws.send(JSON.stringify({ id: mid, method, params })) })

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
  await sleep(7000)

  const modes = [
    ['normal', '正常显示'],
    ['xray', 'X 光透视'],
    ['clip', '剖切面'],
    ['explode', '爆炸视图']
  ]
  for (const [key, label] of modes) {
    await send('Runtime.evaluate', {
      expression: `[...document.querySelectorAll('.mode-btn')].find(b=>b.innerText.includes('${label}')).click()`
    })
    await sleep(2600) // 等待模式切换动画
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    fs.writeFileSync(`${OUT}${key}.png`, Buffer.from(shot.result.data, 'base64'))
    console.log('已保存', `${OUT}${key}.png`)
  }
  ws.close()
} finally {
  edge.kill()
}

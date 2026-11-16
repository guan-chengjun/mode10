import { useState } from 'react'
import useAppStore from '../store/useAppStore.js'
import { isRemoteEnabled, setRemoteEnabled } from '../three/modelLoader.js'

const MODES = [
  { key: 'normal', label: '正常显示', icon: '▣' },
  { key: 'xray', label: 'X 光透视', icon: '◈' },
  { key: 'clip', label: '剖切面', icon: '◧' },
  { key: 'explode', label: '爆炸视图', icon: '✦' }
]

export default function TopBar() {
  const mode = useAppStore((s) => s.mode)
  const setMode = useAppStore((s) => s.setMode)
  const fps = useAppStore((s) => s.fps)
  const [remote, setRemote] = useState(isRemoteEnabled())

  const toggleRemote = () => {
    const next = !remote
    setRemoteEnabled(next)
    setRemote(next)
    // 开关变化后刷新页面，让模型加载器按新策略重新决策
    window.location.reload()
  }

  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-logo">⚙</span>
        <div>
          <h1>炼钢厂数字孪生</h1>
          <p>全流程 3D 可视化仿真平台</p>
        </div>
      </div>

      <div className="mode-switch" role="group" aria-label="显示模式">
        {MODES.map((m) => (
          <button
            key={m.key}
            className={`mode-btn ${mode === m.key ? 'active' : ''}`}
            onClick={() => setMode(m.key)}
            title={m.label}
          >
            <span className="mode-icon">{m.icon}</span>
            <span>{m.label}</span>
          </button>
        ))}
      </div>

      <label
        className={`remote-switch ${remote ? 'on' : ''}`}
        title="开启后优先从在线模型库下载 glb；关闭时仅使用本地模型与程序化几何体（默认零网络请求）"
      >
        <input type="checkbox" checked={remote} onChange={toggleRemote} />
        <span className="switch-track" />
        <span className="switch-text">在线模型</span>
      </label>

      <div className={`fps-badge ${fps >= 45 ? 'good' : fps > 0 ? 'warn' : ''}`}>
        <span className="fps-dot" />
        FPS {fps || '--'}
      </div>
    </header>
  )
}

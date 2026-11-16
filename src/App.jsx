import { useState } from 'react'
import PlantScene from './three/PlantScene.jsx'
import TopBar from './components/TopBar.jsx'
import StagePanel from './components/StagePanel.jsx'
import DetailPanel from './components/DetailPanel.jsx'
import Timeline from './components/Timeline.jsx'

export default function App() {
  const [showHelp, setShowHelp] = useState(true)

  return (
    <div className="app-shell">
      <TopBar />

      <main className="workspace">
        <StagePanel />

        <section className="viewport">
          <PlantScene />
          {showHelp && (
            <div className="help-toast">
              <div className="help-title">
                操作指引
                <button className="close-btn" onClick={() => setShowHelp(false)} aria-label="关闭指引">
                  ✕
                </button>
              </div>
              <ul>
                <li>左键拖拽：360° 环绕旋转</li>
                <li>右键拖拽 / 滚轮：平移与缩放</li>
                <li>点击设备：查看中文工艺说明</li>
                <li>顶部切换四种显示模式</li>
                <li>底部时间轴控制全流程播放</li>
              </ul>
            </div>
          )}
          {!showHelp && (
            <button className="help-fab" onClick={() => setShowHelp(true)} aria-label="打开操作指引">
              ?
            </button>
          )}
        </section>

        <DetailPanel />
      </main>

      <Timeline />
    </div>
  )
}

import useAppStore from '../store/useAppStore.js'
import { STAGES } from '../data/stages.js'
import { PARTS } from '../data/parts.js'

/** 左侧：九大工序讲解，点击可跳转时间轴对应位置 */
export default function StagePanel() {
  const activeStage = useAppStore((s) => s.activeStage)
  const seekStage = useAppStore((s) => s.seekStage)
  const progress = useAppStore((s) => s.progress)
  const selectPart = useAppStore((s) => s.selectPart)

  return (
    <aside className="panel stage-panel">
      <div className="panel-title">
        <span className="title-bar" />
        工艺流程
      </div>
      <div className="stage-flow">
        {STAGES.map((stage, i) => {
          const reached = progress * 9 >= i
          const active = activeStage === i
          const stageParts = PARTS.filter((p) => p.stage === i)
          return (
            <div key={stage.index} className={`stage-item ${active ? 'active' : ''} ${reached ? 'reached' : ''}`}>
              <button className="stage-head" onClick={() => seekStage(i)}>
                <span className="stage-index" style={{ borderColor: stage.color, color: stage.color }}>
                  {i + 1}
                </span>
                <span className="stage-name">{stage.name}</span>
                {active && <span className="stage-live">运行中</span>}
              </button>
              {active && (
                <div className="stage-detail">
                  <p className="stage-desc">{stage.desc}</p>
                  <ul className="stage-points">
                    {stage.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  <div className="stage-parts">
                    {stageParts.map((p) => (
                      <button key={p.id} className="part-chip" onClick={() => selectPart(p.id)}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}

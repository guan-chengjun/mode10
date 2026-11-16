import { useEffect, useState } from 'react'
import useAppStore from '../store/useAppStore.js'
import { PART_MAP, PART_COUNT } from '../data/parts.js'
import { STAGES } from '../data/stages.js'
import { modelStatusBus } from '../three/modelLoader.js'

/** 右侧：部件详情（名称、功能、工艺参数、模型来源） */
export default function DetailPanel() {
  const selectedId = useAppStore((s) => s.selectedId)
  const clearSelection = useAppStore((s) => s.clearSelection)
  const [statusMap, setStatusMap] = useState({})

  useEffect(() => modelStatusBus.subscribe((payload) => {
    setStatusMap((prev) => ({ ...prev, [payload.partId]: payload }))
  }), [])

  if (!selectedId) {
    return (
      <aside className="panel detail-panel empty">
        <div className="panel-title">
          <span className="title-bar" />
          部件详情
        </div>
        <div className="detail-empty">
          <div className="empty-icon">🏭</div>
          <p>点击场景中的设备部件</p>
          <p className="dim">可查看名称、功能与工艺参数示意值</p>
          <p className="dim small">全场景共 {PART_COUNT} 个可交互部件</p>
        </div>
      </aside>
    )
  }

  const part = PART_MAP[selectedId]
  const stage = STAGES[part.stage]
  const status = statusMap[selectedId]

  return (
    <aside className="panel detail-panel">
      <div className="panel-title">
        <span className="title-bar" style={{ background: stage.color }} />
        部件详情
        <button className="close-btn" onClick={clearSelection} aria-label="关闭">
          ✕
        </button>
      </div>

      <div className="detail-body">
        <div className="detail-stage-tag" style={{ color: stage.color, borderColor: stage.color }}>
          工序 {part.stage + 1} · {stage.name}
        </div>
        <h2 className="detail-name">{part.name}</h2>

        <section>
          <h3>功能说明</h3>
          <p className="detail-func">{part.func}</p>
        </section>

        <section>
          <h3>工艺参数（示意值）</h3>
          <table className="param-table">
            <tbody>
              {part.params.map(([k, v]) => (
                <tr key={k}>
                  <td className="param-key">{k}</td>
                  <td className="param-val">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="model-source">
          <h3>模型来源</h3>
          {status?.ok ? (
            <span className="source-tag online">
              在线模型加载成功（{status.type === 'local' ? '本地 public' : '网络下载'}）
            </span>
          ) : (
            <span className="source-tag fallback">程序化几何体降级 · 断网可运行</span>
          )}
        </section>
      </div>
    </aside>
  )
}

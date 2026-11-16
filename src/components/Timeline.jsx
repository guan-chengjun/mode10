import useAppStore, { TOTAL_DURATION } from '../store/useAppStore.js'
import { STAGES } from '../data/stages.js'

const SPEEDS = [0.5, 1, 2, 4]

/** 底部时间轴：播放控制 + 9 段工序进度 + 倍速 */
export default function Timeline() {
  const progress = useAppStore((s) => s.progress)
  const playing = useAppStore((s) => s.playing)
  const togglePlay = useAppStore((s) => s.togglePlay)
  const setPlaying = useAppStore((s) => s.setPlaying)
  const speed = useAppStore((s) => s.speed)
  const setSpeed = useAppStore((s) => s.setSpeed)
  const setProgress = useAppStore((s) => s.setProgress)
  const seekStage = useAppStore((s) => s.seekStage)
  const activeStage = useAppStore((s) => s.activeStage)

  const elapsed = (progress * TOTAL_DURATION).toFixed(1)

  return (
    <footer className="timeline">
      <div className="timeline-controls">
        <button
          className="play-btn"
          onClick={togglePlay}
          title={playing ? '暂停' : '播放'}
          aria-label={playing ? '暂停' : '播放'}
        >
          {playing ? '⏸' : '▶'}
        </button>
        <button className="ctrl-btn" onClick={() => { setPlaying(false); setProgress(0) }} title="回到起点" aria-label="回到起点">
          ⏮
        </button>

        <div className="speed-group">
          {SPEEDS.map((sp) => (
            <button
              key={sp}
              className={`speed-btn ${speed === sp ? 'active' : ''}`}
              onClick={() => setSpeed(sp)}
            >
              {sp}×
            </button>
          ))}
        </div>

        <span className="time-readout">
          {elapsed}s / {TOTAL_DURATION}s
        </span>
      </div>

      <div className="timeline-track-wrap">
        <input
          className="timeline-range"
          type="range"
          min={0}
          max={1000}
          value={Math.round(progress * 1000)}
          style={{ '--p': `${progress * 100}%` }}
          onChange={(e) => {
            setPlaying(false)
            setProgress(Number(e.target.value) / 1000)
          }}
          aria-label="流程进度"
        />
        <div className="stage-segments">
          {STAGES.map((stage) => {
            const start = (stage.index / 9) * 100
            const active = activeStage === stage.index
            const reached = progress * 9 >= stage.index
            return (
              <button
                key={stage.index}
                className={`segment ${active ? 'active' : ''} ${reached ? 'reached' : ''}`}
                style={{
                  left: `${start}%`,
                  width: `${100 / 9}%`,
                  '--seg-color': stage.color
                }}
                onClick={() => seekStage(stage.index)}
                title={`跳转到：${stage.name}`}
              >
                <span className="segment-dot" />
                <span className="segment-label">{stage.short}</span>
              </button>
            )
          })}
        </div>
      </div>
    </footer>
  )
}

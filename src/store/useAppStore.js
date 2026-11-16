import { create } from 'zustand'

/**
 * 全局应用状态（zustand）
 * 所有 UI 与 3D 场景共享同一份状态。
 */
export const TOTAL_DURATION = 90 // 全流程一次循环时长（秒），9 个工序各 10 秒

const useAppStore = create((set, get) => ({
  // ---------- 时间轴 ----------
  progress: 0, // 当前流程位置 0 ~ 1（对应 0 ~ TOTAL_DURATION 秒）
  playing: true,
  speed: 1, // 播放倍速
  fps: 0, // 实时帧率（由场景驱动每 0.5s 回写）
  activeStage: 0, // 当前高亮工序索引

  setProgress: (progress) => set({ progress: Math.min(1, Math.max(0, progress)) }),
  setActiveStage: (activeStage) => set({ activeStage }),
  setFps: (fps) => set({ fps }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setPlaying: (playing) => set({ playing }),
  setSpeed: (speed) => set({ speed }),
  /** 跳转到指定工序（0 ~ 8） */
  seekStage: (index) =>
    set({ progress: Math.min(1, Math.max(0, index / 9)), activeStage: index }),

  // ---------- 显示模式 ----------
  // normal 正常 | xray X 光透视 | clip 剖切面裁剪 | explode 爆炸视图
  mode: 'normal',
  setMode: (mode) => set({ mode }),

  // ---------- 部件选中 ----------
  selectedId: null,
  selectPart: (id) => set({ selectedId: id }),
  clearSelection: () => set({ selectedId: null })
}))

export default useAppStore

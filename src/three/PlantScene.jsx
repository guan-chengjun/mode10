import { Suspense, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid, AdaptiveDpr, Html } from '@react-three/drei'
import * as THREE from 'three'
import useAppStore, { TOTAL_DURATION } from '../store/useAppStore.js'
import { PARTS } from '../data/parts.js'
import { STAGES } from '../data/stages.js'
import { STATION_X } from '../data/layout.js'
import PartMesh, { CLIP_PLANE } from './PartMesh.jsx'
import Particles from './Particles.jsx'
import MaterialFlow from './MaterialFlow.jsx'
import { THEME, STAGE_TINT } from './theme.js'

/** 时间轴推进与当前工序计算（R3F 帧循环驱动，避免额外定时器） */
function TimelineDriver() {
  const playing = useAppStore((s) => s.playing)
  const speed = useAppStore((s) => s.speed)
  const frames = useRef(0)
  const fpsAcc = useRef(0)
  const uiAcc = useRef(0)

  useFrame((_, delta) => {
    const state = useAppStore.getState()
    if (playing) {
      const p = state.progress + (delta * speed) / TOTAL_DURATION
      const next = p >= 1 ? 0 : p
      // 节流到约 20Hz 写回 React 状态，避免每帧重渲染整个界面
      uiAcc.current += delta
      if (uiAcc.current >= 0.05) {
        state.setProgress(next)
        uiAcc.current = 0
      }
    }
    const stage = Math.min(8, Math.floor(useAppStore.getState().progress * 9))
    if (stage !== useAppStore.getState().activeStage) state.setActiveStage(stage)

    // 每 0.5s 统计一次 FPS
    frames.current += 1
    fpsAcc.current += delta
    if (fpsAcc.current >= 0.5) {
      state.setFps(Math.round(frames.current / fpsAcc.current))
      frames.current = 0
      fpsAcc.current = 0
    }
  })
  return null
}

/** 剖切面可视化（clip 模式下显示半透明切面网格） */
function ClipHelper() {
  const mode = useAppStore((s) => s.mode)
  const ref = useRef(null)
  useFrame((state) => {
    if (!ref.current) return
    // plane: normal*p = -constant → p_x = constant（normal.x=-1）
    ref.current.position.x = CLIP_PLANE.constant
    if (mode === 'clip') {
      const t = (state.clock.elapsedTime / 24) % 1
      CLIP_PLANE.constant = 46 - t * 92
    } else {
      CLIP_PLANE.constant = 999 // 场景最大范围约 ±45，999 等价于不裁剪
    }
  })
  if (mode !== 'clip') return null
  return (
    <mesh ref={ref} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[16, 14]} />
      <meshBasicMaterial color="#4fc3f7" transparent opacity={0.12} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}

/** 工位基座与工序编号牌 */
function StationPads() {
  const activeStage = useAppStore((s) => s.activeStage)
  const selectPart = useAppStore((s) => s.selectPart)
  return (
    <group>
      {STAGES.map((stage) => {
        const active = stage.index === activeStage
        const color = STAGE_TINT[stage.index]
        return (
          <group key={stage.index} position={[STATION_X[stage.index], 0, 0]}>
            <mesh
              position={[0, 0.02, 0]}
              receiveShadow
              onClick={(e) => {
                e.stopPropagation()
                useAppStore.getState().seekStage(stage.index)
              }}
            >
              <boxGeometry args={[7.6, 0.08, 7.6]} />
              <meshStandardMaterial
                color={active ? color : THEME.structure}
                emissive={color}
                emissiveIntensity={active ? 0.35 : 0.05}
                roughness={0.8}
                metalness={0.3}
                transparent
                opacity={active ? 0.9 : 0.55}
              />
            </mesh>
            {/* 编号立柱 */}
            <mesh position={[3.1, 0.7, -3.1]}>
              <boxGeometry args={[0.12, 1.4, 0.12]} />
              <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
            </mesh>
            {/* 工序名称牌（DOM 标注，避免离线字体纹理问题） */}
            <Html
              center
              position={[0, 0.35, 3.55]}
              zIndexRange={[5, 0]}
              style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 1,
                  padding: '3px 12px',
                  borderRadius: 6,
                  color: active ? '#eaf6ff' : '#93a8bb',
                  background: active ? `${color}33` : 'rgba(13,19,27,0.75)',
                  border: `1px solid ${active ? color : 'rgba(120,150,180,0.3)'}`,
                  transition: 'all .25s'
                }}
              >
                {stage.index + 1}. {stage.name}
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

/** 场景灯光：环境光 + 主平行光（带阴影）+ 冷暖补光 */
function Lights() {
  return (
    <group>
      <ambientLight intensity={0.42} color="#b8c8dc" />
      <hemisphereLight args={['#9fb8d8', '#1a212b', 0.5]} />
      <directionalLight
        position={[20, 32, 18]}
        intensity={1.5}
        color="#fff2dd"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-45}
        shadow-camera-right={45}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-far={90}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-25, 14, -12]} intensity={0.45} color="#5f8fc7" />
      <pointLight position={[-18, 3, 3.5]} intensity={2.2} distance={9} color="#ff6a26" />
      <pointLight position={[-9, 3, 1]} intensity={2.0} distance={8} color="#ff8a3c" />
      <pointLight position={[29, 3, 0]} intensity={1.6} distance={8} color="#ffb347" />
    </group>
  )
}

function SceneContents() {
  const clearSelection = useAppStore((s) => s.clearSelection)
  return (
    <group onPointerMissed={() => clearSelection()}>
      <Lights />
      <StationPads />
      {PARTS.map((part) => (
        <PartMesh key={part.id} part={part} />
      ))}
      <MaterialFlow />
      <Particles />
      <ClipHelper />
      <TimelineDriver />
    </group>
  )
}

export default function PlantScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
        localClippingEnabled: true
      }}
      camera={{ position: [-6, 17, 40], fov: 48, near: 0.1, far: 300 }}
      onCreated={({ gl }) => {
        gl.setClearColor(THEME.ground)
      }}
    >
      <color attach="background" args={[THEME.ground]} />
      <fog attach="fog" args={[THEME.ground, 55, 130]} />
      <Suspense fallback={null}>
        <SceneContents />
      </Suspense>
      <Grid
        position={[0, -0.02, 0]}
        args={[110, 24]}
        cellSize={1}
        cellThickness={0.6}
        cellColor={THEME.grid}
        sectionSize={5}
        sectionThickness={1.1}
        sectionColor="#3d5268"
        fadeDistance={120}
        fadeStrength={1.5}
        infiniteGrid
      />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        minDistance={8}
        maxDistance={90}
        maxPolarAngle={Math.PI / 2.05}
        target={[0, 2.5, 0]}
      />
      <AdaptiveDpr pixelated />
    </Canvas>
  )
}

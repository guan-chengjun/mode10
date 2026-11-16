import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { EMITTERS } from '../data/layout.js'
import useAppStore from '../store/useAppStore.js'

/** 各类粒子的配色与运动参数 */
const KIND_STYLE = {
  flame: {
    color: 0xff7a18,
    color2: 0xffd166,
    size: 0.22,
    opacity: 0.85,
    up: 1.6,
    spread: 0.5,
    life: 1.6
  },
  spark: {
    color: 0xffe08a,
    color2: 0xff8c2a,
    size: 0.1,
    opacity: 0.95,
    up: 2.4,
    spread: 1.1,
    life: 1.1
  },
  steam: {
    color: 0xcfd8e0,
    color2: 0x8fa3b8,
    size: 0.34,
    opacity: 0.4,
    up: 1.0,
    spread: 0.35,
    life: 2.6
  }
}

function Emitter({ config }) {
  const mode = useAppStore((s) => s.mode)
  const activeStage = useAppStore((s) => s.activeStage)
  const matRef = useRef(null)
  const pointsRef = useRef(null)
  const style = KIND_STYLE[config.kind]

  const { geometry, velocities, lifeLeft, lifeMax } = useMemo(() => {
    const n = config.count
    const positions = new Float32Array(n * 3)
    const colors = new Float32Array(n * 3)
    const c1 = new THREE.Color(style.color)
    const c2 = new THREE.Color(style.color2)
    const velocities = new Float32Array(n * 3)
    const lifeLeft = new Float32Array(n)
    const lifeMax = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      positions[i * 3 + 1] = -100 // 先藏到地面以下
      const c = c1.clone().lerp(c2, Math.random())
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return { geometry, velocities, lifeLeft, lifeMax }
  }, [config.count, style.color, style.color2])

  const respawn = (i) => {
    const pos = geometry.attributes.position.array
    const sp = config.spread ?? style.spread
    pos[i * 3] = config.position[0] + (Math.random() - 0.5) * sp
    pos[i * 3 + 1] = config.position[1] + Math.random() * 0.2
    pos[i * 3 + 2] = config.position[2] + (Math.random() - 0.5) * sp
    velocities[i * 3] = (Math.random() - 0.5) * style.spread
    velocities[i * 3 + 1] = style.up * (0.6 + Math.random() * 0.7)
    velocities[i * 3 + 2] = (Math.random() - 0.5) * style.spread
    const life = style.life * (0.7 + Math.random() * 0.6)
    lifeLeft[i] = life
    lifeMax[i] = life
  }

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05)
    const active = config.stage === -1 || config.stage === activeStage
    const pos = geometry.attributes.position.array
    const rate = config.rate ?? 1
    const n = config.count
    for (let i = 0; i < n; i++) {
      if (lifeLeft[i] > 0) {
        lifeLeft[i] -= dt
        pos[i * 3] += velocities[i * 3] * dt
        pos[i * 3 + 1] += velocities[i * 3 + 1] * dt
        pos[i * 3 + 2] += velocities[i * 3 + 2] * dt
        // 火焰/蒸汽上升时略微减速并横向扩散
        velocities[i * 3 + 1] *= 1 - 0.35 * dt
        velocities[i * 3] += (Math.random() - 0.5) * dt * 0.4
        velocities[i * 3 + 2] += (Math.random() - 0.5) * dt * 0.4
        if (lifeLeft[i] <= 0) pos[i * 3 + 1] = -100
      } else if (active && Math.random() < dt * 26 * rate) {
        respawn(i)
      }
    }
    geometry.attributes.position.needsUpdate = true
    if (matRef.current) {
      const targetOpacity = active ? style.opacity : 0
      matRef.current.opacity += (targetOpacity - matRef.current.opacity) * Math.min(1, dt * 4)
    }
  })

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        ref={matRef}
        size={style.size}
        vertexColors
        transparent
        opacity={0}
        depthWrite={false}
        blending={config.kind === 'steam' ? THREE.NormalBlending : THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

/** 全部粒子发射器的统一入口 */
export default function Particles() {
  return (
    <group>
      {EMITTERS.map((e) => (
        <Emitter key={e.id} config={e} />
      ))}
    </group>
  )
}

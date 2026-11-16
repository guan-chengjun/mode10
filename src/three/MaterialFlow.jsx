import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FLOW_CURVE, PACKET_COUNT, IRON_STREAM } from '../data/layout.js'
import useAppStore from '../store/useAppStore.js'
import { STAGE_TINT } from './theme.js'

/** 路径采样点数（TubeGeometry 与 getPointAt 使用） */
const PATH_SEGMENTS = 240

/** 物流路径管线（半透明青蓝，指示物料走向） */
function FlowPath() {
  const geometry = useMemo(
    () => new THREE.TubeGeometry(FLOW_CURVE, PATH_SEGMENTS, 0.045, 8, false),
    []
  )
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#4fc3f7"
        emissive="#1f7fa8"
        emissiveIntensity={0.8}
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </mesh>
  )
}

/** 沿路径运动的发光物料包：进度驱动、首尾相接循环 */
function Packets() {
  const refs = useRef([])
  const progress = useAppStore((s) => s.progress)
  const activeStage = useAppStore((s) => s.activeStage)
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame(() => {
    refs.current.forEach((mesh, i) => {
      if (!mesh) return
      // 每个包错开 1/PACKET_COUNT，随全局进度循环
      const t = (progress + i / PACKET_COUNT) % 1
      FLOW_CURVE.getPointAt(t, tmp)
      mesh.position.copy(tmp)
      const pulse = 1 + Math.sin(performance.now() * 0.006 + i) * 0.12
      mesh.scale.setScalar(pulse)
    })
  })

  return (
    <group>
      {Array.from({ length: PACKET_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          castShadow
        >
          <icosahedronGeometry args={[0.28, 1]} />
          <meshStandardMaterial
            color={STAGE_TINT[activeStage]}
            emissive={STAGE_TINT[activeStage]}
            emissiveIntensity={1.6}
            roughness={0.3}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  )
}

/** 铁水倾浇注光流（仅在高炉工序时段显示） */
function IronStream() {
  const matRef = useRef(null)
  const meshRef = useRef(null)
  const activeStage = useAppStore((s) => s.activeStage)

  const { position, quaternion, length } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(IRON_STREAM.to, IRON_STREAM.from)
    const length = dir.length()
    const mid = new THREE.Vector3().addVectors(IRON_STREAM.from, IRON_STREAM.to).multiplyScalar(0.5)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    )
    return { position: mid, quaternion, length }
  }, [])

  useFrame((state) => {
    if (matRef.current) {
      const target = activeStage === IRON_STREAM.stage ? 0.95 : 0
      matRef.current.opacity += (target - matRef.current.opacity) * 0.12
      matRef.current.emissiveIntensity = 1.6 + Math.sin(state.clock.elapsedTime * 10) * 0.5
    }
    if (meshRef.current) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 12) * 0.08
      meshRef.current.scale.set(s, 1, s)
    }
  })

  return (
    <mesh ref={meshRef} position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.09, 0.13, length, 10, 1, true]} />
      <meshStandardMaterial
        ref={matRef}
        color="#ff6a26"
        emissive="#ff4d0a"
        emissiveIntensity={1.8}
        transparent
        opacity={0}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

export default function MaterialFlow() {
  return (
    <group>
      <FlowPath />
      <Packets />
      <IronStream />
    </group>
  )
}

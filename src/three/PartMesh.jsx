import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'
import useAppStore from '../store/useAppStore.js'
import { PART_TRANSFORMS } from '../data/layout.js'
import { loadPartModel } from './modelLoader.js'
import { createProcedural } from './procedural.js'

/** 全局剖切面（normal 指向 -X，从场景东端向西扫过） */
export const CLIP_PLANE = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 46)

/** X 光共享材质：轻量半透明发光（不使用 transmission，保证低端设备帧率） */
function makeXrayMaterial() {
  return new THREE.MeshStandardMaterial({
    color: '#7fd4ff',
    emissive: '#2a8fd0',
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.28,
    roughness: 0.3,
    metalness: 0.15,
    side: THREE.DoubleSide,
    depthWrite: false
  })
}

const tmpPos = new THREE.Vector3()
const tmpScale = new THREE.Vector3()

/**
 * 单个部件：负责 glb 加载/程序化降级、四种显示模式、拾取选中、爆炸位移
 */
export default function PartMesh({ part }) {
  const groupRef = useRef(null)
  const [asset, setAsset] = useState(null)
  const [usingFallback, setUsingFallback] = useState(false)
  const [hovered, setHovered] = useState(false)

  const mode = useAppStore((s) => s.mode)
  const activeStage = useAppStore((s) => s.activeStage)
  const selectedId = useAppStore((s) => s.selectedId)
  const selectPart = useAppStore((s) => s.selectPart)

  const transform = PART_TRANSFORMS[part.id]
  const isSelected = selectedId === part.id
  const isDimmed = !isSelected && selectedId !== null

  // 材质缓存（每个 mesh 对应一套模式材质）
  const materialSets = useRef(new WeakMap())
  // ---------- 资源加载：在线 → 本地 → 程序化降级 ----------
  useEffect(() => {
    let cancelled = false
    if (!part.model?.url) {
      const g = createProcedural(part.model?.fallback || 'cone')
      setAsset(g)
      setUsingFallback(true)
      return
    }
    loadPartModel(part.id, part.model.url)
      .then((scene) => {
        if (cancelled) return
        normalizeModel(scene)
        setAsset(scene)
        setUsingFallback(false)
      })
      .catch(() => {
        if (cancelled) return
        setAsset(createProcedural(part.model.fallback || 'cone'))
        setUsingFallback(true)
      })
    return () => {
      cancelled = true
    }
  }, [part.id, part.model])

  // ---------- 统一打标 + 材质缓存 ----------
  useEffect(() => {
    if (!asset) return
    asset.traverse((obj) => {
      if (!obj.isMesh) return
      obj.userData.partId = part.id
      obj.castShadow = true
      obj.receiveShadow = true
      const base = obj.material
      if (Array.isArray(base)) return
      if (!materialSets.current.has(obj)) {
        const cloned = base ? base.clone() : new THREE.MeshStandardMaterial({ color: '#667788' })
        cloned.clippingPlanes = [CLIP_PLANE]
        materialSets.current.set(obj, {
          normal: cloned,
          xray: makeXrayMaterial(),
          // 记录程序化材质自带的高温自发光，避免高亮逻辑把它清零
          baseEmissive: cloned.emissive ? cloned.emissive.clone() : new THREE.Color(0, 0, 0),
          baseEmissiveIntensity: cloned.emissiveIntensity ?? 0
        })
      }
    })
  }, [asset, part.id])

  // ---------- 显示模式：材质切换 ----------
  useEffect(() => {
    if (!asset) return
    asset.traverse((obj) => {
      if (!obj.isMesh) return
      const set = materialSets.current.get(obj)
      if (!set) return
      if (mode === 'xray') {
        obj.material = set.xray
      } else {
        obj.material = set.normal
        const m = set.normal
        // 剖切面与爆炸视图保持实体材质；正常模式恢复
        m.transparent = mode !== 'normal' ? false : isDimmed
        m.opacity = isDimmed ? 0.28 : 1
        m.depthWrite = !isDimmed
      }
    })
  }, [mode, asset, isDimmed])

  // ---------- 选中/悬停高亮 ----------
  useEffect(() => {
    if (!asset) return
    asset.traverse((obj) => {
      if (!obj.isMesh) return
      const set = materialSets.current.get(obj)
      if (!set) return
      const m = set.normal
      if (isSelected) {
        m.emissive = new THREE.Color('#4fc3f7')
        m.emissiveIntensity = 0.55
      } else if (hovered) {
        m.emissive = new THREE.Color('#ffcc66')
        m.emissiveIntensity = 0.35
      } else {
        // 恢复材质原始自发光（如铁水、火焰部件的辉光）
        m.emissive = set.baseEmissive.clone()
        m.emissiveIntensity = set.baseEmissiveIntensity
      }
    })
  }, [isSelected, hovered, asset, mode])

  // ---------- 每帧：爆炸位移 + 剖切面扫描 ----------
  useFrame((state) => {
    const g = groupRef.current
    if (!g) return
    const [bx, by, bz] = part.explode || [0, 0, 0]
    const target = tmpPos.set(
      transform.position[0] + (mode === 'explode' ? bx : 0),
      transform.position[1] + (mode === 'explode' ? by : 0),
      transform.position[2] + (mode === 'explode' ? bz : 0)
    )
    g.position.lerp(target, 0.12)
    if (transform.rotation) g.rotation.set(...transform.rotation)
    const s = (transform.scale ?? 1) * (isSelected ? 1.04 : 1)
    g.scale.lerp(tmpScale.set(s, s, s), 0.15)

    if (mode === 'clip') {
      // 剖切面常量由 PlantScene 的 ClipHelper 统一驱动
    } else {
      CLIP_PLANE.constant = 999 // 不裁剪
    }
  })

  const onClick = (e) => {
    e.stopPropagation()
    selectPart(part.id)
  }

  const label = useMemo(
    () => (
      <Html
        center
        distanceFactor={16}
        position={[0, 2.6, 0]}
        style={{ pointerEvents: 'none', whiteSpace: 'nowrap' }}
        zIndexRange={[20, 0]}
      >
        <div
          style={{
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 13,
            color: '#e8f2fb',
            background: isSelected ? 'rgba(79,195,247,0.92)' : 'rgba(16,24,34,0.85)',
            border: '1px solid rgba(140,180,220,0.45)',
            transform: hovered || isSelected ? 'scale(1.08)' : 'scale(0.92)',
            opacity: hovered || isSelected ? 1 : 0.72,
            transition: 'all .18s'
          }}
        >
          {part.name}
        </div>
      </Html>
    ),
    [part.name, hovered, isSelected]
  )

  return (
    <group
      ref={groupRef}
      position={transform.position}
      rotation={transform.rotation || [0, 0, 0]}
      onClick={onClick}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {asset && <primitive object={asset} />}
      {(hovered || isSelected) && label}
    </group>
  )
}

/**
 * 归一化下载模型：居中、落地、限制最大尺寸，避免外部 glb 比例失控
 */
function normalizeModel(scene) {
  const box = new THREE.Box3().setFromObject(scene)
  const size = new THREE.Vector3()
  const center = new THREE.Vector3()
  box.getSize(size)
  box.getCenter(center)
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const targetMax = 3.4
  const k = targetMax / maxDim
  scene.scale.setScalar(k)
  scene.position.sub(center.multiplyScalar(k))
  // 缩放后重新计算并落地
  const box2 = new THREE.Box3().setFromObject(scene)
  scene.position.y -= box2.min.y
}

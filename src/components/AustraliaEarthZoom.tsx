import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { australiaOutline, type GeoPoint } from '../data/australiaOutline'
import { journeyLocations, type JourneyLocation } from '../data/journey'
import { useModalScrollLock } from '../hooks/useModalScrollLock'
import { useLanguage } from '../i18n'
import { JourneyGallery } from './JourneyGallery'

gsap.registerPlugin(ScrollTrigger)

type ProjectedPoint = {
  x: number
  y: number
  visible: boolean
  depth: number
}

type Scene = {
  centerLng: number
  centerLat: number
  cx: number
  cy: number
  radius: number
}

type PhaseKey = 'orbit' | 'approach' | 'australia' | 'itinerary'

const DEG = Math.PI / 180
const TAU = Math.PI * 2
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress
const ease = (value: number) => {
  const progress = clamp01(value)
  return progress * progress * (3 - 2 * progress)
}

function project(lng: number, lat: number, scene: Scene): ProjectedPoint {
  const longitude = (lng - scene.centerLng) * DEG
  const latitude = lat * DEG
  const centerLatitude = scene.centerLat * DEG
  const cosLatitude = Math.cos(latitude)
  const sinLatitude = Math.sin(latitude)
  const cosCenter = Math.cos(centerLatitude)
  const sinCenter = Math.sin(centerLatitude)
  const cosLongitude = Math.cos(longitude)
  const depth = sinCenter * sinLatitude + cosCenter * cosLatitude * cosLongitude

  return {
    x: scene.cx + scene.radius * cosLatitude * Math.sin(longitude),
    y: scene.cy - scene.radius * (cosCenter * sinLatitude - sinCenter * cosLatitude * cosLongitude),
    visible: depth > 0,
    depth,
  }
}

function strokeGeoLine(context: CanvasRenderingContext2D, points: GeoPoint[], scene: Scene) {
  let drawing = false
  context.beginPath()
  for (const [lng, lat] of points) {
    const point = project(lng, lat, scene)
    if (!point.visible) {
      drawing = false
      continue
    }
    if (!drawing) context.moveTo(point.x, point.y)
    else context.lineTo(point.x, point.y)
    drawing = true
  }
  context.stroke()
}

function greatCirclePoints(from: GeoPoint, to: GeoPoint, steps = 36): GeoPoint[] {
  const toVector = ([lng, lat]: GeoPoint) => {
    const longitude = lng * DEG
    const latitude = lat * DEG
    return [
      Math.cos(latitude) * Math.cos(longitude),
      Math.sin(latitude),
      Math.cos(latitude) * Math.sin(longitude),
    ]
  }
  const fromVector = toVector(from)
  const toVectorPoint = toVector(to)
  const dot = Math.min(1, Math.max(-1,
    fromVector[0] * toVectorPoint[0]
    + fromVector[1] * toVectorPoint[1]
    + fromVector[2] * toVectorPoint[2],
  ))
  const angle = Math.acos(dot)
  const sinAngle = Math.sin(angle)

  return Array.from({ length: steps + 1 }, (_, index) => {
    const progress = index / steps
    if (sinAngle < 0.00001) return [lerp(from[0], to[0], progress), lerp(from[1], to[1], progress)]
    const fromWeight = Math.sin((1 - progress) * angle) / sinAngle
    const toWeight = Math.sin(progress * angle) / sinAngle
    const x = fromVector[0] * fromWeight + toVectorPoint[0] * toWeight
    const y = fromVector[1] * fromWeight + toVectorPoint[1] * toWeight
    const z = fromVector[2] * fromWeight + toVectorPoint[2] * toWeight
    return [Math.atan2(z, x) / DEG, Math.atan2(y, Math.hypot(x, z)) / DEG]
  })
}

const routeSegments = journeyLocations.slice(0, -1).map((location, index) => greatCirclePoints(
  [location.coordinates.lng, location.coordinates.lat],
  [journeyLocations[index + 1].coordinates.lng, journeyLocations[index + 1].coordinates.lat],
))

const preloadedLocationImages = new Set<string>()

function preloadLocationPreview(location: JourneyLocation) {
  const firstArtwork = location.artworks[0]
  if (!firstArtwork || firstArtwork.type === 'placeholder') return
  const source = matchMedia('(max-width: 760px)').matches ? firstArtwork.mobileSrc : firstArtwork.src
  if (preloadedLocationImages.has(source)) return
  const image = new Image()
  image.src = source
  preloadedLocationImages.add(source)
}

function JourneyFlagIcon({ locationId, compact = false }: { locationId: string; compact?: boolean }) {
  const symbol = (() => {
    switch (locationId) {
      case 'sydney':
        return <><path d="M16 34Q19 19 27 32Q29 13 38 32Q42 19 54 34" /><path d="M15 34H56M20 29Q25 27 30 29M35 28Q42 25 49 29" /></>
      case 'melbourne':
        return <><circle cx="23" cy="20" r="6.5" /><circle cx="52" cy="20" r="6.5" /><ellipse cx="37.5" cy="22" rx="14" ry="12" /><ellipse cx="37.5" cy="25" rx="4" ry="5" /><path d="M31 20h.2M44 20h.2M34 30Q37.5 33 41 30" /></>
      case 'perth':
        return <><path d="M15 29C25 35 43 35 56 27C49 27 45 24 43 20C40 14 43 10 49 10C43 8 38 11 37 17C36 23 29 25 17 24Z" /><path d="M48 10L56 12L49 14M22 30Q28 27 34 30" /></>
      case 'adelaide':
        return <><path d="M14 31C21 25 28 23 36 24L45 17L56 19L50 22C57 24 61 28 62 32L54 30L47 27L41 33L34 34L39 28L29 31L24 35L19 35L23 31Z" /><path d="M47 18L45 13M51 19L53 14M35 25Q29 20 24 22" /></>
      case 'kangaroo-island':
        return <><path d="M14 31C21 25 28 23 36 24L45 17L56 19L50 22C57 24 61 28 62 32L54 30L47 27L41 33L34 34L39 28L29 31L24 35L19 35L23 31Z" /><path d="M47 18L45 13M51 19L53 14M35 25Q29 20 24 22" /></>
      default:
        return <><path d="M15 16C26 29 44 30 59 14C53 29 40 36 27 31C20 28 16 22 13 18Z" /><circle cx="20" cy="12" r="1.2" /><circle cx="29" cy="17" r="1.2" /><circle cx="39" cy="19" r="1.2" /><circle cx="49" cy="15" r="1.2" /><circle cx="25" cy="9" r=".8" /><circle cx="35" cy="12" r=".8" /><circle cx="45" cy="9" r=".8" /></>
    }
  })()

  return (
    <span className={`earth-location__flag ${compact ? 'is-compact' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 72 76" focusable="false">
        <path className="flag-pole" d="M9 5V68" />
        <path className="flag-anchor" d="M2 68Q9 63 16 68Q9 73 2 68Z" />
        <g className="flag-cloth">
          <path className="flag-field" d="M9 8C25 5 43 12 66 7V39C46 44 28 36 9 40Z" />
          <g className="flag-symbol">{symbol}</g>
        </g>
      </svg>
    </span>
  )
}

function createRandom(seed: number) {
  let value = seed
  return () => {
    value |= 0
    value = value + 0x6d2b79f5 | 0
    let result = Math.imul(value ^ value >>> 15, 1 | value)
    result = result + Math.imul(result ^ result >>> 7, 61 | result) ^ result
    return ((result ^ result >>> 14) >>> 0) / 4294967296
  }
}

export function AustraliaEarthZoom() {
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const outroRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef<HTMLSpanElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const mobileListRef = useRef<HTMLOListElement>(null)
  const markerRefs = useRef<Array<HTMLButtonElement | null>>([])
  const { t } = useLanguage()
  const currentPhaseRef = useRef<PhaseKey>('orbit')
  const phaseTranslationsRef = useRef(t.earth.phases)
  phaseTranslationsRef.current = t.earth.phases
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)
  const [openLocationId, setOpenLocationId] = useState<string | null>(null)
  const openLocation = journeyLocations.find((location) => location.id === openLocationId) ?? null
  useModalScrollLock(openLocation !== null)

  useEffect(() => {
    if (phaseRef.current) phaseRef.current.textContent = t.earth.phases[currentPhaseRef.current]
  }, [t])

  useEffect(() => {
    const section = sectionRef.current
    const canvas = canvasRef.current
    const intro = introRef.current
    const outro = outroRef.current
    const phase = phaseRef.current
    const progressLine = progressRef.current
    const mobileList = mobileListRef.current
    if (!section || !canvas || !intro || !outro || !phase || !progressLine || !mobileList) return

    const context = canvas.getContext('2d', { alpha: false })
    if (!context) return

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const random = createRandom(1977)
    const stars = Array.from({ length: 110 }, () => ({
      x: random(),
      y: random(),
      size: 0.25 + random() * 1.15,
      alpha: 0.08 + random() * 0.24,
    }))
    const surfacePoints = Array.from({ length: 190 }, () => ({
      lng: random() * 360 - 180,
      lat: Math.asin(random() * 2 - 1) / DEG,
      size: 0.35 + random() * 1.2,
      alpha: 0.035 + random() * 0.12,
    }))

    let width = 1
    let height = 1
    let dpr = 1
    let targetProgress = reducedMotion ? 1 : 0
    let currentProgress = targetProgress
    let inView = false
    let frame = 0
    let lastPhase = ''

    const sceneFor = (progress: number): Scene => {
      const mobile = width <= 820
      const travel = ease((progress - 0.06) / 0.58)
      const zoom = ease(progress / 0.76)
      const baseRadius = Math.min(width, height) * (mobile ? 0.31 : 0.29)

      return {
        centerLng: lerp(78, 133.25, travel),
        centerLat: lerp(9, -25.25, travel),
        cx: lerp(width * (mobile ? 0.38 : 0.34), width * 0.5, travel),
        cy: lerp(height * 0.54, height * 0.51, travel),
        radius: baseRadius * lerp(1, mobile ? 3.75 : 3.72, zoom),
      }
    }

    const drawBackground = (progress: number) => {
      context.fillStyle = '#0c0d0b'
      context.fillRect(0, 0, width, height)

      const glow = context.createRadialGradient(width * 0.5, height * 0.48, 0, width * 0.5, height * 0.48, Math.max(width, height) * 0.72)
      glow.addColorStop(0, `rgba(82,91,78,${0.08 + progress * 0.045})`)
      glow.addColorStop(0.55, 'rgba(19,22,18,.045)')
      glow.addColorStop(1, 'rgba(0,0,0,.34)')
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)

      for (const star of stars) {
        context.globalAlpha = star.alpha * (1 - progress * 0.62)
        context.fillStyle = '#eeece6'
        context.beginPath()
        context.arc(star.x * width, star.y * height, star.size, 0, TAU)
        context.fill()
      }
      context.globalAlpha = 1
    }

    const drawGraticule = (scene: Scene, progress: number) => {
      context.strokeStyle = `rgba(168,181,162,${0.2 + progress * 0.08})`
      context.lineWidth = Math.max(0.55, 1 - progress * 0.25)

      const gridStep = width <= 820 ? 45 : 30
      for (let latitude = -60; latitude <= 60; latitude += gridStep) {
        const points: GeoPoint[] = []
        for (let longitude = -180; longitude <= 180; longitude += 3) points.push([longitude, latitude])
        strokeGeoLine(context, points, scene)
      }
      for (let longitude = -180; longitude < 180; longitude += gridStep) {
        const points: GeoPoint[] = []
        for (let latitude = -88; latitude <= 88; latitude += 2) points.push([longitude, latitude])
        strokeGeoLine(context, points, scene)
      }
    }

    const drawAustralia = (scene: Scene, progress: number) => {
      const reveal = ease((progress - 0.18) / 0.28)
      if (reveal <= 0) return

      context.beginPath()
      for (const ring of australiaOutline) {
        let started = false
        for (const [lng, lat] of ring) {
          const point = project(lng, lat, scene)
          if (!point.visible) continue
          if (!started) context.moveTo(point.x, point.y)
          else context.lineTo(point.x, point.y)
          started = true
        }
        if (started) context.closePath()
      }

      context.fillStyle = `rgba(168,181,162,${0.035 + reveal * 0.13})`
      context.fill()
      context.save()
      context.globalAlpha = reveal
      context.strokeStyle = 'rgba(226,227,220,.88)'
      context.lineWidth = Math.max(0.85, 1.35 - progress * 0.3)
      context.shadowColor = 'rgba(168,181,162,.38)'
      context.shadowBlur = 10
      context.stroke()
      context.restore()
    }

    const drawRoute = (scene: Scene, progress: number) => {
      const routeProgress = ease((progress - 0.6) / 0.27)
      if (routeProgress <= 0) return

      context.save()
      context.strokeStyle = `rgba(238,236,230,${0.35 + routeProgress * 0.45})`
      context.lineWidth = 1
      context.setLineDash([5, 9])
      context.lineDashOffset = -progress * 70

      const segmentProgress = routeProgress * routeSegments.length
      for (let index = 0; index < routeSegments.length; index += 1) {
        const amount = clamp01(segmentProgress - index)
        if (amount <= 0) continue
        const segment = routeSegments[index]
        const finalIndex = Math.min(segment.length - 1, Math.floor(amount * (segment.length - 1)))
        context.beginPath()
        segment.slice(0, finalIndex + 1).forEach(([lng, lat], pointIndex) => {
          const point = project(lng, lat, scene)
          if (pointIndex === 0) context.moveTo(point.x, point.y)
          else context.lineTo(point.x, point.y)
        })
        if (finalIndex < segment.length - 1) {
          const from = project(segment[finalIndex][0], segment[finalIndex][1], scene)
          const to = project(segment[finalIndex + 1][0], segment[finalIndex + 1][1], scene)
          const fraction = amount * (segment.length - 1) - finalIndex
          context.lineTo(lerp(from.x, to.x, fraction), lerp(from.y, to.y, fraction))
        }
        context.stroke()
      }
      context.restore()
    }

    const placeLabels = (points: ProjectedPoint[]) => {
      if (width <= 820) return

      type LabelRect = { left: number; top: number; right: number; bottom: number }
      const margin = Math.max(18, width * 0.018)
      const placed: LabelRect[] = []
      const intersects = (a: LabelRect, b: LabelRect, padding = 7) => !(
        a.right + padding < b.left
        || a.left - padding > b.right
        || a.bottom + padding < b.top
        || a.top - padding > b.bottom
      )
      const flagRects = points.map((point, index): LabelRect => {
        const facesLeft = index === 0 || index === 1 || index === 4 || index === 5
        return {
          left: point.x + (facesLeft ? -74 : -10),
          right: point.x + (facesLeft ? 10 : 74),
          top: point.y - 82,
          bottom: point.y + 6,
        }
      })
      const verticalOffsets = [10, 34, 58, 82, 106, 130]
      const placementOrder = [0, 1, 2, 5, 3, 4]

      placementOrder.forEach((index) => {
        const point = points[index]
        const marker = markerRefs.current[index]
        if (!marker) return
        const label = marker.querySelector<HTMLElement>('.earth-location__label')
        if (!label) return
        const facesLeft = index === 0 || index === 1 || index === 4 || index === 5
        const leftAdjustment = index === 5 ? 12 : index === 4 ? -12 : -4
        const labelWidth = Math.max(62, Math.min(142, journeyLocations[index].name.length * 6.2 + 12))
        const labelHeight = 22
        let chosen: { x: number; y: number; rect: LabelRect } | null = null

        for (const offsetY of verticalOffsets) {
          const x = facesLeft ? point.x - labelWidth + leftAdjustment : point.x + 4
          const y = point.y + offsetY
          const rect = { left: x, top: y, right: x + labelWidth, bottom: y + labelHeight }
          const insideViewport = rect.left >= margin && rect.right <= width - margin && rect.top >= margin && rect.bottom <= height - margin
          const avoidsLabels = placed.every((other) => !intersects(rect, other))
          const avoidsFlags = flagRects.every((flag) => !intersects(rect, flag, 3))
          if (insideViewport && avoidsLabels && avoidsFlags) {
            chosen = { x, y, rect }
            break
          }
        }

        if (!chosen) {
          const rawX = facesLeft ? point.x - labelWidth + leftAdjustment : point.x + 4
          const rawY = point.y + verticalOffsets[0]
          const x = Math.min(width - margin - labelWidth, Math.max(margin, rawX))
          const y = Math.min(height - margin - labelHeight, Math.max(margin, rawY))
          chosen = { x, y, rect: { left: x, top: y, right: x + labelWidth, bottom: y + labelHeight } }
        }

        placed.push(chosen.rect)
        const dx = chosen.x - point.x
        const dy = chosen.y - point.y
        marker.style.setProperty('--label-x', `${dx}px`)
        marker.style.setProperty('--label-y', `${dy}px`)
        marker.style.setProperty('--label-width', `${labelWidth}px`)
      })
    }

    const updateInterface = (scene: Scene, progress: number) => {
      const introProgress = ease(progress / 0.2)
      intro.style.opacity = String(1 - introProgress)
      intro.style.transform = `translateY(${-introProgress * 38}px)`

      const outroProgress = ease((progress - 0.92) / 0.075)
      outro.style.opacity = String(outroProgress)
      outro.style.transform = `translateY(${(1 - outroProgress) * 28}px)`
      mobileList.style.opacity = String(outroProgress)
      mobileList.style.transform = `translateY(${(1 - outroProgress) * 24}px)`

      progressLine.style.transform = `scaleX(${progress})`
      const nextPhase: PhaseKey = progress < 0.18
        ? 'orbit'
        : progress < 0.52
          ? 'approach'
          : progress < 0.72
            ? 'australia'
            : 'itinerary'
      if (nextPhase !== lastPhase) {
        currentPhaseRef.current = nextPhase
        phase.textContent = phaseTranslationsRef.current[nextPhase]
        lastPhase = nextPhase
      }

      const markerPoints = journeyLocations.map((location) => project(location.coordinates.lng, location.coordinates.lat, scene))
      markerRefs.current.forEach((marker, index) => {
        if (!marker) return
        const point = markerPoints[index]
        const reveal = ease((progress - (0.61 + index * 0.055)) / 0.065)
        marker.style.left = `${point.x}px`
        marker.style.top = `${point.y}px`
        marker.style.opacity = String(point.visible ? reveal : 0)
        const perspectiveScale = 0.82 + clamp01(point.depth) * 0.18
        marker.style.transform = `scale(${(0.72 + reveal * 0.28) * perspectiveScale})`
        marker.style.pointerEvents = reveal > 0.92 ? 'auto' : 'none'
      })
      placeLabels(markerPoints)
    }

    const draw = (progress: number) => {
      const scene = sceneFor(progress)
      drawBackground(progress)

      const sphere = context.createRadialGradient(
        scene.cx - scene.radius * 0.28,
        scene.cy - scene.radius * 0.32,
        scene.radius * 0.04,
        scene.cx,
        scene.cy,
        scene.radius,
      )
      sphere.addColorStop(0, '#252a24')
      sphere.addColorStop(0.52, '#171a16')
      sphere.addColorStop(0.84, '#10120f')
      sphere.addColorStop(1, '#080a08')
      context.fillStyle = sphere
      context.beginPath()
      context.arc(scene.cx, scene.cy, scene.radius, 0, TAU)
      context.fill()

      context.save()
      context.beginPath()
      context.arc(scene.cx, scene.cy, scene.radius, 0, TAU)
      context.clip()
      drawGraticule(scene, progress)

      for (const surfacePoint of surfacePoints) {
        const point = project(surfacePoint.lng, surfacePoint.lat, scene)
        if (!point.visible) continue
        context.globalAlpha = surfacePoint.alpha
        context.fillStyle = '#d9ddd2'
        context.beginPath()
        context.arc(point.x, point.y, surfacePoint.size, 0, TAU)
        context.fill()
      }
      context.globalAlpha = 1
      drawAustralia(scene, progress)
      drawRoute(scene, progress)
      context.restore()

      context.strokeStyle = `rgba(168,181,162,${0.55 - progress * 0.2})`
      context.lineWidth = 1.1
      context.beginPath()
      context.arc(scene.cx, scene.cy, scene.radius, 0, TAU)
      context.stroke()

      const atmosphere = context.createRadialGradient(scene.cx, scene.cy, scene.radius * 0.94, scene.cx, scene.cy, scene.radius * 1.035)
      atmosphere.addColorStop(0, 'rgba(168,181,162,0)')
      atmosphere.addColorStop(0.7, 'rgba(168,181,162,.08)')
      atmosphere.addColorStop(1, 'rgba(168,181,162,0)')
      context.fillStyle = atmosphere
      context.beginPath()
      context.arc(scene.cx, scene.cy, scene.radius * 1.04, 0, TAU)
      context.fill()

      updateInterface(scene, progress)
    }

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      dpr = Math.min(devicePixelRatio || 1, width <= 820 ? 1 : 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      draw(currentProgress)
    }

    const tick = () => {
      frame = 0
      if (!inView) return
      currentProgress += (targetProgress - currentProgress) * 0.085
      const settled = Math.abs(targetProgress - currentProgress) < 0.0001
      if (settled) currentProgress = targetProgress
      draw(currentProgress)
      if (!settled) frame = requestAnimationFrame(tick)
    }

    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }

    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(canvas)

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) start()
    }, { rootMargin: '20% 0px' })
    intersectionObserver.observe(section)

    const scrollTrigger = reducedMotion ? null : ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: ({ progress }) => {
        targetProgress = progress
        start()
      },
    })

    if (reducedMotion) draw(1)

    return () => {
      cancelAnimationFrame(frame)
      scrollTrigger?.kill()
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
    }
  }, [])

  const locationCopy = (locationId: string) => t.earth.locations[locationId as keyof typeof t.earth.locations]
  const photographCount = (count: number) => `${count} ${count > 1 ? t.common.photographs : t.common.photograph}`

  return (
    <section className="earth-zoom" id="voyage" aria-labelledby="earth-zoom-title" data-chapter ref={sectionRef}>
      <div className="earth-zoom__sticky">
        <canvas className="earth-zoom__canvas" ref={canvasRef} aria-hidden="true" />
        <div className="earth-zoom__vignette" aria-hidden="true" />

        <div className="earth-zoom__intro" ref={introRef}>
          <div className="section-kicker">
            <span>02</span><span>{t.earth.cartography}</span><span>{t.earth.australia}</span>
          </div>
          <h2 id="earth-zoom-title">{t.earth.titleFirst}<br /><em>{t.earth.titleSecond}</em></h2>
          <p>{t.earth.introduction}</p>
        </div>

        <div className="earth-zoom__hud" aria-hidden="true">
          <span>{t.earth.transition}</span>
          <strong ref={phaseRef}>{t.earth.phases.orbit}</strong>
          <i><span ref={progressRef} /></i>
        </div>

        <div className="earth-zoom__locations">
          {journeyLocations.map((location, index) => (
            <button
              className={`earth-location earth-location--${index + 1} ${selectedLocationId === location.id ? 'is-active' : ''}`}
              type="button"
              key={location.id}
              ref={(node) => { markerRefs.current[index] = node }}
              aria-label={`${t.earth.openStep} ${location.label}, ${location.name}`}
              aria-pressed={selectedLocationId === location.id}
              data-cursor={t.common.open}
              onMouseEnter={() => preloadLocationPreview(location)}
              onFocus={() => preloadLocationPreview(location)}
              onClick={() => {
                setSelectedLocationId(location.id)
                setOpenLocationId(location.id)
              }}
            >
              <JourneyFlagIcon locationId={location.id} />
              <strong className="earth-location__number">{location.label}</strong>
              <span className="earth-location__label">
                <small>{location.name}</small>
              </span>
              <span className="earth-location__card">
                <b>{location.name}</b>
                <em>{photographCount(location.artworks.length)}</em>
                <span>{locationCopy(location.id).region}<br />{locationCopy(location.id).description}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="earth-zoom__mobile-composition">
          <div className="earth-zoom__outro" ref={outroRef}>
            <span>{t.earth.sixSeries}</span>
            <p>{t.earth.everyPoint}<br /><em>{t.earth.opensView}</em></p>
          </div>

          <ol className="earth-zoom__mobile-list" ref={mobileListRef}>
            {journeyLocations.map((location) => (
              <li key={location.id} className={selectedLocationId === location.id ? 'is-active' : ''}>
                <button type="button" aria-label={`${t.earth.openStep} ${location.label}, ${location.name}`} onFocus={() => preloadLocationPreview(location)} onTouchStart={() => preloadLocationPreview(location)} onClick={() => {
                  setSelectedLocationId(location.id)
                  setOpenLocationId(location.id)
                }}>
                  <JourneyFlagIcon locationId={location.id} compact />
                  <span>{location.label}</span>
                  <div><strong>{location.name}</strong><small>{photographCount(location.artworks.length)}</small></div>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <p className="earth-zoom__disclaimer">{t.earth.route}</p>
      </div>

      {openLocation && createPortal((
        <JourneyGallery location={openLocation} onClose={() => setOpenLocationId(null)} />
      ), document.body)}
    </section>
  )
}

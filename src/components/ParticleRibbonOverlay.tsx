import { useEffect, useRef, type RefObject } from 'react'

type ParticleRibbonOverlayProps = {
  enabled?: boolean
  imageRef: RefObject<HTMLImageElement | null>
}

type ParticleLayer = 0 | 1 | 2

type RibbonParticle = {
  layer: ParticleLayer
  side: number
  along: number
  distance: number
  cornerReach: number
  phase: number
  drift: number
  size: number
  alpha: number
  alphaBand: 0 | 1 | 2
  color: number
  dispersedX: number
  dispersedY: number
  x: number
  y: number
  vx: number
  vy: number
  behind: boolean
  edgeOverlap: boolean
  towardText: boolean
}

type Bounds = { x: number; y: number; width: number; height: number }

const TAU = Math.PI * 2
const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))
const mix = (from: number, to: number, progress: number) => from + (to - from) * progress

const rgb = (red: number, green: number, blue: number) => ({ red, green, blue })

function extractPalette(image: HTMLImageElement) {
  const sample = document.createElement('canvas')
  sample.width = 72
  sample.height = 72
  const context = sample.getContext('2d', { willReadFrequently: true })
  if (!context) return ['rgb(22 18 24)', 'rgb(67 49 75)', 'rgb(112 72 82)', 'rgb(172 103 59)', 'rgb(226 151 70)', 'rgb(246 199 119)', 'rgb(194 166 151)', 'rgb(238 218 181)']

  context.drawImage(image, 0, 0, sample.width, sample.height)
  const pixels = context.getImageData(0, 0, sample.width, sample.height).data
  const buckets = new Map<string, { count: number; red: number; green: number; blue: number }>()

  for (let index = 0; index < pixels.length; index += 16) {
    if (pixels[index + 3] < 180) continue
    const red = pixels[index]
    const green = pixels[index + 1]
    const blue = pixels[index + 2]
    const key = `${Math.round(red / 24)}-${Math.round(green / 24)}-${Math.round(blue / 24)}`
    const bucket = buckets.get(key) ?? { count: 0, red: 0, green: 0, blue: 0 }
    bucket.count += 1
    bucket.red += red
    bucket.green += green
    bucket.blue += blue
    buckets.set(key, bucket)
  }

  const candidates = [...buckets.values()]
    .map((bucket) => {
      const color = rgb(bucket.red / bucket.count, bucket.green / bucket.count, bucket.blue / bucket.count)
      const maximum = Math.max(color.red, color.green, color.blue)
      const minimum = Math.min(color.red, color.green, color.blue)
      const saturation = maximum ? (maximum - minimum) / maximum : 0
      const luminance = (color.red * .2126 + color.green * .7152 + color.blue * .0722) / 255
      return { ...color, score: bucket.count * (.72 + saturation * .7) * (.72 + Math.min(luminance, .82)) }
    })
    .sort((first, second) => second.score - first.score)

  const selected: typeof candidates = []
  for (const candidate of candidates) {
    const distinct = selected.every((color) => Math.hypot(
      candidate.red - color.red,
      candidate.green - color.green,
      candidate.blue - color.blue,
    ) > 46)
    if (distinct) selected.push(candidate)
    if (selected.length === 8) break
  }

  for (const candidate of candidates) {
    if (selected.length === 8) break
    if (!selected.includes(candidate)) selected.push(candidate)
  }

  return selected.slice(0, 8).map((color) => `rgb(${Math.round(color.red)} ${Math.round(color.green)} ${Math.round(color.blue)})`)
}

export function ParticleRibbonOverlay({ enabled = true, imageRef }: ParticleRibbonOverlayProps) {
  const rearCanvasRef = useRef<HTMLCanvasElement>(null)
  const middleCanvasRef = useRef<HTMLCanvasElement>(null)
  const frontCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvases = [rearCanvasRef.current, middleCanvasRef.current, frontCanvasRef.current]
    const section = rearCanvasRef.current?.closest<HTMLElement>('.intro')
    const image = imageRef.current
    if (!enabled || !section || !image || canvases.some((canvas) => !canvas)) return

    const contexts = canvases.map((canvas) => canvas?.getContext('2d', { alpha: true }) ?? null)
    if (contexts.some((context) => !context)) return

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const compactQuery = matchMedia('(max-width: 760px)')
    const finePointer = matchMedia('(pointer: fine)').matches
    const particles: RibbonParticle[] = []
    const drawGroups = Array.from({ length: 3 }, () => (
      Array.from({ length: 24 }, () => [] as RibbonParticle[])
    ))
    const pointer = { x: -10_000, y: -10_000, active: false }
    let palette = ['rgb(22 18 24)', 'rgb(67 49 75)', 'rgb(112 72 82)', 'rgb(172 103 59)', 'rgb(226 151 70)', 'rgb(246 199 119)', 'rgb(194 166 151)', 'rgb(238 218 181)']
    let photo: Bounds = { x: 0, y: 0, width: 1, height: 1 }
    let width = 1
    let height = 1
    let dpr = 1
    let inView = false
    let running = false
    let revealed = false
    let reveal = reducedMotion ? 1 : 0
    let frame = 0
    let previousTime = performance.now()
    let parallaxX = 0
    let parallaxY = 0
    let parallaxTargetX = 0
    let parallaxTargetY = 0

    const applyPalette = () => {
      if (!image.complete || !image.naturalWidth) return
      try {
        palette = extractPalette(image)
        const bloom = palette[Math.min(5, palette.length - 1)].match(/\d+/g)?.slice(0, 3).join(' ') ?? '226 151 70'
        section.style.setProperty('--photo-bloom-rgb', bloom)
      } catch {
        // The bundled image is same-origin; the fallback palette keeps the effect usable if sampling fails.
      }
    }

    const updatePhotoBounds = () => {
      const sectionBounds = section.getBoundingClientRect()
      const imageBounds = image.getBoundingClientRect()
      photo = {
        x: imageBounds.left - sectionBounds.left,
        y: imageBounds.top - sectionBounds.top,
        width: Math.max(1, imageBounds.width),
        height: Math.max(1, imageBounds.height),
      }
    }

    const seedParticles = () => {
      particles.length = 0
      const compact = compactQuery.matches
      const count = compact
        ? Math.min(560, Math.max(360, Math.round(width * 1.15)))
        : Math.min(2800, Math.round(width * 1.4))
      const cornerParticleCount = Math.round(count * .18)
      const clusterCenters = [.08, .22, .43, .67, .86]

      for (let index = 0; index < count; index += 1) {
        const roll = Math.random()
        const layer: ParticleLayer = roll < .18 ? 0 : roll < .88 ? 1 : 2
        const cornerSeed = index < cornerParticleCount
        const cornerSlot = index % 8
        const side = cornerSeed ? Math.floor(cornerSlot / 2) : Math.floor(Math.random() * 4)
        let along: number

        if (cornerSeed) {
          const cornerOffset = Math.pow(Math.random(), 1.65) * .13
          along = cornerSlot % 2 === 0 ? cornerOffset : 1 - cornerOffset
        } else if (Math.random() < .48) {
          const center = clusterCenters[Math.floor(Math.random() * clusterCenters.length)]
          along = clamp(center + (Math.random() + Math.random() - 1) * .105, 0, 1)
        } else {
          along = Math.random()
        }

        const dispersedX = Math.random() * width
        const dispersedY = height * (.15 + Math.random() * .72)
        const alpha = .2 + Math.random() * .52
        particles.push({
          layer,
          side,
          along,
          distance: Math.pow(Math.random(), 2.45),
          cornerReach: Math.random(),
          phase: Math.random() * TAU,
          drift: .22 + Math.random() * .42,
          size: compact ? .55 + Math.random() * 1.02 : .62 + Math.random() * 1.48,
          alpha,
          alphaBand: alpha < .36 ? 0 : alpha < .55 ? 1 : 2,
          color: Math.floor(Math.random() * 8),
          dispersedX,
          dispersedY,
          x: dispersedX,
          y: dispersedY,
          vx: 0,
          vy: 0,
          behind: layer === 0 && Math.random() < .38,
          edgeOverlap: layer === 2 && Math.random() < .62,
          towardText: layer === 1 && Math.random() < .014,
        })
      }
    }

    const resize = () => {
      const bounds = section.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      dpr = Math.min(devicePixelRatio || 1, compactQuery.matches ? 1 : 1.25)
      for (const canvas of canvases) {
        if (!canvas) continue
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
      }
      for (const context of contexts) context?.setTransform(dpr, 0, 0, dpr, 0, 0)
      updatePhotoBounds()
      seedParticles()
    }

    const targetFor = (particle: RibbonParticle, elapsed: number) => {
      const compact = compactQuery.matches
      const margin = compact ? 1.5 : 2.5
      const spread = compact
        ? particle.layer === 0 ? 42 : particle.layer === 1 ? 32 : 18
        : particle.layer === 0 ? 58 : particle.layer === 1 ? 44 : 23
      const distance = particle.behind
        ? -(2 + particle.distance * (compact ? 9 : 14))
        : particle.edgeOverlap
          ? -(1.25 + particle.distance * (compact ? 4 : 6.5))
          : margin + particle.distance * spread
      let x = photo.x
      let y = photo.y
      let normalX = 0
      let normalY = 0
      let tangentX = 0
      let tangentY = 0

      if (particle.side === 0) {
        x += particle.along * photo.width
        normalY = -1
        tangentX = 1
      } else if (particle.side === 1) {
        x += photo.width
        y += particle.along * photo.height
        normalX = 1
        tangentY = 1
      } else if (particle.side === 2) {
        x += particle.along * photo.width
        y += photo.height
        normalY = 1
        tangentX = 1
      } else {
        y += particle.along * photo.height
        normalX = -1
        tangentY = 1
      }

      x += normalX * distance
      y += normalY * distance

      const nearestCorner = Math.min(particle.along, 1 - particle.along)
      const cornerInfluence = clamp(1 - nearestCorner / .16, 0, 1)
      const cornerDirection = particle.along < .5 ? -1 : 1
      const cornerOffset = cornerInfluence * (3 + particle.cornerReach * (compact ? 20 : 36))
      x += tangentX * cornerDirection * cornerOffset
      y += tangentY * cornerDirection * cornerOffset

      const breath = Math.sin(elapsed * particle.drift + particle.phase)
      const cross = Math.cos(elapsed * (particle.drift * .72) + particle.phase)
      x += breath * (particle.layer === 0 ? 10 : particle.layer === 1 ? 6.5 : 3)
      y += cross * (particle.layer === 0 ? 8 : particle.layer === 1 ? 5 : 2.5)

      if (particle.towardText && !compact) {
        x = mix(x, photo.x + photo.width + (width - photo.x - photo.width) * (.08 + particle.distance * .12), .24)
        y = mix(y, photo.y + photo.height * (.18 + particle.along * .64), .18)
      }

      return {
        x: mix(particle.dispersedX, x, reveal),
        y: mix(particle.dispersedY, y, reveal),
      }
    }

    const clear = () => {
      for (const context of contexts) context?.clearRect(0, 0, width, height)
    }

    const start = () => {
      if (running || reducedMotion) return
      running = true
      previousTime = performance.now()
      frame = requestAnimationFrame(draw)
    }

    const onPointerMove = (event: PointerEvent) => {
      const bounds = section.getBoundingClientRect()
      pointer.x = event.clientX - bounds.left
      pointer.y = event.clientY - bounds.top
      pointer.active = finePointer && pointer.x >= 0 && pointer.x <= width && pointer.y >= 0 && pointer.y <= height

      const centerX = photo.x + photo.width / 2
      const centerY = photo.y + photo.height / 2
      const rangeX = Math.max(photo.width * 1.15, 260)
      const rangeY = Math.max(photo.height * .72, 260)
      const proximity = clamp(1 - Math.hypot((pointer.x - centerX) / rangeX, (pointer.y - centerY) / rangeY), 0, 1)
      parallaxTargetX = clamp((pointer.x - centerX) / rangeX, -1, 1) * proximity
      parallaxTargetY = clamp((pointer.y - centerY) / rangeY, -1, 1) * proximity
      start()
    }

    const releasePointer = () => {
      pointer.active = false
      parallaxTargetX = 0
      parallaxTargetY = 0
    }

    const draw = (time: number) => {
      const delta = Math.min((time - previousTime) / 16.667, 2)
      previousTime = time
      const elapsed = time * .001
      if (inView) reveal += (1 - reveal) * .018 * delta

      parallaxX += (parallaxTargetX - parallaxX) * .055 * delta
      parallaxY += (parallaxTargetY - parallaxY) * .055 * delta
      section.style.setProperty('--photo-shift-x', `${parallaxX * 5}px`)
      section.style.setProperty('--photo-shift-y', `${parallaxY * 4}px`)
      section.style.setProperty('--photo-rotate-x', `${parallaxY * -0.42}deg`)
      section.style.setProperty('--photo-rotate-y', `${parallaxX * 0.52}deg`)

      if (!revealed && reveal > .34) {
        revealed = true
        section.classList.add('is-artwork-revealed')
      }

      clear()
      for (const layerGroups of drawGroups) {
        for (const group of layerGroups) group.length = 0
      }

      for (const particle of particles) {
        const target = targetFor(particle, elapsed)
        particle.vx += (target.x - particle.x) * .014 * delta
        particle.vy += (target.y - particle.y) * .014 * delta

        if (pointer.active) {
          const dx = particle.x - pointer.x
          const dy = particle.y - pointer.y
          const distance = Math.hypot(dx, dy) || 1
          const radius = compactQuery.matches ? 66 : 118
          if (distance < radius) {
            const proximity = 1 - distance / radius
            const force = proximity * proximity * (particle.layer === 0 ? .32 : .8) * delta
            particle.vx += dx / distance * force
            particle.vy += dy / distance * force
          }
        }

        const damping = Math.pow(.91, delta)
        particle.vx *= damping
        particle.vy *= damping
        particle.x += particle.vx * delta
        particle.y += particle.vy * delta

        drawGroups[particle.layer][particle.color * 3 + particle.alphaBand].push(particle)
      }

      const revealAlpha = .28 + reveal * .72
      const alphaLevels = [.28, .46, .66]
      for (let layer = 0; layer < drawGroups.length; layer += 1) {
        const context = contexts[layer]
        if (!context) continue
        const edgeFade = layer === 2 ? .78 : 1

        for (let color = 0; color < palette.length; color += 1) {
          context.fillStyle = palette[color]
          for (let alphaBand = 0; alphaBand < alphaLevels.length; alphaBand += 1) {
            const group = drawGroups[layer][color * 3 + alphaBand]
            if (!group.length) continue

            context.globalAlpha = alphaLevels[alphaBand] * revealAlpha * edgeFade
            context.beginPath()
            for (const particle of group) {
              const radius = particle.size * (layer === 0 ? 1.45 : 1)
              context.moveTo(particle.x + radius, particle.y)
              context.arc(particle.x, particle.y, radius, 0, TAU)
            }
            context.fill()
          }
        }
      }
      for (const context of contexts) if (context) context.globalAlpha = 1

      const parallaxSettled = Math.abs(parallaxX - parallaxTargetX) + Math.abs(parallaxY - parallaxTargetY) < .002
      if (inView || !parallaxSettled) frame = requestAnimationFrame(draw)
      else running = false
    }

    const resizeObserver = new ResizeObserver(resize)
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      if (inView) start()
    }, { rootMargin: '18% 0px', threshold: .06 })

    const onImageLoad = () => {
      applyPalette()
      resize()
    }

    image.addEventListener('load', onImageLoad)
    resizeObserver.observe(section)
    resizeObserver.observe(image)
    intersectionObserver.observe(section)
    section.addEventListener('pointermove', onPointerMove, { passive: true })
    section.addEventListener('pointerleave', releasePointer)
    applyPalette()
    resize()

    if (reducedMotion) {
      section.classList.add('is-artwork-revealed')
      clear()
    }

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      image.removeEventListener('load', onImageLoad)
      section.removeEventListener('pointermove', onPointerMove)
      section.removeEventListener('pointerleave', releasePointer)
      section.style.removeProperty('--photo-shift-x')
      section.style.removeProperty('--photo-shift-y')
      section.style.removeProperty('--photo-rotate-x')
      section.style.removeProperty('--photo-rotate-y')
    }
  }, [enabled, imageRef])

  if (!enabled) return null
  return (
    <div className="particle-artwork-layers" aria-hidden="true">
      <canvas className="particle-ribbon-overlay particle-ribbon-overlay--rear" ref={rearCanvasRef} />
      <canvas className="particle-ribbon-overlay particle-ribbon-overlay--middle" ref={middleCanvasRef} />
      <canvas className="particle-ribbon-overlay particle-ribbon-overlay--front" ref={frontCanvasRef} />
    </div>
  )
}

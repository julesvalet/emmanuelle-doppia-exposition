import { useEffect, useRef } from 'react'

type Particle = {
  x: number
  y: number
  vx: number
  vy: number
  tx: number
  ty: number
  tz: number
  size: number
  alpha: number
}

const TAU = Math.PI * 2
const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

function cameraPoint(index: number, total: number): [number, number, number] {
  const ratio = index / total
  const depth = (Math.random() - 0.5) * 0.16

  if (ratio < 0.58) {
    let x = 0
    let y = 0
    do {
      x = (Math.random() - 0.5) * 2.2
      y = (Math.random() - 0.5) * 1.18 + 0.08
    } while (Math.abs(x) > 0.92 && Math.abs(y - 0.08) > 0.43)
    return [x, y, depth]
  }

  if (ratio < 0.9) {
    const angle = Math.random() * TAU
    const band = Math.random()
    const radius = band > 0.72 ? 0.54 : band > 0.42 ? 0.39 : Math.sqrt(Math.random()) * 0.27
    return [0.22 + Math.cos(angle) * radius, 0.1 + Math.sin(angle) * radius, -0.18 - (1 - radius / 0.54) * 0.14]
  }

  if (ratio < 0.975) {
    const x = (Math.random() - 0.5) * 0.7 - 0.18
    const roof = 0.1 + Math.abs(x + 0.18) * 0.48
    return [x, -0.58 - Math.random() * Math.max(0.08, 0.3 - roof), depth]
  }

  const angle = Math.random() * TAU
  const radius = Math.sqrt(Math.random()) * 0.1
  return [-0.77 + Math.cos(angle) * radius, -0.61 + Math.sin(angle) * radius * 0.55, -0.06]
}

export function ParticleCamera() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const hero = document.getElementById('ouverture')
    let compact = matchMedia('(max-width: 760px)').matches
    const particles: Particle[] = []
    let width = innerWidth
    let height = innerHeight
    let dpr = Math.min(devicePixelRatio || 1, compact ? 1 : 1.5)
    let frame = 0
    let previousTime = performance.now()
    const startedAt = previousTime
    let scrollVisibility = 1
    let running = false
    let pointerX = -10_000
    let pointerY = -10_000
    let pointerInfluence = 0

    const layout = () => ({
      cx: compact ? width * 0.69 : width * 0.77,
      cy: compact ? height * 0.73 : height * 0.58,
      scale: compact ? Math.min(width * 0.2, 82) : Math.min(width * 0.135, 205),
    })

    const resize = () => {
      width = innerWidth
      height = innerHeight
      compact = width <= 760
      dpr = Math.min(devicePixelRatio || 1, compact ? 1 : 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const initialLayout = layout()
    const count = compact ? Math.min(430, Math.round(width * 1.05)) : Math.min(1250, Math.round(width * 0.78))

    for (let index = 0; index < count; index += 1) {
      const [tx, ty, tz] = cameraPoint(index, count)
      const angle = Math.random() * TAU
      const distance = initialLayout.scale * (1.4 + Math.random() * 2.3)
      particles.push({
        x: reducedMotion ? initialLayout.cx + tx * initialLayout.scale : initialLayout.cx + Math.cos(angle) * distance,
        y: reducedMotion ? initialLayout.cy + ty * initialLayout.scale : initialLayout.cy + Math.sin(angle) * distance,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        tx,
        ty,
        tz,
        size: compact ? 0.45 + Math.random() * 0.72 : 0.45 + Math.random() * 1.05,
        alpha: 0.32 + Math.random() * 0.55,
      })
    }

    const start = () => {
      if (running) return
      running = true
      previousTime = performance.now()
      frame = requestAnimationFrame(draw)
    }

    const updateVisibility = () => {
      const rect = hero?.getBoundingClientRect()
      if (!rect) return
      const fadeDistance = Math.max(height * 0.12, 80)
      scrollVisibility = rect.bottom > 0 && rect.top < height ? clamp01(rect.bottom / fadeDistance) : 0
      if (scrollVisibility > 0.001) start()
      else context.clearRect(0, 0, width, height)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (reducedMotion || scrollVisibility <= 0.001) return
      pointerX = event.clientX
      pointerY = event.clientY
      pointerInfluence = event.pointerType === 'touch' ? 0.32 : 1
    }

    const releasePointer = () => {
      pointerInfluence = 0
      pointerX = -10_000
      pointerY = -10_000
    }

    const draw = (time: number) => {
      const delta = Math.min((time - previousTime) / 16.667, 2)
      previousTime = time
      const elapsed = (time - startedAt) * 0.001
      const formation = reducedMotion ? 1 : clamp01(elapsed / 1.75)
      const visibility = (reducedMotion ? 1 : clamp01(elapsed / 0.55)) * scrollVisibility
      const current = layout()
      const rotationY = reducedMotion ? 0 : Math.sin(elapsed * 0.42) * 0.075
      const rotationX = reducedMotion ? 0 : Math.cos(elapsed * 0.31) * 0.025
      const cosY = Math.cos(rotationY)
      const sinY = Math.sin(rotationY)
      const cosX = Math.cos(rotationX)
      const sinX = Math.sin(rotationX)

      context.clearRect(0, 0, width, height)
      context.globalAlpha = visibility

      for (const particle of particles) {
        const rotatedX = particle.tx * cosY + particle.tz * sinY
        const depthY = -particle.tx * sinY + particle.tz * cosY
        const rotatedY = particle.ty * cosX - depthY * sinX
        const depth = particle.ty * sinX + depthY * cosX
        const perspective = 2.8 / (2.8 + depth)
        const idleX = reducedMotion ? 0 : Math.sin(elapsed * 0.72 + particle.ty * 4) * current.scale * 0.004
        const idleY = reducedMotion ? 0 : Math.cos(elapsed * 0.61 + particle.tx * 3) * current.scale * 0.003
        const targetX = current.cx
          + rotatedX * current.scale * perspective
          + idleX
        const targetY = current.cy
          + rotatedY * current.scale * perspective
          + idleY
        const spring = 0.008 + formation * 0.017

        particle.vx += (targetX - particle.x) * spring * delta
        particle.vy += (targetY - particle.y) * spring * delta

        if (pointerInfluence > 0) {
          const dx = particle.x - pointerX
          const dy = particle.y - pointerY
          const distance = Math.hypot(dx, dy) || 1
          const radius = compact ? 58 : 112
          if (distance < radius) {
            const proximity = 1 - distance / radius
            const force = proximity * proximity * pointerInfluence * (compact ? 1.1 : 2.2) * delta
            particle.vx += dx / distance * force
            particle.vy += dy / distance * force
          }
        }

        const damping = Math.pow(0.9, delta)
        particle.vx *= damping
        particle.vy *= damping
        particle.x += particle.vx * delta
        particle.y += particle.vy * delta

        context.globalAlpha = visibility * particle.alpha
        context.fillStyle = '#eeece6'
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size * Math.max(0.62, perspective), 0, TAU)
        context.fill()
      }

      context.globalAlpha = 1
      if (scrollVisibility > 0.001) frame = requestAnimationFrame(draw)
      else {
        running = false
        context.clearRect(0, 0, width, height)
      }
    }

    addEventListener('resize', resize)
    addEventListener('scroll', updateVisibility, { passive: true })
    addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', releasePointer)
    addEventListener('pointercancel', releasePointer)
    addEventListener('blur', releasePointer)
    updateVisibility()

    return () => {
      cancelAnimationFrame(frame)
      removeEventListener('resize', resize)
      removeEventListener('scroll', updateVisibility)
      removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', releasePointer)
      removeEventListener('pointercancel', releasePointer)
      removeEventListener('blur', releasePointer)
    }
  }, [])

  return <canvas className="particle-camera" ref={canvasRef} aria-hidden="true" />
}

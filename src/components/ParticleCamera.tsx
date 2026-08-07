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
    const poster = document.querySelector<HTMLElement>('.poster')
    let compact = matchMedia('(max-width: 760px)').matches
    const particles: Particle[] = []
    let width = innerWidth
    let height = innerHeight
    // Sub-pixel dots at dpr 1 were the other half of the mobile blur: a 0.5px radius arc lands
    // as a smear. Even at 2 the compact canvas stays well under the desktop one in device pixels.
    let dpr = Math.min(devicePixelRatio || 1, compact ? 2 : 1.5)
    let frame = 0
    let previousTime = performance.now()
    const startedAt = previousTime
    let scrollVisibility = 1
    let heroEdge = Number.POSITIVE_INFINITY
    let burstArmed = false
    let exitAt = 0
    let exitDone = false
    let running = false
    let pointerX = -10_000
    let pointerY = -10_000
    let pointerInfluence = 0

    // The silhouette spans ~2.2 × 1.55 units, so the compact scale is what decides whether the
    // body/lens/viewfinder read as a camera or as a smudge: below ~110 the 0.1-unit details
    // (viewfinder, shutter button) land under 12px and the whole thing collapses into a blur.
    // cx/cy are pulled off the right edge to keep the wider shape clear of the "faire défiler"
    // marker and inside the viewport.
    const layout = () => ({
      cx: compact ? width * 0.55 : width * 0.77,
      cy: compact ? height * 0.7 : height * 0.58,
      scale: compact ? Math.min(width * 0.3, 132) : Math.min(width * 0.135, 205),
    })

    const resize = () => {
      width = innerWidth
      height = innerHeight
      compact = width <= 760
      dpr = Math.min(devicePixelRatio || 1, compact ? 2 : 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    resize()
    const initialLayout = layout()
    // Roughly doubled with the scale: the silhouette now covers ~2.2× the area, so the old count
    // would have thinned it back out into a haze.
    const count = compact ? Math.min(880, Math.round(width * 2.05)) : Math.min(1250, Math.round(width * 0.78))

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
        size: compact ? 0.5 + Math.random() * 0.8 : 0.45 + Math.random() * 1.05,
        alpha: 0.32 + Math.random() * 0.55,
      })
    }

    const start = () => {
      if (running) return
      running = true
      previousTime = performance.now()
      frame = requestAnimationFrame(draw)
    }

    const burst = () => {
      if (reducedMotion) return
      const current = layout()
      for (const particle of particles) {
        const dx = particle.x - current.cx
        const dy = particle.y - current.cy
        const distance = Math.hypot(dx, dy) || 1
        const speed = (3.5 + Math.random() * 4.5) * (compact ? 0.6 : 1)
        particle.vx += dx / distance * speed
        particle.vy += dy / distance * speed
      }
    }

    const updateVisibility = () => {
      const rect = hero?.getBoundingClientRect()
      if (!rect) return
      const fadeDistance = Math.max(height * 0.12, 80)
      const heroVisibility = rect.bottom > 0 && rect.top < height ? clamp01(rect.bottom / fadeDistance) : 0
      // Keep the effect fully hidden while any part of the poster is still on screen, then
      // ramp it in smoothly as the poster's bottom edge clears the top of the viewport —
      // avoids an abrupt pop right as the poster scrolls away.
      // Short ramp: the hero is exactly one viewport tall, so every pixel spent fading in
      // is one less at full opacity before the preamble reaches the cloud.
      const posterRect = poster?.getBoundingClientRect()
      const posterClearance = posterRect ? clamp01(-posterRect.bottom / 60) : 1
      scrollVisibility = Math.min(heroVisibility, posterClearance)

      // The light preamble section starts exactly at the hero's bottom edge, so that edge
      // is where painting must stop — masked per particle in draw() rather than clipped,
      // so the cloud dissolves at the seam instead of being cut by a straight line.
      heroEdge = rect.bottom

      // Disperse as the preamble starts eating into the cloud, while the particles are
      // still fully visible — waiting for scrollVisibility to drop would fire the burst
      // long after the mask had already hidden everything.
      const { cy, scale } = layout()
      const trigger = cy + scale * 0.7 + 20
      if (rect.bottom > trigger + 60) {
        burstArmed = true
        exitAt = 0
        exitDone = false
      } else if (burstArmed && rect.bottom <= trigger) {
        burstArmed = false
        exitAt = performance.now()
        burst()
      }

      if (scrollVisibility > 0.001 && !exitDone) start()
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
      // Time-driven so the dispersion always plays out, even when a fast scroll
      // drops scrollVisibility to 0 in a single step.
      const exitFade = exitAt ? clamp01(1 - (time - exitAt) / 620) : 1
      if (exitAt && exitFade <= 0.001) exitDone = true
      const visibility = (reducedMotion ? 1 : clamp01(elapsed / 0.55)) * scrollVisibility * exitFade
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
        // Relax the pull back to formation during the exit, otherwise the spring
        // cancels the outward impulse and the cloud just dims in place.
        const spring = (0.008 + formation * 0.017) * exitFade * exitFade

        particle.vx += (targetX - particle.x) * spring * delta
        particle.vy += (targetY - particle.y) * spring * delta

        if (pointerInfluence > 0) {
          const dx = particle.x - pointerX
          const dy = particle.y - pointerY
          const distance = Math.hypot(dx, dy) || 1
          const radius = compact ? 84 : 112
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

        const edgeMask = clamp01((heroEdge - particle.y) / 70)
        context.globalAlpha = visibility * particle.alpha * edgeMask
        context.fillStyle = '#ffffff'
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size * Math.max(0.62, perspective), 0, TAU)
        context.fill()
      }

      context.globalAlpha = 1
      if (scrollVisibility > 0.001 && !exitDone) frame = requestAnimationFrame(draw)
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

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'

const HOVER_SCALE = 1.7
const TAP_SCALE = 2.1
const MAX_PINCH_SCALE = 2.8
const TAP_MAX_DURATION = 300
const TAP_MAX_MOVE = 10

type ZoomState = { scale: number; x: number; y: number }

const restingZoom: ZoomState = { scale: 1, x: 50, y: 50 }

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

// Desktop hover-zoom (mouse, cursor position → transform-origin) and mobile tap/pinch-zoom
// share one lens: a scale plus a transform-origin percentage, both driven into CSS custom
// properties by the caller. Touch is wired with native listeners rather than React's
// onTouch* props because React attaches touchmove passively, so preventDefault() there
// can't stop the browser's own page-pinch gesture from fighting ours.
export function useImageZoom(resetKey: unknown) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const isFinePointer = useRef(typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches).current
  const [zoom, setZoom] = useState<ZoomState>(restingZoom)
  const [isPinching, setIsPinching] = useState(false)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

  useEffect(() => {
    setZoom(restingZoom)
  }, [resetKey])

  const pointFromClient = useCallback((clientX: number, clientY: number) => {
    const img = wrapRef.current?.querySelector('img')
    if (!img) return { x: 50, y: 50 }
    const rect = img.getBoundingClientRect()
    if (!rect.width || !rect.height) return { x: 50, y: 50 }
    return {
      x: clampPercent(((clientX - rect.left) / rect.width) * 100),
      y: clampPercent(((clientY - rect.top) / rect.height) * 100),
    }
  }, [])

  const onMouseEnter = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isFinePointer) return
    const { x, y } = pointFromClient(event.clientX, event.clientY)
    setZoom({ scale: HOVER_SCALE, x, y })
  }, [isFinePointer, pointFromClient])

  const onMouseMove = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isFinePointer) return
    const { x, y } = pointFromClient(event.clientX, event.clientY)
    setZoom((current) => ({ ...current, x, y }))
  }, [isFinePointer, pointFromClient])

  const onMouseLeave = useCallback(() => {
    if (!isFinePointer) return
    setZoom((current) => ({ ...current, scale: 1 }))
  }, [isFinePointer])

  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return

    let pinchStartDistance = 0
    let pinchStartScale = 1
    let tap: { x: number; y: number; time: number } | null = null
    let tapMoved = false

    const distance = (touches: TouchList) =>
      Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY)
    const midpoint = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    })

    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        pinchStartDistance = distance(event.touches)
        pinchStartScale = zoomRef.current.scale
        tap = null
        setIsPinching(true)
        return
      }
      if (event.touches.length === 1) {
        const touch = event.touches[0]
        tap = { x: touch.clientX, y: touch.clientY, time: Date.now() }
        tapMoved = false
      }
    }

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        event.preventDefault()
        const ratio = pinchStartDistance ? distance(event.touches) / pinchStartDistance : 1
        const scale = Math.min(MAX_PINCH_SCALE, Math.max(1, pinchStartScale * ratio))
        const mid = midpoint(event.touches)
        setZoom({ scale, ...pointFromClient(mid.x, mid.y) })
        return
      }
      if (tap) {
        const touch = event.touches[0]
        if (touch && Math.hypot(touch.clientX - tap.x, touch.clientY - tap.y) > TAP_MAX_MOVE) tapMoved = true
      }
    }

    const onTouchEnd = (event: TouchEvent) => {
      if (event.touches.length < 2 && pinchStartDistance) {
        pinchStartDistance = 0
        setIsPinching(false)
        if (zoomRef.current.scale <= 1.05) setZoom(restingZoom)
      }
      if (tap && !tapMoved && event.touches.length === 0 && Date.now() - tap.time < TAP_MAX_DURATION) {
        if (zoomRef.current.scale > 1) setZoom(restingZoom)
        else setZoom({ scale: TAP_SCALE, ...pointFromClient(tap.x, tap.y) })
      }
      tap = null
    }

    wrap.addEventListener('touchstart', onTouchStart, { passive: true })
    wrap.addEventListener('touchmove', onTouchMove, { passive: false })
    wrap.addEventListener('touchend', onTouchEnd, { passive: true })
    wrap.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      wrap.removeEventListener('touchstart', onTouchStart)
      wrap.removeEventListener('touchmove', onTouchMove)
      wrap.removeEventListener('touchend', onTouchEnd)
      wrap.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [pointFromClient, resetKey])

  return {
    wrapRef,
    isZoomed: zoom.scale > 1,
    isPinching,
    style: {
      '--zoom-scale': zoom.scale,
      '--zoom-x': `${zoom.x}%`,
      '--zoom-y': `${zoom.y}%`,
    } as CSSProperties,
    handlers: { onMouseEnter, onMouseMove, onMouseLeave },
  }
}

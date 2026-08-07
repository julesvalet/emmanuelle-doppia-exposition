import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent as ReactMouseEvent } from 'react'

const ZOOM_SCALE = 1.7
const TAP_SCALE = 2.1
const MAX_PINCH_SCALE = 2.8
const TAP_MAX_DURATION = 300
const TAP_MAX_MOVE = 10

type ZoomState = { scale: number; x: number; y: number }

const restingZoom: ZoomState = { scale: 1, x: 50, y: 50 }

const clampPercent = (value: number) => Math.min(100, Math.max(0, value))

// Click/tap toggles the zoom; while zoomed, the lens keeps tracking the cursor on desktop
// (mousemove), and a click/tap anywhere outside the photo closes it. Every listener — mouse,
// touch and the point-from-client math — reads off the <img> itself (imgRef) rather than the
// wrapper around it, so the hit area matches the photo's visible edges exactly instead of the
// wrapper's (larger, letterboxed) box. Touch is wired with native listeners rather than
// React's onTouch* props because React attaches touchmove passively, so preventDefault()
// there can't stop the browser's own page-pinch gesture from fighting ours.
export function useImageZoom(resetKey: unknown) {
  const imgRef = useRef<HTMLImageElement>(null)
  const isFinePointer = useRef(typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches).current
  const [zoom, setZoom] = useState<ZoomState>(restingZoom)
  const [isPinching, setIsPinching] = useState(false)
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom

  useEffect(() => {
    setZoom(restingZoom)
  }, [resetKey])

  const pointFromClient = useCallback((clientX: number, clientY: number) => {
    const rect = imgRef.current?.getBoundingClientRect()
    if (!rect || !rect.width || !rect.height) return { x: 50, y: 50 }
    return {
      x: clampPercent(((clientX - rect.left) / rect.width) * 100),
      y: clampPercent(((clientY - rect.top) / rect.height) * 100),
    }
  }, [])

  const onClick = useCallback((event: ReactMouseEvent<HTMLImageElement>) => {
    if (!isFinePointer) return
    if (zoomRef.current.scale > 1) {
      setZoom(restingZoom)
      return
    }
    setZoom({ scale: ZOOM_SCALE, ...pointFromClient(event.clientX, event.clientY) })
  }, [isFinePointer, pointFromClient])

  const onMouseMove = useCallback((event: ReactMouseEvent<HTMLImageElement>) => {
    if (!isFinePointer || zoomRef.current.scale <= 1) return
    setZoom((current) => ({ ...current, ...pointFromClient(event.clientX, event.clientY) }))
  }, [isFinePointer, pointFromClient])

  // A click or tap anywhere outside the photo closes an active zoom — the usual lightbox
  // dismissal pattern. Pointerdown covers both mouse and touch, and taps on the image itself
  // are excluded so this never fights the toggle-off logic below.
  useEffect(() => {
    const onDocumentPointerDown = (event: PointerEvent) => {
      if (zoomRef.current.scale <= 1) return
      if (imgRef.current && !imgRef.current.contains(event.target as Node)) setZoom(restingZoom)
    }
    document.addEventListener('pointerdown', onDocumentPointerDown)
    return () => document.removeEventListener('pointerdown', onDocumentPointerDown)
  }, [])

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

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

    img.addEventListener('touchstart', onTouchStart, { passive: true })
    img.addEventListener('touchmove', onTouchMove, { passive: false })
    img.addEventListener('touchend', onTouchEnd, { passive: true })
    img.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      img.removeEventListener('touchstart', onTouchStart)
      img.removeEventListener('touchmove', onTouchMove)
      img.removeEventListener('touchend', onTouchEnd)
      img.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [pointFromClient, resetKey])

  return {
    imgRef,
    isZoomed: zoom.scale > 1,
    isPinching,
    style: {
      '--zoom-scale': zoom.scale,
      '--zoom-x': `${zoom.x}%`,
      '--zoom-y': `${zoom.y}%`,
    } as CSSProperties,
    handlers: { onClick, onMouseMove },
  }
}

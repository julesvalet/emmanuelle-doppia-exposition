import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function Cursor() {
  const root = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = root.current
    if (!el || !matchMedia('(pointer: fine)').matches) return
    const x = gsap.quickTo(el, 'x', { duration: 0.35, ease: 'power3' })
    const y = gsap.quickTo(el, 'y', { duration: 0.35, ease: 'power3' })
    const move = (event: MouseEvent) => { x(event.clientX); y(event.clientY) }
    const hover = (event: MouseEvent) => {
      const target = (event.target as Element).closest<HTMLElement>('[data-cursor]')
      const zoomTarget = (event.target as Element).closest<HTMLElement>('[data-cursor-zoom]')
      const label = el.querySelector('span')
      el.classList.toggle('is-active', Boolean(target))
      el.classList.toggle('is-zoom', Boolean(zoomTarget))
      if (label) label.textContent = target?.dataset.cursor ?? ''
    }
    addEventListener('mousemove', move)
    document.addEventListener('mouseover', hover)
    return () => { removeEventListener('mousemove', move); document.removeEventListener('mouseover', hover) }
  }, [])
  return (
    <div className="cursor" ref={root} aria-hidden="true">
      <i />
      <span />
      <b className="cursor__zoom">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
          <circle cx="10.4" cy="10.4" r="6.4" />
          <line x1="10.4" y1="7.4" x2="10.4" y2="13.4" />
          <line x1="7.4" y1="10.4" x2="13.4" y2="10.4" />
          <line x1="15.2" y1="15.2" x2="20.2" y2="20.2" />
        </svg>
      </b>
    </div>
  )
}

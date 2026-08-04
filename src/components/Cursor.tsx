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
      const label = el.querySelector('span')
      el.classList.toggle('is-active', Boolean(target))
      if (label) label.textContent = target?.dataset.cursor ?? ''
    }
    addEventListener('mousemove', move)
    document.addEventListener('mouseover', hover)
    return () => { removeEventListener('mousemove', move); document.removeEventListener('mouseover', hover) }
  }, [])
  return <div className="cursor" ref={root} aria-hidden="true"><i /><span /></div>
}

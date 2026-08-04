import { useEffect } from 'react'
import type { GalleryItem } from '../data/gallery'

type Props = {
  items: GalleryItem[]
  activeIndex: number | null
  onChange: (index: number | null) => void
}

export function Lightbox({ items, activeIndex, onChange }: Props) {
  useEffect(() => {
    if (activeIndex === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onChange(null)
      if (event.key === 'ArrowRight') onChange((activeIndex + 1) % items.length)
      if (event.key === 'ArrowLeft') onChange((activeIndex - 1 + items.length) % items.length)
    }
    document.body.style.overflow = 'hidden'
    addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      removeEventListener('keydown', onKeyDown)
    }
  }, [activeIndex, items.length, onChange])

  if (activeIndex === null) return null
  const item = items[activeIndex]

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.type === 'placeholder'
      ? `Photographie ${item.order}, original haute définition manquant`
      : `Photographie agrandie : ${item.title}`}>
      <button className="lightbox__close" onClick={() => onChange(null)}>Fermer <span>×</span></button>
      <figure>
        {item.type === 'placeholder' ? (
          <div className="lightbox__placeholder" role="status">
            <small>N° {String(item.order).padStart(2, '0')}</small>
            <strong>Original haute définition à ajouter</strong>
          </div>
        ) : (
          <picture>
            <source media="(max-width: 760px)" srcSet={item.mobileSrc} />
            <img src={item.src} alt={item.alt} width={item.width || undefined} height={item.height || undefined} />
          </picture>
        )}
        <figcaption><span>{String(item.order).padStart(2, '0')}</span>{item.title}</figcaption>
      </figure>
      {items.length > 1 && (
        <div className="lightbox__controls">
          <button onClick={() => onChange((activeIndex - 1 + items.length) % items.length)}>Précédente</button>
          <button onClick={() => onChange((activeIndex + 1) % items.length)}>Suivante</button>
        </div>
      )}
    </div>
  )
}

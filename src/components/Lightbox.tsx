import { useEffect } from 'react'
import type { GalleryItem } from '../data/gallery'
import { useModalScrollLock } from '../hooks/useModalScrollLock'

type Props = {
  items: GalleryItem[]
  activeIndex: number | null
  onChange: (index: number | null) => void
}

export function Lightbox({ items, activeIndex, onChange }: Props) {
  useModalScrollLock(activeIndex !== null)

  useEffect(() => {
    if (activeIndex === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onChange(null)
      if (event.key === 'ArrowRight') onChange((activeIndex + 1) % items.length)
      if (event.key === 'ArrowLeft') onChange((activeIndex - 1 + items.length) % items.length)
    }
    addEventListener('keydown', onKeyDown)
    return () => {
      removeEventListener('keydown', onKeyDown)
    }
  }, [activeIndex, items.length, onChange])

  if (activeIndex === null) return null
  const item = items[activeIndex]
  const number = String(item.order).padStart(2, '0')

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-labelledby="lightbox-title" data-lenis-prevent>
      <button className="lightbox__close" onClick={() => onChange(null)}>Fermer <span>×</span></button>
      <div className={`lightbox__layout is-${item.orientation}`} key={item.id}>
        <div className="lightbox__media">
          {item.type === 'placeholder' ? (
            <div className="lightbox__placeholder" role="status">
              <small>N° {number}</small>
              <strong>Original haute définition à ajouter</strong>
            </div>
          ) : (
            <picture>
              <source media="(max-width: 760px)" srcSet={item.mobileSrc} />
              <img src={item.src} alt={item.alt} width={item.width || undefined} height={item.height || undefined} />
            </picture>
          )}
        </div>

        <aside className="lightbox__details" tabIndex={0} aria-label={`Détails de ${item.title}`} data-lenis-prevent>
          <div className="lightbox__meta">
            <span>N° {number}</span>
            <span>{number} / {String(items.length).padStart(2, '0')}</span>
          </div>
          <h2 id="lightbox-title">{item.title}</h2>
          {item.descriptionFr && (
            <section className="lightbox__language" lang="fr">
              <span>FR</span>
              <p>{item.descriptionFr}</p>
            </section>
          )}
          {item.descriptionEn && (
            <section className="lightbox__language is-secondary" lang="en">
              <span>EN</span>
              <p>{item.descriptionEn}</p>
            </section>
          )}
        </aside>
      </div>
      {items.length > 1 && (
        <div className="lightbox__controls">
          <button onClick={() => onChange((activeIndex - 1 + items.length) % items.length)}>Précédente</button>
          <button onClick={() => onChange((activeIndex + 1) % items.length)}>Suivante</button>
        </div>
      )}
    </div>
  )
}

import { useCallback, useEffect } from 'react'
import type { GalleryItem } from '../data/gallery'
import { useModalScrollLock } from '../hooks/useModalScrollLock'
import { useLanguage } from '../i18n'
import { useInterfaceControls } from '../interfaceControls'

type Props = {
  items: GalleryItem[]
  activeIndex: number | null
  onChange: (index: number | null) => void
}

export function Lightbox({ items, activeIndex, onChange }: Props) {
  useModalScrollLock(activeIndex !== null)
  const { language, t } = useLanguage()
  const { registerModalClose } = useInterfaceControls()
  const close = useCallback(() => onChange(null), [onChange])
  const isOpen = activeIndex !== null

  useEffect(() => {
    if (!isOpen) return
    return registerModalClose(close)
  }, [close, isOpen, registerModalClose])

  useEffect(() => {
    if (activeIndex === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowRight') onChange((activeIndex + 1) % items.length)
      if (event.key === 'ArrowLeft') onChange((activeIndex - 1 + items.length) % items.length)
    }
    addEventListener('keydown', onKeyDown)
    return () => {
      removeEventListener('keydown', onKeyDown)
    }
  }, [activeIndex, close, items.length, onChange])

  if (activeIndex === null) return null
  const item = items[activeIndex]
  const number = String(item.order).padStart(2, '0')
  const description = language === 'fr' ? item.descriptionFr : item.descriptionEn

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-labelledby="lightbox-title" data-lenis-prevent>
      <div className={`lightbox__layout is-${item.orientation}`} key={item.id}>
        <div className="lightbox__media">
          {item.type === 'placeholder' ? (
            <div className="lightbox__placeholder" role="status">
              <small>{t.common.number} {number}</small>
              <strong>{t.common.originalMissing}</strong>
            </div>
          ) : (
            <picture>
              <source media="(max-width: 760px)" srcSet={item.mobileSrc} />
              <img src={item.src} alt={`${item.title}, ${t.accessibility.artworkAlt} ${item.locationName} ${t.accessibility.byArtist}.`} width={item.width || undefined} height={item.height || undefined} />
            </picture>
          )}
        </div>

        <aside className="lightbox__details" tabIndex={0} aria-label={`${t.viewer.details} ${item.title}`} data-lenis-prevent>
          <div className="lightbox__meta">
            <span>{t.common.number} {number}</span>
            <span>{number} / {String(items.length).padStart(2, '0')}</span>
          </div>
          <h2 id="lightbox-title">{item.title}</h2>
          {description && (
            <section className="lightbox__language" lang={language}>
              <p>{description}</p>
            </section>
          )}
          <button className="lightbox__preorder" type="button" disabled aria-disabled="true">
            <span>{t.shop.preorder}</span>
            <small>{t.shop.comingSoon}</small>
          </button>
        </aside>
      </div>
      {items.length > 1 && (
        <div className="lightbox__controls">
          <button onClick={() => onChange((activeIndex - 1 + items.length) % items.length)}>{t.common.previous}</button>
          <button onClick={() => onChange((activeIndex + 1) % items.length)}>{t.common.next}</button>
        </div>
      )}
    </div>
  )
}

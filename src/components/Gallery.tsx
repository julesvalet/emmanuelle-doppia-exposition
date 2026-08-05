import { useState } from 'react'
import { gallery } from '../data/gallery'
import { useLanguage } from '../i18n'
import { Lightbox } from './Lightbox'

export function Gallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const { t } = useLanguage()
  const artworkCount = `${gallery.length} ${gallery.length > 1 ? t.common.artworks : t.common.artwork}`

  return (
    <section className={`gallery ${gallery.length === 0 ? 'gallery--empty' : ''}`} id="exposition" aria-labelledby="gallery-title">
      <div className="section-kicker reveal">
        <span>03</span><span>{t.gallery.exhibition}</span><span>{gallery.length ? artworkCount : t.gallery.preparing}</span>
      </div>
      <h2 className="gallery__title reveal" id="gallery-title">
        {gallery.length ? <>{t.gallery.titleFirst}<br /><em>{t.gallery.titleSecond}</em></> : <>{t.gallery.emptyFirst}<br /><em>{t.gallery.emptySecond}</em></>}
      </h2>

      {gallery.length === 0 ? (
        <div className="empty-stage" aria-label={t.gallery.emptyLabel}>
          <div className="empty-stage__orbit" aria-hidden="true"><i /><i /></div>
          <p className="reveal">{t.gallery.worksSoon}</p>
          <span className="empty-stage__date">{t.gallery.openingSoon}</span>
        </div>
      ) : (
        <div className="gallery-grid">
          {gallery.map((item, index) => (
            item.type === 'placeholder' ? (
              <div className="gallery-card gallery-card--placeholder reveal" key={item.id} aria-label={`${t.common.photograph} ${item.order}, ${t.common.originalMissing}`}>
                <span className="gallery-card__media gallery-card__placeholder">
                  <small>{t.common.number} {String(item.order).padStart(2, '0')}</small>
                  <strong>{t.common.originalMissing}</strong>
                </span>
                <span className="gallery-card__caption"><i>{String(item.order).padStart(2, '0')}</i><span /></span>
              </div>
            ) : (
              <button className="gallery-card reveal" key={item.id} data-cursor={t.common.view} onClick={() => setActiveIndex(index)} aria-label={`${t.common.open} ${item.title}`}>
                <span className="gallery-card__media">
                  <picture>
                    <source media="(max-width: 760px)" srcSet={item.mobileSrc} />
                    <img
                      className={`is-${item.orientation}`}
                      src={item.src}
                      alt={`${item.title}, ${t.accessibility.artworkAlt} ${item.locationName} ${t.accessibility.byArtist}.`}
                      width={item.width || undefined}
                      height={item.height || undefined}
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                </span>
                <span className="gallery-card__caption"><i>{String(item.order).padStart(2, '0')}</i><span>{item.title}</span></span>
              </button>
            )
          ))}
        </div>
      )}
      <Lightbox items={gallery} activeIndex={activeIndex} onChange={setActiveIndex} />
    </section>
  )
}

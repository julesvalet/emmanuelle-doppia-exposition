import { useEffect, useRef, useState } from 'react'
import { catalogueArtworkCount, type JourneyLocation } from '../data/journey'
import { useLanguage } from '../i18n'

type Props = {
  location: JourneyLocation
  onClose: () => void
}

const formatCounter = (value: number) => String(value).padStart(2, '0')

export function JourneyGallery({ location, onClose }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [failedIndexes, setFailedIndexes] = useState<Set<number>>(() => new Set())
  const touchStartX = useRef<number | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const artworks = location.artworks
  const activeArtwork = activeIndex === null ? null : artworks[activeIndex]
  const { t } = useLanguage()
  const locationCopy = t.earth.locations[location.id as keyof typeof t.earth.locations]
  const photographCount = (count: number) => `${formatCounter(count)} ${count > 1 ? t.common.photographs : t.common.photograph}`

  useEffect(() => {
    setActiveIndex(null)
    setFailedIndexes(new Set())
    closeButton.current?.focus({ preventScroll: true })
  }, [location.id])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (activeIndex !== null) setActiveIndex(null)
        else onClose()
      }
      if (activeIndex === null || !artworks.length) return
      if (event.key === 'ArrowRight') setActiveIndex((activeIndex + 1) % artworks.length)
      if (event.key === 'ArrowLeft') setActiveIndex((activeIndex - 1 + artworks.length) % artworks.length)
    }
    addEventListener('keydown', onKeyDown)
    return () => {
      removeEventListener('keydown', onKeyDown)
    }
  }, [activeIndex, artworks.length, onClose])

  useEffect(() => {
    if (activeIndex === null || artworks.length < 2) return
    const nextArtwork = artworks[(activeIndex + 1) % artworks.length]
    if (nextArtwork.type === 'placeholder') return
    const preload = new Image()
    preload.src = matchMedia('(max-width: 760px)').matches ? nextArtwork.mobileSrc : nextArtwork.src
  }, [activeIndex, artworks])

  const previous = () => {
    if (activeIndex === null) return
    setActiveIndex((activeIndex - 1 + artworks.length) % artworks.length)
  }

  const next = () => {
    if (activeIndex === null) return
    setActiveIndex((activeIndex + 1) % artworks.length)
  }

  return (
    <div className="journey-viewer-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="journey-viewer" role="dialog" aria-modal="true" aria-labelledby="journey-viewer-title">
        <header>
          <div>
            <span>{t.earth.step} {location.label} · {locationCopy.region}</span>
            <h3 id="journey-viewer-title">{location.name}</h3>
          </div>
          <div className="journey-viewer__header-actions">
            <span aria-live="polite">
              {activeIndex === null
                ? photographCount(artworks.length)
                : `${formatCounter(activeArtwork?.order ?? 0)} / ${formatCounter(catalogueArtworkCount)}`}
            </span>
            {activeIndex !== null && (
              <button type="button" onClick={() => setActiveIndex(null)} aria-label={t.viewer.backToGallery}>
                {t.common.gallery}
              </button>
            )}
            <button ref={closeButton} type="button" onClick={onClose} aria-label={`${t.viewer.closeSeries} ${location.name}`}>
              {t.common.close} <i aria-hidden="true">×</i>
            </button>
          </div>
        </header>

        {activeArtwork && activeIndex !== null ? (
          <div
            className={`journey-viewer__stage is-${activeArtwork.orientation}`}
            onTouchStart={(event) => { touchStartX.current = event.changedTouches[0]?.clientX ?? null }}
            onTouchEnd={(event) => {
              if (touchStartX.current === null) return
              const distance = event.changedTouches[0].clientX - touchStartX.current
              touchStartX.current = null
              if (Math.abs(distance) < 45) return
              if (distance < 0) next()
              else previous()
            }}
          >
            <figure key={activeArtwork.id} className="journey-viewer__figure">
              {activeArtwork.type === 'placeholder' ? (
                <div className="journey-viewer__error journey-viewer__placeholder" role="status">
                  <small>{t.common.number} {formatCounter(activeArtwork.order)}</small>
                  <span>{t.common.originalMissing}</span>
                </div>
              ) : failedIndexes.has(activeIndex) ? (
                <div className="journey-viewer__error" role="status">
                  <span>{t.common.unavailable}</span>
                  <small>{formatCounter(activeArtwork.order)} · {location.name}</small>
                </div>
              ) : (
                <picture>
                  <source media="(max-width: 760px)" srcSet={activeArtwork.mobileSrc} />
                  <img
                    src={activeArtwork.src}
                    alt={`${activeArtwork.title}, ${t.accessibility.artworkAlt} ${location.name} ${t.accessibility.byArtist}.`}
                    width={activeArtwork.width || undefined}
                    height={activeArtwork.height || undefined}
                    loading="eager"
                    decoding="async"
                    onError={() => setFailedIndexes((indexes) => new Set(indexes).add(activeIndex))}
                  />
                </picture>
              )}
              <figcaption>
                <span>{activeArtwork.title}</span>
                <small>{activeArtwork.dimensions}</small>
              </figcaption>
            </figure>
          </div>
        ) : artworks.length ? (
          <div className="journey-photo-grid" aria-label={`${t.viewer.photoList} ${location.name}`}>
            {artworks.map((artwork, index) => (
              <button
                className="journey-photo-card"
                key={artwork.id}
                type="button"
                data-cursor={t.common.view}
                onClick={() => setActiveIndex(index)}
                aria-label={artwork.type === 'placeholder'
                  ? `${t.common.photograph} ${artwork.order}, ${t.common.originalMissing}`
                  : `${t.common.open} ${artwork.title}`}
              >
                <span className="journey-photo-card__media">
                  {artwork.type === 'placeholder' ? (
                    <span className="journey-photo-card__error">
                      <small>{t.common.number} {formatCounter(artwork.order)}</small>
                      <strong>{t.common.originalMissing}</strong>
                    </span>
                  ) : failedIndexes.has(index) ? (
                    <span className="journey-photo-card__error" role="status">{t.common.unavailable}</span>
                  ) : (
                    <img
                      src={artwork.mobileSrc}
                      alt={`${artwork.title}, ${t.accessibility.artworkAlt} ${location.name} ${t.accessibility.byArtist}.`}
                      width={artwork.width || undefined}
                      height={artwork.height || undefined}
                      loading="lazy"
                      decoding="async"
                      onError={() => setFailedIndexes((indexes) => new Set(indexes).add(index))}
                    />
                  )}
                </span>
                <span className="journey-photo-card__caption">
                  <i>{formatCounter(artwork.order)}</i>
                  <span>{artwork.title}</span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="journey-viewer__empty">
            <p>{t.viewer.noPhotos}</p>
          </div>
        )}

        <footer>
          <span>{location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}</span>
          {activeIndex !== null && artworks.length > 1 && (
            <nav aria-label={`${t.viewer.browseSeries} ${location.name}`}>
              <button type="button" onClick={previous}>← {t.common.previous}</button>
              <button type="button" onClick={next}>{t.common.next} →</button>
            </nav>
          )}
          <span>{activeIndex === null ? t.viewer.selectPhoto : `${formatCounter(activeArtwork?.order ?? 0)} / ${formatCounter(catalogueArtworkCount)}`}</span>
        </footer>
      </section>
    </div>
  )
}

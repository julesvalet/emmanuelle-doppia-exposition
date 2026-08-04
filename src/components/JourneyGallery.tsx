import { useEffect, useRef, useState } from 'react'
import { catalogueArtworkCount, type JourneyLocation } from '../data/journey'

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
    document.body.style.overflow = 'hidden'
    addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
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
            <span>Étape {location.label} · {location.region}</span>
            <h3 id="journey-viewer-title">{location.name}</h3>
          </div>
          <div className="journey-viewer__header-actions">
            <span aria-live="polite">
              {activeIndex === null
                ? `${formatCounter(artworks.length)} photographie${artworks.length > 1 ? 's' : ''}`
                : `${formatCounter(activeArtwork?.order ?? 0)} / ${formatCounter(catalogueArtworkCount)}`}
            </span>
            {activeIndex !== null && (
              <button type="button" onClick={() => setActiveIndex(null)} aria-label="Revenir à la galerie">
                Galerie
              </button>
            )}
            <button ref={closeButton} type="button" onClick={onClose} aria-label={`Fermer la série ${location.name}`}>
              Fermer <i aria-hidden="true">×</i>
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
                  <small>N° {formatCounter(activeArtwork.order)}</small>
                  <span>Original haute définition à ajouter</span>
                </div>
              ) : failedIndexes.has(activeIndex) ? (
                <div className="journey-viewer__error" role="status">
                  <span>Photographie indisponible</span>
                  <small>{formatCounter(activeArtwork.order)} · {location.name}</small>
                </div>
              ) : (
                <picture>
                  <source media="(max-width: 760px)" srcSet={activeArtwork.mobileSrc} />
                  <img
                    src={activeArtwork.src}
                    alt={activeArtwork.alt}
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
          <div className="journey-photo-grid" aria-label={`Photographies de ${location.name}`}>
            {artworks.map((artwork, index) => (
              <button
                className="journey-photo-card"
                key={artwork.id}
                type="button"
                data-cursor="Voir"
                onClick={() => setActiveIndex(index)}
                aria-label={artwork.type === 'placeholder'
                  ? `Photographie ${artwork.order}, original haute définition manquant`
                  : `Ouvrir ${artwork.title}`}
              >
                <span className="journey-photo-card__media">
                  {artwork.type === 'placeholder' ? (
                    <span className="journey-photo-card__error">
                      <small>N° {formatCounter(artwork.order)}</small>
                      <strong>Original haute définition à ajouter</strong>
                    </span>
                  ) : failedIndexes.has(index) ? (
                    <span className="journey-photo-card__error" role="status">Photographie indisponible</span>
                  ) : (
                    <picture>
                      <source media="(max-width: 760px)" srcSet={artwork.mobileSrc} />
                      <img
                        src={artwork.src}
                        alt={artwork.alt}
                        width={artwork.width || undefined}
                        height={artwork.height || undefined}
                        loading="lazy"
                        decoding="async"
                        onError={() => setFailedIndexes((indexes) => new Set(indexes).add(index))}
                      />
                    </picture>
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
            <p>Les photographies de cette étape seront bientôt disponibles.</p>
          </div>
        )}

        <footer>
          <span>{location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}</span>
          {activeIndex !== null && artworks.length > 1 && (
            <nav aria-label={`Parcourir la série ${location.name}`}>
              <button type="button" onClick={previous}>← Précédente</button>
              <button type="button" onClick={next}>Suivante →</button>
            </nav>
          )}
          <span>{activeIndex === null ? 'Sélectionner une photographie' : `${formatCounter(activeArtwork?.order ?? 0)} / ${formatCounter(catalogueArtworkCount)}`}</span>
        </footer>
      </section>
    </div>
  )
}

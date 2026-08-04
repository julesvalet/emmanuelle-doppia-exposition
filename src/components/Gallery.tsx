import { useState } from 'react'
import { gallery } from '../data/gallery'
import { Lightbox } from './Lightbox'

export function Gallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  return (
    <section className={`gallery ${gallery.length === 0 ? 'gallery--empty' : ''}`} id="exposition" aria-labelledby="gallery-title">
      <div className="section-kicker reveal">
        <span>03</span><span>Exposition</span><span>{gallery.length ? `${gallery.length} œuvres` : 'En préparation'}</span>
      </div>
      <h2 className="gallery__title reveal" id="gallery-title">
        {gallery.length ? <>Le regard<br /><em>en mouvement</em></> : <>La salle<br /><em>attend.</em></>}
      </h2>

      {gallery.length === 0 ? (
        <div className="empty-stage" aria-label="La galerie ouvrira prochainement">
          <div className="empty-stage__orbit" aria-hidden="true"><i /><i /></div>
          <p className="reveal">Les œuvres prendront place ici.</p>
          <span className="empty-stage__date">Ouverture prochaine</span>
        </div>
      ) : (
        <div className="gallery-grid">
          {gallery.map((item, index) => (
            item.type === 'placeholder' ? (
              <div className="gallery-card gallery-card--placeholder reveal" key={item.id} aria-label={`Photographie ${item.order}, original haute définition manquant`}>
                <span className="gallery-card__media gallery-card__placeholder">
                  <small>N° {String(item.order).padStart(2, '0')}</small>
                  <strong>Original haute définition à ajouter</strong>
                </span>
                <span className="gallery-card__caption"><i>{String(item.order).padStart(2, '0')}</i><span /></span>
              </div>
            ) : (
              <button className="gallery-card reveal" key={item.id} data-cursor="Voir" onClick={() => setActiveIndex(index)} aria-label={`Ouvrir ${item.title}`}>
                <span className="gallery-card__media">
                  <picture>
                    <source media="(max-width: 760px)" srcSet={item.mobileSrc} />
                    <img
                      className={`is-${item.orientation}`}
                      src={item.src}
                      alt={item.alt}
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

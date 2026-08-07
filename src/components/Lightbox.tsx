import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const item = activeIndex === null ? null : items[activeIndex]
  const [selectedFormatId, setSelectedFormatId] = useState('')
  const [selectedFinishId, setSelectedFinishId] = useState('')

  useEffect(() => {
    const firstFormat = item?.formats[0]
    setSelectedFormatId(firstFormat?.id ?? '')
    setSelectedFinishId(firstFormat?.options[0]?.id ?? '')
  }, [item?.id, item?.formats])

  useEffect(() => {
    if (!isOpen) return
    return registerModalClose(close)
  }, [close, isOpen, registerModalClose])

  useEffect(() => {
    if (activeIndex === null) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
      if (event.target instanceof HTMLInputElement) return
      if (event.key === 'ArrowRight') onChange((activeIndex + 1) % items.length)
      if (event.key === 'ArrowLeft') onChange((activeIndex - 1 + items.length) % items.length)
    }
    addEventListener('keydown', onKeyDown)
    return () => {
      removeEventListener('keydown', onKeyDown)
    }
  }, [activeIndex, close, items.length, onChange])

  const currencyFormatter = useMemo(() => new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
  }), [language])

  if (activeIndex === null || !item) return null
  const number = String(item.order).padStart(2, '0')
  const description = language === 'fr' ? item.descriptionFr : item.descriptionEn
  const selectedFormat = item.formats.find((format) => format.id === selectedFormatId) ?? item.formats[0]
  const selectedFinish = selectedFormat.options.find((option) => option.id === selectedFinishId) ?? selectedFormat.options[0]
  const note = selectedFormat.note?.[language]

  const selectFormat = (formatId: string) => {
    const format = item.formats.find((candidate) => candidate.id === formatId)
    if (!format) return
    setSelectedFormatId(format.id)
    setSelectedFinishId(format.options[0].id)
  }

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
          <section className="print-configurator" aria-label={t.shop.configuration}>
            <fieldset className="print-configurator__group">
              <legend>{t.shop.size}</legend>
              {item.formats.length === 1 ? (
                <div className="print-configurator__fixed">
                  <strong>{selectedFormat.label}</strong>
                  {note && <small>{note}</small>}
                </div>
              ) : (
                <div className="print-configurator__options">
                  {item.formats.map((format) => (
                    <label className="print-configurator__option" key={format.id}>
                      <input
                        type="radio"
                        name={`format-${item.id}`}
                        value={format.id}
                        checked={selectedFormat.id === format.id}
                        onChange={() => selectFormat(format.id)}
                      />
                      <span aria-hidden="true" />
                      <strong>{format.label}</strong>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <fieldset className="print-configurator__group">
              <legend>{t.shop.finish}</legend>
              {selectedFormat.options.length === 1 ? (
                <div className="print-configurator__fixed">
                  <strong>{selectedFinish.label[language]}</strong>
                </div>
              ) : (
                <div className="print-configurator__options">
                  {selectedFormat.options.map((option) => (
                    <label className="print-configurator__option" key={option.id}>
                      <input
                        type="radio"
                        name={`finish-${item.id}-${selectedFormat.id}`}
                        value={option.id}
                        checked={selectedFinish.id === option.id}
                        onChange={() => setSelectedFinishId(option.id)}
                      />
                      <span aria-hidden="true" />
                      <strong>{option.label[language]}</strong>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>

            <div className="print-configurator__price">
              <span>{t.shop.price}</span>
              <strong aria-live="polite">{currencyFormatter.format(selectedFinish.price)}</strong>
            </div>
          </section>
          <ul className="print-specs" aria-label={t.shop.specifications}>
            <li><span>{t.shop.paperLabel}</span> {t.shop.paper}</li>
            {/* Only worth the room once the finish it describes is actually selected. */}
            {selectedFinish.id === 'with-support' && (
              <li><span>{t.shop.supportLabel}</span> {t.shop.support}</li>
            )}
            <li>{t.shop.certificate}</li>
            <li>{t.shop.shipping}</li>
          </ul>
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

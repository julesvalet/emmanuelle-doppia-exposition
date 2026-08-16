import { useMemo } from 'react'
import { useLanguage } from '../i18n'
import { useSales } from '../sales'

function formatRemaining(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1_000))
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60
  const time = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`
  return days > 0 ? `${String(days).padStart(2, '0')}j ${time}` : time
}

export function PreorderStatus() {
  const { t } = useLanguage()
  const { isSalesOpen, remainingMs, statusReady } = useSales()
  const countdown = useMemo(() => formatRemaining(remainingMs), [remainingMs])

  if (isSalesOpen) return null

  return (
    <section className={`preorder-status${statusReady ? ' is-synchronized' : ''}`} aria-label={t.sales.sectionLabel}>
      <div className="preorder-status__countdown">
        <span>{t.sales.countdownLabel}</span>
        <time dateTime="2026-08-17T10:30:00+02:00" aria-live="off">{countdown}</time>
        <small>{t.sales.opensMessage}</small>
      </div>
    </section>
  )
}

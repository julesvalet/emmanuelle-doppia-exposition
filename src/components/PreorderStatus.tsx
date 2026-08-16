import { useMemo } from 'react'
import { useCart } from '../cart'
import { TEST_PRODUCT_ID, TEST_PRODUCT_PRICE, TEST_PRODUCT_TYPE } from '../data/sales'
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
  const { language, t } = useLanguage()
  const { items, addItem, openCart } = useCart()
  const { isSalesOpen, remainingMs, testStock, testAvailable, statusReady } = useSales()
  const hasTestItem = items.some((item) => item.productType === TEST_PRODUCT_TYPE)
  const showTestOffer = statusReady && testStock !== null && testStock > 0
  const countdown = useMemo(() => formatRemaining(remainingMs), [remainingMs])

  if (isSalesOpen && !showTestOffer) return null

  const addTestItem = () => {
    if (hasTestItem) {
      openCart()
      return
    }
    if (!testAvailable || testAvailable < 1) return
    addItem({
      key: TEST_PRODUCT_ID,
      productType: TEST_PRODUCT_TYPE,
      productId: TEST_PRODUCT_ID,
      artworkNumber: 0,
      artworkId: TEST_PRODUCT_ID,
      title: t.sales.testProductName,
      locationName: '',
      formatId: 'live-test',
      formatLabel: t.sales.testPayment,
      finishId: 'paypal-live',
      finishLabel: { fr: 'PayPal Live', en: 'PayPal Live' },
      unitPrice: TEST_PRODUCT_PRICE,
      thumbnail: `${import.meta.env.BASE_URL}favicon-ed.png`,
    })
    openCart()
  }

  return (
    <section className="preorder-status" aria-label={t.sales.sectionLabel}>
      {!isSalesOpen && (
        <div className="preorder-status__countdown">
          <span>{t.sales.countdownLabel}</span>
          <time dateTime="2026-08-17T10:30:00+02:00" aria-live="off">{countdown}</time>
          <small>{t.sales.opensMessage}</small>
        </div>
      )}
      {showTestOffer && (
        <div className="preorder-status__test">
          <div>
            <span>{t.sales.testEyebrow}</span>
            <strong>{t.sales.testPayment} — {new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-GB', { style: 'currency', currency: 'EUR' }).format(TEST_PRODUCT_PRICE)}</strong>
            {testAvailable === 0 && <small>{t.sales.temporarilyUnavailable}</small>}
          </div>
          <button type="button" onClick={addTestItem} disabled={!hasTestItem && testAvailable === 0}>
            {hasTestItem ? t.sales.openCart : t.sales.addTest}
          </button>
        </div>
      )}
    </section>
  )
}

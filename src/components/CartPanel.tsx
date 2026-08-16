import { useEffect, useMemo, useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import type { OnApproveData } from '@paypal/paypal-js'
import { useCart, type CartItem } from '../cart'
import { useLanguage } from '../i18n'
import { useModalScrollLock } from '../hooks/useModalScrollLock'
import { TEST_PRODUCT_TYPE } from '../data/sales'
import { useSales } from '../sales'

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID

type Step = 'cart' | 'checkout' | 'success' | 'error'

type OrderSummary = {
  orderID: string
  items: CartItem[]
  total: number
}

class RequestError extends Error {
  code?: string

  constructor(message?: string, code?: string) {
    super(message)
    this.code = code
  }
}

async function requestJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = (data && typeof data === 'object' && 'error' in data) ? String((data as { error: unknown }).error) : undefined
    const code = (data && typeof data === 'object' && 'code' in data) ? String((data as { code: unknown }).code) : undefined
    throw new RequestError(message, code)
  }
  return data
}

export function CartPanel() {
  const { language, t } = useLanguage()
  const { items, itemCount, total, removeItem, setQuantity, clearCart, isOpen, closeCart } = useCart()
  const { isSalesOpen, testStock, testAvailable, refreshStatus } = useSales()
  const [step, setStep] = useState<Step>('cart')
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [pendingOrderID, setPendingOrderID] = useState<string | null>(null)

  useModalScrollLock(isOpen)

  const hasTestItem = items.some((item) => item.productType === TEST_PRODUCT_TYPE)
  const hasPrintItem = items.some((item) => item.productType !== TEST_PRODUCT_TYPE)
  const isTestOnly = items.length === 1 && hasTestItem && items[0].quantity === 1
  const checkoutAllowed = isTestOnly ? (testAvailable ?? 0) > 0 : isSalesOpen && !hasTestItem
  const checkoutNotice = hasTestItem && hasPrintItem
    ? t.cart.mixedTestOrder
    : hasTestItem && testAvailable === 0
      ? t.cart.testUnavailable
      : !isSalesOpen && hasPrintItem
        ? t.shop.opensMessage
        : ''

  const localizedRequestError = (error: unknown) => {
    if (error instanceof RequestError) {
      if (error.code === 'SALES_NOT_OPEN') return t.shop.opensMessage
      if (error.code === 'TEST_UNAVAILABLE' || error.code === 'INVALID_TEST_ORDER') return t.cart.testUnavailable
    }
    return error instanceof Error && error.message ? error.message : t.cart.errorGeneric
  }

  useEffect(() => {
    if (testStock !== 0) return
    const staleTestItems = items.filter((item) => item.productType === TEST_PRODUCT_TYPE)
    if (staleTestItems.length === 0) return
    staleTestItems.forEach((item) => removeItem(item.key))
    setNotice(t.sales.soldOut)
    setStep('cart')
  }, [items, removeItem, t.sales.soldOut, testStock])

  useEffect(() => {
    if (isOpen) return
    const timeout = setTimeout(() => {
      setStep((current) => current === 'success' ? current : 'cart')
      setNotice('')
    }, 400)
    return () => clearTimeout(timeout)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCart()
    }
    addEventListener('keydown', onKeyDown)
    return () => removeEventListener('keydown', onKeyDown)
  }, [isOpen, closeCart])

  const currencyFormatter = useMemo(() => new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
  }), [language])

  if (!isOpen) return null

  const goToCheckout = () => {
    if (!checkoutAllowed) return
    setNotice('')
    setStep('checkout')
  }

  const createOrder = async () => {
    setPendingOrderID(null)
    try {
      const data = await requestJson('/api/create-order', {
        items: items.map((item) => ({
          productType: item.productType,
          productId: item.productId,
          artworkNumber: item.artworkNumber,
          formatId: item.formatId,
          finishId: item.finishId,
          quantity: item.quantity,
        })),
      })
      return (data as { orderID: string }).orderID
    } catch (error) {
      setErrorMessage(localizedRequestError(error))
      throw error
    }
  }

  const completeApprovedOrder = async (orderID: string) => {
    try {
      await requestJson('/api/capture-order', { orderID })
      setSummary({ orderID, items, total })
      clearCart()
      await refreshStatus()
      setPendingOrderID(null)
      setStep('success')
    } catch (error) {
      setErrorMessage(localizedRequestError(error))
      setStep('error')
    }
  }

  const onApprove = async (data: OnApproveData) => {
    setPendingOrderID(data.orderID)
    await completeApprovedOrder(data.orderID)
  }

  const onCancel = () => {
    setPendingOrderID(null)
    setNotice(t.cart.cancelledNotice)
    setStep('cart')
  }

  const onError = () => {
    setErrorMessage((current) => current || t.cart.errorGeneric)
    setStep('error')
  }

  return (
    <div className="cart-panel-backdrop" role="presentation" onClick={closeCart}>
      <aside
        className="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t.cart.title}
        data-lenis-prevent
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cart-panel__header">
          <h2>{step === 'success' ? t.cart.successTitle : t.cart.title}</h2>
          <button type="button" className="cart-panel__close" onClick={closeCart} aria-label={t.common.close}>
            <i aria-hidden="true">×</i>
          </button>
        </header>

        {step === 'cart' && (
          <div className="cart-panel__body">
            {notice && <p className="cart-panel__notice">{notice}</p>}
            {items.length === 0 ? (
              <div className="cart-panel__empty">
                <strong>{t.cart.empty}</strong>
                <small>{t.cart.emptyHint}</small>
              </div>
            ) : (
              <ul className="cart-panel__items">
                {items.map((item) => (
                  <li className="cart-panel__item" key={item.key}>
                    <div className="cart-panel__item-media">
                      <img src={item.thumbnail} alt="" width={72} height={72} />
                    </div>
                    <div className="cart-panel__item-info">
                      <strong>{item.title}</strong>
                      <span>{item.formatLabel} · {item.finishLabel[language]}</span>
                      <div className="cart-panel__item-row">
                        <div className="cart-panel__stepper">
                          <button type="button" onClick={() => setQuantity(item.key, item.quantity - 1)} aria-label={t.common.previous}>−</button>
                          <span aria-live="polite">{item.quantity}</span>
                          <button type="button" onClick={() => setQuantity(item.key, item.quantity + 1)} aria-label={t.common.next}>+</button>
                        </div>
                        <strong>{currencyFormatter.format(item.unitPrice * item.quantity)}</strong>
                      </div>
                      <button type="button" className="cart-panel__remove" onClick={() => removeItem(item.key)}>{t.cart.remove}</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step === 'checkout' && (
          <div className="cart-panel__body">
            <ul className="cart-panel__summary-list">
              {items.map((item) => (
                <li key={item.key}>
                  <span>{item.quantity} × {item.title} — {item.formatLabel} ({item.finishLabel[language]})</span>
                  <strong>{currencyFormatter.format(item.unitPrice * item.quantity)}</strong>
                </li>
              ))}
            </ul>
            <p className="cart-panel__secure-note">{t.cart.securePayment}</p>
            {!checkoutAllowed ? (
              <p className="cart-panel__notice">{checkoutNotice || t.cart.testUnavailable}</p>
            ) : PAYPAL_CLIENT_ID ? (
              <PayPalScriptProvider
                options={{
                  clientId: PAYPAL_CLIENT_ID,
                  currency: 'EUR',
                  intent: 'capture',
                  components: ['buttons'],
                  enableFunding: ['card'],
                  locale: language === 'fr' ? 'fr_FR' : 'en_GB',
                }}
              >
                <PayPalButtons
                  style={{ layout: 'vertical', shape: 'rect', label: 'pay' }}
                  createOrder={createOrder}
                  onApprove={onApprove}
                  onCancel={onCancel}
                  onError={onError}
                />
              </PayPalScriptProvider>
            ) : (
              <p className="cart-panel__notice">{t.cart.missingClientId}</p>
            )}
            <button type="button" className="cart-panel__back" onClick={() => setStep('cart')}>{t.cart.backToCart}</button>
          </div>
        )}

        {step === 'success' && summary && (
          <div className="cart-panel__body cart-panel__success">
            <p>{t.cart.successIntro}</p>
            <div className="cart-panel__order-number">
              <span>{t.cart.orderNumber}</span>
              <strong>{summary.orderID}</strong>
            </div>
            <ul className="cart-panel__summary-list">
              {summary.items.map((item) => (
                <li key={item.key}>
                  <span>{item.quantity} × {item.title} — {item.formatLabel} ({item.finishLabel[language]})</span>
                  <strong>{currencyFormatter.format(item.unitPrice * item.quantity)}</strong>
                </li>
              ))}
            </ul>
            <div className="cart-panel__total">
              <span>{t.cart.total}</span>
              <strong>{currencyFormatter.format(summary.total)}</strong>
            </div>
            <button type="button" className="cart-panel__checkout" onClick={closeCart}>{t.cart.continueBrowsing}</button>
          </div>
        )}

        {step === 'error' && (
          <div className="cart-panel__body">
            <p className="cart-panel__error">{errorMessage}</p>
            <button
              type="button"
              className="cart-panel__checkout"
              onClick={() => pendingOrderID ? void completeApprovedOrder(pendingOrderID) : setStep('checkout')}
            >
              {t.cart.retry}
            </button>
            <button type="button" className="cart-panel__back" onClick={() => setStep('cart')}>{t.cart.backToCart}</button>
          </div>
        )}

        {step === 'cart' && items.length > 0 && (
          <footer className="cart-panel__footer">
            {checkoutNotice && <p className="cart-panel__notice">{checkoutNotice}</p>}
            <div className="cart-panel__total">
              <span>{t.cart.total}</span>
              <strong>{currencyFormatter.format(total)}</strong>
            </div>
            <button type="button" className="cart-panel__checkout" onClick={goToCheckout} disabled={itemCount === 0 || !checkoutAllowed}>
              {t.cart.checkout}
            </button>
          </footer>
        )}
      </aside>
    </div>
  )
}

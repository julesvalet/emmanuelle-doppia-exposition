import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import type { OnApproveData } from '@paypal/paypal-js'
import { useCart, type CartItem } from '../cart'
import { useLanguage } from '../i18n'
import { useModalScrollLock } from '../hooks/useModalScrollLock'
import { PROMO_CODE, PROMO_PRICE, PROMO_VALID_UNTIL_MS } from '../data/sales'
import { useSales } from '../sales'

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID

type Step = 'cart' | 'shipping' | 'checkout' | 'success' | 'error'

type OrderSummary = {
  orderID: string
  items: CartItem[]
  total: number
  promoApplied: boolean
}

export type ShippingAddress = {
  address: string
  postalCode: string
  city: string
  country: string
  floor: string
  doorName: string
}

const emptyShippingAddress: ShippingAddress = {
  address: '',
  postalCode: '',
  city: '',
  country: '',
  floor: '',
  doorName: '',
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
  const { isSalesOpen, refreshStatus } = useSales()
  const [step, setStep] = useState<Step>('cart')
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [pendingOrderID, setPendingOrderID] = useState<string | null>(null)
  const [pendingTotal, setPendingTotal] = useState<number | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoMessage, setPromoMessage] = useState('')
  const [shipping, setShipping] = useState<ShippingAddress>(emptyShippingAddress)

  useModalScrollLock(isOpen)

  const promoEligibleCart = items.length === 1 && itemCount === 1
  const promoWindowOpen = Date.now() < PROMO_VALID_UNTIL_MS
  const activePromo = promoApplied && promoEligibleCart && promoWindowOpen
  const checkoutAllowed = isSalesOpen || activePromo
  const checkoutTotal = activePromo ? PROMO_PRICE : total
  const checkoutNotice = !isSalesOpen && !activePromo ? t.cart.promoRequired : ''

  const localizedRequestError = (error: unknown) => {
    if (error instanceof RequestError) {
      if (error.code === 'SALES_NOT_OPEN') return t.shop.opensMessage
      if (error.code === 'PROMO_EXPIRED') return t.cart.promoExpired
      if (error.code === 'PROMO_INVALID') return t.cart.promoInvalid
      if (error.code === 'PAYPAL_PAYEE_RESTRICTED') return t.cart.paypalMerchantRestricted
    }
    return error instanceof Error && error.message ? error.message : t.cart.errorGeneric
  }

  useEffect(() => {
    if (!promoApplied || (promoEligibleCart && promoWindowOpen)) return
    setPromoApplied(false)
    setPromoMessage(promoWindowOpen ? '' : t.cart.promoExpired)
  }, [promoApplied, promoEligibleCart, promoWindowOpen, t.cart.promoExpired])

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

  const goToShipping = () => {
    if (!checkoutAllowed) return
    setNotice('')
    setStep('shipping')
  }

  const handleShippingSubmit = (event: FormEvent) => {
    event.preventDefault()
    setStep('checkout')
  }

  const applyPromo = () => {
    if (promoInput.trim().toLowerCase() !== PROMO_CODE) {
      setPromoApplied(false)
      setPromoMessage(t.cart.promoInvalid)
      return
    }
    if (!promoWindowOpen) {
      setPromoApplied(false)
      setPromoMessage(t.cart.promoExpired)
      return
    }
    if (!promoEligibleCart) {
      setPromoApplied(false)
      setPromoMessage(t.cart.promoSingleItem)
      return
    }
    setPromoApplied(true)
    setPromoMessage(t.cart.promoApplied)
  }

  const createOrder = async () => {
    setPendingOrderID(null)
    setPendingTotal(checkoutTotal)
    try {
      const data = await requestJson('/api/create-order', {
        items: items.map((item) => ({
          artworkNumber: item.artworkNumber,
          formatId: item.formatId,
          finishId: item.finishId,
          quantity: item.quantity,
        })),
        promoCode: activePromo ? promoInput.trim() : undefined,
      })
      return (data as { orderID: string }).orderID
    } catch (error) {
      setErrorMessage(localizedRequestError(error))
      throw error
    }
  }

  const completeApprovedOrder = async (orderID: string) => {
    try {
      await requestJson('/api/capture-order', { orderID, shippingAddress: shipping })
      setSummary({ orderID, items, total: pendingTotal ?? checkoutTotal, promoApplied: activePromo || pendingTotal === PROMO_PRICE })
      clearCart()
      setShipping(emptyShippingAddress)
      await refreshStatus()
      setPendingOrderID(null)
      setPendingTotal(null)
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
    setPendingTotal(null)
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

        {step === 'shipping' && (
          <div className="cart-panel__body">
            <form className="account-panel__form" onSubmit={handleShippingSubmit}>
              <div className="account-panel__field">
                <label htmlFor="shipping-address">{t.cart.shippingAddressLabel}</label>
                <input
                  id="shipping-address"
                  type="text"
                  autoComplete="street-address"
                  required
                  value={shipping.address}
                  onChange={(event) => setShipping((current) => ({ ...current, address: event.target.value }))}
                />
              </div>
              <div className="account-panel__field">
                <label htmlFor="shipping-postal-code">{t.cart.shippingPostalCodeLabel}</label>
                <input
                  id="shipping-postal-code"
                  type="text"
                  autoComplete="postal-code"
                  required
                  value={shipping.postalCode}
                  onChange={(event) => setShipping((current) => ({ ...current, postalCode: event.target.value }))}
                />
              </div>
              <div className="account-panel__field">
                <label htmlFor="shipping-city">{t.cart.shippingCityLabel}</label>
                <input
                  id="shipping-city"
                  type="text"
                  autoComplete="address-level2"
                  required
                  value={shipping.city}
                  onChange={(event) => setShipping((current) => ({ ...current, city: event.target.value }))}
                />
              </div>
              <div className="account-panel__field">
                <label htmlFor="shipping-country">{t.cart.shippingCountryLabel}</label>
                <input
                  id="shipping-country"
                  type="text"
                  autoComplete="country-name"
                  required
                  value={shipping.country}
                  onChange={(event) => setShipping((current) => ({ ...current, country: event.target.value }))}
                />
              </div>
              <div className="account-panel__field">
                <label htmlFor="shipping-floor">{t.cart.shippingFloorLabel} <small>({t.cart.shippingOptional})</small></label>
                <input
                  id="shipping-floor"
                  type="text"
                  autoComplete="off"
                  value={shipping.floor}
                  onChange={(event) => setShipping((current) => ({ ...current, floor: event.target.value }))}
                />
              </div>
              <div className="account-panel__field">
                <label htmlFor="shipping-door-name">{t.cart.shippingDoorNameLabel} <small>({t.cart.shippingOptional})</small></label>
                <input
                  id="shipping-door-name"
                  type="text"
                  autoComplete="off"
                  value={shipping.doorName}
                  onChange={(event) => setShipping((current) => ({ ...current, doorName: event.target.value }))}
                />
                <small>{t.cart.shippingDoorNameHint}</small>
              </div>
              <button type="submit" className="cart-panel__checkout">{t.cart.shippingContinue}</button>
              <button type="button" className="cart-panel__back" onClick={() => setStep('cart')}>{t.cart.backToCart}</button>
            </form>
          </div>
        )}

        {step === 'checkout' && (
          <div className="cart-panel__body">
            <ul className="cart-panel__summary-list">
              {items.map((item) => (
                <li key={item.key}>
                  <span>{item.quantity} × {item.title} — {item.formatLabel} ({item.finishLabel[language]})</span>
                  <strong>{currencyFormatter.format(activePromo ? PROMO_PRICE : item.unitPrice * item.quantity)}</strong>
                </li>
              ))}
            </ul>
            {activePromo && <p className="cart-panel__promo-confirmation">{t.cart.promoApplied}</p>}
            <p className="cart-panel__secure-note">{t.cart.securePayment}</p>
            {!checkoutAllowed ? (
              <p className="cart-panel__notice">{checkoutNotice}</p>
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
            <button type="button" className="cart-panel__back" onClick={() => setStep('shipping')}>{t.cart.backToShipping}</button>
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
                  <strong>{currencyFormatter.format(summary.promoApplied ? PROMO_PRICE : item.unitPrice * item.quantity)}</strong>
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
            <div className="cart-panel__promo">
              <label htmlFor="cart-promo-code">{t.cart.promoLabel}</label>
              <div>
                <input
                  id="cart-promo-code"
                  type="text"
                  value={promoInput}
                  placeholder={t.cart.promoPlaceholder}
                  autoComplete="off"
                  onChange={(event) => {
                    setPromoInput(event.target.value)
                    setPromoApplied(false)
                    setPromoMessage('')
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      applyPromo()
                    }
                  }}
                />
                <button type="button" onClick={applyPromo}>{t.cart.promoApply}</button>
              </div>
              {promoMessage && <small className={promoApplied ? 'is-valid' : 'is-invalid'}>{promoMessage}</small>}
            </div>
            {checkoutNotice && <p className="cart-panel__notice">{checkoutNotice}</p>}
            <div className="cart-panel__total">
              <span>{t.cart.total}</span>
              <strong>{currencyFormatter.format(checkoutTotal)}</strong>
            </div>
            <button type="button" className="cart-panel__checkout" onClick={goToShipping} disabled={itemCount === 0 || !checkoutAllowed}>
              {t.cart.checkout}
            </button>
          </footer>
        )}
      </aside>
    </div>
  )
}

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import type { OnApproveData } from '@paypal/paypal-js'
import { mapAuthError } from '../accountErrors'
import { useAddresses, type SavedAddress } from '../addresses'
import { useAuth } from '../auth'
import { useCart, type CartItem } from '../cart'
import { useLanguage } from '../i18n'
import { useModalScrollLock } from '../hooks/useModalScrollLock'
import { PROMO_CODE, PROMO_PRICE, PROMO_VALID_UNTIL_MS } from '../data/sales'
import { useSales } from '../sales'
import { AddressForm } from './AddressForm'

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID

type Step = 'cart' | 'account' | 'shipping' | 'checkout' | 'success' | 'error'
type AccountMode = 'signin' | 'signup' | 'signup-sent'

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
  const { isConfigured: authConfigured, user, session, signIn, signUp } = useAuth()
  const { addresses, addAddress } = useAddresses()
  const [step, setStep] = useState<Step>('cart')
  const [notice, setNotice] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [summary, setSummary] = useState<OrderSummary | null>(null)
  const [pendingOrderID, setPendingOrderID] = useState<string | null>(null)
  const [pendingTotal, setPendingTotal] = useState<number | null>(null)
  const [pendingItems, setPendingItems] = useState<CartItem[] | null>(null)
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoMessage, setPromoMessage] = useState('')
  const [shipping, setShipping] = useState<ShippingAddress>(emptyShippingAddress)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [accountMode, setAccountMode] = useState<AccountMode>('signin')
  const [accountEmail, setAccountEmail] = useState('')
  const [accountPassword, setAccountPassword] = useState('')
  const [accountError, setAccountError] = useState('')
  const [accountSubmitting, setAccountSubmitting] = useState(false)

  useModalScrollLock(isOpen)

  // Once signed in (or if accounts aren't configured on this deployment at all), automatically
  // move past the account gate into the shipping step instead of leaving the user stranded.
  useEffect(() => {
    if (step !== 'account') return
    if (!authConfigured || user) {
      setShowAddressForm(addresses.length === 0)
      setStep('shipping')
    }
  }, [step, authConfigured, user, addresses.length])

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
      setShowAddressForm(false)
      setAccountMode('signin')
      setAccountEmail('')
      setAccountPassword('')
      setAccountError('')
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
    if (authConfigured && !user) {
      setStep('account')
      return
    }
    setShowAddressForm(addresses.length === 0)
    setStep('shipping')
  }

  const handleAccountSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setAccountError('')
    if (accountMode === 'signup' && accountPassword.length < 6) {
      setAccountError(t.account.errorPasswordTooShort)
      return
    }
    setAccountSubmitting(true)
    const { error } = accountMode === 'signin'
      ? await signIn(accountEmail, accountPassword)
      : await signUp(accountEmail, accountPassword)
    setAccountSubmitting(false)
    if (error) {
      setAccountError(mapAuthError(error, t.account))
      return
    }
    if (accountMode === 'signup') {
      setAccountMode('signup-sent')
    }
    // On sign-in, the effect watching `user` advances to the shipping step automatically.
  }

  const selectSavedAddress = (address: SavedAddress) => {
    setShipping({
      address: address.address,
      postalCode: address.postalCode,
      city: address.city,
      country: address.country,
      floor: address.floor,
      doorName: address.doorName,
    })
    setStep('checkout')
  }

  const handleShippingSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (authConfigured && user) {
      const result = await addAddress(shipping)
      if (result.error) console.error('CartPanel: failed to save the address for reuse', result.error)
    }
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
    // Snapshot the cart at the moment payment starts, so the receipt (email + order history)
    // reflects exactly what was charged even if the cart's live state somehow changes before
    // PayPal's approval callback fires.
    setPendingItems(items)
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
      const capturedItems = pendingItems ?? items
      await requestJson('/api/capture-order', {
        orderID,
        shippingAddress: shipping,
        accessToken: session?.access_token,
        items: capturedItems.map((item) => ({
          artworkNumber: item.artworkNumber,
          formatId: item.formatId,
          finishId: item.finishId,
          quantity: item.quantity,
        })),
      })
      setSummary({ orderID, items: capturedItems, total: pendingTotal ?? checkoutTotal, promoApplied: activePromo || pendingTotal === PROMO_PRICE })
      clearCart()
      setShipping(emptyShippingAddress)
      await refreshStatus()
      setPendingOrderID(null)
      setPendingTotal(null)
      setPendingItems(null)
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

        {step === 'account' && (
          <div className="cart-panel__body">
            <p className="cart-panel__notice">{t.cart.accountRequiredNotice}</p>
            {accountMode === 'signup-sent' ? (
              <div className="account-panel__form">
                <p className="cart-panel__notice">{t.account.signUpSuccess}</p>
                <button type="button" className="cart-panel__back" onClick={() => setAccountMode('signin')}>{t.account.backToSignIn}</button>
              </div>
            ) : (
              <form className="account-panel__form" onSubmit={handleAccountSubmit}>
                {accountError && <p className="cart-panel__error">{accountError}</p>}
                <div className="account-panel__field">
                  <label htmlFor="cart-account-email">{t.account.emailLabel}</label>
                  <input
                    id="cart-account-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={accountEmail}
                    onChange={(event) => setAccountEmail(event.target.value)}
                  />
                </div>
                <div className="account-panel__field">
                  <label htmlFor="cart-account-password">{t.account.passwordLabel}</label>
                  <input
                    id="cart-account-password"
                    type="password"
                    autoComplete={accountMode === 'signup' ? 'new-password' : 'current-password'}
                    required
                    minLength={6}
                    value={accountPassword}
                    onChange={(event) => setAccountPassword(event.target.value)}
                  />
                </div>
                {accountMode === 'signup' && <p className="account-panel__hint">{t.account.signUpDeliveryNote}</p>}
                <button type="submit" className="cart-panel__checkout" disabled={accountSubmitting}>
                  {accountMode === 'signin' ? t.account.signInSubmit : t.account.signUpSubmit}
                </button>
                <p className="account-panel__switch">
                  {accountMode === 'signin' ? (
                    <>{t.account.noAccountYet}{' '}<button type="button" className="account-panel__link" onClick={() => { setAccountMode('signup'); setAccountError('') }}>{t.account.createAccountLink}</button></>
                  ) : (
                    <>{t.account.alreadyAccount}{' '}<button type="button" className="account-panel__link" onClick={() => { setAccountMode('signin'); setAccountError('') }}>{t.account.signInLink}</button></>
                  )}
                </p>
              </form>
            )}
            <button type="button" className="cart-panel__back" onClick={() => setStep('cart')}>{t.cart.backToCart}</button>
          </div>
        )}

        {step === 'shipping' && (
          <div className="cart-panel__body">
            {!showAddressForm && addresses.length > 0 ? (
              <div className="account-panel__form">
                <p className="account-panel__hint">{t.cart.shippingSameAddress}</p>
                <ul className="account-panel__address-list">
                  {addresses.map((address) => (
                    <li key={address.id} className="account-panel__address">
                      <div className="account-panel__address-summary">
                        <strong>{address.address}</strong>
                        <span>{address.postalCode} {address.city}, {address.country}</span>
                        {address.floor && <span>{address.floor}</span>}
                        {address.doorName && <span>{address.doorName}</span>}
                      </div>
                      <button type="button" className="cart-panel__checkout" onClick={() => selectSavedAddress(address)}>{t.cart.shippingUseAddress}</button>
                    </li>
                  ))}
                </ul>
                <button type="button" className="cart-panel__back" onClick={() => setShowAddressForm(true)}>{t.cart.shippingAddNew}</button>
                <button type="button" className="cart-panel__back" onClick={() => setStep('cart')}>{t.cart.backToCart}</button>
              </div>
            ) : (
              <AddressForm
                idPrefix="shipping"
                value={shipping}
                onChange={setShipping}
                onSubmit={handleShippingSubmit}
                submitLabel={t.cart.shippingContinue}
                onCancel={() => addresses.length > 0 ? setShowAddressForm(false) : setStep('cart')}
                cancelLabel={addresses.length > 0 ? t.cart.backToAddresses : t.cart.backToCart}
              />
            )}
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

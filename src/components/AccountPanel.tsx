import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { mapAuthError } from '../accountErrors'
import { useAddresses, type AddressInput } from '../addresses'
import { useAuth } from '../auth'
import { useLanguage } from '../i18n'
import { useOrders } from '../orders'
import { useModalScrollLock } from '../hooks/useModalScrollLock'
import { AddressForm } from './AddressForm'

type Step = 'signin' | 'signup' | 'forgot' | 'signup-sent' | 'forgot-sent'
type AccountView = 'profile' | 'orders' | 'addresses'

const emptyAddress: AddressInput = { address: '', postalCode: '', city: '', country: '', floor: '', doorName: '' }

export function AccountPanel() {
  const { language, t } = useLanguage()
  const {
    isConfigured, user, isOpen, isRecovery, closeAccount,
    signUp, signIn, signOut, sendPasswordReset, updatePassword,
  } = useAuth()
  const [step, setStep] = useState<Step>('signin')
  const [view, setView] = useState<AccountView>('profile')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { orders, loading: ordersLoading } = useOrders()
  const { addresses, loading: addressesLoading, addAddress, updateAddress, deleteAddress } = useAddresses()
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressForm, setAddressForm] = useState<AddressInput>(emptyAddress)
  const [addressSubmitting, setAddressSubmitting] = useState(false)

  const currencyFormatter = useMemo(() => new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {
    style: 'currency',
    currency: 'EUR',
  }), [language])
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {
    dateStyle: 'medium',
  }), [language])

  useModalScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) return
    const timeout = setTimeout(() => {
      setStep('signin')
      setEmail('')
      setPassword('')
      setErrorMessage('')
      setView('profile')
      setEditingAddressId(null)
      setAddressForm(emptyAddress)
    }, 400)
    return () => clearTimeout(timeout)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeAccount()
    }
    addEventListener('keydown', onKeyDown)
    return () => removeEventListener('keydown', onKeyDown)
  }, [isOpen, closeAccount])

  if (!isOpen) return null

  const switchTo = (nextStep: Step) => {
    setErrorMessage('')
    setPassword('')
    setStep(nextStep)
  }

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setSubmitting(true)
    const { error } = await signIn(email, password)
    setSubmitting(false)
    if (error) setErrorMessage(mapAuthError(error, t.account))
  }

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    if (password.length < 6) {
      setErrorMessage(t.account.errorPasswordTooShort)
      return
    }
    setSubmitting(true)
    const { error } = await signUp(email, password)
    setSubmitting(false)
    if (error) {
      setErrorMessage(mapAuthError(error, t.account))
      return
    }
    setStep('signup-sent')
  }

  const handleForgot = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setSubmitting(true)
    const { error } = await sendPasswordReset(email)
    setSubmitting(false)
    if (error) {
      setErrorMessage(mapAuthError(error, t.account))
      return
    }
    setStep('forgot-sent')
  }

  const handleUpdatePassword = async (event: FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    if (password.length < 6) {
      setErrorMessage(t.account.errorPasswordTooShort)
      return
    }
    setSubmitting(true)
    const { error } = await updatePassword(password)
    setSubmitting(false)
    if (error) setErrorMessage(mapAuthError(error, t.account))
  }

  const startNewAddress = () => {
    setEditingAddressId('new')
    setAddressForm(emptyAddress)
  }

  const startEditAddress = (id: string) => {
    const existing = addresses.find((candidate) => candidate.id === id)
    if (!existing) return
    setEditingAddressId(id)
    setAddressForm({
      address: existing.address,
      postalCode: existing.postalCode,
      city: existing.city,
      country: existing.country,
      floor: existing.floor,
      doorName: existing.doorName,
    })
  }

  const handleAddressSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setAddressSubmitting(true)
    const result = editingAddressId && editingAddressId !== 'new'
      ? await updateAddress(editingAddressId, addressForm)
      : await addAddress(addressForm)
    setAddressSubmitting(false)
    if (!result.error) {
      setEditingAddressId(null)
      setAddressForm(emptyAddress)
    }
  }

  const title = isRecovery
    ? t.account.updatePasswordTitle
    : user
      ? view === 'orders' ? t.account.ordersTitle : view === 'addresses' ? t.account.addressesTitle : t.account.accountTitle
      : step === 'signup' ? t.account.signUpTitle
      : step === 'forgot' || step === 'forgot-sent' ? t.account.forgotTitle
      : t.account.signInTitle

  return (
    <div className="cart-panel-backdrop" role="presentation" onClick={closeAccount}>
      <aside
        className="cart-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        data-lenis-prevent
        onClick={(event) => event.stopPropagation()}
      >
        <header className="cart-panel__header">
          <h2>{title}</h2>
          <button type="button" className="cart-panel__close" onClick={closeAccount} aria-label={t.common.close}>
            <i aria-hidden="true">×</i>
          </button>
        </header>

        {isConfigured && !isRecovery && user && (
          <nav className="account-panel__tabs" aria-label={t.account.accountTitle}>
            <button type="button" className={view === 'profile' ? 'is-active' : ''} onClick={() => setView('profile')}>{t.account.tabProfile}</button>
            <button type="button" className={view === 'orders' ? 'is-active' : ''} onClick={() => setView('orders')}>{t.account.tabOrders}</button>
            <button type="button" className={view === 'addresses' ? 'is-active' : ''} onClick={() => setView('addresses')}>{t.account.tabAddresses}</button>
          </nav>
        )}

        <div className="cart-panel__body">
          {!isConfigured && (
            <p className="cart-panel__notice">{t.account.missingConfig}</p>
          )}

          {isConfigured && isRecovery && (
            <form className="account-panel__form" onSubmit={handleUpdatePassword}>
              {errorMessage && <p className="cart-panel__error">{errorMessage}</p>}
              <div className="account-panel__field">
                <label htmlFor="account-new-password">{t.account.newPasswordLabel}</label>
                <input
                  id="account-new-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <button type="submit" className="cart-panel__checkout" disabled={submitting}>{t.account.updatePasswordSubmit}</button>
            </form>
          )}

          {isConfigured && !isRecovery && user && view === 'profile' && (
            <div className="account-panel__profile">
              <p className="account-panel__meta"><span>{t.account.signedInAs}</span><strong>{user.email}</strong></p>
              <button type="button" className="cart-panel__checkout" onClick={() => signOut()}>{t.account.signOut}</button>
            </div>
          )}

          {isConfigured && !isRecovery && user && view === 'orders' && (
            ordersLoading ? (
              <p className="cart-panel__notice">{t.account.ordersLoading}</p>
            ) : orders.length === 0 ? (
              <p className="cart-panel__notice">{t.account.ordersEmpty}</p>
            ) : (
              <ul className="account-panel__orders">
                {orders.map((order) => (
                  <li key={order.id} className="account-panel__order">
                    <div className="account-panel__order-header">
                      <span>{t.account.orderNumberLabel} · {dateFormatter.format(new Date(order.date))}</span>
                      <strong>{currencyFormatter.format(order.total)}</strong>
                    </div>
                    <ul className="cart-panel__summary-list">
                      {order.items.map((item, index) => (
                        <li key={index}>
                          <span>
                            {item.quantity} × N° {item.artworkNumber} — {item.title} — {item.formatLabel}
                            <br />
                            <small>{item.dibond ? t.account.orderDibondYes : t.account.orderDibondNo}</small>
                          </span>
                          <strong>{currencyFormatter.format(item.lineTotal)}</strong>
                        </li>
                      ))}
                    </ul>
                    <span className="account-panel__order-status">
                      {order.status === 'COMPLETED' ? t.account.orderStatusCompleted : order.status}
                    </span>
                  </li>
                ))}
              </ul>
            )
          )}

          {isConfigured && !isRecovery && user && view === 'addresses' && (
            <div className="account-panel__addresses">
              {editingAddressId ? (
                <AddressForm
                  idPrefix="account-address"
                  value={addressForm}
                  onChange={setAddressForm}
                  onSubmit={handleAddressSubmit}
                  submitLabel={t.account.saveAddress}
                  submitting={addressSubmitting}
                  onCancel={() => { setEditingAddressId(null); setAddressForm(emptyAddress) }}
                  cancelLabel={t.account.cancelEdit}
                />
              ) : (
                <>
                  {addressesLoading ? (
                    <p className="cart-panel__notice">{t.account.addressesLoading}</p>
                  ) : addresses.length === 0 ? (
                    <p className="cart-panel__notice">{t.account.addressesEmpty}</p>
                  ) : (
                    <ul className="account-panel__address-list">
                      {addresses.map((addr) => (
                        <li key={addr.id} className="account-panel__address">
                          <div className="account-panel__address-summary">
                            <strong>{addr.address}</strong>
                            <span>{addr.postalCode} {addr.city}, {addr.country}</span>
                            {addr.floor && <span>{addr.floor}</span>}
                            {addr.doorName && <span>{addr.doorName}</span>}
                          </div>
                          <div className="account-panel__address-actions">
                            <button type="button" className="account-panel__link" onClick={() => startEditAddress(addr.id)}>{t.account.editAddress}</button>
                            <button type="button" className="account-panel__link" onClick={() => deleteAddress(addr.id)}>{t.account.deleteAddress}</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button type="button" className="cart-panel__checkout" onClick={startNewAddress}>{t.account.addAddress}</button>
                </>
              )}
            </div>
          )}

          {isConfigured && !isRecovery && !user && step === 'signin' && (
            <form className="account-panel__form" onSubmit={handleSignIn}>
              {errorMessage && <p className="cart-panel__error">{errorMessage}</p>}
              <div className="account-panel__field">
                <label htmlFor="account-signin-email">{t.account.emailLabel}</label>
                <input
                  id="account-signin-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="account-panel__field">
                <label htmlFor="account-signin-password">{t.account.passwordLabel}</label>
                <input
                  id="account-signin-password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <button type="submit" className="cart-panel__checkout" disabled={submitting}>{t.account.signInSubmit}</button>
              <div className="account-panel__links">
                <button type="button" className="account-panel__link" onClick={() => switchTo('forgot')}>{t.account.forgotLink}</button>
              </div>
              <p className="account-panel__switch">
                {t.account.noAccountYet}{' '}
                <button type="button" className="account-panel__link" onClick={() => switchTo('signup')}>{t.account.createAccountLink}</button>
              </p>
            </form>
          )}

          {isConfigured && !isRecovery && !user && step === 'signup' && (
            <form className="account-panel__form" onSubmit={handleSignUp}>
              {errorMessage && <p className="cart-panel__error">{errorMessage}</p>}
              <div className="account-panel__field">
                <label htmlFor="account-signup-email">{t.account.emailLabel}</label>
                <input
                  id="account-signup-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div className="account-panel__field">
                <label htmlFor="account-signup-password">{t.account.passwordLabel}</label>
                <input
                  id="account-signup-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <p className="account-panel__hint">{t.account.signUpDeliveryNote}</p>
              <button type="submit" className="cart-panel__checkout" disabled={submitting}>{t.account.signUpSubmit}</button>
              <p className="account-panel__switch">
                {t.account.alreadyAccount}{' '}
                <button type="button" className="account-panel__link" onClick={() => switchTo('signin')}>{t.account.signInLink}</button>
              </p>
            </form>
          )}

          {isConfigured && !isRecovery && !user && step === 'forgot' && (
            <form className="account-panel__form" onSubmit={handleForgot}>
              {errorMessage && <p className="cart-panel__error">{errorMessage}</p>}
              <div className="account-panel__field">
                <label htmlFor="account-forgot-email">{t.account.emailLabel}</label>
                <input
                  id="account-forgot-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <button type="submit" className="cart-panel__checkout" disabled={submitting}>{t.account.forgotSubmit}</button>
              <button type="button" className="cart-panel__back" onClick={() => switchTo('signin')}>{t.account.backToSignIn}</button>
            </form>
          )}

          {isConfigured && !isRecovery && !user && step === 'signup-sent' && (
            <div className="account-panel__form">
              <p className="cart-panel__notice">{t.account.signUpSuccess}</p>
              <button type="button" className="cart-panel__back" onClick={() => switchTo('signin')}>{t.account.backToSignIn}</button>
            </div>
          )}

          {isConfigured && !isRecovery && !user && step === 'forgot-sent' && (
            <div className="account-panel__form">
              <p className="cart-panel__notice">{t.account.forgotSuccess}</p>
              <button type="button" className="cart-panel__back" onClick={() => switchTo('signin')}>{t.account.backToSignIn}</button>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}

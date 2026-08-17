import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../auth'
import { useLanguage } from '../i18n'
import { useModalScrollLock } from '../hooks/useModalScrollLock'

type Step = 'signin' | 'signup' | 'forgot' | 'signup-sent' | 'forgot-sent'

type AccountTranslations = ReturnType<typeof useLanguage>['t']['account']

function mapAuthError(message: string | null, t: AccountTranslations): string {
  if (!message) return t.errorGeneric
  const normalized = message.toLowerCase()
  if (normalized.includes('invalid login credentials')) return t.errorInvalidCredentials
  if (normalized.includes('already registered') || normalized.includes('already exists')) return t.errorEmailInUse
  if (normalized.includes('at least 6 characters')) return t.errorPasswordTooShort
  return t.errorGeneric
}

export function AccountPanel() {
  const { t } = useLanguage()
  const {
    isConfigured, user, isOpen, isRecovery, closeAccount,
    signUp, signIn, signOut, sendPasswordReset, updatePassword,
  } = useAuth()
  const [step, setStep] = useState<Step>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useModalScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) return
    const timeout = setTimeout(() => {
      setStep('signin')
      setEmail('')
      setPassword('')
      setErrorMessage('')
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

  const title = isRecovery
    ? t.account.updatePasswordTitle
    : user
      ? t.account.accountTitle
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

          {isConfigured && !isRecovery && user && (
            <div className="account-panel__profile">
              <p className="account-panel__meta"><span>{t.account.signedInAs}</span><strong>{user.email}</strong></p>
              <button type="button" className="cart-panel__checkout" onClick={() => signOut()}>{t.account.signOut}</button>
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

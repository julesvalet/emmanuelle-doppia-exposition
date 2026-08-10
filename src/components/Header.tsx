import { useEffect, useState } from 'react'
import { site } from '../data/site'
import { useAuth } from '../auth'
import { useCart } from '../cart'
import { useLanguage } from '../i18n'
import { useInterfaceControls } from '../interfaceControls'
import { Logo } from './Logo'

export function Header() {
  const [open, setOpen] = useState(false)
  const { t, toggleLanguage } = useLanguage()
  const { modalClose } = useInterfaceControls()
  const { itemCount, openCart } = useCart()
  const { user, openAccount } = useAuth()

  useEffect(() => {
    const close = () => setOpen(false)
    addEventListener('resize', close)
    return () => removeEventListener('resize', close)
  }, [])

  useEffect(() => {
    if (modalClose) setOpen(false)
  }, [modalClose])

  const toggleMenu = () => {
    if (!open && modalClose) modalClose()
    setOpen((value) => !value)
  }

  return (
    <header className={`header ${open ? 'is-open' : ''} ${modalClose ? 'is-lightbox' : ''}`}>
      <a className="header__brand" href="#ouverture" aria-label={t.header.backToOpening}>
        <Logo compact />
      </a>
      <button
        className="menu-toggle"
        type="button"
        aria-label={open ? t.common.closeMenu : t.common.openMenu}
        aria-expanded={open}
        aria-controls="main-navigation"
        data-cursor={open ? t.common.close : t.common.open}
        onClick={toggleMenu}
      >
        <span>{open ? t.common.close : t.common.menu}</span>
        <i aria-hidden="true" />
      </button>
      <div className="header__controls">
        <button
          className="account-toggle"
          type="button"
          aria-label={user ? t.account.openAccount : t.account.signIn}
          title={user ? t.account.account : t.account.signIn}
          onClick={openAccount}
        >
          <span>{user ? t.account.account : t.account.signIn}</span>
        </button>
        <button
          className="cart-toggle"
          type="button"
          aria-label={t.cart.openCart}
          title={t.cart.openCart}
          onClick={openCart}
        >
          <span>{t.cart.title}</span>
          {itemCount > 0 && <i aria-hidden="true">{itemCount}</i>}
        </button>
        <button
          className="language-toggle"
          type="button"
          aria-label={t.switchLanguage}
          title={t.switchLanguage}
          onClick={toggleLanguage}
        >
          <span>{t.languageCode}</span>
        </button>
        {modalClose && (
          <button className="header__modal-close" type="button" onClick={modalClose} aria-label={t.common.close}>
            <span>{t.common.close}</span>
            <i aria-hidden="true">×</i>
          </button>
        )}
      </div>
      <nav id="main-navigation" className="nav" aria-label={t.header.navigation}>
        <ol>
          {site.navigation.map((item, index) => (
            <li key={item.href}>
              <span>0{index + 1}</span>
              <a href={item.href} data-cursor={t.common.go} onClick={() => setOpen(false)}>{t.header.navigationItems[index]}</a>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  )
}

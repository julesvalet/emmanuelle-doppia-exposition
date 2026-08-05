import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { site } from '../data/site'
import { useLanguage } from '../i18n'
import { Logo } from './Logo'

export function Header() {
  const [open, setOpen] = useState(false)
  const { t, toggleLanguage } = useLanguage()

  useEffect(() => {
    const close = () => setOpen(false)
    addEventListener('resize', close)
    return () => removeEventListener('resize', close)
  }, [])

  return (
    <>
      <header className={`header ${open ? 'is-open' : ''}`}>
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
          onClick={() => setOpen((value) => !value)}
        >
          <span>{open ? t.common.close : t.common.menu}</span>
          <i aria-hidden="true" />
        </button>
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
      {createPortal((
        <button
          className="language-toggle"
          type="button"
          aria-label={t.switchLanguage}
          title={t.switchLanguage}
          onClick={toggleLanguage}
        >
          <span>{t.languageCode}</span>
        </button>
      ), document.body)}
    </>
  )
}

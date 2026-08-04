import { useEffect, useState } from 'react'
import { site } from '../data/site'
import { Logo } from './Logo'

export function Header() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const close = () => setOpen(false)
    addEventListener('resize', close)
    return () => removeEventListener('resize', close)
  }, [])

  return (
    <header className={`header ${open ? 'is-open' : ''}`}>
      <a className="header__brand" href="#ouverture" aria-label="Retour à l’ouverture">
        <Logo compact />
      </a>
      <button
        className="menu-toggle"
        type="button"
        aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={open}
        aria-controls="main-navigation"
        data-cursor={open ? 'Fermer' : 'Ouvrir'}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{open ? 'Fermer' : 'Menu'}</span>
        <i aria-hidden="true" />
      </button>
      <nav id="main-navigation" className="nav" aria-label="Navigation principale">
        <ol>
          {site.navigation.map((item, index) => (
            <li key={item.href}>
              <span>0{index + 1}</span>
              <a href={item.href} data-cursor="Aller" onClick={() => setOpen(false)}>{item.label}</a>
            </li>
          ))}
        </ol>
      </nav>
    </header>
  )
}

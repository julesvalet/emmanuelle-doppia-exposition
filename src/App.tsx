import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { site } from './data/site'
import { catalogueArtworks } from './data/journey'
import { useLanguage } from './i18n'
import { Cursor } from './components/Cursor'
import { Gallery } from './components/Gallery'
import { Header } from './components/Header'
import { Logo } from './components/Logo'
import { ParticleRibbonOverlay } from './components/ParticleRibbonOverlay'
import { ParticleCamera } from './components/ParticleCamera'
import { AustraliaEarthZoom } from './components/AustraliaEarthZoom'
import { modalScrollLockEvent, type ModalScrollLockDetail } from './hooks/useModalScrollLock'

gsap.registerPlugin(ScrollTrigger)

const EDITORIAL_PARTICLE_RIBBON_ENABLED = true
const introArtwork = catalogueArtworks.find((artwork) => artwork.order === 3 && artwork.type === 'image')

function App() {
  const app = useRef<HTMLDivElement>(null)
  const chapter = useRef<HTMLSpanElement>(null)
  const introImage = useRef<HTMLImageElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ duration: 1.15, smoothWheel: true })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    const onModalScrollLock = (event: Event) => {
      const { locked, scrollY } = (event as CustomEvent<ModalScrollLockDetail>).detail
      if (locked) {
        lenis.stop()
        return
      }

      lenis.scrollTo(scrollY, { immediate: true, force: true })
      lenis.start()
      ScrollTrigger.update()
    }
    addEventListener(modalScrollLockEvent, onModalScrollLock)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    const context = gsap.context(() => {
      gsap.from('.hero__line > span', {
        yPercent: 72,
        rotate: 1.2,
        clipPath: 'inset(0 -0.18em 100% -0.18em)',
        duration: 1.4,
        stagger: 0.1,
        ease: 'expo.out',
      })
      gsap.from('.hero__meta, .hero__mark', { opacity: 0, y: 28, duration: 1, delay: 0.35, stagger: 0.12, ease: 'power3.out' })
      gsap.to('.scroll-progress__line', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: app.current, start: 'top top', end: 'bottom bottom', scrub: 0.25 } })
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((element) => {
        const editorial = element.matches('h2, .intro__lead, .gallery__title')
        gsap.from(element, {
          y: editorial ? 95 : 52,
          opacity: 0,
          clipPath: editorial ? 'inset(0 -0.18em 100% -0.18em)' : 'inset(0 0 0% 0)',
          duration: editorial ? 1.45 : 1.05,
          ease: editorial ? 'expo.out' : 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 89%' },
        })
      })
      gsap.to('.hero h1', { yPercent: -11, opacity: 0.28, ease: 'none', scrollTrigger: { trigger: '.hero', start: '35% top', end: 'bottom top', scrub: true } })
      gsap.to('.hero__line:nth-child(2) span', { xPercent: 4, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
      gsap.to('.marquee__track', { xPercent: -25, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: 1 } })
      gsap.to('.empty-stage__orbit', { rotate: 210, scale: 0.78, ease: 'none', scrollTrigger: { trigger: '.empty-stage', start: 'top bottom', end: 'bottom top', scrub: 1 } })
      gsap.to('.about__symbol', { rotate: 4, yPercent: -15, ease: 'none', scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: 1 } })

      gsap.utils.toArray<HTMLElement>('[data-chapter]').forEach((section, index) => {
        ScrollTrigger.create({
          trigger: section,
          start: 'top center',
          end: 'bottom center',
          onToggle: ({ isActive }) => {
            if (isActive && chapter.current) chapter.current.textContent = String(index + 1).padStart(2, '0')
          },
        })
      })
    }, app)

    return () => {
      removeEventListener(modalScrollLockEvent, onModalScrollLock)
      context.revert()
      lenis.destroy()
      gsap.ticker.remove(tick)
    }
  }, [])

  return (
    <div ref={app}>
      <Cursor />
      <ParticleCamera />
      <div className="ambient-grain" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true"><i className="scroll-progress__line" /></div>
      <aside className="chapter-rail" aria-hidden="true"><span>Index</span><div><span ref={chapter}>01</span><i>/</i><span>05</span></div></aside>
      <Header />
      <main id="main">
        <section className="hero" id="ouverture" aria-labelledby="hero-title" data-chapter>
          <div className="hero__meta"><span>{t.hero.exhibition}</span><span>{t.hero.edition} {site.year}</span></div>
          <h1 className="hero__title--exhibition" id="hero-title">
            <span className="hero__line"><span>{t.hero.titleFirst}</span></span>
            <span className="hero__line hero__line--offset"><span><em>{t.hero.titleSecond}</em></span></span>
          </h1>
          <div className="hero__mark"><span>{t.hero.scroll}</span><i /></div>
        </section>

        <section className="intro editorial-section" aria-labelledby="intro-title">
          <div className="editorial-text-layer">
            <div className="section-kicker reveal"><span>01</span><span>{t.intro.preamble}</span><span>{t.intro.gaze}</span></div>
            {introArtwork && (
              <figure className="intro__artwork" aria-label={introArtwork.title}>
                <span className="intro__artwork-frame">
                  <picture>
                    <source media="(max-width: 760px)" srcSet={introArtwork.mobileSrc} />
                    <img
                      ref={introImage}
                      src={introArtwork.src}
                      alt={`${introArtwork.title}, ${t.accessibility.artworkAlt} Uluru–Kata Tjuta ${t.accessibility.byArtist}.`}
                      width={introArtwork.width || undefined}
                      height={introArtwork.height || undefined}
                      loading="lazy"
                      decoding="async"
                    />
                  </picture>
                </span>
              </figure>
            )}
            <p className="intro__lead editorial-text reveal" id="intro-title">{t.intro.statement}</p>
            <div className="intro__aside reveal"><span>{t.intro.exhibitionBy}</span><strong>{site.artist}</strong></div>
          </div>
          <ParticleRibbonOverlay enabled={EDITORIAL_PARTICLE_RIBBON_ENABLED} imageRef={introImage} />
        </section>

        <div className="marquee" aria-hidden="true"><div className="marquee__track">{t.intro.marquee}</div></div>

        <AustraliaEarthZoom />

        <div data-chapter><Gallery /></div>

        <section className="about" id="demarche" aria-labelledby="about-title" data-chapter>
          <div className="section-kicker reveal"><span>04</span><span>{t.about.approach}</span><span>{t.about.about}</span></div>
          <div className="about__layout">
            <h2 className="reveal" id="about-title">{t.about.titleFirst}<br /><em>{t.about.titleSecond}</em></h2>
            <div className="about__copy reveal"><p>{t.about.text}</p><span>{site.artist}<br />{t.about.photographer}</span></div>
          </div>
          <div className="about__symbol" aria-hidden="true"><Logo /></div>
        </section>

        <section className="contact" id="contact" aria-labelledby="contact-title" data-chapter>
          <div className="section-kicker reveal"><span>05</span><span>Contact</span><span>{site.location}</span></div>
          <h2 className="reveal" id="contact-title">{t.contact.headingFirst}<br /><em>{t.contact.headingSecond}</em></h2>
          <p className="reveal">{t.contact.note}</p>
        </section>
      </main>
      <footer className="footer">
        <Logo compact />
        <span>© {site.year} {site.artist}</span>
        <a href="#ouverture" data-cursor={t.footer.cursorTop}>{t.footer.backToTop}</a>
      </footer>
    </div>
  )
}

export default App

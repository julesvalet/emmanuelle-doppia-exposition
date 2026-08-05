/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Language = 'fr' | 'en'

const STORAGE_KEY = 'emmanuelle-doppia-language'

export const translations = {
  fr: {
    languageCode: 'FR',
    switchLanguage: 'Passer le site en anglais',
    common: {
      menu: 'Menu',
      openMenu: 'Ouvrir le menu',
      closeMenu: 'Fermer le menu',
      close: 'Fermer',
      open: 'Ouvrir',
      view: 'Voir',
      go: 'Aller',
      previous: 'Précédente',
      next: 'Suivante',
      gallery: 'Galerie',
      photograph: 'photographie',
      photographs: 'photographies',
      artwork: 'œuvre',
      artworks: 'œuvres',
      unavailable: 'Photographie indisponible',
      originalMissing: 'Original haute définition à ajouter',
      number: 'N°',
    },
    header: {
      backToOpening: 'Retour à l’ouverture',
      navigation: 'Navigation principale',
      navigationItems: ['Ouverture', 'Voyage', 'Exposition', 'Démarche', 'Contact'],
    },
    hero: {
      exhibition: 'Exposition photographique',
      edition: 'Édition',
      titleFirst: 'De l’Opéra',
      titleSecond: 'à l’Ocre',
      scroll: 'Faire défiler',
    },
    intro: {
      preamble: 'Préambule',
      gaze: 'Le regard',
      statement: 'Chaque image commence par une présence. Un temps suspendu, une lumière, un geste — puis le regard qui choisit de rester.',
      exhibitionBy: 'Une exposition de',
      marquee: 'Présence — lumière — silence — mouvement — présence — lumière — silence — mouvement —',
    },
    earth: {
      cartography: 'Cartographie',
      australia: 'Australie',
      titleFirst: 'Vers le sud,',
      titleSecond: 'lentement.',
      introduction: 'De Sydney à Uluru–Kata Tjuta, six étapes composent le territoire de l’exposition.',
      transition: 'Transition géographique',
      phases: { orbit: 'Orbite', approach: 'Approche', australia: 'Australie', itinerary: 'Itinéraire' },
      sixSeries: 'Six séries photographiques',
      everyPoint: 'Chaque point',
      opensView: 'ouvre un regard.',
      step: 'Étape',
      openStep: 'Ouvrir le contenu de l’étape',
      route: '6 étapes · Sydney → Uluru–Kata Tjuta',
      locations: {
        sydney: { region: 'Nouvelle-Galles du Sud', description: 'Première étape du parcours photographique australien.' },
        melbourne: { region: 'Victoria', description: 'Deuxième étape du parcours photographique australien.' },
        perth: { region: 'Australie-Occidentale', description: 'Troisième étape du parcours photographique australien.' },
        adelaide: { region: 'Australie-Méridionale', description: 'Quatrième étape du parcours photographique australien.' },
        'kangaroo-island': { region: 'Australie-Méridionale', description: 'Cinquième étape du parcours photographique australien.' },
        'uluru-kata-tjuta': { region: 'Territoire du Nord', description: 'Dernière étape du parcours photographique australien.' },
      },
    },
    gallery: {
      exhibition: 'Exposition',
      preparing: 'En préparation',
      titleFirst: 'Le regard',
      titleSecond: 'en mouvement',
      emptyFirst: 'La salle',
      emptySecond: 'attend.',
      openingSoon: 'Ouverture prochaine',
      worksSoon: 'Les œuvres prendront place ici.',
      emptyLabel: 'La galerie ouvrira prochainement',
    },
    about: {
      approach: 'Démarche',
      about: 'À propos',
      titleFirst: 'Regarder,',
      titleSecond: 'vraiment.',
      text: 'Cette exposition est pensée comme un espace de respiration. Les photographies y trouveront leur rythme, sans décor superflu, dans une scénographie numérique au service du regard.',
      photographer: 'Photographe',
    },
    contact: {
      headingFirst: 'Entrer',
      headingSecond: 'en relation',
      note: 'Les coordonnées de l’atelier seront publiées à l’ouverture de l’exposition.',
    },
    footer: { backToTop: 'Retour en haut ↑', cursorTop: 'Haut' },
    viewer: {
      closeSeries: 'Fermer la série',
      backToGallery: 'Revenir à la galerie',
      browseSeries: 'Parcourir la série',
      photoList: 'Photographies de',
      selectPhoto: 'Sélectionner une photographie',
      noPhotos: 'Les photographies de cette étape seront bientôt disponibles.',
      details: 'Détails de',
    },
    accessibility: {
      artworkAlt: 'photographie de la série',
      byArtist: 'par Emmanuelle Doppia',
    },
  },
  en: {
    languageCode: 'GB',
    switchLanguage: 'Switch the site to French',
    common: {
      menu: 'Menu',
      openMenu: 'Open menu',
      closeMenu: 'Close menu',
      close: 'Close',
      open: 'Open',
      view: 'View',
      go: 'Go',
      previous: 'Previous',
      next: 'Next',
      gallery: 'Gallery',
      photograph: 'photograph',
      photographs: 'photographs',
      artwork: 'artwork',
      artworks: 'artworks',
      unavailable: 'Photograph unavailable',
      originalMissing: 'High-definition original to be added',
      number: 'No.',
    },
    header: {
      backToOpening: 'Back to the opening',
      navigation: 'Main navigation',
      navigationItems: ['Opening', 'Journey', 'Exhibition', 'Approach', 'Contact'],
    },
    hero: {
      exhibition: 'Photography exhibition',
      edition: 'Edition',
      titleFirst: 'From the Opera',
      titleSecond: 'to Ochre',
      scroll: 'Scroll',
    },
    intro: {
      preamble: 'Preamble',
      gaze: 'The gaze',
      statement: 'Every image begins with a presence. A suspended moment, a light, a gesture — then the gaze that chooses to remain.',
      exhibitionBy: 'An exhibition by',
      marquee: 'Presence — light — silence — movement — presence — light — silence — movement —',
    },
    earth: {
      cartography: 'Cartography',
      australia: 'Australia',
      titleFirst: 'Heading south,',
      titleSecond: 'slowly.',
      introduction: 'From Sydney to Uluru–Kata Tjuta, six stages shape the territory of the exhibition.',
      transition: 'Geographic transition',
      phases: { orbit: 'Orbit', approach: 'Approach', australia: 'Australia', itinerary: 'Itinerary' },
      sixSeries: 'Six photographic series',
      everyPoint: 'Every point',
      opensView: 'opens a gaze.',
      step: 'Stage',
      openStep: 'Open the content of stage',
      route: '6 stages · Sydney → Uluru–Kata Tjuta',
      locations: {
        sydney: { region: 'New South Wales', description: 'First stage of the Australian photographic journey.' },
        melbourne: { region: 'Victoria', description: 'Second stage of the Australian photographic journey.' },
        perth: { region: 'Western Australia', description: 'Third stage of the Australian photographic journey.' },
        adelaide: { region: 'South Australia', description: 'Fourth stage of the Australian photographic journey.' },
        'kangaroo-island': { region: 'South Australia', description: 'Fifth stage of the Australian photographic journey.' },
        'uluru-kata-tjuta': { region: 'Northern Territory', description: 'Final stage of the Australian photographic journey.' },
      },
    },
    gallery: {
      exhibition: 'Exhibition',
      preparing: 'In preparation',
      titleFirst: 'The gaze',
      titleSecond: 'in motion',
      emptyFirst: 'The room',
      emptySecond: 'waits.',
      openingSoon: 'Opening soon',
      worksSoon: 'The artworks will take their place here.',
      emptyLabel: 'The gallery will open soon',
    },
    about: {
      approach: 'Approach',
      about: 'About',
      titleFirst: 'Looking,',
      titleSecond: 'truly.',
      text: 'This exhibition is conceived as a space to breathe. The photographs find their rhythm without superfluous decoration, in a digital scenography devoted to the gaze.',
      photographer: 'Photographer',
    },
    contact: {
      headingFirst: 'Get',
      headingSecond: 'in touch',
      note: 'The studio’s contact details will be published when the exhibition opens.',
    },
    footer: { backToTop: 'Back to top ↑', cursorTop: 'Top' },
    viewer: {
      closeSeries: 'Close the series',
      backToGallery: 'Back to the gallery',
      browseSeries: 'Browse the series',
      photoList: 'Photographs from',
      selectPhoto: 'Select a photograph',
      noPhotos: 'The photographs from this stage will be available soon.',
      details: 'Details of',
    },
    accessibility: {
      artworkAlt: 'photograph from the series',
      byArtist: 'by Emmanuelle Doppia',
    },
  },
} as const

type TranslationDictionary = (typeof translations)[Language]

type LanguageContextValue = {
  language: Language
  t: TranslationDictionary
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function initialLanguage(): Language {
  if (typeof window === 'undefined') return 'fr'
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'fr'
  } catch {
    return 'fr'
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(initialLanguage)
  const toggleLanguage = useCallback(() => setLanguage((current) => current === 'fr' ? 'en' : 'fr'), [])

  useEffect(() => {
    document.documentElement.lang = language
    try {
      window.localStorage.setItem(STORAGE_KEY, language)
    } catch {
      // The site still works when storage is unavailable.
    }
  }, [language])

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    t: translations[language],
    toggleLanguage,
  }), [language, toggleLanguage])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useLanguage must be used inside LanguageProvider')
  return context
}

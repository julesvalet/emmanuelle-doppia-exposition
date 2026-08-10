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
      navigationItems: ['Ouverture', 'Voyage', 'Exposition', 'Contact'],
    },
    hero: {
      exhibition: 'Exposition photographique',
      edition: 'Édition',
      titleFirst: 'De l’Opéra',
      titleSecond: 'à l’Ocre',
      scroll: 'Faire défiler',
    },
    poster: {
      label: 'Affiche de l’exposition',
      alt: 'Affiche de l’exposition EXPOZITION : une ligne de pins en silhouette sous un ciel nuageux, traversée par le lettrage blanc « EXPOZITION » dont les lettres « OZ » sont traitées en texture bois.',
    },
    intro: {
      preamble: 'Préambule',
      gaze: 'Le regard',
      statement: [
        'G’day Mate ! (Bonjour !) Voilà l’expression typique locale que vous pourriez entendre lorsque vous arriverez en Australie. Le SLANG (argot australien) est caractérisé par des mots ou expressions typiques de la culture australienne. Savez-vous d’ailleurs que vous utilisez régulièrement un terme mondialement connu qui vient de l’Australie dans le domaine de la photographie ? Avez-vous deviné ?',
        'Artiste photographe, sensible, passionnée et à **l’esprit sauvage**, **je suis charmée par les photographies en noir et blanc**. Mon regard est instinctif, libre, j’aime capturer l’instant brut, les moments spontanés, les paysages habités pour faire émerger ce qui est simple et authentique. **Je suis une faiseuse d’images**, voilà tout.',
        'Chaque photographie est pour moi une nouvelle aventure. Si bien que pour cette exposition, révéler l’essence même de l’Australie dans sa **nature profonde, brute, authentique et colorée**, a plus que du sens, en mettant en avant ses contrastes vifs et changeants. J’ai donc choisi d’apporter seulement quelques photographies en noir et blanc.',
        'Je vous invite à explorer ce fabuleux pays qui regorge de merveilles et de trésors cachés en tous genres, que ce soit par sa faune et sa flore riches et variées ou par ses paysages à couper le souffle et sa diversité de couleurs, d’un état à un autre tout est à découvrir.',
        'Lors de deux voyages effectués en 2023 et 2025, j’ai eu l’opportunité de visiter Sydney et Melbourne puis, je repartais pour 3 semaines à Perth, Adelaïde, une petite escapade à Kangaroo Island et Uluru-Kata, c’est là que mon voyage s’est achevé, je n’aurais pas pu rêver meilleure façon de conclure mon aventure. Ce pays, si vaste (14 fois la France) ne se dévoile jamais entièrement en un seul voyage et l’envie d’explorer davantage ce merveilleux continent est toujours présente.',
        'À travers mes photos, laissez-vous emporter à « Oz » (petit surnom donné à l’Australie par les australiens) ou « Down Under », chaque image est une étape, **un instant suspendu de mon Road trip**. Entrez dans mon voyage, **ressentez la chaleur du soleil, la poussière de l’Outback et la liberté des grands espaces**. Bonne visite !',
      ],
      exhibitionBy: 'Une exposition de',
      marquee: 'Présence — lumière — silence — mouvement — présence — lumière — silence — mouvement —',
    },
    earth: {
      cartography: 'Cartographie',
      australia: 'Australie',
      titleFirst: 'Vers le Red Center,',
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
      titleFirst: 'Chaque image commence par une présence.',
      titleSecond: 'Un temps suspendu, une lumière, un geste — puis le regard qui choisit de rester.',
      emptyFirst: 'La salle',
      emptySecond: 'attend.',
      openingSoon: 'Ouverture prochaine',
      worksSoon: 'Les œuvres prendront place ici.',
      emptyLabel: 'La galerie ouvrira prochainement',
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
    shop: {
      configuration: 'Configuration du tirage',
      size: 'Format',
      finish: 'Finition',
      price: 'Prix',
      addToCart: 'Ajouter au panier',
      addedToCart: 'Ajouté au panier ✓',
      specifications: 'Caractéristiques du tirage',
      paperLabel: 'Papier',
      paper: 'Papier brillant Hahnemühle Photo Lustre 260 g.',
      supportLabel: 'Support',
      support: 'Encadrement par contrecollage de la photo sur plaque rigide Dibond 3 mm (plaque aluminium).',
      certificate: 'Certificat d’authenticité inclus avec chaque tirage.',
      shipping: 'Frais de livraison offerts.',
    },
    cart: {
      title: 'Panier',
      openCart: 'Ouvrir le panier',
      empty: 'Votre panier est vide.',
      emptyHint: 'Ajoutez un tirage depuis la galerie pour commencer votre commande.',
      quantity: 'Quantité',
      remove: 'Retirer',
      total: 'Total',
      checkout: 'Commander',
      backToCart: 'Retour au panier',
      summary: 'Récapitulatif de la commande',
      securePayment: 'Paiement sécurisé via PayPal — carte bancaire acceptée sans compte PayPal.',
      processing: 'Traitement du paiement…',
      cancelledNotice: 'Paiement annulé. Votre panier a été conservé.',
      errorGeneric: 'Une erreur est survenue pendant le paiement. Veuillez réessayer.',
      missingClientId: 'Le paiement PayPal n’est pas configuré sur ce déploiement.',
      retry: 'Réessayer',
      successTitle: 'Merci pour votre commande',
      successIntro: 'Votre paiement a été confirmé par PayPal.',
      orderNumber: 'Numéro de commande PayPal',
      continueBrowsing: 'Continuer la visite',
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
      navigationItems: ['Opening', 'Journey', 'Exhibition', 'Contact'],
    },
    hero: {
      exhibition: 'Photography exhibition',
      edition: 'Edition',
      titleFirst: 'From the Opera',
      titleSecond: 'to Ochre',
      scroll: 'Scroll',
    },
    poster: {
      label: 'Exhibition poster',
      alt: 'Poster for the EXPOZITION exhibition: a line of silhouetted pines under a cloudy sky, crossed by the white “EXPOZITION” lettering whose “OZ” letters are rendered in a wood texture.',
    },
    intro: {
      preamble: 'Preamble',
      gaze: 'The gaze',
      statement: [
        'G’day Mate! That’s the typical local greeting you might hear on arriving in Australia. Slang (Australian slang) is marked by words and expressions unique to Australian culture. Did you know you regularly use a term that comes from Australia, one known the world over in the field of photography? Can you guess it?',
        'A sensitive, passionate photographer with a **wild spirit**, **I am captivated by black-and-white photography**. My eye is instinctive and free — I love capturing the raw instant, spontaneous moments, lived-in landscapes, letting what is simple and authentic come to the surface. **I am an image-maker**, that’s all.',
        'Every photograph is, to me, a new adventure. So for this exhibition, revealing the very essence of Australia in its **deep, raw, authentic and colourful nature** felt more than fitting, highlighting its vivid, ever-changing contrasts. I therefore chose to bring only a handful of black-and-white photographs.',
        'I invite you to explore this fabulous country, brimming with wonders and hidden treasures of every kind — its rich and varied wildlife and flora, its breathtaking landscapes, its diversity of colour. From one state to the next, there is always something new to discover.',
        'Across two journeys, in 2023 and 2025, I had the chance to visit Sydney and Melbourne, then set off again for three weeks through Perth and Adelaide, with a brief escape to Kangaroo Island before Uluru–Kata Tjuta — where my journey came to an end. I couldn’t have dreamed of a better way to close this adventure. This country, so vast (fourteen times the size of France), never reveals itself fully in a single journey, and the desire to explore this wonderful continent further never fades.',
        'Through my photographs, let yourself be carried away to “Oz” (the affectionate nickname Australians give their own country) or “Down Under” — each image is a stage, **a suspended moment from my road trip**. Step into my journey, **feel the warmth of the sun, the dust of the Outback and the freedom of wide-open spaces**. Enjoy the visit!',
      ],
      exhibitionBy: 'An exhibition by',
      marquee: 'Presence — light — silence — movement — presence — light — silence — movement —',
    },
    earth: {
      cartography: 'Cartography',
      australia: 'Australia',
      titleFirst: 'Heading to the Red Centre,',
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
      titleFirst: 'Every image begins with a presence.',
      titleSecond: 'A suspended moment, a light, a gesture — then the gaze that chooses to remain.',
      emptyFirst: 'The room',
      emptySecond: 'waits.',
      openingSoon: 'Opening soon',
      worksSoon: 'The artworks will take their place here.',
      emptyLabel: 'The gallery will open soon',
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
    shop: {
      configuration: 'Print configuration',
      size: 'Size',
      finish: 'Finish',
      price: 'Price',
      addToCart: 'Add to cart',
      addedToCart: 'Added to cart ✓',
      specifications: 'Print specifications',
      paperLabel: 'Paper',
      paper: 'Hahnemühle Photo Lustre 260 gsm glossy paper.',
      supportLabel: 'Support',
      support: 'Print mounted on a rigid 3 mm Dibond panel (aluminium composite).',
      certificate: 'Certificate of authenticity included with every print.',
      shipping: 'Free shipping.',
    },
    cart: {
      title: 'Cart',
      openCart: 'Open cart',
      empty: 'Your cart is empty.',
      emptyHint: 'Add a print from the gallery to start your order.',
      quantity: 'Quantity',
      remove: 'Remove',
      total: 'Total',
      checkout: 'Checkout',
      backToCart: 'Back to cart',
      summary: 'Order summary',
      securePayment: 'Secure payment via PayPal — card payment accepted without a PayPal account.',
      processing: 'Processing payment…',
      cancelledNotice: 'Payment cancelled. Your cart has been kept.',
      errorGeneric: 'Something went wrong during payment. Please try again.',
      missingClientId: 'PayPal payment is not configured on this deployment.',
      retry: 'Try again',
      successTitle: 'Thank you for your order',
      successIntro: 'Your payment has been confirmed by PayPal.',
      orderNumber: 'PayPal order number',
      continueBrowsing: 'Continue browsing',
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

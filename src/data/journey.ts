import detectedAssets from 'virtual:gallery-assets'
import { catalogue, type PrintFormat } from './catalogue'

export type JourneyArtwork = {
  id: string
  src: string
  mobileSrc: string
  sourcePath: string
  filename: string
  title: string
  order: number
  alt: string
  type: 'image' | 'placeholder'
  location: string
  locationName: string
  width: number
  height: number
  dimensions: string
  orientation: 'portrait' | 'landscape' | 'square'
  year?: string
  descriptionFr?: string
  descriptionEn?: string
  formats: PrintFormat[]
  preorderStatus: 'coming-soon' | 'available'
}

export type JourneyLocation = {
  id: string
  slug: string
  label: string
  name: string
  icon: 'sydney-opera' | 'koala' | 'black-swan' | 'kangaroo' | 'boomerang'
  folder: string
  region: string
  coordinates: {
    lat: number
    lng: number
  }
  status: 'awaiting-images' | 'ready'
  description: string
  artworks: JourneyArtwork[]
}

type LocationDefinition = Omit<JourneyLocation, 'status' | 'artworks'>

const locationDefinitions: LocationDefinition[] = [
  {
    id: 'sydney',
    slug: 'sydney',
    label: '01',
    name: 'Sydney',
    icon: 'sydney-opera',
    folder: 'Assets/Sydney',
    region: 'New South Wales',
    coordinates: { lat: -33.8688, lng: 151.2093 },
    description: 'Première étape du parcours photographique australien.',
  },
  {
    id: 'melbourne',
    slug: 'melbourne',
    label: '02',
    name: 'Melbourne',
    icon: 'koala',
    folder: 'Assets/Melbourne',
    region: 'Victoria',
    coordinates: { lat: -37.8136, lng: 144.9631 },
    description: 'Deuxième étape du parcours photographique australien.',
  },
  {
    id: 'perth',
    slug: 'perth',
    label: '03',
    name: 'Perth',
    icon: 'black-swan',
    folder: 'Assets/Perth',
    region: 'Western Australia',
    coordinates: { lat: -31.9523, lng: 115.8613 },
    description: 'Troisième étape du parcours photographique australien.',
  },
  {
    id: 'adelaide',
    slug: 'adelaide',
    label: '04',
    name: 'Adelaide',
    icon: 'kangaroo',
    folder: 'Assets/Adelaide',
    region: 'South Australia',
    coordinates: { lat: -34.9285, lng: 138.6007 },
    description: 'Quatrième étape du parcours photographique australien.',
  },
  {
    id: 'kangaroo-island',
    slug: 'kangaroo-island',
    label: '05',
    name: 'Kangaroo Island',
    icon: 'kangaroo',
    folder: 'Assets/Kangaroo Island',
    region: 'South Australia',
    coordinates: { lat: -35.7752, lng: 137.2142 },
    description: 'Cinquième étape du parcours photographique australien.',
  },
  {
    id: 'uluru-kata-tjuta',
    slug: 'uluru-kata-tjuta',
    label: '06',
    name: 'Uluru–Kata Tjuta',
    icon: 'boomerang',
    folder: 'Assets/Uluru-Kata Tjuta',
    region: 'Northern Territory',
    coordinates: { lat: -25.3444, lng: 131.0369 },
    description: 'Dernière étape du parcours photographique australien.',
  },
]

const filenameFromPath = (path: string) => path.split('/').at(-1) ?? ''

export const missingCatalogueNumbers: number[] = []
export const catalogueArtworkCount = catalogue.length

const assetsByPath = new Map(detectedAssets.map((asset) => [asset.path, asset]))
const locationsById = new Map(locationDefinitions.map((location) => [location.id, location]))

const catalogueFiles = new Set<string>()
catalogue.forEach((entry, index) => {
  if (entry.number !== index + 1) throw new Error(`Ordre du catalogue invalide au n°${entry.number}.`)
  if (!entry.title) throw new Error(`Titre officiel manquant au n°${entry.number}.`)
  if (catalogueFiles.has(entry.file)) throw new Error(`Photographie HD dupliquée : ${entry.file}.`)
  catalogueFiles.add(entry.file)
})

export const catalogueArtworks: JourneyArtwork[] = catalogue.map<JourneyArtwork>((entry) => {
  const location = locationsById.get(entry.location)
  if (!location) throw new Error(`Lieu inconnu pour la photographie n°${entry.number}.`)
  const asset = assetsByPath.get(entry.file)
  if (!asset || asset.type !== 'image') throw new Error(`Photographie HD introuvable pour le n°${entry.number} : ${entry.file}.`)

  return {
    id: `catalogue-${String(entry.number).padStart(2, '0')}`,
    src: asset.src,
    mobileSrc: asset.mobileSrc,
    sourcePath: entry.file,
    filename: filenameFromPath(entry.file),
    title: entry.title,
    order: entry.number,
    alt: `${entry.title}, photographie de la série ${location.name} par Emmanuelle Doppia.`,
    type: 'image' as const,
    location: entry.location,
    locationName: location.name,
    width: asset.width,
    height: asset.height,
    dimensions: `${asset.width} × ${asset.height}`,
    orientation: asset.orientation,
    descriptionFr: entry.descriptionFr,
    descriptionEn: entry.descriptionEn,
    formats: entry.formats,
    preorderStatus: entry.preorderStatus,
  }
})

export const journeyLocations: JourneyLocation[] = locationDefinitions.map((location) => {
  const artworks = catalogueArtworks.filter((artwork) => artwork.location === location.id)
  return {
    ...location,
    status: artworks.length > 0 ? 'ready' : 'awaiting-images',
    artworks,
  }
})

export const exhibitionArtworkCount = journeyLocations.reduce((total, location) => total + location.artworks.length, 0)

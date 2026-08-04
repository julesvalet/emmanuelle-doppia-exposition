import detectedAssets from 'virtual:gallery-assets'

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
  width: number
  height: number
  dimensions: string
  orientation: 'portrait' | 'landscape' | 'square'
  year?: string
  description?: string
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

const titleFromFilename = (filename: string) => filename
  .replace(/\.[^.]+$/, '')

export type CatalogueCorrespondence = {
  pdfNumber: number
  sourcePath: string | null
  filename: string
  title: string
  location: string
}

const catalogueEntry = (pdfNumber: number, sourcePath: string | null, location: string): CatalogueCorrespondence => {
  if (sourcePath === null) return { pdfNumber, sourcePath, filename: '', title: '', location }
  const filename = filenameFromPath(sourcePath)
  return { pdfNumber, sourcePath, filename, title: titleFromFilename(filename), location }
}

// Source d'ordre unique : lecture visuelle, page par page, du catalogue officiel.
// Les chemins pointent exclusivement vers les originaux haute définition de Assets.
export const catalogueCorrespondence: CatalogueCorrespondence[] = [
  catalogueEntry(1, 'Uluru-Kata Tjuta/Uluru -8.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(2, 'Uluru-Kata Tjuta/Uluru - 9.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(3, 'Uluru-Kata Tjuta/Kata-Tjuta-2.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(4, 'Uluru-Kata Tjuta/Kata-Tjuta -1.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(5, 'Uluru-Kata Tjuta/Kata-Tjuta-3.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(6, 'Uluru-Kata Tjuta/Kata-Tjuta-4.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(7, 'Uluru-Kata Tjuta/Kata-Tjuta-5.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(8, 'Uluru-Kata Tjuta/Kata-Tjuta-8.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(9, 'Uluru-Kata Tjuta/Kata-Tjuta-7.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(10, 'Uluru-Kata Tjuta/Kata-Tjuta-6.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(11, 'Uluru-Kata Tjuta/Uluru -7.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(12, 'Uluru-Kata Tjuta/Kata-Tjuta-9.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(13, 'Uluru-Kata Tjuta/Kata-Tjuta-10.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(14, 'Uluru-Kata Tjuta/Uluru-5.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(15, 'Uluru-Kata Tjuta/Uluru- 2.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(16, 'Melbourne/Melbourne -1.JPG', 'melbourne'),
  catalogueEntry(17, 'Melbourne/Melbourne -2.JPG', 'melbourne'),
  catalogueEntry(18, 'Perth/Perth- 10.JPG', 'perth'),
  catalogueEntry(19, 'Uluru-Kata Tjuta/Kata-Tjuta-12.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(20, 'Uluru-Kata Tjuta/Kata-Tjuta-11.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(21, 'Uluru-Kata Tjuta/Uluru-3.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(22, 'Uluru-Kata Tjuta/Uluru-10.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(23, 'Uluru-Kata Tjuta/Uluru -1.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(24, 'Uluru-Kata Tjuta/Uluru -6.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(25, 'Uluru-Kata Tjuta/Uluru- 4.jpg', 'uluru-kata-tjuta'),
  catalogueEntry(26, 'Perth/Perth -1.JPG', 'perth'),
  catalogueEntry(27, 'Perth/Perth -3.JPG', 'perth'),
  catalogueEntry(28, 'Perth/Perth -2.JPG', 'perth'),
  catalogueEntry(29, 'Perth/Perth -5.JPG', 'perth'),
  catalogueEntry(30, 'Perth/Perth-6.JPG', 'perth'),
  catalogueEntry(31, 'Perth/Perth -4.JPG', 'perth'),
  catalogueEntry(32, 'Perth/Perth -7.JPG', 'perth'),
  catalogueEntry(33, 'Perth/Perth -9.JPG', 'perth'),
  catalogueEntry(34, 'Perth/Perth -8.JPG', 'perth'),
  catalogueEntry(35, 'Adelaide/Adelaïde -1.jpg', 'adelaide'),
  catalogueEntry(36, 'Adelaide/Adelaîde -2.jpg', 'adelaide'),
  catalogueEntry(37, 'Adelaide/Adelaïde -3.jpg', 'adelaide'),
  catalogueEntry(38, 'Adelaide/Adelaïde -4.jpg', 'adelaide'),
  catalogueEntry(39, 'Adelaide/Adelaïde-5.jpg', 'adelaide'),
  catalogueEntry(40, 'Adelaide/Adelaïde -6.jpg', 'adelaide'),
  catalogueEntry(41, 'Kangaroo Island/Kangaroo Island -1.jpg', 'kangaroo-island'),
  catalogueEntry(42, 'Kangaroo Island/Kangaroo Island-4.jpg', 'kangaroo-island'),
  catalogueEntry(43, 'Kangaroo Island/Kangaroo Island-6.jpg', 'kangaroo-island'),
  catalogueEntry(44, 'Kangaroo Island/Kangaroo Island-2.jpg', 'kangaroo-island'),
  catalogueEntry(45, 'Kangaroo Island/Kangaroo Island-5.jpg', 'kangaroo-island'),
  catalogueEntry(46, 'Kangaroo Island/Kangaroo Island-3.jpg', 'kangaroo-island'),
  catalogueEntry(47, 'Sydney/Sydney - 2.JPG', 'sydney'),
  catalogueEntry(48, 'Sydney/Sydney -3.JPG', 'sydney'),
  catalogueEntry(49, 'Sydney/Sydney -4.JPG', 'sydney'),
  catalogueEntry(50, 'Sydney/Sydney -5.JPG', 'sydney'),
  catalogueEntry(51, 'Sydney/Sydney -1.JPG', 'sydney'),
]

export const missingCatalogueNumbers = catalogueCorrespondence
  .filter((entry) => entry.sourcePath === null)
  .map((entry) => entry.pdfNumber)
export const catalogueArtworkCount = 51

const assetsByPath = new Map(detectedAssets.map((asset) => [asset.path, asset]))
const locationsById = new Map(locationDefinitions.map((location) => [location.id, location]))

export const catalogueArtworks: JourneyArtwork[] = catalogueCorrespondence.flatMap<JourneyArtwork>((entry) => {
  const location = locationsById.get(entry.location)
  if (!location) return []
  if (entry.sourcePath === null) {
    return [{
      id: `catalogue-${String(entry.pdfNumber).padStart(2, '0')}`,
      src: '',
      mobileSrc: '',
      sourcePath: '',
      filename: '',
      title: '',
      order: entry.pdfNumber,
      alt: `Photographie ${entry.pdfNumber} : original haute définition manquant.`,
      type: 'placeholder' as const,
      location: entry.location,
      width: 0,
      height: 0,
      dimensions: '',
      orientation: 'landscape' as const,
    }]
  }

  const asset = assetsByPath.get(entry.sourcePath)
  if (!asset || asset.type !== 'image') return []

  return [{
    id: `catalogue-${String(entry.pdfNumber).padStart(2, '0')}`,
    src: asset.src,
    mobileSrc: asset.mobileSrc,
    sourcePath: entry.sourcePath,
    filename: entry.filename,
    title: entry.title,
    order: entry.pdfNumber,
    alt: `${entry.title}, photographie de la série ${location.name} par Emmanuelle Doppia.`,
    type: 'image' as const,
    location: entry.location,
    width: asset.width,
    height: asset.height,
    dimensions: `${asset.width} × ${asset.height}`,
    orientation: asset.orientation,
  }]
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

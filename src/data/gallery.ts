import { catalogueArtworks, type JourneyArtwork } from './journey'

export type GalleryItem = JourneyArtwork

// La galerie générale suit directement la table du catalogue PDF, sans tri ni
// regroupement supplémentaire. La carte réutilise les mêmes objets par lieu.
export const gallery: GalleryItem[] = catalogueArtworks

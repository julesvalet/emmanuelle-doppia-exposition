export type CatalogueLocationId =
  | 'sydney'
  | 'melbourne'
  | 'perth'
  | 'adelaide'
  | 'kangaroo-island'
  | 'uluru-kata-tjuta'

export type CatalogueEntry = {
  number: number
  file: string
  title: string
  location: CatalogueLocationId
}

// Source de vérité unique du site : ordre, correspondance HD et titres en gras
// du catalogue officiel. Les n°10, 20 et 43 appartiennent au même cartouche
// de titre que la photographie qui les précède dans le PDF.
export const catalogue: CatalogueEntry[] = [
  { number: 1, file: 'Uluru-Kata Tjuta/Uluru -8.jpg', title: 'Ayers Rock-Uluru View', location: 'uluru-kata-tjuta' },
  { number: 2, file: 'Uluru-Kata Tjuta/Uluru - 9.jpg', title: 'Ayers Rock-Uluru View', location: 'uluru-kata-tjuta' },
  { number: 3, file: 'Uluru-Kata Tjuta/Kata-Tjuta-2.jpg', title: 'Colors of a sunrise at Kata-Tjuta / Ayers Rock-Uluru View', location: 'uluru-kata-tjuta' },
  { number: 4, file: 'Uluru-Kata Tjuta/Kata-Tjuta -1.jpg', title: 'Outback path', location: 'uluru-kata-tjuta' },
  { number: 5, file: 'Uluru-Kata Tjuta/Kata-Tjuta-3.jpg', title: 'Sunrise at Kata-Tjuta / Ayers Rock-Uluru View', location: 'uluru-kata-tjuta' },
  { number: 6, file: 'Uluru-Kata Tjuta/Kata-Tjuta-4.jpg', title: 'Sunrise in the Australian Outback at Kata-Tjuta', location: 'uluru-kata-tjuta' },
  { number: 7, file: 'Uluru-Kata Tjuta/Kata-Tjuta-5.jpg', title: 'The Olga Mount (The Olgas) sacred site / Kata-Tjuta', location: 'uluru-kata-tjuta' },
  { number: 8, file: 'Uluru-Kata Tjuta/Kata-Tjuta-8.jpg', title: 'Walk through Kata-Tjuta Domes', location: 'uluru-kata-tjuta' },
  { number: 9, file: 'Uluru-Kata Tjuta/Kata-Tjuta-7.jpg', title: 'Mirror in Black & White / Walpa Gorge', location: 'uluru-kata-tjuta' },
  { number: 10, file: 'Uluru-Kata Tjuta/Kata-Tjuta-6.jpg', title: 'Mirror in Black & White / Walpa Gorge', location: 'uluru-kata-tjuta' },
  { number: 11, file: 'Uluru-Kata Tjuta/Uluru -7.jpg', title: 'Fountain', location: 'uluru-kata-tjuta' },
  { number: 12, file: 'Uluru-Kata Tjuta/Kata-Tjuta-9.jpg', title: 'Landscape Kata-Tjuta', location: 'uluru-kata-tjuta' },
  { number: 13, file: 'Uluru-Kata Tjuta/Kata-Tjuta-10.jpg', title: 'Birds', location: 'uluru-kata-tjuta' },
  { number: 14, file: 'Uluru-Kata Tjuta/Uluru-5.jpg', title: 'Ayers Rock or Aboriginal name Uluru “Oulourwou”aerial view', location: 'uluru-kata-tjuta' },
  { number: 15, file: 'Uluru-Kata Tjuta/Uluru- 2.jpg', title: 'Ayers Rock or Uluru', location: 'uluru-kata-tjuta' },
  { number: 16, file: 'Melbourne/Melbourne -1.JPG', title: 'Royal Botanic Garden', location: 'melbourne' },
  { number: 17, file: 'Melbourne/Melbourne -2.JPG', title: 'Ibis', location: 'melbourne' },
  { number: 18, file: 'Perth/Perth- 10.JPG', title: 'Street in Black and White', location: 'perth' },
  { number: 19, file: 'Uluru-Kata Tjuta/Kata-Tjuta-12.jpg', title: 'Ayers Rock or Uluru', location: 'uluru-kata-tjuta' },
  { number: 20, file: 'Uluru-Kata Tjuta/Kata-Tjuta-11.jpg', title: 'Ayers Rock or Uluru', location: 'uluru-kata-tjuta' },
  { number: 21, file: 'Uluru-Kata Tjuta/Uluru-3.jpg', title: 'Cave', location: 'uluru-kata-tjuta' },
  { number: 22, file: 'Uluru-Kata Tjuta/Uluru-10.jpg', title: 'Cave in Black & White', location: 'uluru-kata-tjuta' },
  { number: 23, file: 'Uluru-Kata Tjuta/Uluru -1.jpg', title: 'Birds', location: 'uluru-kata-tjuta' },
  { number: 24, file: 'Uluru-Kata Tjuta/Uluru -6.jpg', title: 'Ochre color of the earth and rock', location: 'uluru-kata-tjuta' },
  { number: 25, file: 'Uluru-Kata Tjuta/Uluru- 4.jpg', title: 'Ayers Rock or Uluru', location: 'uluru-kata-tjuta' },
  { number: 26, file: 'Perth/Perth -1.JPG', title: 'Sand Dunes', location: 'perth' },
  { number: 27, file: 'Perth/Perth -3.JPG', title: 'Beach after the rain', location: 'perth' },
  { number: 28, file: 'Perth/Perth -2.JPG', title: 'Red flowers', location: 'perth' },
  { number: 29, file: 'Perth/Perth -5.JPG', title: 'View of the Sand Dunes', location: 'perth' },
  { number: 30, file: 'Perth/Perth-6.JPG', title: 'Reflections', location: 'perth' },
  { number: 31, file: 'Perth/Perth -4.JPG', title: 'Beach', location: 'perth' },
  { number: 32, file: 'Perth/Perth -7.JPG', title: 'Pinnacles Desert in Nambung National Park', location: 'perth' },
  { number: 33, file: 'Perth/Perth -9.JPG', title: 'Rocks', location: 'perth' },
  { number: 34, file: 'Perth/Perth -8.JPG', title: 'Pinnacles Desert in Nambung National Park', location: 'perth' },
  { number: 35, file: 'Adelaide/Adelaïde -1.jpg', title: 'Paddle steamer', location: 'adelaide' },
  { number: 36, file: 'Adelaide/Adelaîde -2.jpg', title: 'Fishing Hut', location: 'adelaide' },
  { number: 37, file: 'Adelaide/Adelaïde -3.jpg', title: 'Aboriginal Flag', location: 'adelaide' },
  { number: 38, file: 'Adelaide/Adelaïde -4.jpg', title: 'Birds', location: 'adelaide' },
  { number: 39, file: 'Adelaide/Adelaïde-5.jpg', title: 'Pelicans', location: 'adelaide' },
  { number: 40, file: 'Adelaide/Adelaïde -6.jpg', title: 'Paddle Steamer wheel', location: 'adelaide' },
  { number: 41, file: 'Kangaroo Island/Kangaroo Island -1.jpg', title: 'Wallaby', location: 'kangaroo-island' },
  { number: 42, file: 'Kangaroo Island/Kangaroo Island-4.jpg', title: 'Shore of the island', location: 'kangaroo-island' },
  { number: 43, file: 'Kangaroo Island/Kangaroo Island-6.jpg', title: 'Shore of the island', location: 'kangaroo-island' },
  { number: 44, file: 'Kangaroo Island/Kangaroo Island-2.jpg', title: 'Sunset after the rain', location: 'kangaroo-island' },
  { number: 45, file: 'Kangaroo Island/Kangaroo Island-5.jpg', title: 'Cave in Black & White', location: 'kangaroo-island' },
  { number: 46, file: 'Kangaroo Island/Kangaroo Island-3.jpg', title: 'Beach in Black & White', location: 'kangaroo-island' },
  { number: 47, file: 'Sydney/Sydney - 2.JPG', title: 'Central Business District (CBD)', location: 'sydney' },
  { number: 48, file: 'Sydney/Sydney -3.JPG', title: 'Birds of paradise', location: 'sydney' },
  { number: 49, file: 'Sydney/Sydney -4.JPG', title: "Old black & white photography of the Opera taken on Sydney's walls", location: 'sydney' },
  { number: 50, file: 'Sydney/Sydney -5.JPG', title: 'The iconic Sydney Opera House', location: 'sydney' },
  { number: 51, file: 'Sydney/Sydney -1.JPG', title: 'Central Business District (CBD)', location: 'sydney' },
]

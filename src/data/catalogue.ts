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
  descriptionFr?: string
  descriptionEn?: string
}

// Source de vérité unique du site : ordre, correspondance HD et titres en gras
// du catalogue officiel. Les n°10, 20 et 43 appartiennent au même cartouche
// de titre que la photographie qui les précède dans le PDF.
export const catalogue: CatalogueEntry[] = [
  {
    number: 1, file: 'Uluru-Kata Tjuta/Uluru -8.jpg', title: 'Ayers Rock-Uluru View', location: 'uluru-kata-tjuta',
    descriptionEn: 'Ayers Rock-Uluru View / Red Center / Australian Outback\nNorthern Territory',
    descriptionFr: 'Vue de l’Ayers Rock-Uluru / Centre Rouge\nOutback Australien / Territoire du Nord)',
  },
  {
    number: 2, file: 'Uluru-Kata Tjuta/Uluru - 9.jpg', title: 'Ayers Rock-Uluru View', location: 'uluru-kata-tjuta',
    descriptionEn: 'Ayers Rock-Uluru View / Red Center / Australian Outback\nNorthern Territory / Black and White picture',
    descriptionFr: 'Vue de l’Ayers Rock-Uluru / Centre Rouge / Outback Australien\nTerritoire du Nord / Photo Noir et Blanc',
  },
  {
    number: 3, file: 'Uluru-Kata Tjuta/Kata-Tjuta-2.jpg', title: 'Colors of a sunrise at Kata-Tjuta / Ayers Rock-Uluru View', location: 'uluru-kata-tjuta',
    descriptionEn: 'Colors of a sunrise at Kata-Tjuta / Ayers Rock-Uluru View\nRed Center / Australian Outback / Northern Territory',
    descriptionFr: "Couleurs d'un lever de Soleil à Kata-Tjuta / Vue sur Ayers Rock-Uluru / Centre Rouge / Outback Australien / Territoire du Nord)",
  },
  {
    number: 4, file: 'Uluru-Kata Tjuta/Kata-Tjuta -1.jpg', title: 'Outback path', location: 'uluru-kata-tjuta',
    descriptionEn: 'Outback path / Red Center / Northern Territory',
    descriptionFr: "Chemin de l'Outback / Centre Rouge / Territoire du Nord",
  },
  {
    number: 5, file: 'Uluru-Kata Tjuta/Kata-Tjuta-3.jpg', title: 'Sunrise at Kata-Tjuta / Ayers Rock-Uluru View', location: 'uluru-kata-tjuta',
    descriptionEn: 'Sunrise at Kata-Tjuta / Ayers Rock-Uluru View / Red Center\nAustralian Outback / Northern Territory',
    descriptionFr: 'Lever de Soleil à Kata-Tjuta / Vue sur Ayers Rock-Uluru\nCentre Rouge / Outback Australien / Territoire du Nord',
  },
  {
    number: 6, file: 'Uluru-Kata Tjuta/Kata-Tjuta-4.jpg', title: 'Sunrise in the Australian Outback at Kata-Tjuta', location: 'uluru-kata-tjuta',
    descriptionEn: 'Sunrise in the Australian Outback at Kata-Tjuta\nRed Center / Northern Territory',
    descriptionFr: "Lever de soleil dans l'Outback Australien à Kata-Tjuta\nCentre Rouge / Territoire du Nord",
  },
  {
    number: 7, file: 'Uluru-Kata Tjuta/Kata-Tjuta-5.jpg', title: 'The Olga Mount (The Olgas) sacred site / Kata-Tjuta', location: 'uluru-kata-tjuta',
    descriptionEn: 'The Olga Mount (The Olgas) sacred site / Kata-Tjuta\nRed Center / Australian Outback / Northern Territory\nListed as a UNESCO World Heritage site',
    descriptionFr: 'Le Mont Olga (Les Olgas) site sacré / Kata-Tjuta\nCentre Rouge / Outback Australien /Territoire du Nord\nClassé au Patrimoine Mondial de l’UNESCO',
  },
  {
    number: 8, file: 'Uluru-Kata Tjuta/Kata-Tjuta-8.jpg', title: 'Walk through Kata-Tjuta Domes', location: 'uluru-kata-tjuta',
    descriptionEn: 'Walk through Kata-Tjuta Domes / Red Center\nOutback Australian / Northern Territory',
    descriptionFr: 'Ballade à travers les Dômes de Kata-Tjuta / Centre Rouge / Outback Australien / Territoire du Nord',
  },
  {
    number: 9, file: 'Uluru-Kata Tjuta/Kata-Tjuta-7.jpg', title: 'Mirror in Black & White / Walpa Gorge', location: 'uluru-kata-tjuta',
    descriptionEn: 'Mirror in Black & White / Walpa Gorge / Kata-Tjuta Domes / Red Center\nAustralian Outback / Northern Territory',
    descriptionFr: 'Miroir en Noir et Blanc / Gorges de Walpa / Dômes de Kata-Tjuta\nCentre Rouge / Outback Australien / Territoire du Nord',
  },
  { number: 10, file: 'Uluru-Kata Tjuta/Kata-Tjuta-6.jpg', title: 'Mirror in Black & White / Walpa Gorge', location: 'uluru-kata-tjuta' },
  {
    number: 11, file: 'Uluru-Kata Tjuta/Uluru -7.jpg', title: 'Fountain', location: 'uluru-kata-tjuta',
    descriptionEn: 'Fountain / Kata-Tjuta Domes / Red Center / Australian Outback / Northern Territory',
    descriptionFr: 'Fontaine / Dômes de Kata-Tjuta / Centre Rouge / Outback Australien / Territoire du Nord',
  },
  {
    number: 12, file: 'Uluru-Kata Tjuta/Kata-Tjuta-9.jpg', title: 'Landscape Kata-Tjuta', location: 'uluru-kata-tjuta',
    descriptionEn: 'Landscape Kata-Tjuta / Red Center / Australian Outback\nNorthern Territory',
    descriptionFr: 'Paysage Kata-Tjuta / Centre Rouge / Outback Australien\nTerritoire du Nord',
  },
  {
    number: 13, file: 'Uluru-Kata Tjuta/Kata-Tjuta-10.jpg', title: 'Birds', location: 'uluru-kata-tjuta',
    descriptionEn: 'Birds / Kata-Tjuta / Red Center / Australian Outback\nNorthern Territory',
    descriptionFr: 'Oiseaux / Kata-Tjuta / Centre Rouge / Outback Australien\nTerritoire du Nord',
  },
  {
    number: 14, file: 'Uluru-Kata Tjuta/Uluru-5.jpg', title: 'Ayers Rock or Aboriginal name Uluru “Oulourwou”aerial view', location: 'uluru-kata-tjuta',
    descriptionEn: 'Ayers Rock or Aboriginal name Uluru “Oulourwou”aerial view\nThis Sandstone rock, 500 million years old, rises 348 meters high and has a circumference of about 9 km.\nRed Center / Australian Outback / Northern Territory',
    descriptionFr: "Ayers Rock ou Nom Aborigène Uluru “Oulourwou” vue aérienne\nCe rocher de grès, âgé de 500 millions d'années, s'élève de 348 mètres de hauteur et a une circonférence d'environ 9 km.\nCentre Rouge / Outback Australien / Territoire du Nord",
  },
  {
    number: 15, file: 'Uluru-Kata Tjuta/Uluru- 2.jpg', title: 'Ayers Rock or Uluru', location: 'uluru-kata-tjuta',
    descriptionEn: "Ayers Rock, or Uluru, is an iconic monolith in Australia's Red Centre. This remarkable landscape is listed as a UNESCO World Heritage Site.",
    descriptionFr: "Ayers Rock, ou Uluru, est un monolithe emblématique du Centre Rouge australien. Ce paysage remarquable est inscrit au patrimoine mondial de l'UNESCO.",
  },
  {
    number: 16, file: 'Melbourne/Melbourne -1.JPG', title: 'Royal Botanic Garden', location: 'melbourne',
    descriptionEn: 'Royal Botanic Garden / Melbourne / Victoria',
    descriptionFr: 'Jardins botaniques Royaux / Melbourne / Victoria',
  },
  {
    number: 17, file: 'Melbourne/Melbourne -2.JPG', title: 'Ibis', location: 'melbourne',
    descriptionEn: 'Ibis / Melbourne / Victoria',
    descriptionFr: 'Ibis / Melbourne / Victoria',
  },
  {
    number: 18, file: 'Perth/Perth- 10.JPG', title: 'Street in Black and White', location: 'perth',
    descriptionEn: 'Street in Black and White / Yagan Square / Perth / Western Australia',
    descriptionFr: "Rue en Noir en Blanc / Yagan Square / Perth / Australie de l'Ouest",
  },
  {
    number: 19, file: 'Uluru-Kata Tjuta/Kata-Tjuta-12.jpg', title: 'Ayers Rock or Uluru', location: 'uluru-kata-tjuta',
    descriptionEn: 'Ayers Rock or Uluru / Red Center / Australian Outback / Northern Territory',
    descriptionFr: 'Ayers Rock or Uluru / Centre Rouge / Outback Australien / Territoire du Nord',
  },
  { number: 20, file: 'Uluru-Kata Tjuta/Kata-Tjuta-11.jpg', title: 'Ayers Rock or Uluru', location: 'uluru-kata-tjuta' },
  {
    number: 21, file: 'Uluru-Kata Tjuta/Uluru-3.jpg', title: 'Cave', location: 'uluru-kata-tjuta',
    descriptionEn: 'Cave / Uluru / Red Center / Australian Outback\nNorthern Territory',
    descriptionFr: 'Grotte / Uluru / Centre Rouge / Outback Australien\nTerritoire du Nord',
  },
  {
    number: 22, file: 'Uluru-Kata Tjuta/Uluru-10.jpg', title: 'Cave in Black & White', location: 'uluru-kata-tjuta',
    descriptionEn: 'Cave in Black & White / Uluru / Red Center / Australian Outback\nNorthern Territory',
    descriptionFr: 'Grotte en Noir et Blanc / Uluru / Centre Rouge / Outback Australien\nTerritoire du Nord',
  },
  {
    number: 23, file: 'Uluru-Kata Tjuta/Uluru -1.jpg', title: 'Birds', location: 'uluru-kata-tjuta',
    descriptionEn: 'Birds / Ayers Rock or Uluru / Red Center / Australian Outback / Northern Territory',
    descriptionFr: 'Oiseaux / Ayers Rock ou Uluru / Centre Rouge / Outback Australien / Territoire du Nord',
  },
  {
    number: 24, file: 'Uluru-Kata Tjuta/Uluru -6.jpg', title: 'Ochre color of the earth and rock', location: 'uluru-kata-tjuta',
    descriptionEn: 'Ochre color of the earth and rock / Ayers Rock or Uluru / Australien Outback / Northern Territory',
    descriptionFr: 'Couleur Ocre de la Terre et de la Roche / Ayers Rock ou Uluru / Red Center / Outback Australien / Territoire du Nord',
  },
  {
    number: 25, file: 'Uluru-Kata Tjuta/Uluru- 4.jpg', title: 'Ayers Rock or Uluru', location: 'uluru-kata-tjuta',
    descriptionEn: 'Ayers Rock or Uluru / Red Center / Australian Outback / Northern Territory',
    descriptionFr: 'Ayers Rock or Uluru / Centre Rouge / Outback Australien / Territoire du Nord',
  },
  {
    number: 26, file: 'Perth/Perth -1.JPG', title: 'Sand Dunes', location: 'perth',
    descriptionEn: 'Sand Dunes / Lancelin / Western Australia - Black & White photography',
    descriptionFr: "Dunes de sable / Lancelin / Australie de l'Ouest - Photographie Noir et Blanc",
  },
  {
    number: 27, file: 'Perth/Perth -3.JPG', title: 'Beach after the rain', location: 'perth',
    descriptionEn: 'Beach after the rain / Sand Dunes / Lancelin / Western Australia',
    descriptionFr: "Plage après la pluie / Dunes de sable / Lancelin / Australie de l'Ouest",
  },
  {
    number: 28, file: 'Perth/Perth -2.JPG', title: 'Red flowers', location: 'perth',
    descriptionEn: 'Red flowers / Sand Dunes / Lancelin / Western Australia',
    descriptionFr: "Fleurs rouges / Dunes de sable / Lancelin / Australie de l'Ouest",
  },
  {
    number: 29, file: 'Perth/Perth -5.JPG', title: 'View of the Sand Dunes', location: 'perth',
    descriptionEn: 'View of the Sand Dunes / Lancelin / Western Australia / Black & White photography',
    descriptionFr: "Vue des Dunes de sable / Lancelin / Australie de l'Ouest / Noir et Blanc photographie",
  },
  {
    number: 30, file: 'Perth/Perth-6.JPG', title: 'Reflections', location: 'perth',
    descriptionEn: 'Reflections / Sand Dunes / Lancelin / Western Australia / Black & White photography',
    descriptionFr: "Reflets / Dunes de sable / Lancelin / Australie de l'Ouest\nNoir et Blanc photographie",
  },
  {
    number: 31, file: 'Perth/Perth -4.JPG', title: 'Beach', location: 'perth',
    descriptionEn: 'Beach / Sand Dunes / Lancelin / Western Australia',
    descriptionFr: "Plage / Dunes de Sable / Lancelin / Australie de l'Ouest",
  },
  {
    number: 32, file: 'Perth/Perth -7.JPG', title: 'Pinnacles Desert in Nambung National Park', location: 'perth',
    descriptionEn: 'Pinnacles Desert in Nambung National Park / Perth / Western Australia',
    descriptionFr: "Désert des Pinnacles dans le parc national de Nambung\nPerth / Australie de l'Ouest",
  },
  {
    number: 33, file: 'Perth/Perth -9.JPG', title: 'Rocks', location: 'perth',
    descriptionEn: 'Rocks / Pinnacles Desert in Nambung National Park/ Perth / Western Australia',
    descriptionFr: "Rochers / Désert des Pinnacles dans le parc national de Nambung / Perth / Australie de l'Ouest",
  },
  {
    number: 34, file: 'Perth/Perth -8.JPG', title: 'Pinnacles Desert in Nambung National Park', location: 'perth',
    descriptionEn: 'Pinnacles Desert in Nambung National Park / Perth / Western Australia',
    descriptionFr: "Désert des Pinnacles dans le parc national de Nambung / Perth / Australie de l'Ouest",
  },
  {
    number: 35, file: 'Adelaide/Adelaïde -1.jpg', title: 'Paddle steamer', location: 'adelaide',
    descriptionEn: 'Paddle steamer / Murray River / Adelaïde / South Australia\nBlack & White photography',
    descriptionFr: 'Paddle Steamer / Rivière Murray / Adelaïde / Australie du Sud\nNoir et Blanc photographie',
  },
  {
    number: 36, file: 'Adelaide/Adelaîde -2.jpg', title: 'Fishing Hut', location: 'adelaide',
    descriptionEn: 'Fishing Hut / Murray River / Adelaïde / South Australia\nBlack & White photography',
    descriptionFr: 'Cabane de pêche / Rivière Murray / Adelaïde / Australie du Sud\nNoir et Blanc photographie',
  },
  {
    number: 37, file: 'Adelaide/Adelaïde -3.jpg', title: 'Aboriginal Flag', location: 'adelaide',
    descriptionEn: 'Aboriginal Flag / Murray River / Adelaïde / South Australia',
    descriptionFr: 'Drapeau Aborigène / Rivière Murray / Adelaïde / Australie du Sud',
  },
  {
    number: 38, file: 'Adelaide/Adelaïde -4.jpg', title: 'Birds', location: 'adelaide',
    descriptionEn: 'Birds / Murray River / Adelaïde / South Australia / Black & White photography',
    descriptionFr: 'Oiseaux / Rivière Murray / Adelaïde / Australie du Sud\nNoir et Blanc photographie',
  },
  {
    number: 39, file: 'Adelaide/Adelaïde-5.jpg', title: 'Pelicans', location: 'adelaide',
    descriptionEn: 'Pelicans / Murray River / Adelaïde / South Australia',
    descriptionFr: 'Pélicans / Rivère Murray / Adelaïde / Australie du Sud',
  },
  {
    number: 40, file: 'Adelaide/Adelaïde -6.jpg', title: 'Paddle Steamer wheel', location: 'adelaide',
    descriptionEn: 'Paddle Steamer wheel / Murray River / Adelaïde / South Australie\nBlack & White photography',
    descriptionFr: 'Roue du Paddle Steamer / Rivère Murray / Adelaïde / Australie du Sud\nNoir et Blanc photographie\n\nPhoto non exposée mais possibilité de commande',
  },
  {
    number: 41, file: 'Kangaroo Island/Kangaroo Island -1.jpg', title: 'Wallaby', location: 'kangaroo-island',
    descriptionEn: 'Wallaby / Kangaroo Island / South of South Australia',
    descriptionFr: "Walabi / Ile aux Kangourous / Sud de l'Australie Méridoniale",
  },
  {
    number: 42, file: 'Kangaroo Island/Kangaroo Island-4.jpg', title: 'Shore of the island', location: 'kangaroo-island',
    descriptionEn: 'Shore of the island / Kangaroo Island / Souht of South Australia',
    descriptionFr: "Rivage de l'île / Ile aux kangourous / Sud de l'Australie Méridoniale",
  },
  { number: 43, file: 'Kangaroo Island/Kangaroo Island-6.jpg', title: 'Shore of the island', location: 'kangaroo-island' },
  {
    number: 44, file: 'Kangaroo Island/Kangaroo Island-2.jpg', title: 'Sunset after the rain', location: 'kangaroo-island',
    descriptionEn: 'Sunset after the rain / Kangaroo Island / South of South Australia',
    descriptionFr: "Coucher de soleil après la pluie / Ile aux kangourous / Sud de l'Australie Mériodniale",
  },
  {
    number: 45, file: 'Kangaroo Island/Kangaroo Island-5.jpg', title: 'Cave in Black & White', location: 'kangaroo-island',
    descriptionEn: 'Cave in Black & White / Kangaroo Island / South of South Australia',
    descriptionFr: "Grotte en noir et blanc / Ile aux kangourous / Sud de l'Australie Méridoniale",
  },
  {
    number: 46, file: 'Kangaroo Island/Kangaroo Island-3.jpg', title: 'Beach in Black & White', location: 'kangaroo-island',
    descriptionEn: 'Beach in Black & White / Kangaroo Island / South of South Australia',
    descriptionFr: "Plage en noir et blanc / Ile aux kangourous / Sud de l'Australie Méridoniale",
  },
  {
    number: 47, file: 'Sydney/Sydney - 2.JPG', title: 'Central Business District (CBD)', location: 'sydney',
    descriptionEn: 'Central Business District (CBD) / Sydney / New South Wales\nAustralia / Black & White photography',
    descriptionFr: 'Quartier Central des Affaires / Sydney / Nouvelle Galles du Sud\nAustralie / photographie noir et blanc',
  },
  {
    number: 48, file: 'Sydney/Sydney -3.JPG', title: 'Birds of paradise', location: 'sydney',
    descriptionEn: 'Birds of paradise / Sydney / New South Walles / Australia',
    descriptionFr: 'Oiseaux de paradis / Sydney / Nouvelle Galles du Sud / Australie',
  },
  {
    number: 49, file: 'Sydney/Sydney -4.JPG', title: "Old black & white photography of the Opera taken on Sydney's walls", location: 'sydney',
    descriptionEn: "Old black & white photography of the Opera taken on Sydney's walls\nSydney / New South Walles / Australia",
    descriptionFr: 'Vieille photographie en noir et blanc prise sur les murs de Sydney\nNouvelle Galles du Sud / Australie',
  },
  {
    number: 50, file: 'Sydney/Sydney -5.JPG', title: 'The iconic Sydney Opera House', location: 'sydney',
    descriptionEn: 'The iconic Sydney Opera House / Bennelong Point\nSydney / New South Walles / Australia',
    descriptionFr: "L'emblématique Opéra de Sydney / Bennelong Point\nSydney / Nouvelle Galles du Sud / Australie",
  },
  {
    number: 51, file: 'Sydney/Sydney -1.JPG', title: 'Central Business District (CBD)', location: 'sydney',
    descriptionEn: 'Central Business District (CBD) / Sydney / New South Wales / Australia',
    descriptionFr: 'Quartier Central des Affaires / Sydney / Nouvelle Galles du Sud / Australie',
  },
]

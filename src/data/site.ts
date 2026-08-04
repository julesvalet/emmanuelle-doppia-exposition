export const site = {
  artist: 'Emmanuelle Doppia',
  discipline: 'Photographie',
  exhibition: 'Exposition photographique',
  location: 'France',
  year: new Date().getFullYear(),
  navigation: [
    { label: 'Ouverture', href: '#ouverture' },
    { label: 'Voyage', href: '#voyage' },
    { label: 'Exposition', href: '#exposition' },
    { label: 'Démarche', href: '#demarche' },
    { label: 'Contact', href: '#contact' },
  ],
} as const

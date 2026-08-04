# De l’Opéra à l’Ocre

Expérience photographique immersive conçue pour l’exposition d’Emmanuelle Doppia.

## Développement

```bash
npm install
npm run dev
```

La version de production se génère avec `npm run build`.

## Photographies

La correspondance officielle entre les numéros du catalogue et les fichiers est centralisée dans `src/data/journey.ts`. La galerie suit cette table sans tri automatique.

Les originaux haute définition restent localement dans `Assets/` et ne sont pas publiés dans le dépôt. Les versions web optimisées sont enregistrées dans :

- `public/media/` pour les écrans desktop ;
- `public/media-mobile/` pour les téléphones.

Les composants utilisent automatiquement la variante mobile sous 760 px.

## Déploiement

GitHub Actions construit et publie automatiquement le site sur GitHub Pages après chaque mise à jour de la branche `main`.

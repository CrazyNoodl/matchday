const resizeLab = {
  title: 'Labo redimensionnement',
  presets: {
    regularMedia: 'Média standard',
    ocrPayload: 'Charge OCR',
    statPhotoStorage: 'Stockage photo de stats',
    teamLogo: "Logo d'équipe",
  },
  pickAnotherPhoto: 'Choisir une autre photo',
  pickPhoto: 'Choisir une photo',
  emptyHint:
    'Choisissez une vraie photo de votre bibliothèque pour voir exactement ce que produit chaque préréglage de redimensionnement sur cet appareil — dimensions, taille du fichier et toute erreur éventuelle.',
  original: 'Original',
  resizing: 'Redimensionnement...',
  failed: 'Échec : {{error}}',
} as const;

export default resizeLab;

const ocrLab = {
  title: 'Labo OCR',
  scanFailedFallback: 'Échec du scan',
  addPhotos: 'Ajouter des photos',
  addMore: 'Ajouter plus',
  photosSelected: '{{count}} photo sélectionnée · appuyez sur × pour retirer',
  photosSelectedPlural: '{{count}} photos sélectionnées · appuyez sur × pour retirer',
  scanning: 'Analyse...',
  scanWithCount: "Analyser {{count}} photos avec l'IA",
  scanGeneric: "Analyser avec l'IA",
  scanFailedTitle: 'Échec du scan',
  extractedStats: 'Statistiques extraites',
  found: '{{count}} trouvées',
  uncertain: '{{count}} incertaines',
  legendOrange: 'Orange — incertain, à vérifier manuellement',
  legendYellow: "Jaune — légèrement flou sur l'image",
  maxPhotos: 'Maximum 4 photos',
  removeOneFirst: "Retirez-en une d'abord.",
} as const;

export default ocrLab;

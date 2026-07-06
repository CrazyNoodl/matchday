const matchDetail = {
  title: 'Détail du match',
  homeWin: 'Victoire dom.',
  awayWin: 'Victoire ext.',
  draw: 'Match nul',
  noData: 'Données du match introuvables.',
  commentary: 'Commentaire',
  wonBy: '{{name}} a gagné',
  swapSides: '⇄ inverser les côtés',
  statsSection: 'Statistiques du match',
  aiRead: 'Lu par IA',
  commentaryPrompt: 'Ajouter un commentaire...',
  noCommentary: 'Aucun commentaire',
  editScore: {
    title: 'Modifier le score',
    subtitle: 'Corriger le résultat',
  },
  editStats: {
    title: 'Modifier les stats',
    subtitle: 'Corriger les valeurs lues par l\'IA',
  },
  editNote: {
    subtitle: 'Ajouter des notes sur le match',
    placeholder: 'Écrivez quelque chose sur ce match...',
  },
  statsMenu: {
    rescan: 'Réanalyser',
    clear: 'Effacer',
  },
  clearStats: {
    title: 'Effacer les stats',
    desc: 'Supprimer toutes les statistiques du match ?',
    confirm: 'Effacer',
  },
  swapSidesDialog: {
    title: 'Inverser les côtés',
    desc: 'Inverser qui a joué à domicile et à l\'extérieur ? Les stats seront inversées.',
    confirm: 'Inverser',
  },
  importStats: {
    preparing: 'Préparation...',
    uploading: 'Envoi...',
    scanning: 'Analyse...',
    cta: '📊 Importer les stats',
  },
  media: {
    sectionTitle: 'Média',
    tapToAdd: 'Appuyer pour ajouter un média',
    empty: 'Aucun média ajouté',
    retryUpload: 'Appuyer pour réessayer',
  },
  ocr: {
    failed: 'Impossible de lire les stats',
    failedDesc: 'Veuillez réessayer avec une image plus nette.',
    invalidPhoto: 'Mauvaise photo ?',
    invalidPhotoDesc: 'Cela ne ressemble pas à un écran de statistiques — importez une nouvelle photo ou reprenez-en une plus nette.',
  },
} as const;

export default matchDetail;

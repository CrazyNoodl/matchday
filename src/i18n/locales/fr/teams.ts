const teams = {
  title: 'Équipes',
  noResults: "Aucune équipe pour l'instant. Créez une équipe pour assigner des joueurs.",
  noResultsAction: 'Ajouter une équipe',
  editTitle: "Modifier l'équipe",
  newTitle: 'Nouvelle équipe',
  addBtn: "Ajouter l'équipe",
  uploading: 'Envoi...',
  deleteConfirm: "Supprimer l'équipe ?",
  deleteDesc: 'Cette équipe sera supprimée.',
  cannotDelete: 'Impossible de supprimer — équipe utilisée.',
  form: {
    name: "Nom de l'équipe",
    namePlaceholder: 'ex. Manchester City',
    shortCode: 'Code court (3 lettres)',
    shortCodePlaceholder: 'ex. MCI',
    logo: 'Logo (optionnel)',
  },
} as const;

export default teams;

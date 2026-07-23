const players = {
  title: 'Joueurs',
  noResults: "Aucun joueur pour l'instant. Ajoutez votre premier joueur pour commencer.",
  noResultsAction: 'Ajouter un joueur',
  editTitle: 'Modifier le joueur',
  deleteConfirm: 'Supprimer le joueur ?',
  deleteDesc: 'Ce joueur sera supprimé.',
  cannotDelete: 'Impossible de supprimer — le joueur a des matchs actifs.',
  duplicateName: 'Un joueur avec ce nom existe déjà.',
  teamRequired: "Aucune équipe pour l'instant — créez-en une pour assigner ce joueur.",
} as const;

export default players;

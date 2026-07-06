const setup = {
  title: 'Créer un tournoi',
  subtitle: 'FC / FIFA · configuration',
  tournamentNameLabel: 'Nom du tournoi',
  tournamentNamePlaceholder: 'ex. FC26 · Tour 10',
  roundsLabel: 'Tours cibles',
  roundsDesc: 'Nombre de tours classés à jouer (0 = illimité)',
  roundsUnlimited: '∞',
  playersLabel: 'Joueurs & équipes · {{count}} sélectionnés',
  addPlayer: 'Ajouter un joueur',
  manageTeams: 'Gérer les équipes',
  startTournament: 'Démarrer le tournoi',
  newPlayer: 'Nouveau joueur',
  form: {
    name: 'Nom',
    nickname: 'Pseudo (optionnel)',
    defaultTeam: 'Équipe par défaut',
    color: 'Couleur',
    playerNamePlaceholder: 'Nom du joueur',
    nicknamePlaceholder: 'ex. Fox',
  },
  addPlayerBtn: 'Ajouter le joueur',
  teamFor: 'Équipe pour {{name}}',
  manageTeamsTitle: 'Gérer les équipes',
  teamNamePlaceholder: 'Nom de l\'équipe',
} as const;

export default setup;

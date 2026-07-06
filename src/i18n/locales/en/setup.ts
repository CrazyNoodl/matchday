const setup = {
  title: 'Create tournament',
  subtitle: 'FC / FIFA · set it up',
  tournamentNameLabel: 'Tournament name',
  tournamentNamePlaceholder: 'e.g. FC26 · Round 10',
  roundsLabel: 'Target rounds',
  roundsDesc: 'Number of ranked rounds to play (0 = unlimited)',
  roundsUnlimited: '∞',
  playersLabel: 'Players & teams · {{count}} selected',
  addPlayer: 'Add Player',
  manageTeams: 'Manage Teams',
  startTournament: 'Start tournament',
  newPlayer: 'New player',
  form: {
    name: 'Name',
    nickname: 'Nickname (optional)',
    defaultTeam: 'Default team',
    color: 'Color',
    playerNamePlaceholder: 'Player name',
    nicknamePlaceholder: 'e.g. Fox',
  },
  addPlayerBtn: 'Add player',
  teamFor: 'TEAM FOR {{name}}',
  manageTeamsTitle: 'Manage teams',
  teamNamePlaceholder: 'Team name',
} as const;

export default setup;

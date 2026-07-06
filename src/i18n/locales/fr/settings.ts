const settings = {
  title: 'Paramètres',
  account: {
    section: 'Compte',
    signedIn: 'Connecté',
    signOut: 'Se déconnecter',
    signOutDesc: 'Vous serez déconnecté sur cet appareil.',
  },
  developer: {
    section: 'Développeur',
    devModeOn: '🛠  Mode développeur activé',
    tapsToUnlock: 'Encore {{count}} appuis pour débloquer le menu développeur',
    menuLabel: 'Menu développeur',
    menuSub: 'Outils d\'import et options internes',
  },
  tournament: {
    section: 'Tournoi',
    label: 'Tournois',
    noActive: 'Aucun tournoi actif',
  },
  data: {
    section: 'Données',
    players: 'Joueurs',
    playersCount: '{{count}} joueurs',
    teams: 'Équipes',
    teamsCount: '{{count}} équipes',
    backup: 'Sauvegarde et restauration',
    backupSub: 'Exporter ou importer un instantané local de vos données',
  },
  display: {
    section: 'Affichage',
    theme: 'Thème',
    themeDark: 'Sombre',
    themeLight: 'Clair',
    themeAuto: 'Auto',
    showNicknames: 'Afficher les pseudos',
    showNicknamesDesc: 'Afficher les pseudos à la place des noms complets',
    showTeamLogos: 'Afficher les logos',
    showTeamLogosDesc: 'Afficher les écussons des équipes sur les cartes de match',
  },
  language: {
    section: 'Langue',
    label: 'Langue',
  },
  about: {
    section: 'À propos',
    appName: 'Matchday',
    version: 'Version {{version}}',
  },
  changelog: {
    title: 'Nouveautés',
    added: 'Ajouté',
    changed: 'Modifié',
    fixed: 'Corrigé',
    internal: 'Interne',
    empty: 'Aucune entrée pour le moment.',
  },
  danger: {
    section: 'Zone dangereuse',
    resetAll: 'Réinitialiser les données',
    resetTitle: 'Réinitialiser les données ?',
    resetDesc: 'Cela supprimera définitivement tous les tournois, matchs, tours et réinitialisera les joueurs et équipes par défaut.',
    cancel: 'Annuler',
    reset: 'Réinitialiser',
  },
} as const;

export default settings;

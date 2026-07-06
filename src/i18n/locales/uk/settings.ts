const settings = {
  title: 'Налаштування',
  account: {
    section: 'Акаунт',
    signedIn: 'Ви увійшли',
    signOut: 'Вийти',
    signOutDesc: 'Ви вийдете з акаунту на цьому пристрої.',
  },
  developer: {
    section: 'Розробник',
    devModeOn: '🛠  Режим розробника увімкнено',
    tapsToUnlock: 'Ще {{count}} натискань до розблокування меню розробника',
    menuLabel: 'Меню розробника',
    menuSub: 'Інструменти імпорту та внутрішні опції',
  },
  tournament: {
    section: 'Турнір',
    label: 'Турніри',
    noActive: 'Немає активного турніру',
  },
  data: {
    section: 'Дані',
    players: 'Гравці',
    playersCount: '{{count}} гравців',
    teams: 'Команди',
    teamsCount: '{{count}} команд',
    backup: 'Бекап і відновлення',
    backupSub: 'Експорт або імпорт локального знімку ваших даних',
  },
  display: {
    section: 'Відображення',
    theme: 'Тема',
    themeDark: 'Темна',
    themeLight: 'Світла',
    themeAuto: 'Авто',
    showNicknames: 'Показувати нікнейми',
    showNicknamesDesc: 'Відображати нікнейми замість повних імен',
    showTeamLogos: 'Показувати логотипи команд',
    showTeamLogosDesc: 'Відображати емблеми команд на картках матчів',
  },
  language: {
    section: 'Мова',
    label: 'Мова',
  },
  about: {
    section: 'Про додаток',
    appName: 'Matchday',
    version: 'Версія {{version}}',
  },
  changelog: {
    title: 'Що нового',
    added: 'Додано',
    fixed: 'Виправлено',
    notes: 'Примітки',
    empty: 'Записів поки немає.',
  },
  danger: {
    section: 'Небезпечна зона',
    resetAll: 'Скинути всі дані',
    resetTitle: 'Скинути всі дані?',
    resetDesc: 'Це назавжди видалить усі турніри, матчі, раунди та поверне стандартних гравців і команди.',
    cancel: 'Скасувати',
    reset: 'Скинути',
  },
} as const;

export default settings;

const settings = {
  title: 'Налаштування',
  account: {
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
  play: {
    section: 'Гра',
  },
  personalize: {
    section: 'Персоналізація',
  },
  more: {
    section: 'Ще',
  },
  tournament: {
    label: 'Турніри',
    noActive: 'Немає активного турніру',
  },
  data: {
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
    nicknamesOn: 'Нікнейми увімкнено',
    nicknamesOff: 'Нікнейми вимкнено',
    upcoming: 'Скоро',
    inDevelopment: 'У розробці',
  },
  language: {
    section: 'Мова',
    label: 'Мова',
  },
  about: {
    appName: 'Matchday',
    version: 'Версія {{version}}',
  },
  changelog: {
    title: 'Що нового',
    added: 'Додано',
    changed: 'Змінено',
    fixed: 'Виправлено',
    internal: 'Внутрішнє',
    empty: 'Записів поки немає.',
  },
  danger: {
    resetAll: 'Скинути всі дані',
    resetTitle: 'Скинути всі дані?',
    resetDesc: 'Це назавжди видалить усі турніри, матчі, раунди та поверне стандартних гравців і команди.',
    cancel: 'Скасувати',
    reset: 'Скинути',
  },
} as const;

export default settings;

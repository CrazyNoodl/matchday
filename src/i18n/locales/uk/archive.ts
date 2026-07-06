const archive = {
  title: 'Архів',
  season: 'Сезон {{year1}} / {{year2}} · {{count}} ігрових днів',
  roundMatches: '{{count}} матчів',
  noRoundData: 'Дані раунду відсутні.',
  dayWinner: 'Переможець дня',
  matchCount: '{{count}} матчів',
  draw: 'Нічия',
  noArchive: 'Немає завершених турнірів',
  noArchiveDesc: 'Завершені турніри зберігатимуться тут',
  live: 'Живий',
  allMatches: 'Усі матчі · натисніть для статистики',
  noMatchesRecorded: 'Матчів не записано.',
  editDate: {
    title: 'Редагувати дату раунду',
    placeholder: 'ДД/ММ/РРРР',
    invalid: 'Введіть коректну дату',
    cancel: 'Скасувати',
    save: 'Зберегти',
  },
  deleteRoundTitle: 'Видалити раунд?',
  deleteRoundDesc: 'Всі матчі цього раунду будуть назавжди видалені.',
  deleteRoundConfirm: 'Видалити раунд',
  championDaysWon: 'чемпіон · виграно {{count}} дн.',
} as const;

export default archive;

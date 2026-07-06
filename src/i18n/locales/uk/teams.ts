const teams = {
  title: 'Команди',
  noResults: 'Поки немає команд. Створи команду для призначення гравців.',
  noResultsAction: 'Додати команду',
  editTitle: 'Редагувати команду',
  newTitle: 'Нова команда',
  addBtn: 'Додати команду',
  uploading: 'Завантаження...',
  deleteConfirm: 'Видалити команду?',
  deleteDesc: 'Цю команду буде видалено.',
  cannotDelete: 'Неможливо видалити — команда використовується.',
  form: {
    name: 'Назва команди',
    namePlaceholder: 'напр. Manchester City',
    shortCode: 'Короткий код (3 літери)',
    shortCodePlaceholder: 'напр. MCI',
    logo: 'Логотип (необов\'язково)',
  },
} as const;

export default teams;

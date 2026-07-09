const matchDetail = {
  title: 'Деталі матчу',
  homeWin: 'Перемога господарів',
  awayWin: 'Перемога гостей',
  draw: 'Нічия',
  noData: 'Дані матчу не знайдено.',
  commentary: 'Коментар',
  wonBy: '{{name}} переміг',
  swapSides: '⇄ поміняти сторони',
  statsSection: 'Статистика матчу',
  aiRead: 'Зчитано ШІ',
  commentaryPrompt: 'Додати коментар...',
  noCommentary: 'Немає коментаря',
  editScore: {
    title: 'Редагувати рахунок',
    subtitle: 'Виправити результат',
  },
  editStats: {
    title: 'Редагувати статистику',
    subtitle: 'Виправити значення, зчитані ШІ',
    confirmValue: 'Підтвердити правильне значення',
  },
  editNote: {
    subtitle: 'Додати нотатки до матчу',
    placeholder: 'Напиши щось про цей матч...',
  },
  statsMenu: {
    rescan: 'Пересканувати',
    clear: 'Очистити',
  },
  clearStats: {
    title: 'Очистити статистику',
    desc: 'Видалити всю статистику матчу?',
    confirm: 'Очистити',
  },
  swapSidesDialog: {
    title: 'Поміняти сторони',
    desc: 'Поміняти місцями, хто грав вдома, а хто в гостях? Статистику буде віддзеркалено.',
    confirm: 'Поміняти',
  },
  importStats: {
    preparing: 'Підготовка...',
    uploading: 'Завантаження...',
    scanning: 'Сканування...',
    cta: '📊 Імпортувати статистику',
  },
  media: {
    sectionTitle: 'Медіа',
    tapToAdd: 'Натисніть, щоб додати медіа',
    empty: 'Немає доданих медіа',
    retryUpload: 'Натисни, щоб повторити',
  },
  ocr: {
    failed: 'Не вдалося прочитати статистику',
    failedDesc: 'Спробуй ще раз із чіткішим зображенням.',
    invalidPhoto: 'Не те фото?',
    invalidPhotoDesc:
      'Це не схоже на екран статистики — завантаж нове фото або перефотографуй чіткіше.',
  },
} as const;

export default matchDetail;

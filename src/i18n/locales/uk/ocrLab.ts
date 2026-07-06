const ocrLab = {
  title: 'OCR-лабораторія',
  scanFailedFallback: 'Скан не вдався',
  addPhotos: 'Додати фото',
  addMore: 'Додати ще',
  photosSelected: 'Обрано {{count}} фото · натисніть ×, щоб видалити',
  photosSelectedPlural: 'Обрано {{count}} фото · натисніть ×, щоб видалити',
  scanning: 'Сканування...',
  scanWithCount: 'Сканувати {{count}} фото за допомогою AI',
  scanGeneric: 'Сканувати за допомогою AI',
  scanFailedTitle: 'Скан не вдався',
  extractedStats: 'Розпізнана статистика',
  found: 'Знайдено {{count}}',
  uncertain: '{{count}} невпевнено',
  legendOrange: 'Помаранчевий — невпевнено, перевірте вручну',
  legendYellow: 'Жовтий — трохи нечітко на зображенні',
  maxPhotos: 'Максимум 4 фото',
  removeOneFirst: 'Спочатку видаліть одне.',
} as const;

export default ocrLab;

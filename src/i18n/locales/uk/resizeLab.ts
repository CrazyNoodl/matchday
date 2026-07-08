const resizeLab = {
  title: 'Лабораторія зменшення',
  presets: {
    regularMedia: 'Звичайне медіа',
    ocrPayload: 'OCR-навантаження',
    statPhotoStorage: 'Зберігання фото статистики',
    teamLogo: 'Логотип команди',
  },
  pickAnotherPhoto: 'Обрати інше фото',
  pickPhoto: 'Обрати фото',
  emptyHint:
    'Обери реальне фото зі своєї бібліотеки, щоб побачити, що саме кожен пресет стиснення робить на цьому пристрої — розміри, розмір файлу та будь-яку помилку стиснення.',
  original: 'Оригінал',
  resizing: 'Стиснення...',
  failed: 'Помилка: {{error}}',
} as const;

export default resizeLab;

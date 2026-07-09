const developer = {
  title: 'Меню розробника',
  internalBadge: '⚙️  Внутрішнє',
  dataImport: {
    section: 'Імпорт даних',
    importRound: 'Імпорт раунду',
    importRoundSub: 'Вставте CSV або дані з Google Таблиць',
  },
  aiExperiments: {
    section: 'AI-експерименти',
    ocrLab: 'OCR-лабораторія',
    ocrLabSub: 'Витягти статистику матчу зі скріншота через Claude Vision',
  },
  imagePipeline: {
    section: 'Обробка зображень',
    resizeLab: 'Лабораторія зменшення',
    resizeLabSub: 'Порівняння розміру до/після для кожного пресету стиснення (#62)',
  },
  errorTracking: {
    section: 'Логування помилок',
    sendTestError: 'Надіслати тестову помилку',
    sendTestErrorSub: 'Кидає тестову помилку, щоб перевірити підключення Sentry',
  },
  analytics: {
    section: 'Аналітика',
    sendTestEvent: 'Надіслати тестову подію',
    sendTestEventSub: 'Надсилає тестову подію, щоб перевірити підключення Aptabase',
  },
} as const;

export default developer;

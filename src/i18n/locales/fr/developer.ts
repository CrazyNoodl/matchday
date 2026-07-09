const developer = {
  title: 'Menu développeur',
  internalBadge: '⚙️  Interne',
  dataImport: {
    section: 'Import de données',
    importRound: 'Importer un tour',
    importRoundSub: 'Coller du CSV ou des données Google Sheets',
  },
  aiExperiments: {
    section: 'Expériences IA',
    ocrLab: 'Labo OCR',
    ocrLabSub: 'Extraire les stats du match depuis une capture avec Claude Vision',
  },
  imagePipeline: {
    section: "Traitement d'image",
    resizeLab: 'Labo redimensionnement',
    resizeLabSub: 'Comparer la taille avant/après pour chaque préréglage de compression (#62)',
  },
  errorTracking: {
    section: 'Suivi des erreurs',
    sendTestError: 'Envoyer une erreur test',
    sendTestErrorSub: 'Déclenche une erreur test pour vérifier que Sentry est bien connecté',
  },
  analytics: {
    section: 'Analytique',
    sendTestEvent: 'Envoyer un événement test',
    sendTestEventSub: 'Envoie un événement test pour vérifier qu’Aptabase est bien connecté',
  },
} as const;

export default developer;

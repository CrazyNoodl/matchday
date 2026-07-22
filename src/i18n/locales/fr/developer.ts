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
  experimental: {
    section: 'Fonctionnalités expérimentales',
    dragReorder: 'Glisser-déposer pour réordonner les matchs',
    dragReorderSub: 'Testeurs uniquement — réordonner les matchs d’un tour par glisser-déposer',
  },
  errorTracking: {
    section: 'Suivi des erreurs',
    sendTestError: 'Envoyer une erreur test',
    sendTestErrorSub: 'Déclenche une erreur test pour vérifier que Sentry est bien connecté',
    testErrorSentTitle: 'Erreur test envoyée',
    testErrorSentDesc: 'Vérifiez le tableau de bord Sentry pour confirmer la réception.',
  },
  analytics: {
    section: 'Analytique',
    sendTestEvent: 'Envoyer un événement test',
    sendTestEventSub: 'Envoie un événement test pour vérifier qu’Aptabase est bien connecté',
    testEventSentTitle: 'Événement test envoyé',
    testEventSentDesc: 'Vérifiez le tableau de bord Aptabase pour confirmer la réception.',
  },
} as const;

export default developer;

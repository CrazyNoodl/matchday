const developer = {
  title: 'Developer Menu',
  internalBadge: '⚙️  Internal',
  dataImport: {
    section: 'Data import',
    importRound: 'Import Round',
    importRoundSub: 'Paste CSV or Google Sheets match data',
  },
  aiExperiments: {
    section: 'AI experiments',
    ocrLab: 'OCR Lab',
    ocrLabSub: 'Extract match stats from a screenshot with Claude Vision',
  },
  imagePipeline: {
    section: 'Image pipeline',
    resizeLab: 'Resize Lab',
    resizeLabSub: 'See before/after size for each upload resize preset (#62)',
  },
  experimental: {
    section: 'Experimental features',
    dragReorder: 'Drag & drop match reorder',
    dragReorderSub: 'Testers only — reorder matches within a tour by dragging',
  },
  errorTracking: {
    section: 'Error tracking',
    sendTestError: 'Send test error',
    sendTestErrorSub: 'Throws a test error to verify Sentry is wired up',
    testErrorSentTitle: 'Test error sent',
    testErrorSentDesc: 'Check the Sentry dashboard to confirm it arrived.',
  },
  analytics: {
    section: 'Analytics',
    sendTestEvent: 'Send test event',
    sendTestEventSub: 'Fires a test event to verify Aptabase is wired up',
    testEventSentTitle: 'Test event sent',
    testEventSentDesc: 'Check the Aptabase dashboard to confirm it arrived.',
  },
} as const;

export default developer;

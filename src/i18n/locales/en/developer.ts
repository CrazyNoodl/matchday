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
} as const;

export default developer;

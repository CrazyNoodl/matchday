const matchDetail = {
  title: 'Match detail',
  homeWin: 'Home win',
  awayWin: 'Away win',
  draw: 'Draw',
  noData: 'No match data found.',
  commentary: 'Commentary',
  wonBy: '{{name}} won',
  swapSides: '⇄ swap sides',
  statsSection: 'Match stats',
  aiRead: 'AI-read',
  commentaryPrompt: 'Add commentary...',
  noCommentary: 'No commentary',
  editScore: {
    title: 'Edit score',
    subtitle: 'Correct the result',
  },
  editStats: {
    title: 'Edit stats',
    subtitle: 'Correct AI-read values',
    confirmValue: 'Confirm value is correct',
  },
  editNote: {
    subtitle: 'Add match notes',
    placeholder: 'Write something about this match...',
  },
  statsMenu: {
    rescan: 'Re-scan',
    clear: 'Clear',
  },
  clearStats: {
    title: 'Clear stats',
    desc: 'Remove all match statistics?',
    confirm: 'Clear',
  },
  swapSidesDialog: {
    title: 'Swap sides',
    desc: 'Switch who played home and away? Stats will be mirrored.',
    confirm: 'Swap',
  },
  importStats: {
    preparing: 'Preparing...',
    uploading: 'Uploading...',
    scanning: 'Scanning...',
    cta: '📊 Import stats',
  },
  media: {
    sectionTitle: 'Media',
    tapToAdd: 'Tap to add media',
    empty: 'No media attached',
    retryUpload: 'Tap to retry upload',
  },
  ocr: {
    failed: 'Could Not Read Stats',
    failedDesc: 'Please try again with a clearer image.',
    invalidPhoto: 'Wrong Photo?',
    invalidPhotoDesc:
      'This doesn’t look like a stats screen — please upload a new photo or retake a clearer one.',
  },
} as const;

export default matchDetail;

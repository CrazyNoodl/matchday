const resizeLab = {
  title: 'Resize Lab',
  presets: {
    regularMedia: 'Regular media',
    ocrPayload: 'OCR payload',
    statPhotoStorage: 'Stat photo storage',
    teamLogo: 'Team logo',
  },
  pickAnotherPhoto: 'Pick another photo',
  pickPhoto: 'Pick a photo',
  emptyHint:
    'Pick a real photo from your library to see exactly what each resize preset produces on this device — dimensions, file size, and any error the resize step hits.',
  original: 'Original',
  resizing: 'Resizing...',
  failed: 'Failed: {{error}}',
} as const;

export default resizeLab;

const ocrLab = {
  title: 'OCR Lab',
  scanFailedFallback: 'Scan failed',
  addPhotos: 'Add photos',
  addMore: 'Add more',
  photosSelected: '{{count}} photo selected · tap × to remove',
  photosSelectedPlural: '{{count}} photos selected · tap × to remove',
  scanning: 'Scanning...',
  scanWithCount: 'Scan {{count}} photos with AI',
  scanGeneric: 'Scan with AI',
  scanFailedTitle: 'Scan failed',
  extractedStats: 'Extracted stats',
  found: '{{count}} found',
  uncertain: '{{count}} uncertain',
  legendOrange: 'Orange — uncertain, verify manually',
  legendYellow: 'Yellow — slightly unclear in image',
  maxPhotos: 'Max 4 photos',
  removeOneFirst: 'Remove one first.',
} as const;

export default ocrLab;

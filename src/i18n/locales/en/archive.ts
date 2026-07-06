const archive = {
  title: 'Archive',
  season: 'Season {{year1}} / {{year2}} · {{count}} match days',
  roundMatches: '{{count}} matches',
  noRoundData: 'No round data available.',
  dayWinner: 'Day winner',
  matchCount: '{{count}} matches',
  draw: 'Draw',
  noArchive: 'No closed tournaments',
  noArchiveDesc: 'Completed tournaments will appear here',
  live: 'Live',
  allMatches: 'All matches · tap for stats',
  noMatchesRecorded: 'No matches recorded.',
  editDate: {
    title: 'Edit round date',
    placeholder: 'DD/MM/YYYY',
    invalid: 'Enter a valid date',
    cancel: 'Cancel',
    save: 'Save',
  },
  deleteRoundTitle: 'Delete round?',
  deleteRoundDesc: 'All matches in this round will be permanently removed.',
  deleteRoundConfirm: 'Delete Round',
  championDaysWon: 'champion · {{count}}d won',
} as const;

export default archive;

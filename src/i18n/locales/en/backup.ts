const backup = {
  title: 'Backup & Restore',
  infoTitle: 'Local JSON backup',
  infoDesc:
    'Creates a snapshot of your players, teams, and tournaments as a file on this device — independent of cloud sync. Tap Create Backup below to make one manually, anytime.',
  autoBackupDesc:
    'A backup is also created automatically every time you finish a matchday. The last {{count}} automatic backups are kept — older ones are removed automatically; backups you create manually are never deleted this way.',
  mediaLimitationNote:
    'Player photos, team logos, and match photos/videos are not included in this backup.',
  origin: {
    auto: 'Auto',
    manual: 'Manual',
  },
  staleNotice:
    "{{count}} change(s) made after the matchday closed aren't in your last backup yet.",
  staleUpdateBtn: 'Update Backup Now',
  demoModeWarning: 'Exit Demo Mode in Settings before creating or restoring a backup.',
  createSection: 'Create',
  createBtn: 'Create Backup',
  createSuccess: 'Backup created.',
  listSection: 'Your backups',
  emptyList: 'No backups yet.',
  importSection: 'Import',
  importFromFileBtn: 'Import from File',
  importSuccess: 'Backup restored locally.',
  restoringOverlay: 'Restoring backup…',
  restoreSyncSuccess: 'Backup restored and synced to the cloud.',
  restoreSyncFailed: 'Backup restored locally, but syncing to the cloud failed.',
  syncRetrySection: 'Cloud sync',
  retrySyncBtn: 'Retry Cloud Sync',
  pushSuccess: 'Cloud data updated.',
  pushFailed: 'Could not push to cloud. Try again.',
  shareDialogTitle: 'Matchday backup',
  deleteConfirmTitle: 'Delete backup?',
  deleteConfirmDesc: 'This only removes the file from this device.',
  importConfirmTitle: 'Replace all local data?',
  importConfirmDesc:
    'This replaces every player, team, and tournament on this device with the contents of this backup, and — if cloud sync is enabled — overwrites your cloud data to match. It is not a merge, and cannot be undone.',
  importConfirmBtn: 'Replace',
  error: {
    invalidFormat: 'This file is not a valid Matchday backup.',
    unsupportedVersion: 'This backup was made with a different app version and cannot be imported.',
    missingFields: 'This backup file looks corrupted.',
    writeFailed: 'Could not create the backup file.',
    shareFailed: 'Could not share the backup file.',
    notAvailable: 'Sharing is not available on this device.',
    parseError: 'This file is not valid JSON.',
    readError: 'Could not read the selected file.',
  },
} as const;

export default backup;

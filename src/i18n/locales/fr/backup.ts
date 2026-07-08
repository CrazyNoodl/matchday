const backup = {
  title: 'Sauvegarde et restauration',
  infoTitle: 'Sauvegarde JSON locale',
  infoDesc:
    'Crée un instantané de vos joueurs, équipes et tournois sous forme de fichier sur cet appareil — indépendamment de la synchronisation cloud.',
  mediaLimitationNote:
    "Les photos de joueurs, logos d'équipes et photos/vidéos de match ne sont pas inclus dans cette sauvegarde.",
  demoModeWarning:
    'Quittez le Mode Démo dans les Paramètres avant de créer ou restaurer une sauvegarde.',
  createSection: 'Créer',
  createBtn: 'Créer une sauvegarde',
  createSuccess: 'Sauvegarde créée.',
  listSection: 'Vos sauvegardes',
  emptyList: 'Aucune sauvegarde pour le moment.',
  importSection: 'Importer',
  importFromFileBtn: 'Importer depuis un fichier',
  importSuccess: 'Sauvegarde restaurée localement.',
  restoringOverlay: 'Restauration de la sauvegarde…',
  restoreSyncSuccess: 'Sauvegarde restaurée et synchronisée avec le cloud.',
  restoreSyncFailed:
    'Sauvegarde restaurée localement, mais la synchronisation avec le cloud a échoué.',
  syncRetrySection: 'Synchronisation cloud',
  retrySyncBtn: 'Réessayer la synchronisation',
  pushSuccess: 'Données cloud mises à jour.',
  pushFailed: "Impossible d'envoyer au cloud. Réessayez.",
  shareDialogTitle: 'Sauvegarde Matchday',
  deleteConfirmTitle: 'Supprimer la sauvegarde ?',
  deleteConfirmDesc: 'Cela ne supprime que le fichier de cet appareil.',
  importConfirmTitle: 'Remplacer toutes les données locales ?',
  importConfirmDesc:
    "Cela remplace tous les joueurs, équipes et tournois de cet appareil par le contenu de cette sauvegarde, et — si la synchronisation cloud est activée — écrase vos données cloud pour correspondre. Ce n'est pas une fusion, et cette action ne peut pas être annulée.",
  importConfirmBtn: 'Remplacer',
  error: {
    invalidFormat: "Ce fichier n'est pas une sauvegarde Matchday valide.",
    unsupportedVersion:
      "Cette sauvegarde a été créée avec une autre version de l'application et ne peut pas être importée.",
    missingFields: 'Ce fichier de sauvegarde semble corrompu.',
    writeFailed: 'Impossible de créer le fichier de sauvegarde.',
    shareFailed: 'Impossible de partager le fichier de sauvegarde.',
    notAvailable: "Le partage n'est pas disponible sur cet appareil.",
    parseError: "Ce fichier n'est pas du JSON valide.",
    readError: 'Impossible de lire le fichier sélectionné.',
  },
} as const;

export default backup;

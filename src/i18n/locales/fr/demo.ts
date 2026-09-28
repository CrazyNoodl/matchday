const demo = {
  label: 'Mode Démo',
  desc: "Explorer l'app avec des données exemple",
  banner: 'Mode démo',
  bannerSub: 'Vos vraies données sont en sécurité',
  bannerNote:
    "L'ajout de photos/vidéos est désactivé en mode démo — elles ne seraient de toute façon pas sauvegardées.",
  exit: 'Quitter',
  replaceWarning:
    'Votre tournoi actif sera temporairement remplacé par des données de démonstration. Il sera restauré à la sortie du mode démo.',
  enable: 'Activer',
} as const;

export default demo;

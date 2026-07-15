const welcome = {
  skip: 'Skip',
  next: 'Next',
  getStarted: 'Get started',
  slide1: {
    title: 'Welcome to Matchday',
    desc: 'Track FIFA/FC nights with your friends — scores, standings, and bragging rights, all in one place.',
  },
  slide2: {
    title: 'Set up a tournament',
    desc: 'Create a tournament and add the players you’ll be facing off against.',
  },
  slide3: {
    title: 'Play and record matches',
    desc: 'Start a round, log results as you play, and track stats for every match.',
  },
  slide4: {
    title: 'Follow the standings',
    desc: 'Check the live table, dig into stats, and browse the archive of past tournaments.',
  },
  slide5: {
    title: 'Not ready with real data yet?',
    desc: 'Turn on Demo Mode to explore Matchday with a sample tournament, players, and stats already filled in.',
  },
  demoToggleHint: 'You can turn this off anytime in Settings → More.',
} as const;

export default welcome;

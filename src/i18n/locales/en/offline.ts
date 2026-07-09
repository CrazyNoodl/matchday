const offline = {
  title: 'No Internet Connection',
  desc: 'Please check your connection and try again.',
  bannerTitle: 'No Internet Connection',
  bannerSub: 'Changes are saved on this device and will sync once you’re back online.',
  syncErrorTitle: 'Sync Issue',
  syncErrorSub: 'Your changes are saved on this device but couldn’t reach the server.',
} as const;

export default offline;

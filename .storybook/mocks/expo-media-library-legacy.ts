// Storybook-only stub. This native module is only ever reached from the
// `Platform.OS !== 'web'` branch of ShareRoundModal/ShareStandingsModal's
// save flow, which never runs in the Storybook web preview — but the real
// package depends on expo-modules-core internals that don't bundle for web,
// so Vite must never be allowed to resolve the real module here.
export async function requestPermissionsAsync(_writeOnly?: boolean) {
  return { status: 'denied' as const };
}

export async function saveToLibraryAsync(_uri: string) {
  return null;
}

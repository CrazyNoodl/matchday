// Storybook-only stub for `expo-router`. Stories render components in
// isolation, outside any real navigation tree, so `useRouter()` has nothing
// to call — this satisfies the import without needing a NavigationContainer.
export function useRouter() {
  return {
    push: (href: unknown) => console.log('[storybook] router.push', href),
    replace: (href: unknown) => console.log('[storybook] router.replace', href),
    back: () => console.log('[storybook] router.back'),
  };
}

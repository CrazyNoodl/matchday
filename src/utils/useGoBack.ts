import { useRouter } from 'expo-router';

// On PWA, opening a screen via direct URL leaves an empty nav stack.
// router.back() throws "GO_BACK was not handled" in that case.
// This hook falls back to home when there's nowhere to go back to.
export function useGoBack(fallback: string = '/') {
  const router = useRouter();
  return () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallback as Parameters<typeof router.replace>[0]);
    }
  };
}

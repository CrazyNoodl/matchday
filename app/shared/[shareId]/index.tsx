import { useLocalSearchParams } from 'expo-router';
import { SharedRoundScreen } from '@/screens/shared/SharedRoundScreen';

export default function SharedRoundRoute() {
  const { shareId } = useLocalSearchParams<{ shareId: string }>();
  // Keyed so navigating between two /shared/<id> URLs (rare, but possible via
  // browser history) fully remounts the hook instead of reusing stale state.
  return <SharedRoundScreen key={shareId} shareId={shareId} />;
}

import { useLocalSearchParams } from 'expo-router';
import { SharedMatchDetailScreen } from '@/screens/shared/SharedMatchDetailScreen';

export default function SharedMatchDetailRoute() {
  const { shareId, matchId } = useLocalSearchParams<{ shareId: string; matchId: string }>();
  return <SharedMatchDetailScreen key={`${shareId}/${matchId}`} shareId={shareId} matchId={matchId} />;
}

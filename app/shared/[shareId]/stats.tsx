import { useLocalSearchParams } from 'expo-router';
import { SharedMatchdayStatsScreen } from '@/screens/shared/SharedMatchdayStatsScreen';

export default function SharedMatchdayStatsRoute() {
  const { shareId } = useLocalSearchParams<{ shareId: string }>();
  return <SharedMatchdayStatsScreen key={shareId} shareId={shareId} />;
}

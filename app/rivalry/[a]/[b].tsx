import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { RivalryScreen } from '@/screens/rivalry/RivalryScreen';

export default function RivalryRoute() {
  const { a, b, scope } = useLocalSearchParams<{ a: string; b: string; scope?: string }>();
  return <RivalryScreen playerIdA={a} playerIdB={b} tournamentOnly={scope === 'tournament'} />;
}

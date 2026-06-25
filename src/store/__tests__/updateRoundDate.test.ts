jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => null,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

import { useStore } from '../index';
import type { ArchivedRound, Match } from '../types';

const makeMatch = (id: string): Match => ({
  id,
  aId: 'p1',
  bId: 'p2',
  aScore: 2,
  bScore: 1,
  aTeam: 'JUV',
  bTeam: 'BAR',
});

const makeRound = (id: string, date: string): ArchivedRound => ({
  id,
  n: 1,
  date,
  winner: 'p1',
  games: 1,
  ranked: true,
  matches: [makeMatch(`${id}-m1`)],
  name: 'Round 1',
});

const OLD_DATE = '2024-01-01T00:00:00.000Z';
const NEW_DATE = '2024-06-15T00:00:00.000Z';

beforeEach(() => {
  useStore.setState({
    hasTournament: true,
    archivedRounds: [makeRound('r1', OLD_DATE), makeRound('r2', OLD_DATE)],
  });
});

describe('updateRoundDate', () => {
  it('updates the date of the target round while the tournament is open', () => {
    useStore.getState().updateRoundDate('r1', NEW_DATE);
    const { archivedRounds } = useStore.getState();
    expect(archivedRounds.find((r) => r.id === 'r1')?.date).toBe(NEW_DATE);
  });

  it('does not affect other rounds', () => {
    useStore.getState().updateRoundDate('r1', NEW_DATE);
    const { archivedRounds } = useStore.getState();
    expect(archivedRounds.find((r) => r.id === 'r2')?.date).toBe(OLD_DATE);
  });

  it('is a no-op for an unknown round id', () => {
    useStore.getState().updateRoundDate('does-not-exist', NEW_DATE);
    const { archivedRounds } = useStore.getState();
    expect(archivedRounds.map((r) => r.date)).toEqual([OLD_DATE, OLD_DATE]);
  });

  it('does not change the date once the tournament is closed (hasTournament=false)', () => {
    useStore.setState({ hasTournament: false });
    useStore.getState().updateRoundDate('r1', NEW_DATE);
    const { archivedRounds } = useStore.getState();
    expect(archivedRounds.find((r) => r.id === 'r1')?.date).toBe(OLD_DATE);
  });
});

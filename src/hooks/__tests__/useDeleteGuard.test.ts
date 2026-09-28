import { act, renderHook } from '@testing-library/react-native';
import { useDeleteGuard } from '../useDeleteGuard';
import type { ArchivedRound, ClosedTournament, Match } from '@/store/types';

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'm1',
    aId: 'p1',
    bId: 'p2',
    aTeam: 'RED',
    bTeam: 'BLU',
    aScore: 1,
    bScore: 0,
    ...overrides,
  };
}

const isReferencedByPlayer = (m: Match, id: string) => m.aId === id || m.bId === id;

describe('useDeleteGuard', () => {
  it('asks for confirmation when the entity is not referenced by any match', async () => {
    const onDelete = jest.fn();
    const { result } = await renderHook(() =>
      useDeleteGuard({
        matches: [],
        archivedRounds: [],
        closedTournaments: [],
        isReferencedBy: isReferencedByPlayer,
        onDelete,
      }),
    );

    await act(() => result.current.requestDelete('p1'));

    expect(result.current.showDeleteConfirm).toBe(true);
    expect(result.current.showCannotDelete).toBe(false);
  });

  it('blocks deletion when referenced by a match in the current round', async () => {
    const onDelete = jest.fn();
    const { result } = await renderHook(() =>
      useDeleteGuard({
        matches: [makeMatch({ aId: 'p1' })],
        archivedRounds: [],
        closedTournaments: [],
        isReferencedBy: isReferencedByPlayer,
        onDelete,
      }),
    );

    await act(() => result.current.requestDelete('p1'));

    expect(result.current.showCannotDelete).toBe(true);
    expect(result.current.showDeleteConfirm).toBe(false);
  });

  it('blocks deletion when referenced only by a match in an archived round', async () => {
    const onDelete = jest.fn();
    const archivedRounds: ArchivedRound[] = [
      {
        id: 'r1',
        n: 1,
        date: '2026-01-01',
        winner: 'p1',
        games: 1,
        ranked: true,
        matches: [makeMatch({ aId: 'p1' })],
        name: 'Round 1',
      },
    ];
    const { result } = await renderHook(() =>
      useDeleteGuard({
        matches: [],
        archivedRounds,
        closedTournaments: [],
        isReferencedBy: isReferencedByPlayer,
        onDelete,
      }),
    );

    await act(() => result.current.requestDelete('p1'));

    expect(result.current.showCannotDelete).toBe(true);
  });

  it('blocks deletion when referenced only by a match inside a closed tournament', async () => {
    const onDelete = jest.fn();
    const closedTournaments: ClosedTournament[] = [
      {
        id: 't1',
        name: 'Tournament 1',
        date: '2026-01-01',
        champId: 'p1',
        champName: 'Player 1',
        champColor: '#fff',
        champInit: 'P1',
        players: ['p1', 'p2'],
        rounds: [
          {
            id: 'r1',
            n: 1,
            date: '2026-01-01',
            winner: 'p1',
            games: 1,
            ranked: true,
            matches: [makeMatch({ aId: 'p1' })],
            name: 'Round 1',
          },
        ],
      },
    ];
    const { result } = await renderHook(() =>
      useDeleteGuard({
        matches: [],
        archivedRounds: [],
        closedTournaments,
        isReferencedBy: isReferencedByPlayer,
        onDelete,
      }),
    );

    await act(() => result.current.requestDelete('p1'));

    expect(result.current.showCannotDelete).toBe(true);
  });

  it('deletes the pending id and resets state on confirm', async () => {
    const onDelete = jest.fn();
    const { result } = await renderHook(() =>
      useDeleteGuard({
        matches: [],
        archivedRounds: [],
        closedTournaments: [],
        isReferencedBy: isReferencedByPlayer,
        onDelete,
      }),
    );

    await act(() => result.current.requestDelete('p1'));
    expect(result.current.showDeleteConfirm).toBe(true);

    await act(() => result.current.confirmDelete());

    expect(onDelete).toHaveBeenCalledWith('p1');
    expect(result.current.showDeleteConfirm).toBe(false);
  });

  it('does not call onDelete if confirmDelete fires with no pending id', async () => {
    const onDelete = jest.fn();
    const { result } = await renderHook(() =>
      useDeleteGuard({
        matches: [],
        archivedRounds: [],
        closedTournaments: [],
        isReferencedBy: isReferencedByPlayer,
        onDelete,
      }),
    );

    await act(() => result.current.confirmDelete());

    expect(onDelete).not.toHaveBeenCalled();
  });

  it('closeCannotDelete and closeDeleteConfirm dismiss their respective dialogs', async () => {
    const onDelete = jest.fn();
    const { result } = await renderHook(() =>
      useDeleteGuard({
        matches: [makeMatch({ aId: 'p1' })],
        archivedRounds: [],
        closedTournaments: [],
        isReferencedBy: isReferencedByPlayer,
        onDelete,
      }),
    );

    await act(() => result.current.requestDelete('p1'));
    expect(result.current.showCannotDelete).toBe(true);

    await act(() => result.current.closeCannotDelete());
    expect(result.current.showCannotDelete).toBe(false);

    await act(() => result.current.requestDelete('p3'));
    expect(result.current.showDeleteConfirm).toBe(true);

    await act(() => result.current.closeDeleteConfirm());
    expect(result.current.showDeleteConfirm).toBe(false);
  });
});

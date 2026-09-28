import { useCallback, useState } from 'react';
import type { ArchivedRound, ClosedTournament, Match } from '@/store/types';

interface UseDeleteGuardOptions<ID extends string> {
  matches: Match[];
  archivedRounds: ArchivedRound[];
  closedTournaments: ClosedTournament[];
  /** Whether this match references the entity being deleted (e.g. m.aId === id || m.bId === id). */
  isReferencedBy: (match: Match, id: ID) => boolean;
  onDelete: (id: ID) => void;
}

// Shared "can this entity be deleted?" flow for players and teams: block the
// delete with a "cannot delete" dialog if any match (current, archived, or in
// a closed tournament) still references it, otherwise ask for confirmation.
export function useDeleteGuard<ID extends string>({
  matches,
  archivedRounds,
  closedTournaments,
  isReferencedBy,
  onDelete,
}: UseDeleteGuardOptions<ID>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCannotDelete, setShowCannotDelete] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<ID | null>(null);

  const requestDelete = useCallback(
    (id: ID) => {
      const allMatches = [
        ...matches,
        ...archivedRounds.flatMap((r) => r.matches),
        ...closedTournaments.flatMap((t) => t.rounds.flatMap((r) => r.matches)),
      ];
      if (allMatches.some((m) => isReferencedBy(m, id))) {
        setShowCannotDelete(true);
        return;
      }
      setPendingDeleteId(id);
      setShowDeleteConfirm(true);
    },
    [matches, archivedRounds, closedTournaments, isReferencedBy],
  );

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) {
      onDelete(pendingDeleteId);
    }
    setShowDeleteConfirm(false);
    setPendingDeleteId(null);
  }, [pendingDeleteId, onDelete]);

  const closeCannotDelete = useCallback(() => setShowCannotDelete(false), []);
  const closeDeleteConfirm = useCallback(() => setShowDeleteConfirm(false), []);

  return {
    showCannotDelete,
    showDeleteConfirm,
    requestDelete,
    confirmDelete,
    closeCannotDelete,
    closeDeleteConfirm,
  };
}

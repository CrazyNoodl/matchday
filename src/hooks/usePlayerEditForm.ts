import { useCallback, useState } from 'react';
import { type Player, type Team } from '@/store/types';
import { canSavePlayer } from '@/utils/playerForm';

interface UsePlayerEditFormOptions {
  addPlayer: (player: Player) => void;
  updatePlayer: (player: Player) => void;
  defaultTeamCode: () => string;
  teams: Team[];
}

// Owns the create/edit form state and save behavior for a player, so every
// screen that opens a `PlayerEditSheet` (Settings → Players, Setup) shares
// identical behavior, not just identical markup.
export function usePlayerEditForm({
  addPlayer,
  updatePlayer,
  defaultTeamCode,
  teams,
}: UsePlayerEditFormOptions) {
  const [visible, setVisible] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [formName, setFormName] = useState('');
  const [formNick, setFormNick] = useState('');
  const [formTeam, setFormTeam] = useState('');

  const openCreate = useCallback(() => {
    setEditingPlayer(null);
    setFormName('');
    setFormNick('');
    setFormTeam(defaultTeamCode());
    setVisible(true);
  }, [defaultTeamCode]);

  const openEdit = useCallback((player: Player) => {
    setEditingPlayer(player);
    setFormName(player.name);
    setFormNick(player.nick ?? '');
    setFormTeam(player.teamCode);
    setVisible(true);
  }, []);

  const close = useCallback(() => setVisible(false), []);

  const save = useCallback(() => {
    if (!canSavePlayer(formName, formTeam, teams)) return;
    const name = formName.trim();

    if (editingPlayer) {
      updatePlayer({
        ...editingPlayer,
        name,
        nick: formNick.trim() || undefined,
        teamCode: formTeam,
      });
    } else {
      addPlayer({
        id: `player-${Date.now()}`,
        name,
        nick: formNick.trim() || undefined,
        teamCode: formTeam,
      });
    }
    setVisible(false);
  }, [formName, formNick, formTeam, editingPlayer, addPlayer, updatePlayer, teams]);

  return {
    visible,
    editingPlayer,
    formName,
    setFormName,
    formNick,
    setFormNick,
    formTeam,
    setFormTeam,
    openCreate,
    openEdit,
    close,
    save,
  };
}

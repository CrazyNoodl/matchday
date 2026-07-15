/**
 * Tests for demo mode store behavior — verifies that enabling/disabling demo
 * mode correctly isolates demo data from the user's real data.
 */

// Mock MMKV so the store can initialise in the node test environment
import { useStore } from '../index';
import { DEMO_STATE, DEMO_PLAYERS, DEMO_TEAMS } from '../../demo/data';
import type { Player, Team } from '../types';

jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({
    getString: () => null,
    set: jest.fn(),
    remove: jest.fn(),
  }),
}));

// Mock react-native Platform so the store uses the localStorage path (simpler
// than wiring up the real MMKV mock fully)
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const REAL_PLAYER: Player = {
  id: 'real-p1',
  name: 'Real Player',
  teamCode: 'JUV',
};

const REAL_TEAM: Team = {
  code: 'REAL',
  name: 'Real Team',
  short: 'RLT',
  color: '#0000ff',
};

function freshStore() {
  // Reset to a known state before each test
  useStore.getState().resetStore();
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('demo mode — store isolation', () => {
  beforeEach(() => {
    freshStore();
    // Seed some real data so we have something worth backing up
    useStore.getState().addPlayer(REAL_PLAYER);
    useStore.getState().addTeam(REAL_TEAM);
    useStore.getState().startTournament('Real Cup', [REAL_PLAYER.id], true, 3);
  });

  it('loads DEMO_STATE when demo mode is enabled', () => {
    useStore.getState().setDemoMode(true);
    const s = useStore.getState();

    expect(s.demoMode).toBe(true);
    expect(s.players).toEqual(DEMO_PLAYERS);
    expect(s.teams).toEqual(DEMO_TEAMS);
    expect(s.tournamentName).toBe(DEMO_STATE.tournamentName);
    expect(s.hasTournament).toBe(true);
    expect(s.tournamentId).toBe('demo-tour-pl-s2');
  });

  it('saves real data (including tournamentId) in backup when demo mode is enabled', () => {
    const realTournamentId = useStore.getState().tournamentId;

    useStore.getState().setDemoMode(true);
    const backup = useStore.getState().realDataBackup;

    expect(backup).not.toBeNull();
    expect(backup!.tournamentId).toBe(realTournamentId);
    expect(backup!.players).toEqual([REAL_PLAYER]);
    expect(backup!.teams).toEqual([REAL_TEAM]);
    expect(backup!.hasTournament).toBe(true);
    expect(backup!.tournamentName).toBe('Real Cup');
  });

  it('restores real data including tournamentId when demo mode is disabled', () => {
    const realTournamentId = useStore.getState().tournamentId;

    useStore.getState().setDemoMode(true);
    useStore.getState().setDemoMode(false);

    const s = useStore.getState();
    expect(s.demoMode).toBe(false);
    expect(s.realDataBackup).toBeNull();
    expect(s.tournamentId).toBe(realTournamentId);
    expect(s.players).toEqual([REAL_PLAYER]);
    expect(s.teams).toEqual([REAL_TEAM]);
    expect(s.tournamentName).toBe('Real Cup');
  });

  it('real data is not mixed into demo state', () => {
    useStore.getState().setDemoMode(true);
    const s = useStore.getState();

    expect(s.players.some((p) => p.id === REAL_PLAYER.id)).toBe(false);
    expect(s.teams.some((t) => t.code === REAL_TEAM.code)).toBe(false);
  });

  it('demo data is not mixed into restored real state', () => {
    useStore.getState().setDemoMode(true);
    useStore.getState().setDemoMode(false);
    const s = useStore.getState();

    expect(s.players.some((p) => p.id === 'demo-p1')).toBe(false);
    expect(s.teams.some((t) => t.code === 'JUV' && t.name === 'Juventus')).toBe(false);
  });

  it('is a no-op if demo mode is already in the desired state', () => {
    const before = useStore.getState();
    useStore.getState().setDemoMode(false); // already false
    expect(useStore.getState()).toBe(before); // same reference = no set() called
  });

  // Regression: Switch.onValueChange passes the new boolean value directly (not a
  // negation of the current state). setDemoMode(true) must enable when currently off,
  // and setDemoMode(false) must disable when currently on — not just toggle blindly.
  it('setDemoMode(true) enables demo when called with explicit boolean from Switch.onValueChange', () => {
    expect(useStore.getState().demoMode).toBe(false);
    useStore.getState().setDemoMode(true);
    expect(useStore.getState().demoMode).toBe(true);
  });

  it('setDemoMode(false) disables demo when called with explicit boolean from Switch.onValueChange', () => {
    useStore.getState().setDemoMode(true);
    expect(useStore.getState().demoMode).toBe(true);
    useStore.getState().setDemoMode(false);
    expect(useStore.getState().demoMode).toBe(false);
  });

  it('applyCloudState is blocked while demo mode is active', () => {
    useStore.getState().setDemoMode(true);

    useStore.getState().applyCloudState({
      players: [{ id: 'cloud-p1', name: 'Cloud', teamCode: 'JUV' }],
      teams: [],
      matches: [],
      archivedRounds: [],
      closedTournaments: [],
      tournamentId: 'cloud-tour',
      hasTournament: false,
      tournamentName: '',
      tournamentRanked: true,
      tournamentRounds: 0,
      tournamentPlayers: [],
      round: 0,
      roundOpen: false,
      roundPlayers: [],
      settings: null,
    });

    const s = useStore.getState();
    // Demo state must be unchanged — cloud data must not have leaked in
    expect(s.players).toEqual(DEMO_PLAYERS);
    expect(s.tournamentId).toBe('demo-tour-pl-s2');
  });

  it('applyCloudState works normally after demo mode is disabled', () => {
    useStore.getState().setDemoMode(true);
    useStore.getState().setDemoMode(false);

    const cloudPlayer: Player = { id: 'cloud-p1', name: 'Cloud', teamCode: 'JUV' };
    useStore.getState().applyCloudState({
      players: [cloudPlayer],
      teams: [],
      matches: [],
      archivedRounds: [],
      closedTournaments: [],
      tournamentId: 'cloud-tour',
      hasTournament: true,
      tournamentName: 'Cloud Cup',
      tournamentRanked: true,
      tournamentRounds: 3,
      tournamentPlayers: [cloudPlayer.id],
      round: 1,
      roundOpen: false,
      roundPlayers: [],
      settings: null,
    });

    const s = useStore.getState();
    expect(s.players).toEqual([cloudPlayer]);
    expect(s.tournamentName).toBe('Cloud Cup');
  });

  it('UI state is cleared when entering demo mode', () => {
    useStore.getState().setModal('add');
    useStore.getState().setDemoMode(true);

    const s = useStore.getState();
    expect(s.modal).toBeNull();
    expect(s.selectedMatchId).toBeNull();
    expect(s.viewingRound).toBeNull();
    expect(s.viewingTournament).toBeNull();
  });

  it('UI state is cleared when exiting demo mode', () => {
    useStore.getState().setDemoMode(true);
    useStore.getState().setModal('add');
    useStore.getState().setDemoMode(false);

    const s = useStore.getState();
    expect(s.modal).toBeNull();
  });
});

describe('demo mode — tournamentId isolation', () => {
  beforeEach(() => {
    freshStore();
  });

  it('demo tournamentId does not overwrite real tournamentId in backup', () => {
    useStore.getState().startTournament('My Tour', [], true, 5);
    const realId = useStore.getState().tournamentId;
    expect(realId).toBeTruthy();

    useStore.getState().setDemoMode(true);
    // Demo gets its own ID
    expect(useStore.getState().tournamentId).toBe('demo-tour-pl-s2');

    useStore.getState().setDemoMode(false);
    // Real ID is fully restored
    expect(useStore.getState().tournamentId).toBe(realId);
  });

  it('backup tournamentId is empty string when user has no active tournament', () => {
    // No tournament started — tournamentId should be ''
    expect(useStore.getState().tournamentId).toBe('');

    useStore.getState().setDemoMode(true);
    const backup = useStore.getState().realDataBackup;
    expect(backup!.tournamentId).toBe('');

    useStore.getState().setDemoMode(false);
    expect(useStore.getState().tournamentId).toBe('');
  });
});

import { StateCreator } from 'zustand';
import { RealDataBackup } from '../types';
import { DEMO_STATE } from '@/demo/data';
import type { ThemePreference } from '@/theme/colors';
import type { Language } from '@/i18n';
import type { RootState } from '../index';

export interface SettingsState {
  showNick: boolean;
  showTeamLogo: boolean;
  groupByTours: boolean;
  colorScheme: ThemePreference;
  language: Language;
  demoMode: boolean;
  realDataBackup: RealDataBackup | null;
}

export interface SettingsActions {
  setShowNick: (v: boolean) => void;
  setShowTeamLogo: (v: boolean) => void;
  setGroupByTours: (v: boolean) => void;
  setColorScheme: (scheme: ThemePreference) => void;
  setLanguage: (lang: Language) => void;
  setDemoMode: (on: boolean) => void;
}

export type SettingsSlice = SettingsState & SettingsActions;

export const createSettingsSlice: StateCreator<RootState, [], [], SettingsSlice> = (set, get) => ({
  showNick: true,
  showTeamLogo: true,
  groupByTours: true,
  colorScheme: 'dark',
  language: 'en',
  demoMode: false,
  realDataBackup: null,

  setShowNick: (v) => set({ showNick: v }),
  setShowTeamLogo: (v) => set({ showTeamLogo: v }),
  setGroupByTours: (v) => set({ groupByTours: v }),
  setColorScheme: (scheme) => set({ colorScheme: scheme }),
  setLanguage: (lang) => set({ language: lang }),

  setDemoMode: (on) => {
    const s = get();
    if (on === s.demoMode) return;
    if (on) {
      const backup: RealDataBackup = {
        tournamentId: s.tournamentId,
        hasTournament: s.hasTournament,
        tournamentName: s.tournamentName,
        round: s.round,
        roundOpen: s.roundOpen,
        tournamentRanked: s.tournamentRanked,
        tournamentRounds: s.tournamentRounds,
        tournamentPlayers: s.tournamentPlayers,
        roundPlayers: s.roundPlayers,
        matches: s.matches,
        archivedRounds: s.archivedRounds,
        closedTournaments: s.closedTournaments,
        players: s.players,
        teams: s.teams,
      };
      set({
        demoMode: true,
        realDataBackup: backup,
        ...DEMO_STATE,
        modal: null,
        selectedMatchId: null,
        viewingRound: null,
        viewingTournament: null,
      });
    } else {
      const backup = s.realDataBackup;
      set({
        demoMode: false,
        realDataBackup: null,
        ...(backup ?? {}),
        modal: null,
        selectedMatchId: null,
        viewingRound: null,
        viewingTournament: null,
      });
    }
  },
});

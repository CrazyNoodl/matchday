import { canSavePlayer, isDuplicatePlayerName } from '../playerForm';
import type { Player, Team } from '@/store/types';

const team = (code: string): Team => ({ code, name: code, short: code, color: '#fff' });
const player = (id: string, name: string): Player => ({ id, name, teamCode: 'AAA' });

describe('canSavePlayer', () => {
  it('is false when name is blank, even with a team selected', () => {
    expect(canSavePlayer('  ', 'AAA', [team('AAA')], [])).toBe(false);
  });

  it('is false when teams exist but none is selected', () => {
    expect(canSavePlayer('Artem', '', [team('AAA')], [])).toBe(false);
  });

  it('is true when name and team are both set', () => {
    expect(canSavePlayer('Artem', 'AAA', [team('AAA')], [])).toBe(true);
  });

  it('is false when no teams exist yet — must add a team before adding a player', () => {
    expect(canSavePlayer('Artem', '', [], [])).toBe(false);
  });

  it('is false when another player already has that name', () => {
    const players = [player('p1', 'Artem')];
    expect(canSavePlayer('Artem', 'AAA', [team('AAA')], players)).toBe(false);
  });

  it('is true when editing a player and keeping their own name', () => {
    const players = [player('p1', 'Artem')];
    expect(canSavePlayer('Artem', 'AAA', [team('AAA')], players, 'p1')).toBe(true);
  });
});

describe('isDuplicatePlayerName', () => {
  it('is false against an empty roster', () => {
    expect(isDuplicatePlayerName('Artem', [])).toBe(false);
  });

  it('is false for a blank name', () => {
    expect(isDuplicatePlayerName('   ', [player('p1', 'Artem')])).toBe(false);
  });

  it('matches case-insensitively and ignores surrounding whitespace', () => {
    const players = [player('p1', 'Artem')];
    expect(isDuplicatePlayerName(' artem ', players)).toBe(true);
    expect(isDuplicatePlayerName('ARTEM', players)).toBe(true);
  });

  it('is false when the only match is the player being edited', () => {
    const players = [player('p1', 'Artem')];
    expect(isDuplicatePlayerName('Artem', players, 'p1')).toBe(false);
  });

  it('is true when a different player shares the name, even while editing someone else', () => {
    const players = [player('p1', 'Artem'), player('p2', 'Denys')];
    expect(isDuplicatePlayerName('Artem', players, 'p2')).toBe(true);
  });
});

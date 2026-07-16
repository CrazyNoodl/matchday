import { canSavePlayer } from '../playerForm';
import type { Team } from '@/store/types';

const team = (code: string): Team => ({ code, name: code, short: code, color: '#fff' });

describe('canSavePlayer', () => {
  it('is false when name is blank, even with a team selected', () => {
    expect(canSavePlayer('  ', 'AAA', [team('AAA')])).toBe(false);
  });

  it('is false when teams exist but none is selected', () => {
    expect(canSavePlayer('Artem', '', [team('AAA')])).toBe(false);
  });

  it('is true when name and team are both set', () => {
    expect(canSavePlayer('Artem', 'AAA', [team('AAA')])).toBe(true);
  });

  it('does not require a team when no teams exist yet (fresh install, no dead-end)', () => {
    expect(canSavePlayer('Artem', '', [])).toBe(true);
  });
});

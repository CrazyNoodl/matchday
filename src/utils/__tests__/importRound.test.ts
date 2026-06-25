import { parseRoundText } from '../importRound';

describe('parseRoundText — 4-col simple format', () => {
  it('parses a single comma-separated line', () => {
    const { matches, errors } = parseRoundText('Alice,2,1,Bob');
    expect(errors).toHaveLength(0);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({
      playerAName: 'Alice',
      teamACode: null,
      scoreA: 2,
      scoreB: 1,
      playerBName: 'Bob',
      teamBCode: null,
    });
  });

  it('parses multiple lines', () => {
    const { matches, errors } = parseRoundText('Alice,2,1,Bob\nCarol,0,3,Dave');
    expect(errors).toHaveLength(0);
    expect(matches).toHaveLength(2);
    expect(matches[1].playerAName).toBe('Carol');
    expect(matches[1].scoreB).toBe(3);
  });

  it('parses a 0-0 draw', () => {
    const { matches } = parseRoundText('Alice,0,0,Bob');
    expect(matches[0].scoreA).toBe(0);
    expect(matches[0].scoreB).toBe(0);
  });
});

describe('parseRoundText — 6-col full format', () => {
  it('parses playerName, teamCode, scores, playerName, teamCode', () => {
    const { matches, errors } = parseRoundText('Alice,JUV,3,0,Bob,BAR');
    expect(errors).toHaveLength(0);
    expect(matches[0]).toEqual({
      playerAName: 'Alice',
      teamACode: 'JUV',
      scoreA: 3,
      scoreB: 0,
      playerBName: 'Bob',
      teamBCode: 'BAR',
    });
  });

  it('treats empty team column as null', () => {
    const { matches } = parseRoundText('Alice,,3,0,Bob,');
    expect(matches[0].teamACode).toBeNull();
    expect(matches[0].teamBCode).toBeNull();
  });
});

describe('parseRoundText — 7-col Google Sheets format', () => {
  it('parses tab-separated GSheets row with row number prefix', () => {
    const line = '1\tJUV\tAlice\t2\t1\tBob\tBAR';
    const { matches, errors } = parseRoundText(line);
    expect(errors).toHaveLength(0);
    expect(matches[0]).toEqual({
      playerAName: 'Alice',
      teamACode: 'JUV',
      scoreA: 2,
      scoreB: 1,
      playerBName: 'Bob',
      teamBCode: 'BAR',
    });
  });

  it('treats empty teamA column in GSheets as null (non-trailing)', () => {
    // Trailing tab gets trimmed by the line trimmer, reducing 7-col to 6-col.
    // Test the realistic case: teamA empty, teamB present.
    const line = '1\t\tAlice\t2\t1\tBob\tBAR';
    const { matches } = parseRoundText(line);
    expect(matches[0].teamACode).toBeNull();
    expect(matches[0].teamBCode).toBe('BAR');
  });
});

describe('parseRoundText — error handling', () => {
  it('reports unrecognized format and continues parsing valid lines', () => {
    const input = 'bad line\nAlice,2,1,Bob';
    const { matches, errors } = parseRoundText(input);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Line 1/);
    expect(matches).toHaveLength(1);
    expect(matches[0].playerAName).toBe('Alice');
  });

  it('reports missing player name', () => {
    const { matches, errors } = parseRoundText(',2,1,Bob');
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/missing player name/i);
    expect(matches).toHaveLength(0);
  });

  it('returns empty result for empty input', () => {
    const { matches, errors } = parseRoundText('');
    expect(matches).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  it('handles whitespace-only input', () => {
    const { matches, errors } = parseRoundText('   \n  \n  ');
    expect(matches).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  it('accumulates errors without stopping parsing of valid lines', () => {
    const input = 'bad1\nbad2\nAlice,2,1,Bob\nbad3';
    const { matches, errors } = parseRoundText(input);
    expect(errors).toHaveLength(3);
    expect(matches).toHaveLength(1);
  });
});

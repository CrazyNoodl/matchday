export interface ParsedMatch {
  playerAName: string;
  teamACode: string | null;
  scoreA: number;
  scoreB: number;
  playerBName: string;
  teamBCode: string | null;
}

export interface ParseResult {
  matches: ParsedMatch[];
  errors: string[];
}

/**
 * Parse pasted Google Sheets data or manual CSV into match records.
 *
 * Supported formats (tab or comma separated):
 *   7-col GSheets: [N] [TeamA] [PlayerA] [ScoreA] [ScoreB] [PlayerB] [TeamB]
 *   6-col full:    [PlayerA] [TeamA] [ScoreA] [ScoreB] [PlayerB] [TeamB]
 *   4-col simple:  [PlayerA] [ScoreA] [ScoreB] [PlayerB]
 *
 * Team columns in Google Sheets paste are empty (images don't copy as text).
 * When empty or omitted, the player's current default team is used on import.
 */
export function parseRoundText(raw: string): ParseResult {
  const matches: ParsedMatch[] = [];
  const errors: string[] = [];

  const lines = raw
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    const isTab = line.includes('\t');
    const parts = (isTab ? line.split('\t') : line.split(',')).map((p) => p.trim());

    let playerAName = '';
    let teamACode: string | null = null;
    let scoreA = 0;
    let scoreB = 0;
    let playerBName = '';
    let teamBCode: string | null = null;

    if (parts.length >= 7 && parts[0] !== '' && !isNaN(Number(parts[0]))) {
      // Google Sheets 7-col: N, TeamA, PlayerA, ScoreA, ScoreB, PlayerB, TeamB
      teamACode = parts[1] || null;
      playerAName = parts[2];
      scoreA = Number(parts[3]);
      scoreB = Number(parts[4]);
      playerBName = parts[5];
      teamBCode = parts[6] || null;
    } else if (
      parts.length === 6 &&
      !isNaN(Number(parts[2])) &&
      !isNaN(Number(parts[3])) &&
      parts[2] !== '' &&
      parts[3] !== ''
    ) {
      // Full 6-col: PlayerA, TeamA, ScoreA, ScoreB, PlayerB, TeamB
      playerAName = parts[0];
      teamACode = parts[1] || null;
      scoreA = Number(parts[2]);
      scoreB = Number(parts[3]);
      playerBName = parts[4];
      teamBCode = parts[5] || null;
    } else if (
      parts.length === 4 &&
      !isNaN(Number(parts[1])) &&
      !isNaN(Number(parts[2])) &&
      parts[1] !== '' &&
      parts[2] !== ''
    ) {
      // Simple 4-col: PlayerA, ScoreA, ScoreB, PlayerB
      playerAName = parts[0];
      scoreA = Number(parts[1]);
      scoreB = Number(parts[2]);
      playerBName = parts[3];
    } else {
      errors.push(`Line ${lineNum}: unrecognized format — expected 4, 6, or 7 columns`);
      continue;
    }

    if (!playerAName || !playerBName) {
      errors.push(`Line ${lineNum}: missing player name`);
      continue;
    }
    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
      errors.push(`Line ${lineNum}: invalid scores (${scoreA}:${scoreB})`);
      continue;
    }

    matches.push({
      playerAName: playerAName.trim(),
      teamACode: teamACode?.trim() || null,
      scoreA,
      scoreB,
      playerBName: playerBName.trim(),
      teamBCode: teamBCode?.trim() || null,
    });
  }

  return { matches, errors };
}

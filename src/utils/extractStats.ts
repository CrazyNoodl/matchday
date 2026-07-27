import { Platform } from 'react-native';
import * as Sentry from '@sentry/react-native';
import type { KnownStatKey, StatConfidence, StatKey } from '@/store/types';

export interface ExtractedStat {
  key: StatKey;
  label: string;
  home: number;
  away: number;
  confidence: StatConfidence;
}

// Known stat keys that map to the store's statsOverride format
const KEY_ALIASES: Record<string, KnownStatKey> = {
  possession: 'possession',
  timetoregin: 'timeToRegain',
  timetoregain: 'timeToRegain',
  timetoreginball: 'timeToRegain',
  timetoregainball: 'timeToRegain',
  shots: 'shots',
  expectedgoals: 'expectedGoals',
  xg: 'expectedGoals',
  passes: 'passes',
  tackles: 'tackles',
  successfultackles: 'successfulTackles',
  interceptions: 'interceptions',
  interception: 'interceptions',
  saves: 'saves',
  fouls: 'fouls',
  offsides: 'offsides',
  offside: 'offsides',
  corners: 'corners',
  freekicks: 'freekicks',
  freekick: 'freekicks',
  penaltyshots: 'penaltyShots',
  penalties: 'penaltyShots',
  penaltyattempts: 'penaltyShots',
  yellowcards: 'yellowCards',
  yellowcard: 'yellowCards',
  redcards: 'redCards',
  redcard: 'redCards',
  breaksthroughcenter: 'breaksThroughCenter',
  centerbreaks: 'breaksThroughCenter',
  centrebreaks: 'breaksThroughCenter',
  breaksthroughwing: 'breaksThroughWing',
  wingbreaks: 'breaksThroughWing',
  breaksthroughhigh: 'breaksThroughHigh',
  highbreaks: 'breaksThroughHigh',
  defbreakattempts: 'defBreakAttempts',
  breakattempts: 'defBreakAttempts',
  defensivebreaks: 'defBreakAttempts',
  successfuldribbles: 'successfulDribbles',
  dribbles: 'successfulDribbles',
  dribblesuccess: 'successfulDribbles',
  shotaccuracy: 'shotAccuracy',
  passaccuracy: 'passAccuracy',
  passingaccuracy: 'passAccuracy',
};

export function normalizeKey(raw: string): StatKey {
  const lower = raw.toLowerCase().replace(/[^a-z]/g, '');
  return KEY_ALIASES[lower] ?? raw;
}

// Stats that just repeat the match score itself (see #72) — dropped outright
// rather than surfaced as a separate, unremovable extra row.
const BLOCKED_KEYS = new Set(['goals', 'score', 'finalscore', 'matchscore', 'result']);

function isBlockedKey(raw: string): boolean {
  const lower = raw.toLowerCase().replace(/[^a-z]/g, '');
  return BLOCKED_KEYS.has(lower);
}

// Local dev (Metro/standalone proxy) serves this at the relative path.
// Production web builds (GitHub Pages has no backend) point it at the
// deployed Cloudflare Worker via EXPO_PUBLIC_ANTHROPIC_PROXY_URL.
const API_ENDPOINT =
  Platform.OS === 'web'
    ? process.env.EXPO_PUBLIC_ANTHROPIC_PROXY_URL || '/api/anthropic'
    : 'https://api.anthropic.com/v1/messages';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const PROMPT = `This is a screenshot of a football/soccer match statistics screen (EA FC26). The image may be rotated or photographed at an angle — extract what you can see.

CRITICAL - avoid row misalignment from perspective distortion:
When a photo is taken at an angle, rows of text can appear vertically shifted relative to each other, causing a label to visually line up with numbers from the row above or below its true row. Before assigning values, treat each stat row as a single horizontal band: the label and its two numbers (home/away) must belong together based on the overall row spacing pattern of the table, not just which pixels look closest. If perspective tilt makes a row look shifted, use the spacing of neighboring rows to infer the correct grouping rather than the nearest visual match.

Self-check before finalizing your answer:
- Count the visible stat rows in the image, and make sure your output has exactly that many entries, in the same top-to-bottom order shown.
- Sanity-check pairs against what's plausible for that stat: possession home+away should sum close to 100; cards/fouls/offsides/corners are small integers, not decimals; percentage-based stats (possession, accuracy, dribbles) stay within 0-100.
- If any row's values seem implausible for that stat label (e.g. a "possession" row showing values typical of a "cards" row), you have likely shifted by one row — re-check against the row above and below and correct it.

Return ONLY raw JSON, no markdown:
{
  "stats": [
    { "key": "possession", "label": "Possession", "home": 52, "away": 48, "confidence": "high" }
  ]
}

Use these exact keys (camelCase) where the stat matches:
- possession, timeToRegain, shots, expectedGoals, passes
- tackles, successfulTackles, interceptions, saves, fouls
- offsides, corners, freekicks, penaltyShots
- yellowCards, redCards
- breaksThroughCenter, breaksThroughWing, breaksThroughHigh, defBreakAttempts
- successfulDribbles, shotAccuracy, passAccuracy

Rules:
- "key": use exact keys above when they match; otherwise camelCase English
- "label": short English name for the stat
- "home": LEFT team value as number only (strip % sign, keep decimals like 4.4)
- "away": RIGHT team value as number only
- "confidence": "high" = clearly readable, "medium" = slightly unclear or row alignment was ambiguous, "low" = guessed or blurry
- Include EVERY stat row visible, even if uncertain
- For percentage stats (possession, accuracy, dribbles): store the number without % sign
- Do NOT include "goals"/"score"/"result" — that's the match score, not a stat row`;

export async function extractStatsFromPhoto(
  base64: string,
  mimeType: string,
): Promise<ExtractedStat[]> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };
  if (Platform.OS !== 'web') {
    headers['x-api-key'] = ANTHROPIC_API_KEY;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mimeType, data: base64 },
              },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API ${response.status}: ${err.slice(0, 200)}`);
    }

    const data = await response.json();
    const text: string = data.content?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.warn('[extractStats] malformed JSON in AI response:', e);
      Sentry.captureException(e, {
        tags: { extractStatsOp: 'parseAiResponse' },
        extra: { rawJson: jsonMatch[0].slice(0, 500) },
      });
      throw new Error('Malformed JSON in AI response');
    }

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray((parsed as Record<string, unknown>).stats)
    ) {
      throw new Error('Invalid response format');
    }

    return ((parsed as Record<string, unknown>).stats as ExtractedStat[])
      .filter((s) => !isBlockedKey(String(s.key)))
      .map((s) => ({
        ...s,
        key: normalizeKey(s.key),
      }));
  } finally {
    clearTimeout(timeoutId);
  }
}

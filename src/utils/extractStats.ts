import { Platform } from 'react-native';
import type { StatConfidence } from '@/store/types';

export interface ExtractedStat {
  key: string;
  label: string;
  home: number;
  away: number;
  confidence: StatConfidence;
}

// Known stat keys that map to the store's statsOverride format
const KEY_ALIASES: Record<string, string> = {
  possession:           'possession',
  timetoregin:          'timeToRegain',
  timetoregain:         'timeToRegain',
  timetoreginball:      'timeToRegain',
  timetoregainball:     'timeToRegain',
  shots:                'shots',
  expectedgoals:        'expectedGoals',
  xg:                   'expectedGoals',
  passes:               'passes',
  tackles:              'tackles',
  successfultackles:    'successfulTackles',
  interceptions:        'interceptions',
  interception:         'interceptions',
  saves:                'saves',
  fouls:                'fouls',
  offsides:             'offsides',
  offside:              'offsides',
  corners:              'corners',
  freekicks:            'freekicks',
  freekick:             'freekicks',
  penaltyshots:         'penaltyShots',
  penalties:            'penaltyShots',
  penaltyattempts:      'penaltyShots',
  yellowcards:          'yellowCards',
  yellowcard:           'yellowCards',
  redcards:             'redCards',
  redcard:              'redCards',
  breaksthroughcenter:  'breaksThroughCenter',
  centerbreaks:         'breaksThroughCenter',
  centrebreaks:         'breaksThroughCenter',
  breaksthroughwing:    'breaksThroughWing',
  wingbreaks:           'breaksThroughWing',
  breaksthroughhigh:    'breaksThroughHigh',
  highbreaks:           'breaksThroughHigh',
  defbreakattempts:     'defBreakAttempts',
  breakattempts:        'defBreakAttempts',
  defensivebreaks:      'defBreakAttempts',
  successfuldribbles:   'successfulDribbles',
  dribbles:             'successfulDribbles',
  dribblesuccess:       'successfulDribbles',
  shotaccuracy:         'shotAccuracy',
  passaccuracy:         'passAccuracy',
  passingaccuracy:      'passAccuracy',
};

export function normalizeKey(raw: string): string {
  const lower = raw.toLowerCase().replace(/[^a-z]/g, '');
  return KEY_ALIASES[lower] ?? raw;
}

// Local dev (Metro/standalone proxy) serves this at the relative path.
// Production web builds (GitHub Pages has no backend) point it at the
// deployed Cloudflare Worker via EXPO_PUBLIC_ANTHROPIC_PROXY_URL.
const API_ENDPOINT =
  Platform.OS === 'web'
    ? process.env.EXPO_PUBLIC_ANTHROPIC_PROXY_URL || '/api/anthropic'
    : 'https://api.anthropic.com/v1/messages';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const PROMPT = `This is a screenshot of a football/soccer match statistics screen (EA FC, FIFA, or similar). The image may be rotated or photographed at an angle — extract what you can see.

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
- "confidence": "high" = clearly readable, "medium" = slightly unclear, "low" = guessed or blurry
- Include EVERY stat row visible, even if uncertain
- For percentage stats (possession, accuracy, dribbles): store the number without % sign`;

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
    } catch {
      throw new Error('Malformed JSON in AI response');
    }

    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as Record<string, unknown>).stats)) {
      throw new Error('Invalid response format');
    }

    return ((parsed as Record<string, unknown>).stats as ExtractedStat[]).map((s) => ({
      ...s,
      key: normalizeKey(s.key),
    }));
  } finally {
    clearTimeout(timeoutId);
  }
}

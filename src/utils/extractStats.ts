import { Platform } from 'react-native';

export interface ExtractedStat {
  key: string;
  label: string;
  home: number;
  away: number;
  confidence: 'high' | 'medium' | 'low';
}

// Known stat keys that map to the store's statsOverride format
const KEY_ALIASES: Record<string, string> = {
  possession: 'possession',
  shots: 'shots',
  shots_on_target: 'shotsOnTarget',
  shots_on_goal: 'shotsOnTarget',
  shotsontarget: 'shotsOnTarget',
  shotsongoal: 'shotsOnTarget',
  pass_accuracy: 'passAccuracy',
  passing_accuracy: 'passAccuracy',
  passaccuracy: 'passAccuracy',
  passes: 'passes',
  tackles: 'tackles',
  fouls: 'fouls',
  corners: 'corners',
  offsides: 'offsides',
  offside: 'offsides',
};

export function normalizeKey(raw: string): string {
  const lower = raw.toLowerCase().replace(/[^a-z]/g, '');
  return KEY_ALIASES[lower] ?? raw;
}

const API_ENDPOINT =
  Platform.OS === 'web'
    ? '/api/anthropic'
    : 'https://api.anthropic.com/v1/messages';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const PROMPT = `This is a screenshot of a football/soccer match statistics screen (EA FC, FIFA, or similar). Extract ALL visible statistics.

Return ONLY raw JSON, no markdown:
{
  "stats": [
    { "key": "possession", "label": "Possession", "home": 52, "away": 48, "confidence": "high" }
  ]
}

Use these exact keys where applicable:
- possession, shots, shots_on_target, pass_accuracy, passes, tackles, fouls, corners, offsides

Rules:
- "key": snake_case English (use exact keys above when they match)
- "label": short English name
- "home": left team value as number only (no % sign)
- "away": right team value as number only
- "confidence": "high" = clear, "medium" = slightly unclear, "low" = guessed/blurry
- Image may be rotated or at an angle — extract what you can
- Include EVERY stat row visible`;

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

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers,
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
  const parsed = JSON.parse(jsonMatch[0]);
  if (!Array.isArray(parsed.stats)) throw new Error('Invalid response format');

  return (parsed.stats as ExtractedStat[]).map((s) => ({
    ...s,
    key: normalizeKey(s.key),
  }));
}

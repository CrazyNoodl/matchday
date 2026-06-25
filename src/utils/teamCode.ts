export function generateTeamCode(short: string): string {
  return short + Date.now().toString(36).slice(-3).toUpperCase();
}

/** Formats an ISO date string as dd/mm/yy. */
export function formatShortDate(isoString: string): string {
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

/** Returns the last two digits of the year of an ISO date string. */
export function formatYearShort(isoString: string): string {
  return String(new Date(isoString).getFullYear()).slice(-2);
}

/** Formats an ISO date string as dd/mm/yyyy, for use as an editable field value. */
export function formatEditableDate(isoString: string): string {
  const d = new Date(isoString);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Parses a dd/mm/yyyy string into an ISO date string, keeping the
 * time-of-day from `referenceIso` (or local noon if not given) so the
 * calendar day doesn't shift across timezones. Returns null if invalid.
 */
export function parseEditableDate(value: string, referenceIso?: string): string | null {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, ddStr, mmStr, yyyyStr] = match;
  const dd = Number(ddStr);
  const mm = Number(mmStr);
  const yyyy = Number(yyyyStr);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;

  const ref = referenceIso ? new Date(referenceIso) : null;
  const hours = ref ? ref.getHours() : 12;
  const minutes = ref ? ref.getMinutes() : 0;
  const seconds = ref ? ref.getSeconds() : 0;

  const d = new Date(yyyy, mm - 1, dd, hours, minutes, seconds);
  if (d.getDate() !== dd || d.getMonth() !== mm - 1 || d.getFullYear() !== yyyy) {
    return null;
  }
  return d.toISOString();
}

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

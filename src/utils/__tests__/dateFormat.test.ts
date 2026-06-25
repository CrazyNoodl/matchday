import { formatEditableDate, parseEditableDate } from '../dateFormat';

describe('formatEditableDate', () => {
  it('formats an ISO string as dd/mm/yyyy', () => {
    expect(formatEditableDate('2024-06-15T12:00:00.000Z')).toMatch(/^\d{2}\/\d{2}\/2024$/);
  });
});

describe('parseEditableDate', () => {
  it('parses a valid dd/mm/yyyy string into an ISO string', () => {
    const result = parseEditableDate('15/06/2024');
    expect(result).not.toBeNull();
    const d = new Date(result!);
    expect(d.getDate()).toBe(15);
    expect(d.getMonth()).toBe(5);
    expect(d.getFullYear()).toBe(2024);
  });

  it('preserves the time-of-day from a reference ISO string', () => {
    const reference = '2024-01-01T08:30:00.000Z';
    const result = parseEditableDate('15/06/2024', reference);
    const d = new Date(result!);
    const ref = new Date(reference);
    expect(d.getHours()).toBe(ref.getHours());
    expect(d.getMinutes()).toBe(ref.getMinutes());
  });

  it('rejects malformed input', () => {
    expect(parseEditableDate('not-a-date')).toBeNull();
    expect(parseEditableDate('15-06-2024')).toBeNull();
    expect(parseEditableDate('')).toBeNull();
  });

  it('rejects out-of-range day/month values', () => {
    expect(parseEditableDate('32/01/2024')).toBeNull();
    expect(parseEditableDate('15/13/2024')).toBeNull();
  });

  it('rejects invalid calendar dates like 31/04', () => {
    expect(parseEditableDate('31/04/2024')).toBeNull();
  });

  it('accepts a valid leap day', () => {
    expect(parseEditableDate('29/02/2024')).not.toBeNull();
  });

  it('rejects a leap day in a non-leap year', () => {
    expect(parseEditableDate('29/02/2023')).toBeNull();
  });
});

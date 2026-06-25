/**
 * Guards against duplicate top-level keys in locale files.
 * TypeScript does not error on duplicate object keys — the second silently
 * overwrites the first, making entire translation groups disappear.
 * See docs/pitfalls.md for the full history.
 */

import * as fs from 'fs';
import * as path from 'path';

const LOCALES_DIR = path.join(__dirname, '../locales');

function findDuplicateTopLevelKeys(filePath: string): string[] {
  const source = fs.readFileSync(filePath, 'utf-8');
  const duplicates: string[] = [];
  const seen = new Set<string>();

  // Match top-level keys: lines like `  keyName: {` or `  keyName: '...'`
  // that appear directly inside the root object (2-space indent, followed by colon).
  const keyPattern = /^  ([a-zA-Z_][a-zA-Z0-9_]*):/gm;
  let match: RegExpExecArray | null;

  while ((match = keyPattern.exec(source)) !== null) {
    const key = match[1];
    if (seen.has(key)) {
      duplicates.push(key);
    } else {
      seen.add(key);
    }
  }

  return duplicates;
}

describe('i18n locale files — no duplicate top-level keys', () => {
  const localeFiles = fs.readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.ts'));

  it('locale directory contains at least one file', () => {
    expect(localeFiles.length).toBeGreaterThan(0);
  });

  localeFiles.forEach((file) => {
    it(`${file} has no duplicate top-level keys`, () => {
      const filePath = path.join(LOCALES_DIR, file);
      const duplicates = findDuplicateTopLevelKeys(filePath);
      expect(duplicates).toHaveLength(0);
    });
  });
});

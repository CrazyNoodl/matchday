/**
 * Guards against two classes of silent i18n bugs:
 * 1. Duplicate keys inside any single object literal — TypeScript does not
 *    error on this, the second definition silently overwrites the first.
 * 2. Locale drift — en/uk/fr ending up with different key sets after an edit
 *    only touched one file.
 * See docs/pitfalls.md for the incident history.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import en from '../locales/en';
import uk from '../locales/uk';
import fr from '../locales/fr';

const LOCALES_DIR = path.join(__dirname, '../locales');
const LOCALES: Record<string, unknown> = { en, uk, fr };

function findDuplicateKeysInFile(filePath: string): string[] {
  const source = fs.readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const duplicates: string[] = [];

  function visit(node: ts.Node) {
    if (ts.isObjectLiteralExpression(node)) {
      const seen = new Set<string>();
      for (const prop of node.properties) {
        const name = prop.name && ts.isIdentifier(prop.name) ? prop.name.text : undefined;
        if (name) {
          if (seen.has(name)) duplicates.push(name);
          seen.add(name);
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return duplicates;
}

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix];
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe('i18n locale files — no duplicate keys at any nesting depth', () => {
  for (const locale of Object.keys(LOCALES)) {
    const dir = path.join(LOCALES_DIR, locale);
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.ts'));

    it(`${locale}/ contains group files`, () => {
      expect(files.length).toBeGreaterThan(1); // index.ts + at least one group
    });

    files.forEach((file) => {
      it(`${locale}/${file} has no duplicate keys`, () => {
        const duplicates = findDuplicateKeysInFile(path.join(dir, file));
        expect(duplicates).toEqual([]);
      });
    });
  }
});

describe('i18n locale files — cross-locale key parity', () => {
  const enKeys = new Set(flattenKeys(en));

  (['uk', 'fr'] as const).forEach((locale) => {
    it(`${locale} has exactly the same keys as en`, () => {
      const localeKeys = new Set(flattenKeys(LOCALES[locale]));
      const missing = [...enKeys].filter((k) => !localeKeys.has(k));
      const extra = [...localeKeys].filter((k) => !enKeys.has(k));
      expect({ missing, extra }).toEqual({ missing: [], extra: [] });
    });
  });
});

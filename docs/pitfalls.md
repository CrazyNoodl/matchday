# Known Pitfalls

### i18n: No duplicate keys, and en/uk/fr must stay in sync

`src/i18n/locales/{en,uk,fr}/` each hold one file per top-level group (`common.ts`, `home.ts`, ...) merged by that locale's `index.ts`. Plain JS objects exported `as const` — TypeScript does **not** error on duplicate object keys, the second definition silently overwrites the first at runtime, with no warning. This once caused `stats.*` screen strings (title, ranking, h2hGames, etc.) to disappear entirely because a second `stats:` block for match-stat labels was added further down the (then-monolithic) file.

**Now enforced by `src/i18n/__tests__/noDuplicateKeys.test.ts`**, which fails the build on either:

- a duplicate key at any nesting depth in any single group file (parsed via the TS AST, not a regex — catches it regardless of indentation), or
- en/uk/fr key sets drifting apart (a key added to one locale but not the others).

`en/index.ts` also derives a `TranslationSchema` type that `uk`/`fr` are checked against via `satisfies` — a missing/extra key shows up as a `tsc --noEmit` error too, before the test even runs.

**Rule still applies when adding a new key by hand:** `grep` for the key name across all three locales before creating a new block, so you add to the existing group file instead of accidentally shadowing it — the test will catch a miss, but catching it yourself is faster than reading a failing CI log.

```bash
grep -rn "<key>:" src/i18n/locales/en/ src/i18n/locales/uk/ src/i18n/locales/fr/
```

### Bottom sheets: scrollable content requires `snapToMax`

`Sheet` has two modes:

- **Dynamic height** (default): wraps children in `BottomSheetView` + `onLayout`, snaps to measured content height. Use for short, fixed-height content (score editor, confirmation). Do **not** use with a `ScrollView` — the sheet will size to full content height until it hits `MAX_HEIGHT`, then clip instead of scroll.
- **Full-height** (`snapToMax` prop): snaps to 85% of screen height, children rendered directly. Use whenever the sheet contains a list that could be long (stats editor, import results, player pickers).

For scrollable sheets, always pair `snapToMax` with `style={styles.sheetScrollFlex}` (`flex: 1`) on `BottomSheetScrollView`, and wrap children in a `flex: 1` container. See the `editStats` and `importStats` sheets in `app/match/[id].tsx` as the canonical pattern.

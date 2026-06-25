# Known Pitfalls

### i18n: No duplicate top-level keys in locale files

`src/i18n/locales/*.ts` are plain JS objects exported `as const`. TypeScript does **not** error on duplicate object keys — the second definition silently overwrites the first at runtime, with no warning. This caused `stats.*` screen strings (title, ranking, h2hGames, etc.) to disappear entirely because a second `stats:` block for match-stat labels was added further down the file.

**Rule:** When adding a new translation group, always `grep` for the key name in all three locale files before creating a new top-level block. If the key already exists, add the new entries inside the existing block.

```bash
grep -n "^  <key>:" src/i18n/locales/en.ts src/i18n/locales/uk.ts src/i18n/locales/fr.ts
```

### Bottom sheets: scrollable content requires `snapToMax`

`Sheet` has two modes:
- **Dynamic height** (default): wraps children in `BottomSheetView` + `onLayout`, snaps to measured content height. Use for short, fixed-height content (score editor, confirmation). Do **not** use with a `ScrollView` — the sheet will size to full content height until it hits `MAX_HEIGHT`, then clip instead of scroll.
- **Full-height** (`snapToMax` prop): snaps to 85% of screen height, children rendered directly. Use whenever the sheet contains a list that could be long (stats editor, import results, player pickers).

For scrollable sheets, always pair `snapToMax` with `style={styles.sheetScrollFlex}` (`flex: 1`) on `BottomSheetScrollView`, and wrap children in a `flex: 1` container. See the `editStats` and `importStats` sheets in `app/match/[id].tsx` as the canonical pattern.

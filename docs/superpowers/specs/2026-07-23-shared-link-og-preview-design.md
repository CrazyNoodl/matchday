# Absolute share links + static social-preview meta tags — design

Date: 2026-07-23

## Purpose

Shared matchday links ("Copy Link" in `ShareRoundModal`, added in
[2026-07-22-shared-round-link-design.md](2026-07-22-shared-round-link-design.md)) paste
into messengers (WhatsApp, Telegram, Slack, iMessage, etc.) as a bare, unstyled string
with no preview card. Investigation during brainstorming found two separate problems:

1. **Root cause — the copied link has no domain.** `handleCopyLink`
   (`ShareRoundModal.tsx:494`) builds the URL from `BASE_URL`
   (`src/utils/baseUrl.ts`), which reads `experiments.baseUrl` from `app.config.js`. That
   config value is only ever set to `/matchday` when `EXPO_WEB_BUILD=true` (i.e. during
   `npm run build:web`) — never on native, and never in local web dev. So the clipboard
   gets `/shared/<id>` on the phone app, or `/matchday/shared/<id>` on the deployed web
   build — both relative paths with no scheme/host. A relative path pasted into an
   external messenger can't be fetched by anything (no origin to resolve against), which
   alone is enough to explain the "doesn't look like a real link" symptom independent of
   any preview-card styling.
2. **Cosmetic — no Open Graph preview.** Even once the link is absolute, messengers that
   do unfurl links need `og:title`/`og:description`/`og:image` meta tags on the fetched
   page to render a card instead of a plain blue link.

Both are fixed together since the second fix is meaningless without the first (a
messenger can't fetch OG tags from a host-less path), and both touch the same new
constant.

## Scope decision (from brainstorming)

Chosen over a dynamic per-round preview (real score/winner/date baked into the card):
the app is exported as a **static single-page bundle** (`app.config.js`'s
`web.output: 'single'`) and deployed to **GitHub Pages**
(`.github/workflows/deploy.yml`), which serves static files only — no per-request server
code, no edge functions. Rendering a different preview per `shareId` would require either
introducing a serverless layer in front of GitHub Pages or moving the `/shared/*` routes
to a hosting platform with API routes (e.g. EAS Hosting), both out of scope here. Instead:
one static, branded preview (app name + description + icon) for every `/shared/*` link.

**Known limitation accepted with this choice:** Facebook's link crawler sometimes
declines to render a preview for a non-200 HTTP response. Every direct request to
`/shared/<id>` is served by GitHub Pages' `public/404.html` (see below) with an HTTP 404
status, since no static file exists at that exact path. WhatsApp, Telegram, Slack, and
iMessage's unfurlers are not known to be status-code-sensitive and will render the
preview regardless; Facebook is the one exception this design does not solve for.

## Why GitHub Pages serves `404.html` for `/shared/*`

The site uses the standard SPA-on-GitHub-Pages trick (`public/404.html` already in the
repo): any path with no matching static file — every `/shared/<id>` URL, since the export
only produces one `index.html` — returns GitHub Pages' 404 fallback, which is this
project's own `public/404.html`. Its inline script re-encodes the path into a query
string and client-side-redirects to `index.html`, which expo-router then parses back into
a route. This already works correctly for real users (redirect happens before they
perceive anything). It means **any OG tags added only to the exported `index.html` never
apply to a shared link**, because link-preview crawlers request the exact `/shared/<id>`
path and don't execute the redirect's JavaScript — they read whatever HTML comes back in
that first response, i.e. `404.html`'s current content. Both files must carry the same
meta tags.

## Changes

### 1. New absolute-URL constant — `src/utils/shareBaseUrl.ts` (new file)

```ts
export const SHARE_BASE_URL = 'https://crazynoodl.github.io/matchday';
```

Deviates from the original plan of adding this to the existing `src/utils/baseUrl.ts`:
that file's top-level scope reads `Constants.expoConfig` from `expo-constants`, which
throws under this repo's Jest config (`testEnvironment: "node"`, no RN/native mocks) —
any test importing anything from `baseUrl.ts` fails at import time regardless of what it
actually asserts. Since `SHARE_BASE_URL` has to be importable from `app/+html.tsx`-style
Node-only build contexts too (see below) with zero native dependency, it gets its own
file. `BASE_URL` in `baseUrl.ts` is untouched — `app/_layout.tsx` still uses it for the
apple-touch-icon `<link>` and the service worker's registration URL/scope, both of which
must stay relative to whatever origin is actually serving the page (`''` in local dev,
`/matchday` in the deployed build). `SHARE_BASE_URL` is a different kind of value on
purpose: a link that must resolve correctly no matter where it's opened, including
outside the app entirely, so it's hardcoded to the real production origin regardless of
environment.

### 2. `ShareRoundModal.tsx:494`

```diff
- await Clipboard.setStringAsync(buildSharedRoundUrl(BASE_URL, round.shareId));
+ await Clipboard.setStringAsync(buildSharedRoundUrl(SHARE_BASE_URL, round.shareId));
```

`buildSharedRoundUrl` itself (`src/utils/sharedRoundUrl.ts`) is unchanged — it's a pure
`${baseUrl}/shared/${shareId}` join; its existing unit test already covers that shape
with literal strings. This is the only call site in the app that copies a shared-round
link to the clipboard (`ShareStandingsModal` shares a rendered image only, no URL).

### 3. `public/index.html` (new) — not `app/+html.tsx`

Expo Router's `app/+html.tsx` root-document override only applies to
`web.output: 'static'` (full static rendering); this project uses
`web.output: 'single'` (SPA), a different export code path
(`@expo/cli`'s `createTemplateHtmlAsync`) that ignores `+html.tsx` entirely — confirmed
by building with a `+html.tsx` present and finding zero trace of it in `dist/index.html`.
That code path instead looks for `public/index.html` first, falling back to its own
built-in template (`@expo/cli`'s `static/template/index.html`) only if the project has
none. `public/index.html` is the built-in template's exact contents (`%LANG_ISO_CODE%`
and `%WEB_TITLE%` placeholders preserved — the CLI string-replaces them regardless of
which template file it read) plus the meta-tag block from "Meta tag content" below,
added inside `<head>`. The CLI still appends its own `theme-color`/`description`/favicon
tags after ours automatically (same `createTemplateHtmlAsync` step, unaffected by using a
custom template file) — verified in the exported `dist/index.html`.

### 4. `public/404.html`

Same meta-tag block added by hand into the existing `<head>`, directly below the
`<title>Matchday</title>` line already there. The redirect `<script>` is untouched.

### 5. `public/og-image.png` (new)

A copy of `assets/icon.png` (1024×1024) placed under `public/`, which Expo Router's web
export copies verbatim to the export root — giving a stable, guaranteed path at
`${SHARE_BASE_URL}/og-image.png`. Reusing the existing icon avoids new design work;
1024×1024 is square rather than the 1.91:1 banner shape Facebook/Twitter's large-image
card prefers, which is why `twitter:card` is set to `summary` (small square thumbnail)
rather than `summary_large_image` (would letterbox/crop a square image oddly). A
dedicated banner-shaped asset is a natural future improvement, not required for this
iteration.

### 6. Meta tag content (identical block in both HTML files)

```html
<meta property="og:type" content="website" />
<meta property="og:title" content="Matchday" />
<meta property="og:description" content="Tournament & match tracker" />
<meta property="og:image" content="https://crazynoodl.github.io/matchday/og-image.png" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="Matchday" />
<meta name="twitter:description" content="Tournament & match tracker" />
<meta name="twitter:image" content="https://crazynoodl.github.io/matchday/og-image.png" />
```

English only, per brainstorming — a static, single HTML document can't vary by the
viewer's in-app language selection, and English was chosen for the widest reach since a
shared link may travel outside the sharer's own language circle. Title/description reuse
`app.config.js`'s existing `web.description` copy ("Tournament & match tracker") for
consistency rather than inventing new marketing copy. The image URL is the literal
`SHARE_BASE_URL` value, hardcoded rather than templated — OG tags are only meaningful
once deployed; no crawler will ever fetch a `localhost` URL.

## Testing

- **Unit (Jest)**: new `src/utils/__tests__/shareBaseUrl.test.ts` asserting
  `SHARE_BASE_URL` is an absolute URL and matches the expected production domain — a
  cheap regression guard against this exact bug recurring (someone later changing it
  back to a relative/env-derived value).
- **`public/index.html` / `public/404.html`**: no automated test — after
  `EXPO_WEB_BUILD=true npx expo export --platform web`, manually inspected
  `dist/index.html` and `dist/404.html` for the meta-tag block (done during
  implementation — both present, `dist/og-image.png` present). Real messenger-preview
  verification can only happen after deploying to GitHub Pages (out of scope for local
  verification).
- **`ShareRoundModal`**: no existing test file for this component; not adding one now —
  `handleCopyLink`'s only change is which constant it passes to an already-tested pure
  function, covered indirectly by the new `shareBaseUrl.test.ts`.

## Files touched

- `src/utils/shareBaseUrl.ts` (new) — `SHARE_BASE_URL`
- `src/utils/__tests__/shareBaseUrl.test.ts` (new)
- `src/components/ShareRoundModal/ShareRoundModal.tsx` — use `SHARE_BASE_URL` in
  `handleCopyLink`
- `public/index.html` (new)
- `public/404.html` — add meta-tag block
- `public/og-image.png` (new — copy of `assets/icon.png`)
- `docs/CONTEXT.md` — update before `finish-feature.sh`, per project workflow

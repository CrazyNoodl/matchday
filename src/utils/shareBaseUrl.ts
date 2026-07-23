// Unlike BASE_URL (src/utils/baseUrl.ts — relative to whatever origin is serving the
// page, via expo-constants), a copied share link must resolve on its own outside the
// app entirely, including from the native app where there is no "current origin" at
// all. Always the real production origin, and deliberately free of any native
// dependency so it's safe to import from a Node-only context (app/+html.tsx).
export const SHARE_BASE_URL = 'https://crazynoodl.github.io/matchday';

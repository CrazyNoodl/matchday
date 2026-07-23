// Query-param form, not a `/shared/<id>` path: GitHub Pages returns a real HTTP 404
// for any path with no matching file, and some link-preview crawlers (Telegram) won't
// render a preview for a non-200 response regardless of its body's Open Graph tags.
// "<baseUrl>/?shared=<id>" resolves to the real index.html (200, tags included) and is
// rewritten to the internal "/shared/<id>" route client-side — see public/index.html.
export function buildSharedRoundUrl(baseUrl: string, shareId: string): string {
  return `${baseUrl}/?shared=${shareId}`;
}

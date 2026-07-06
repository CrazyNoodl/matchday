import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigured } from './client';

const DEFAULT_TIMEOUT_MS = 2500;

// NetInfo (native) and the browser's online/offline events only report whether
// there's a network interface with a route — not whether requests to our own
// backend actually get through. A phone with mobile data cut off for
// non-payment, or a wifi network stuck behind a captive portal, can both still
// report "connected" while every real request fails. This hits Supabase's
// lightweight GoTrue health endpoint (no auth/session required) to verify
// actual reachability.
export async function pingSupabase(timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<boolean> {
  if (!supabaseConfigured) return true;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: SUPABASE_ANON_KEY },
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

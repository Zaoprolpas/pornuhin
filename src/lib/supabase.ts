import { createClient, SupabaseClient } from '@supabase/supabase-js';

function getUrl() {
  return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
}
function getAnonKey() {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
}
function getServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

// Lazy clients — created on first use, not at import time (avoids build-time crash)
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabase() {
  if (!_supabase) _supabase = createClient(getUrl(), getAnonKey());
  return _supabase;
}

export function getSupabaseAdmin() {
  if (!_supabaseAdmin) _supabaseAdmin = createClient(getUrl(), getServiceKey());
  return _supabaseAdmin;
}

// Backwards-compatible exports
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) { return (getSupabase() as any)[prop]; }
});
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_, prop) { return (getSupabaseAdmin() as any)[prop]; }
});

// Upsert events into the database (uses service role)
export async function upsertEvents(events: import('./types').Event[]): Promise<{ inserted: number; errors: number }> {
  let inserted = 0;
  let errors = 0;

  // Batch upsert in chunks of 100
  const chunkSize = 100;
  for (let i = 0; i < events.length; i += chunkSize) {
    const chunk = events.slice(i, i + chunkSize);
    const { error } = await supabaseAdmin
      .from('events')
      .upsert(
        chunk.map(e => ({
          ...e,
          fetched_at: new Date().toISOString(),
        })),
        { onConflict: 'source,source_id' }
      );

    if (error) {
      console.error(`Upsert error for chunk ${i / chunkSize}:`, error.message);
      errors += chunk.length;
    } else {
      inserted += chunk.length;
    }
  }

  return { inserted, errors };
}

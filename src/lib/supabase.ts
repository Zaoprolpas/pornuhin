import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Client for frontend (read-only, uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for API routes (read-write, uses service role key)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

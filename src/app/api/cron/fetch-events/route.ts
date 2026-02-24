import { NextRequest, NextResponse } from 'next/server';
import { fetchKudaGoEvents } from '@/lib/parsers/kudago';
import { fetchF1Events } from '@/lib/parsers/openf1';
import { fetchTicketmasterEvents } from '@/lib/parsers/ticketmaster';
import { upsertEvents, supabaseAdmin } from '@/lib/supabase';
import { FetchResult, CronResponse } from '@/lib/types';

export const maxDuration = 60; // Allow up to 60s for Vercel

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results: FetchResult[] = [];

  // Optional: verify cron secret for production
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  // Fetch KudaGo events
  try {
    const kudaGoEvents = await fetchKudaGoEvents();
    const { inserted, errors } = await upsertEvents(kudaGoEvents);
    results.push({
      source: 'kudago',
      fetched: inserted,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('KudaGo fetch failed:', error);
    results.push({
      source: 'kudago',
      fetched: 0,
      errors: 1,
      timestamp: new Date().toISOString(),
    });
  }

  // Fetch Ticketmaster events (Europe)
  try {
    const tmEvents = await fetchTicketmasterEvents();
    const { inserted, errors } = await upsertEvents(tmEvents);
    results.push({
      source: 'ticketmaster',
      fetched: inserted,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ticketmaster fetch failed:', error);
    results.push({
      source: 'ticketmaster',
      fetched: 0,
      errors: 1,
      timestamp: new Date().toISOString(),
    });
  }

  // Fetch OpenF1 events
  try {
    const f1Events = await fetchF1Events();
    const { inserted, errors } = await upsertEvents(f1Events);
    results.push({
      source: 'openf1',
      fetched: inserted,
      errors,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('OpenF1 fetch failed:', error);
    results.push({
      source: 'openf1',
      fetched: 0,
      errors: 1,
      timestamp: new Date().toISOString(),
    });
  }

  // Clean up stale non-permanent events (next_occurrence > 7 days ago)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { count: deletedCount } = await supabaseAdmin
    .from('events')
    .delete({ count: 'exact' })
    .eq('is_permanent', false)
    .lt('next_occurrence', sevenDaysAgo);

  if (deletedCount && deletedCount > 0) {
    console.log(`Cleaned up ${deletedCount} stale events`);
  }

  const response: CronResponse = {
    success: results.every(r => r.errors === 0),
    results,
    total_events: results.reduce((sum, r) => sum + r.fetched, 0),
    duration_ms: Date.now() - startTime,
  };

  return NextResponse.json(response);
}

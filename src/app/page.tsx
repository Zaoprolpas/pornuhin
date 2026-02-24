import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';
import EventFilters from './components/EventFilters';
import EventCard from './components/EventCard';
import Pagination from './components/Pagination';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 24; // divisible by 1, 2, 3, 4 columns

// ─── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ─── data fetching ───────────────────────────────────────────────────────────

interface FetchEventsOptions {
  source?: string;
  category?: string;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  page: number;
}

interface FetchEventsResult {
  events: Event[];
  totalCount: number;
  kudaGoCount: number;
  ticketmasterCount: number;
  openF1Count: number;
  lastUpdate: string | null;
}

async function fetchEvents(opts: FetchEventsOptions): Promise<FetchEventsResult> {
  const { source, category, city, dateFrom, dateTo, page } = opts;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('events')
    .select('*', { count: 'exact' })
    .order('fetched_at', { ascending: false })
    .range(from, to);

  if (source) query = query.eq('source', source);
  if (category) query = query.eq('category', category);
  if (city) query = query.ilike('city', `%${city}%`);
  if (dateFrom) query = query.gte('start_date', dateFrom);
  if (dateTo) query = query.lte('start_date', `${dateTo}T23:59:59Z`);

  const { data, count, error } = await query;

  if (error) {
    console.error('Supabase query error:', error.message);
    return { events: [], totalCount: 0, kudaGoCount: 0, ticketmasterCount: 0, openF1Count: 0, lastUpdate: null };
  }

  const [kudaGoResult, ticketmasterResult, openF1Result, lastUpdateResult] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('source', 'kudago'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('source', 'ticketmaster'),
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('source', 'openf1'),
    supabase
      .from('events')
      .select('fetched_at')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single(),
  ]);

  return {
    events: (data as Event[]) ?? [],
    totalCount: count ?? 0,
    kudaGoCount: kudaGoResult.count ?? 0,
    ticketmasterCount: ticketmasterResult.count ?? 0,
    openF1Count: openF1Result.count ?? 0,
    lastUpdate: (lastUpdateResult.data as { fetched_at?: string } | null)?.fetched_at ?? null,
  };
}

// ─── page ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: {
    source?: string;
    category?: string;
    city?: string;
    from?: string;
    to?: string;
    page?: string;
  };
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const source = searchParams.source ?? '';
  const category = searchParams.category ?? '';
  const city = searchParams.city ?? '';
  const dateFrom = searchParams.from ?? '';
  const dateTo = searchParams.to ?? '';
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10));

  const { events, totalCount, kudaGoCount, ticketmasterCount, openF1Count, lastUpdate } = await fetchEvents({
    source: source || undefined,
    category: category || undefined,
    city: city || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const totalAll = kudaGoCount + ticketmasterCount + openF1Count;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <StatCard
          label="Total Events"
          value={totalAll.toLocaleString('en')}
          accent="text-gray-100"
        />
        <StatCard
          label="KudaGo"
          value={kudaGoCount.toLocaleString('en')}
          accent="text-blue-400"
          badge={<span className="w-2 h-2 rounded-full bg-blue-400 inline-block mr-1.5 flex-shrink-0" />}
        />
        <StatCard
          label="Ticketmaster"
          value={ticketmasterCount.toLocaleString('en')}
          accent="text-green-400"
          badge={<span className="w-2 h-2 rounded-full bg-green-400 inline-block mr-1.5 flex-shrink-0" />}
        />
        <StatCard
          label="OpenF1"
          value={openF1Count.toLocaleString('en')}
          accent="text-red-400"
          badge={<span className="w-2 h-2 rounded-full bg-red-400 inline-block mr-1.5 flex-shrink-0" />}
        />
        <StatCard
          label="Last Updated"
          value={lastUpdate ? formatDate(lastUpdate) : 'Never'}
          accent="text-emerald-400"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-5">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Filters
        </h2>
        <Suspense>
          <EventFilters
            currentSource={source}
            currentCategory={category}
            currentCity={city}
            currentDateFrom={dateFrom}
            currentDateTo={dateTo}
          />
        </Suspense>
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-100">
          Events
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {totalCount.toLocaleString('en')} result{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </h1>
      </div>

      {/* Gallery grid */}
      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {events.map((event) => (
            <EventCard key={`${event.source}-${event.source_id}`} event={event} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Suspense>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={PAGE_SIZE}
          />
        </Suspense>
      )}
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
  badge,
  className = '',
}: {
  label: string;
  value: string;
  accent: string;
  badge?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`flex items-center text-xl font-bold ${accent}`}>
        {badge}
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-8 py-16 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <p className="text-gray-300 font-medium">No events found</p>
      <p className="text-sm text-gray-600 max-w-sm">
        Try adjusting the filters or trigger the cron job to fetch fresh data.
      </p>
    </div>
  );
}

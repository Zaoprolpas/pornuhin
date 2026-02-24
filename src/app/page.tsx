import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/types';
import EventFilters from './components/EventFilters';
import Pagination from './components/Pagination';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

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

function formatPrice(min: number | null, max: number | null, currency: string): string {
  if (min === null && max === null) return '—';
  const symbol = currency === 'RUB' ? '₽' : currency;
  if (min !== null && max !== null && min !== max) {
    return `от ${min.toLocaleString('ru-RU')} до ${max.toLocaleString('ru-RU')} ${symbol}`;
  }
  const value = min ?? max!;
  return `от ${value.toLocaleString('ru-RU')} ${symbol}`;
}

function SourceBadge({ source }: { source: string }) {
  if (source === 'kudago') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-900/60 text-blue-300 border border-blue-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
        KudaGo
      </span>
    );
  }
  if (source === 'openf1') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-red-900/60 text-red-300 border border-red-800/50">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
        OpenF1
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
      {source}
    </span>
  );
}

function CategoryBadge({ category }: { category: string | null }) {
  if (!category) return <span className="text-gray-600">—</span>;

  const colors: Record<string, string> = {
    concert: 'bg-purple-900/50 text-purple-300 border-purple-800/50',
    exhibition: 'bg-amber-900/50 text-amber-300 border-amber-800/50',
    festival: 'bg-emerald-900/50 text-emerald-300 border-emerald-800/50',
    sport: 'bg-red-900/50 text-red-300 border-red-800/50',
    theater: 'bg-pink-900/50 text-pink-300 border-pink-800/50',
    party: 'bg-orange-900/50 text-orange-300 border-orange-800/50',
    fashion: 'bg-rose-900/50 text-rose-300 border-rose-800/50',
    other: 'bg-gray-800 text-gray-400 border-gray-700',
  };

  const colorClass = colors[category] ?? colors.other;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border capitalize ${colorClass}`}
    >
      {category}
    </span>
  );
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
    .order('start_date', { ascending: true })
    .range(from, to);

  if (source) query = query.eq('source', source);
  if (category) query = query.eq('category', category);
  if (city) query = query.ilike('city', `%${city}%`);
  if (dateFrom) query = query.gte('start_date', dateFrom);
  if (dateTo) query = query.lte('start_date', `${dateTo}T23:59:59Z`);

  const { data, count, error } = await query;

  if (error) {
    console.error('Supabase query error:', error.message);
    return { events: [], totalCount: 0, kudaGoCount: 0, openF1Count: 0, lastUpdate: null };
  }

  // Fetch aggregate counts (unfiltered, for the stats bar)
  const [kudaGoResult, openF1Result, lastUpdateResult] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }).eq('source', 'kudago'),
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

  const { events, totalCount, kudaGoCount, openF1Count, lastUpdate } = await fetchEvents({
    source: source || undefined,
    category: category || undefined,
    city: city || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
  });

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const totalAll = kudaGoCount + openF1Count;

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Events"
          value={totalAll.toLocaleString('en')}
          accent="text-gray-100"
        />
        <StatCard
          label="KudaGo"
          value={kudaGoCount.toLocaleString('en')}
          accent="text-blue-400"
          badge={
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block mr-1.5 flex-shrink-0" />
          }
        />
        <StatCard
          label="OpenF1"
          value={openF1Count.toLocaleString('en')}
          accent="text-red-400"
          badge={
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block mr-1.5 flex-shrink-0" />
          }
        />
        <StatCard
          label="Last Updated"
          value={lastUpdate ? formatDate(lastUpdate) : 'Never'}
          accent="text-emerald-400"
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

      {/* Table */}
      {events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          {/* Desktop table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-[35%]">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    City
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Link
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {events.map((event) => (
                  <EventRow key={`${event.source}-${event.source_id}`} event={event} />
                ))}
              </tbody>
            </table>
          </div>
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
}: {
  label: string;
  value: string;
  accent: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex flex-col gap-1">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`flex items-center text-xl font-bold ${accent}`}>
        {badge}
        {value}
      </span>
    </div>
  );
}

function EventRow({ event }: { event: Event }) {
  return (
    <tr className="hover:bg-gray-800/40 transition-colors">
      {/* Title */}
      <td className="px-4 py-3">
        <p className="text-gray-100 font-medium line-clamp-2 leading-snug">{event.title}</p>
        {/* Mobile: show city + category inline */}
        <div className="flex flex-wrap gap-1.5 mt-1.5 sm:hidden">
          {event.city && (
            <span className="text-xs text-gray-500">{event.city}</span>
          )}
          <CategoryBadge category={event.category} />
        </div>
        {/* Mobile: show date inline */}
        <p className="text-xs text-gray-500 mt-1 lg:hidden">
          {formatDate(event.start_date)}
        </p>
      </td>

      {/* Source */}
      <td className="px-4 py-3 whitespace-nowrap">
        <SourceBadge source={event.source} />
      </td>

      {/* City */}
      <td className="px-4 py-3 hidden sm:table-cell">
        <span className="text-gray-300">{event.city ?? '—'}</span>
      </td>

      {/* Category */}
      <td className="px-4 py-3 hidden md:table-cell">
        <CategoryBadge category={event.category} />
      </td>

      {/* Date */}
      <td className="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
        <span className="text-gray-300">{formatDate(event.start_date)}</span>
        {event.end_date && event.end_date !== event.start_date && (
          <span className="text-gray-600 block text-xs">
            → {formatDate(event.end_date)}
          </span>
        )}
      </td>

      {/* Price */}
      <td className="px-4 py-3 hidden lg:table-cell">
        <span className="text-gray-400 text-xs">
          {formatPrice(event.price_min, event.price_max, event.currency)}
        </span>
      </td>

      {/* Link */}
      <td className="px-4 py-3 hidden sm:table-cell">
        {event.url ? (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Open
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : (
          <span className="text-gray-700 text-xs">—</span>
        )}
      </td>
    </tr>
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
        Try adjusting the filters or trigger the cron job to fetch fresh data from KudaGo and OpenF1.
      </p>
    </div>
  );
}

import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Flight } from '@/lib/types';
import FlightCard from '../components/FlightCard';
import FlightFilters from '../components/FlightFilters';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// ─── data fetching ───────────────────────────────────────────────────────────

interface FetchFlightsOptions {
  country?: string;
  directOnly?: boolean;
  maxPrice?: number;
}

async function fetchFlights(opts: FetchFlightsOptions) {
  let query = supabase
    .from('flights')
    .select('*', { count: 'exact' })
    .gte('departure_date', new Date().toISOString().slice(0, 10))
    .order('price', { ascending: true });

  if (opts.country) query = query.eq('destination_country', opts.country);
  if (opts.directOnly) query = query.eq('is_direct', true);
  if (opts.maxPrice) query = query.lte('price', opts.maxPrice);

  const { data, count, error } = await query;

  if (error) {
    console.error('Flights query error:', error.message);
    return { flights: [], totalCount: 0, cheapest: null, destinations: 0 };
  }

  const flights = (data as Flight[]) ?? [];
  const cheapest = flights.length > 0 ? flights[0].price : null;

  // Count unique destinations
  const uniqueDests = new Set(flights.map(f => f.destination));

  return {
    flights,
    totalCount: count ?? 0,
    cheapest,
    destinations: uniqueDests.size,
  };
}

// ─── page ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: {
    country?: string;
    direct?: string;
    maxprice?: string;
  };
}

export default async function FlightsPage({ searchParams }: PageProps) {
  const country = searchParams.country ?? '';
  const directOnly = searchParams.direct === 'true';
  const maxPrice = searchParams.maxprice ? parseInt(searchParams.maxprice, 10) : undefined;

  const { flights, totalCount, cheapest, destinations } = await fetchFlights({
    country: country || undefined,
    directOnly: directOnly || undefined,
    maxPrice,
  });

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <StatCard
          label="Flights"
          value={totalCount.toLocaleString('en')}
          accent="text-gray-100"
        />
        <StatCard
          label="Cheapest"
          value={cheapest ? `${cheapest.toLocaleString('ru-RU')} ₽` : '—'}
          accent="text-emerald-400"
        />
        <StatCard
          label="Destinations"
          value={String(destinations)}
          accent="text-blue-400"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Filters */}
      <Suspense>
        <FlightFilters
          currentCountry={country}
          currentDirect={directOnly}
          currentMaxPrice={searchParams.maxprice ?? ''}
        />
      </Suspense>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-100">
          Flights from Moscow
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {totalCount} result{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </h1>
      </div>

      {/* Grid */}
      {flights.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-8 py-16 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-2xl">✈️</span>
          </div>
          <p className="text-gray-300 font-medium">No flights found</p>
          <p className="text-sm text-gray-600 max-w-sm">
            Try adjusting the filters or wait for the next cron run to fetch fresh prices.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {flights.map((flight, i) => (
            <FlightCard key={`${flight.origin}-${flight.destination}-${flight.departure_date}-${i}`} flight={flight} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── sub-components ──────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  accent,
  className = '',
}: {
  label: string;
  value: string;
  accent: string;
  className?: string;
}) {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex flex-col gap-1 ${className}`}>
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-xl font-bold ${accent}`}>{value}</span>
    </div>
  );
}

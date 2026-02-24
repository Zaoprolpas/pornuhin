import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Vacancy } from '@/lib/types';
import GigCard from '../components/GigCard';
import GigFilters from '../components/GigFilters';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// ─── data fetching ───────────────────────────────────────────────────────────

interface FetchGigsOptions {
  schedule?: string;
  noExp?: boolean;
  minSalary?: number;
}

async function fetchGigs(opts: FetchGigsOptions) {
  let query = supabase
    .from('vacancies')
    .select('*', { count: 'exact' })
    .order('salary_from', { ascending: false, nullsFirst: false });

  if (opts.schedule) query = query.eq('schedule', opts.schedule);
  if (opts.noExp) query = query.eq('experience', 'noExperience');
  if (opts.minSalary) query = query.gte('salary_from', opts.minSalary);

  const { data, count, error } = await query;

  if (error) {
    console.error('Vacancies query error:', error.message);
    return { vacancies: [], totalCount: 0, avgSalary: null, companies: 0 };
  }

  const vacancies = (data as Vacancy[]) ?? [];

  // Compute avg salary
  const salaries = vacancies
    .map(v => v.salary_from ?? v.salary_to)
    .filter((s): s is number => s !== null);
  const avgSalary = salaries.length > 0
    ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length)
    : null;

  // Unique companies
  const uniqueCompanies = new Set(vacancies.map(v => v.company));

  return {
    vacancies,
    totalCount: count ?? 0,
    avgSalary,
    companies: uniqueCompanies.size,
  };
}

// ─── page ────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: {
    schedule?: string;
    noexp?: string;
    minsalary?: string;
  };
}

export default async function GigsPage({ searchParams }: PageProps) {
  const schedule = searchParams.schedule ?? '';
  const noExp = searchParams.noexp === 'true';
  const minSalary = searchParams.minsalary ? parseInt(searchParams.minsalary, 10) : undefined;

  const { vacancies, totalCount, avgSalary, companies } = await fetchGigs({
    schedule: schedule || undefined,
    noExp: noExp || undefined,
    minSalary,
  });

  return (
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-5">
      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <StatCard
          label="Side Gigs"
          value={totalCount.toLocaleString('en')}
          accent="text-gray-100"
        />
        <StatCard
          label="Avg Salary"
          value={avgSalary ? `${avgSalary.toLocaleString('ru-RU')} ₽` : '—'}
          accent="text-emerald-400"
        />
        <StatCard
          label="Companies"
          value={String(companies)}
          accent="text-blue-400"
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Filters */}
      <Suspense>
        <GigFilters
          currentSchedule={schedule}
          currentNoExp={noExp}
          currentMinSalary={searchParams.minsalary ?? ''}
        />
      </Suspense>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-100">
          Side Gigs in Moscow
          {totalCount > 0 && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              {totalCount} result{totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </h1>
      </div>

      {/* Grid */}
      {vacancies.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-8 py-16 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
            <span className="text-2xl">💼</span>
          </div>
          <p className="text-gray-300 font-medium">No gigs found</p>
          <p className="text-sm text-gray-600 max-w-sm">
            Try adjusting the filters or wait for the next cron run to fetch fresh vacancies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {vacancies.map((vacancy) => (
            <GigCard key={vacancy.hh_id} vacancy={vacancy} />
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

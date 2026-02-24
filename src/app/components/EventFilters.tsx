'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

// ─── data ────────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { value: 'concert', label: 'Concerts', icon: '🎵' },
  { value: 'exhibition', label: 'Exhibitions', icon: '🎨' },
  { value: 'festival', label: 'Festivals', icon: '🎪' },
  { value: 'sport', label: 'Sport', icon: '⚽' },
  { value: 'theater', label: 'Theater', icon: '🎭' },
  { value: 'party', label: 'Party', icon: '🎉' },
  { value: 'fashion', label: 'Fashion', icon: '👗' },
  { value: 'other', label: 'Other', icon: '📌' },
];

const CATEGORY_COLORS: Record<string, string> = {
  concert: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  exhibition: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  festival: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  sport: 'bg-red-500/20 text-red-300 border-red-500/40',
  theater: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
  party: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  fashion: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  other: 'bg-gray-500/20 text-gray-300 border-gray-500/40',
};

const WHEN_OPTIONS = [
  { value: 'weekend', label: 'This weekend', icon: '⚡' },
  { value: 'week', label: 'This week', icon: '📅' },
  { value: 'month', label: 'This month', icon: '🗓' },
];

const COUNTRIES = [
  { value: 'Россия', label: 'Russia', icon: '🇷🇺' },
  { value: 'Turkey', label: 'Turkey', icon: '🇹🇷' },
  { value: 'Spain', label: 'Spain', icon: '🇪🇸' },
  { value: 'United Kingdom', label: 'UK', icon: '🇬🇧' },
  { value: 'Germany', label: 'Germany', icon: '🇩🇪' },
  { value: 'Italy', label: 'Italy', icon: '🇮🇹' },
  { value: 'Netherlands', label: 'Netherlands', icon: '🇳🇱' },
  { value: 'Austria', label: 'Austria', icon: '🇦🇹' },
  { value: 'United Arab Emirates', label: 'UAE', icon: '🇦🇪' },
  { value: 'Georgia', label: 'Georgia', icon: '🇬🇪' },
];

const SOURCES = [
  { value: 'kudago', label: 'KudaGo', dot: 'bg-blue-400' },
  { value: 'ticketmaster', label: 'Ticketmaster', dot: 'bg-green-400' },
  { value: 'openf1', label: 'OpenF1', dot: 'bg-red-400' },
];

// ─── component ───────────────────────────────────────────────────────────────

interface EventFiltersProps {
  currentSource: string;
  currentCategory: string;
  currentCity: string;
  currentWhen: string;
  currentFree: string;
  currentCountry: string;
}

export default function EventFilters({
  currentSource,
  currentCategory,
  currentCity,
  currentWhen,
  currentFree,
  currentCountry,
}: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const toggleParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      const current = params.get(key);
      if (current === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      params.delete('page');
      startTransition(() => router.push(`?${params.toString()}`));
    },
    [router, searchParams],
  );

  const updateCity = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set('city', value);
      } else {
        params.delete('city');
      }
      params.delete('page');
      startTransition(() => router.push(`?${params.toString()}`));
    },
    [router, searchParams],
  );

  const clearAll = useCallback(() => {
    startTransition(() => router.push('/'));
  }, [router]);

  const hasFilters =
    currentSource || currentCategory || currentCity || currentWhen || currentFree || currentCountry;

  const chipBase =
    'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer select-none active:scale-95';
  const chipInactive = 'bg-gray-800/80 text-gray-400 border-gray-700/60 hover:border-gray-600 hover:text-gray-300';

  return (
    <div className={`space-y-3 transition-opacity duration-150 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Row 1 — Categories */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-1 px-1 pb-0.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            onClick={() => toggleParam('category', c.value)}
            className={`${chipBase} ${
              currentCategory === c.value
                ? `${CATEGORY_COLORS[c.value]} border`
                : chipInactive
            }`}
          >
            <span className="text-base leading-none">{c.icon}</span>
            <span className="hidden sm:inline">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Row 2 — When + Free + Sources */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-1 px-1 pb-0.5">
        {WHEN_OPTIONS.map((w) => (
          <button
            key={w.value}
            onClick={() => toggleParam('when', w.value)}
            className={`${chipBase} ${
              currentWhen === w.value
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : chipInactive
            }`}
          >
            <span className="text-base leading-none">{w.icon}</span>
            {w.label}
          </button>
        ))}

        <span className="w-px bg-gray-700/60 self-stretch flex-shrink-0 mx-0.5" />

        <button
          onClick={() => toggleParam('free', 'true')}
          className={`${chipBase} ${
            currentFree === 'true'
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : chipInactive
          }`}
        >
          <span className="text-base leading-none">🎟</span>
          Free
        </button>

        <span className="w-px bg-gray-700/60 self-stretch flex-shrink-0 mx-0.5" />

        {SOURCES.map((s) => (
          <button
            key={s.value}
            onClick={() => toggleParam('source', s.value)}
            className={`${chipBase} ${
              currentSource === s.value
                ? 'bg-gray-700 text-gray-100 border-gray-600'
                : chipInactive
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${s.dot}`} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Row 3 — Countries + City search */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-1 px-1 pb-0.5 items-center">
        {COUNTRIES.map((c) => (
          <button
            key={c.value}
            onClick={() => toggleParam('country', c.value)}
            className={`${chipBase} ${
              currentCountry === c.value
                ? 'bg-gray-700 text-gray-100 border-gray-600'
                : chipInactive
            }`}
          >
            <span className="text-base leading-none">{c.icon}</span>
            {c.label}
          </button>
        ))}

        <span className="w-px bg-gray-700/60 self-stretch flex-shrink-0 mx-0.5" />

        {/* City search — compact inline */}
        <div className="relative flex-shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">🔍</span>
          <input
            type="text"
            placeholder="City..."
            defaultValue={currentCity}
            onBlur={(e) => {
              if (e.target.value !== currentCity) updateCity(e.target.value.trim());
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') updateCity((e.target as HTMLInputElement).value.trim());
            }}
            className="bg-gray-800/80 border border-gray-700/60 text-gray-100 text-sm rounded-xl pl-8 pr-3 py-2 w-32 sm:w-40 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
          />
        </div>
      </div>

      {/* Clear all */}
      {hasFilters && (
        <div className="flex">
          <button
            onClick={clearAll}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-2"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}

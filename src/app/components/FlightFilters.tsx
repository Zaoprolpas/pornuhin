'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

const COUNTRIES = [
  { value: 'Turkey', label: 'Turkey', icon: '🇹🇷' },
  { value: 'Spain', label: 'Spain', icon: '🇪🇸' },
  { value: 'United Kingdom', label: 'UK', icon: '🇬🇧' },
  { value: 'Germany', label: 'Germany', icon: '🇩🇪' },
  { value: 'Italy', label: 'Italy', icon: '🇮🇹' },
  { value: 'Netherlands', label: 'Netherlands', icon: '🇳🇱' },
  { value: 'Austria', label: 'Austria', icon: '🇦🇹' },
  { value: 'United Arab Emirates', label: 'UAE', icon: '🇦🇪' },
  { value: 'Georgia', label: 'Georgia', icon: '🇬🇪' },
  { value: 'France', label: 'France', icon: '🇫🇷' },
];

const PRICE_LIMITS = [
  { value: '15000', label: 'Up to 15k ₽' },
  { value: '25000', label: 'Up to 25k ₽' },
  { value: '40000', label: 'Up to 40k ₽' },
];

interface FlightFiltersProps {
  currentCountry: string;
  currentDirect: boolean;
  currentMaxPrice: string;
}

export default function FlightFilters({
  currentCountry,
  currentDirect,
  currentMaxPrice,
}: FlightFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const toggleParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (params.get(key) === value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      startTransition(() => router.push(`/flights?${params.toString()}`));
    },
    [router, searchParams],
  );

  const clearAll = useCallback(() => {
    startTransition(() => router.push('/flights'));
  }, [router]);

  const hasFilters = currentCountry || currentDirect || currentMaxPrice;

  const chipBase =
    'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer select-none active:scale-95';
  const chipInactive =
    'bg-gray-800/80 text-gray-400 border-gray-700/60 hover:border-gray-600 hover:text-gray-300';

  return (
    <div className={`space-y-3 transition-opacity duration-150 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Row 1 — Countries */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-1 px-1 pb-0.5">
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
      </div>

      {/* Row 2 — Direct + Price limits */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-1 px-1 pb-0.5">
        <button
          onClick={() => toggleParam('direct', 'true')}
          className={`${chipBase} ${
            currentDirect
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : chipInactive
          }`}
        >
          <span className="text-base leading-none">✈️</span>
          Direct only
        </button>

        <span className="w-px bg-gray-700/60 self-stretch flex-shrink-0 mx-0.5" />

        {PRICE_LIMITS.map((p) => (
          <button
            key={p.value}
            onClick={() => toggleParam('maxprice', p.value)}
            className={`${chipBase} ${
              currentMaxPrice === p.value
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : chipInactive
            }`}
          >
            <span className="text-base leading-none">💰</span>
            {p.label}
          </button>
        ))}
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

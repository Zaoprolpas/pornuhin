'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

const SCHEDULES = [
  { value: 'shift', label: 'Shift work', icon: '🔄' },
  { value: 'flexible', label: 'Flexible', icon: '⏰' },
  { value: 'remote', label: 'Remote', icon: '🏠' },
];

const SALARY_MINS = [
  { value: '3000', label: 'From 3k/day' },
  { value: '5000', label: 'From 5k/day' },
  { value: '80000', label: 'From 80k/mo' },
];

interface GigFiltersProps {
  currentSchedule: string;
  currentNoExp: boolean;
  currentMinSalary: string;
}

export default function GigFilters({
  currentSchedule,
  currentNoExp,
  currentMinSalary,
}: GigFiltersProps) {
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
      startTransition(() => router.push(`/gigs?${params.toString()}`));
    },
    [router, searchParams],
  );

  const clearAll = useCallback(() => {
    startTransition(() => router.push('/gigs'));
  }, [router]);

  const hasFilters = currentSchedule || currentNoExp || currentMinSalary;

  const chipBase =
    'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer select-none active:scale-95';
  const chipInactive =
    'bg-gray-800/80 text-gray-400 border-gray-700/60 hover:border-gray-600 hover:text-gray-300';

  return (
    <div className={`space-y-3 transition-opacity duration-150 ${isPending ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Row 1 — Schedule + No experience */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-1 px-1 pb-0.5">
        {SCHEDULES.map((s) => (
          <button
            key={s.value}
            onClick={() => toggleParam('schedule', s.value)}
            className={`${chipBase} ${
              currentSchedule === s.value
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : chipInactive
            }`}
          >
            <span className="text-base leading-none">{s.icon}</span>
            {s.label}
          </button>
        ))}

        <span className="w-px bg-gray-700/60 self-stretch flex-shrink-0 mx-0.5" />

        <button
          onClick={() => toggleParam('noexp', 'true')}
          className={`${chipBase} ${
            currentNoExp
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : chipInactive
          }`}
        >
          <span className="text-base leading-none">🎓</span>
          No experience
        </button>
      </div>

      {/* Row 2 — Salary minimums */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 -mx-1 px-1 pb-0.5">
        {SALARY_MINS.map((s) => (
          <button
            key={s.value}
            onClick={() => toggleParam('minsalary', s.value)}
            className={`${chipBase} ${
              currentMinSalary === s.value
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : chipInactive
            }`}
          >
            <span className="text-base leading-none">💰</span>
            {s.label}
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

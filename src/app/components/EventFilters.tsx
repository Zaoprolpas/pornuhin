'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'concert', label: 'Concert' },
  { value: 'exhibition', label: 'Exhibition' },
  { value: 'festival', label: 'Festival' },
  { value: 'sport', label: 'Sport' },
  { value: 'theater', label: 'Theater' },
  { value: 'party', label: 'Party' },
  { value: 'fashion', label: 'Fashion' },
  { value: 'other', label: 'Other' },
];

const SOURCES = [
  { value: '', label: 'All Sources' },
  { value: 'kudago', label: 'KudaGo' },
  { value: 'ticketmaster', label: 'Ticketmaster' },
  { value: 'openf1', label: 'OpenF1' },
];

interface EventFiltersProps {
  currentSource: string;
  currentCategory: string;
  currentCity: string;
  currentDateFrom: string;
  currentDateTo: string;
}

export default function EventFilters({
  currentSource,
  currentCategory,
  currentCity,
  currentDateFrom,
  currentDateTo,
}: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 whenever a filter changes
      params.delete('page');
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const clearAll = useCallback(() => {
    startTransition(() => {
      router.push('/');
    });
  }, [router]);

  const hasFilters =
    currentSource || currentCategory || currentCity || currentDateFrom || currentDateTo;

  return (
    <div
      className={`transition-opacity duration-150 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
    >
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 items-end">
        {/* Source filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Source
          </label>
          <select
            value={currentSource}
            onChange={(e) => updateParam('source', e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Category
          </label>
          <select
            value={currentCategory}
            onChange={(e) => updateParam('category', e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* City search */}
        <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            City
          </label>
          <input
            type="text"
            placeholder="Search city..."
            defaultValue={currentCity}
            onBlur={(e) => {
              if (e.target.value !== currentCity) {
                updateParam('city', e.target.value.trim());
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                updateParam('city', (e.target as HTMLInputElement).value.trim());
              }
            }}
            className="bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Date from */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            From
          </label>
          <input
            type="date"
            value={currentDateFrom}
            onChange={(e) => updateParam('from', e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
          />
        </div>

        {/* Date to */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            To
          </label>
          <input
            type="date"
            value={currentDateTo}
            onChange={(e) => updateParam('to', e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-100 text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent [color-scheme:dark]"
          />
        </div>

        {/* Clear button */}
        {hasFilters && (
          <button
            onClick={clearAll}
            className="self-end px-3 py-2 text-sm text-gray-400 hover:text-gray-200 border border-gray-700 hover:border-gray-500 rounded-lg transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}

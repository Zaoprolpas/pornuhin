'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page === 1) {
      params.delete('page');
    } else {
      params.set('page', String(page));
    }
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Build page number array with ellipsis
  const getPages = (): (number | '...')[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '...')[] = [1];
    if (currentPage > 3) pages.push('...');
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('...');
    pages.push(totalPages);
    return pages;
  };

  const pages = getPages();

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 transition-opacity ${isPending ? 'opacity-50' : ''}`}
    >
      <span className="text-sm text-gray-400">
        Showing{' '}
        <span className="text-gray-200 font-medium">
          {startItem}–{endItem}
        </span>{' '}
        of{' '}
        <span className="text-gray-200 font-medium">{totalCount}</span> events
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-700 text-gray-400 hover:text-gray-100 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Prev
        </button>

        {pages.map((page, idx) =>
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-600">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={`min-w-[36px] px-2 py-1.5 text-sm rounded-md border transition-colors ${
                page === currentPage
                  ? 'bg-blue-600 border-blue-600 text-white font-medium'
                  : 'border-gray-700 text-gray-400 hover:text-gray-100 hover:border-gray-500'
              }`}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1.5 text-sm rounded-md border border-gray-700 text-gray-400 hover:text-gray-100 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
}

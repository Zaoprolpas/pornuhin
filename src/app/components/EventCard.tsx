import { Event } from '@/lib/types';

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
  if (min === null && max === null) return '';
  const symbol = currency === 'RUB' ? '₽' : currency;
  if (min !== null && max !== null && min !== max) {
    return `${min.toLocaleString('ru-RU')}–${max.toLocaleString('ru-RU')} ${symbol}`;
  }
  const value = min ?? max!;
  return `от ${value.toLocaleString('ru-RU')} ${symbol}`;
}

const SOURCE_STYLES: Record<string, { label: string; bg: string; dot: string }> = {
  kudago: { label: 'KudaGo', bg: 'bg-blue-900/80 text-blue-200', dot: 'bg-blue-400' },
  ticketmaster: { label: 'Ticketmaster', bg: 'bg-green-900/80 text-green-200', dot: 'bg-green-400' },
  openf1: { label: 'OpenF1', bg: 'bg-red-900/80 text-red-200', dot: 'bg-red-400' },
};

const CATEGORY_COLORS: Record<string, string> = {
  concert: 'bg-purple-900/60 text-purple-300 border-purple-700/50',
  exhibition: 'bg-amber-900/60 text-amber-300 border-amber-700/50',
  festival: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50',
  sport: 'bg-red-900/60 text-red-300 border-red-700/50',
  theater: 'bg-pink-900/60 text-pink-300 border-pink-700/50',
  party: 'bg-orange-900/60 text-orange-300 border-orange-700/50',
  fashion: 'bg-rose-900/60 text-rose-300 border-rose-700/50',
  other: 'bg-gray-800 text-gray-400 border-gray-700',
};

const FALLBACK_GRADIENTS: Record<string, string> = {
  kudago: 'from-blue-900/80 to-gray-900',
  ticketmaster: 'from-green-900/80 to-gray-900',
  openf1: 'from-red-900/80 to-gray-900',
};

export default function EventCard({ event }: { event: Event }) {
  const source = SOURCE_STYLES[event.source] ?? SOURCE_STYLES.kudago;
  const categoryColor = CATEGORY_COLORS[event.category ?? 'other'] ?? CATEGORY_COLORS.other;
  const price = formatPrice(event.price_min, event.price_max, event.currency);
  const fallbackGradient = FALLBACK_GRADIENTS[event.source] ?? 'from-gray-800 to-gray-900';

  return (
    <div className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-black/20 flex flex-col">
      {/* Image */}
      <div className="relative aspect-[16/10] overflow-hidden">
        {event.image_url ? (
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${fallbackGradient} flex items-center justify-center`}>
            <span className="text-4xl opacity-30">
              {event.category === 'concert' ? '♫' :
               event.category === 'sport' ? '⚽' :
               event.category === 'exhibition' ? '🎨' :
               event.category === 'festival' ? '🎪' :
               event.category === 'theater' ? '🎭' :
               '📅'}
            </span>
          </div>
        )}

        {/* Source badge overlay */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold backdrop-blur-sm ${source.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${source.dot}`} />
            {source.label}
          </span>
        </div>

        {/* Category badge overlay */}
        {event.category && (
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border capitalize backdrop-blur-sm ${categoryColor}`}>
              {event.category}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug">
          {event.title}
        </h3>

        <div className="flex flex-col gap-1 mt-auto">
          {/* Location */}
          {(event.city || event.country) && (
            <p className="text-xs text-gray-400 truncate">
              <span className="inline-block w-3.5 text-center mr-0.5">📍</span>
              {[event.city, event.country].filter(Boolean).join(', ')}
            </p>
          )}

          {/* Date */}
          <p className="text-xs text-gray-400">
            <span className="inline-block w-3.5 text-center mr-0.5">📅</span>
            {formatDate(event.start_date)}
            {event.end_date && event.end_date !== event.start_date && (
              <span className="text-gray-600"> → {formatDate(event.end_date)}</span>
            )}
          </p>

          {/* Price */}
          {price && (
            <p className="text-xs text-gray-400">
              <span className="inline-block w-3.5 text-center mr-0.5">💰</span>
              {price}
            </p>
          )}
        </div>

        {/* Link */}
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center justify-center gap-1.5 w-full px-3 py-1.5 text-xs font-medium text-blue-400 bg-blue-950/40 border border-blue-900/50 rounded-lg hover:bg-blue-900/40 hover:text-blue-300 transition-colors"
          >
            Open
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}

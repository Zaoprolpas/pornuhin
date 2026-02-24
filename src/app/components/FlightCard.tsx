import { Flight } from '@/lib/types';

const AIRLINE_NAMES: Record<string, string> = {
  SU: 'Aeroflot',
  S7: 'S7 Airlines',
  DP: 'Pobeda',
  UT: 'UTair',
  U6: 'Ural Airlines',
  TK: 'Turkish Airlines',
  PC: 'Pegasus',
  '2S': 'Star Lines',
  W6: 'Wizz Air',
  FR: 'Ryanair',
  EK: 'Emirates',
  FZ: 'flydubai',
  LH: 'Lufthansa',
  BA: 'British Airways',
  AF: 'Air France',
  AZ: 'ITA Airways',
  KL: 'KLM',
  OS: 'Austrian',
  VY: 'Vueling',
  IB: 'Iberia',
  A9: 'Georgian Airways',
};

const COUNTRY_FLAGS: Record<string, string> = {
  'Turkey': '🇹🇷',
  'Spain': '🇪🇸',
  'United Kingdom': '🇬🇧',
  'Germany': '🇩🇪',
  'Italy': '🇮🇹',
  'Netherlands': '🇳🇱',
  'Austria': '🇦🇹',
  'United Arab Emirates': '🇦🇪',
  'Georgia': '🇬🇪',
  'France': '🇫🇷',
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' ₽';
}

export default function FlightCard({ flight }: { flight: Flight }) {
  const airlineName = flight.airline ? (AIRLINE_NAMES[flight.airline] || flight.airline) : null;
  const flag = COUNTRY_FLAGS[flight.destination_country] || '✈️';

  return (
    <div className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-black/20 flex flex-col">
      {/* Top: Route + Price */}
      <div className="p-4 pb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <span className="text-base">{flag}</span>
            <span className="truncate">{flight.destination_city}, {flight.destination_country}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-200">MOW</span>
            <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            <span className="text-sm font-semibold text-gray-200">{flight.destination}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-emerald-400">{formatPrice(flight.price)}</div>
          {flight.trip_duration && (
            <div className="text-xs text-gray-500">{flight.trip_duration} days round trip</div>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {/* Direct / Transfer badge */}
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
          flight.is_direct
            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
            : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30'
        }`}>
          {flight.is_direct ? 'Direct' : 'Transfer'}
        </span>

        {/* Dates */}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700/50">
          📅 {formatDate(flight.departure_date)}
          {flight.return_date && (
            <span className="text-gray-600"> → {formatDate(flight.return_date)}</span>
          )}
        </span>

        {/* Airline */}
        {airlineName && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700/50">
            {airlineName}
          </span>
        )}
      </div>

      {/* CTA */}
      <div className="px-4 pb-4 mt-auto">
        {flight.link ? (
          <a
            href={flight.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 rounded-lg hover:bg-emerald-900/40 hover:text-emerald-300 transition-colors"
          >
            Buy on Aviasales
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : (
          <span className="block text-center text-xs text-gray-600 py-2">Price may have changed</span>
        )}
      </div>
    </div>
  );
}

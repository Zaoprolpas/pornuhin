import { Flight } from '../types';

const API_BASE = 'https://api.travelpayouts.com';
const ORIGIN = 'MOW';
const MARKER = '501939'; // Travelpayouts affiliate marker

// Destinations: cities with events in our DB → IATA codes
const DESTINATIONS: Array<{ iata: string; city: string; country: string }> = [
  { iata: 'IST', city: 'Istanbul', country: 'Turkey' },
  { iata: 'BCN', city: 'Barcelona', country: 'Spain' },
  { iata: 'LON', city: 'London', country: 'United Kingdom' },
  { iata: 'BER', city: 'Berlin', country: 'Germany' },
  { iata: 'ROM', city: 'Rome', country: 'Italy' },
  { iata: 'AMS', city: 'Amsterdam', country: 'Netherlands' },
  { iata: 'VIE', city: 'Vienna', country: 'Austria' },
  { iata: 'DXB', city: 'Dubai', country: 'United Arab Emirates' },
  { iata: 'TBS', city: 'Tbilisi', country: 'Georgia' },
  { iata: 'PAR', city: 'Paris', country: 'France' },
];

const MAX_FLIGHTS_PER_DEST = 5;

interface CheapTicket {
  airline: string;
  departure_at: string;
  return_at: string;
  expires_at: string;
  price: number;
  flight_number: number;
  duration: number;
  duration_to: number;
  duration_back: number;
}

interface CheapResponse {
  success: boolean;
  currency: string;
  data: Record<string, Record<string, CheapTicket>>;
}

function buildAffiliateLink(origin: string, dest: string, departDate: string, returnDate: string | null): string {
  const depart = departDate.slice(0, 10);
  let url = `https://www.aviasales.ru/search/${origin}${depart.replace(/-/g, '')}${dest}`;
  if (returnDate) {
    url += `${returnDate.slice(0, 10).replace(/-/g, '')}`;
  }
  url += `1?marker=${MARKER}`;
  return url;
}

async function fetchDestinationFlights(
  dest: typeof DESTINATIONS[number],
  token: string,
): Promise<Flight[]> {
  const flights: Flight[] = [];

  try {
    const params = new URLSearchParams({
      origin: ORIGIN,
      destination: dest.iata,
      currency: 'rub',
    });

    const response = await fetch(`${API_BASE}/v1/prices/cheap?${params}`, {
      headers: { 'X-Access-Token': token },
    });

    if (!response.ok) {
      console.warn(`Aviasales ${dest.city}: HTTP ${response.status}`);
      return flights;
    }

    const data: CheapResponse = await response.json();

    if (!data.success || !data.data[dest.iata]) {
      return flights;
    }

    const tickets = data.data[dest.iata];
    // tickets is { "0": {...}, "1": {...}, "2": {...} } keyed by number of stops
    const allTickets: Array<{ ticket: CheapTicket; stops: number }> = [];
    for (const [stops, ticket] of Object.entries(tickets)) {
      allTickets.push({ ticket, stops: Number(stops) });
    }

    // Sort by price, take top N
    allTickets.sort((a, b) => a.ticket.price - b.ticket.price);

    for (const { ticket, stops } of allTickets.slice(0, MAX_FLIGHTS_PER_DEST)) {
      const departDate = ticket.departure_at.slice(0, 10);
      const returnDate = ticket.return_at ? ticket.return_at.slice(0, 10) : null;

      // Calculate trip duration in days
      let tripDuration: number | null = null;
      if (returnDate) {
        const diff = new Date(returnDate).getTime() - new Date(departDate).getTime();
        tripDuration = Math.round(diff / (1000 * 60 * 60 * 24));
      }

      flights.push({
        origin: ORIGIN,
        destination: dest.iata,
        destination_city: dest.city,
        destination_country: dest.country,
        price: ticket.price,
        airline: ticket.airline || null,
        departure_date: departDate,
        return_date: returnDate,
        trip_duration: tripDuration,
        is_direct: stops === 0,
        link: buildAffiliateLink(ORIGIN, dest.iata, departDate, returnDate),
      });
    }
  } catch (error) {
    console.warn(
      `Error fetching flights to ${dest.city}:`,
      error instanceof Error ? error.message : String(error),
    );
  }

  return flights;
}

export async function fetchAviasalesFlights(): Promise<Flight[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) {
    console.warn('TRAVELPAYOUTS_TOKEN not set, skipping Aviasales fetch');
    return [];
  }

  const allFlights: Flight[] = [];

  for (const dest of DESTINATIONS) {
    const flights = await fetchDestinationFlights(dest, token);
    allFlights.push(...flights);
    // Rate limit: 60 req/min, we make 10 requests → 300ms is safe
    await new Promise((r) => setTimeout(r, 300));
  }

  // Sort by price, cap at 50
  allFlights.sort((a, b) => a.price - b.price);
  const result = allFlights.slice(0, 50);

  console.log(`Total flights fetched from Aviasales: ${result.length}`);
  return result;
}

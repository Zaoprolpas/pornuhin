import { Event } from '../types';

const BASE_URL = 'https://app.ticketmaster.com/discovery/v2/events.json';

// Countries relevant to the travel platform's CIS audience
const COUNTRIES = [
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'TR', name: 'Turkey' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GE', name: 'Georgia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'AT', name: 'Austria' },
];

// Map Ticketmaster segment names to our categories
const CATEGORY_MAP: Record<string, Event['category']> = {
  'Music': 'concert',
  'Sports': 'sport',
  'Arts & Theatre': 'theater',
  'Film': 'other',
  'Miscellaneous': 'other',
};

function mapCategory(classifications: any[] | undefined): Event['category'] {
  if (!classifications || classifications.length === 0) return 'other';
  const segment = classifications[0]?.segment?.name;
  if (!segment) return 'other';
  return CATEGORY_MAP[segment] || 'other';
}

function buildTags(event: any): string[] {
  const tags: string[] = [];
  const cls = event.classifications?.[0];
  if (cls?.segment?.name) tags.push(cls.segment.name.toLowerCase());
  if (cls?.genre?.name && cls.genre.name !== 'Undefined') tags.push(cls.genre.name.toLowerCase());
  if (cls?.subGenre?.name && cls.subGenre.name !== 'Undefined') tags.push(cls.subGenre.name.toLowerCase());
  return tags;
}

function parseEvent(raw: any, countryName: string): Event | null {
  try {
    if (!raw.id || !raw.name || !raw.dates?.start?.dateTime) {
      return null;
    }

    const venue = raw._embedded?.venues?.[0];
    const priceRanges = raw.priceRanges?.[0];
    const image = raw.images?.find((img: any) => img.width >= 500) || raw.images?.[0];

    return {
      source: 'ticketmaster',
      source_id: raw.id,
      title: raw.name,
      description: raw.info || raw.pleaseNote || null,
      category: mapCategory(raw.classifications),
      city: venue?.city?.name || null,
      country: countryName,
      venue: venue?.name || null,
      address: venue?.address?.line1 || null,
      start_date: raw.dates.start.dateTime,
      end_date: raw.dates.end?.dateTime || null,
      is_permanent: false,
      url: raw.url || null,
      image_url: image?.url || null,
      price_min: priceRanges?.min || null,
      price_max: priceRanges?.max || null,
      currency: priceRanges?.currency || 'EUR',
      tags: buildTags(raw),
      raw_data: raw as unknown as Record<string, unknown>,
    };
  } catch (error) {
    console.warn(`Error parsing TM event ${raw?.id}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCountryEvents(countryCode: string, countryName: string, apiKey: string): Promise<Event[]> {
  const events: Event[] = [];
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  const sixtyDays = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().replace(/\.\d+Z$/, 'Z');

  const maxPages = 3; // 3 pages × 100 = up to 300 events per country

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      apikey: apiKey,
      countryCode,
      startDateTime: now,
      endDateTime: sixtyDays,
      size: '100',
      page: String(page),
      sort: 'date,asc',
    });

    try {
      const response = await fetch(`${BASE_URL}?${params}`);

      if (response.status === 429) {
        console.warn(`Rate limited on ${countryName}, waiting 2s...`);
        await delay(2000);
        continue;
      }

      if (!response.ok) {
        console.warn(`Ticketmaster ${countryName} page ${page}: HTTP ${response.status}`);
        break;
      }

      const data = await response.json();
      const rawEvents = data._embedded?.events || [];

      for (const raw of rawEvents) {
        const event = parseEvent(raw, countryName);
        if (event) events.push(event);
      }

      // Stop if no more pages
      const totalPages = data.page?.totalPages || 0;
      if (page + 1 >= totalPages) break;

      // Rate limit: max 5 req/sec → 200ms between requests
      await delay(220);
    } catch (error) {
      console.warn(`Error fetching ${countryName} page ${page}:`, error instanceof Error ? error.message : String(error));
      break;
    }
  }

  console.log(`Fetched ${events.length} events from ${countryName} (${countryCode})`);
  return events;
}

export async function fetchTicketmasterEvents(): Promise<Event[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    console.warn('TICKETMASTER_API_KEY not set, skipping Ticketmaster fetch');
    return [];
  }

  const allEvents: Event[] = [];

  for (const { code, name } of COUNTRIES) {
    const events = await fetchCountryEvents(code, name, apiKey);
    allEvents.push(...events);
    // Small delay between countries to be polite
    await delay(300);
  }

  console.log(`Total events fetched from Ticketmaster: ${allEvents.length}`);
  return allEvents;
}

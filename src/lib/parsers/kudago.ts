import { Event } from '../types';

interface KudaGoEventResponse {
  id: number;
  title: string;
  description: string | null;
  dates: Array<{
    start: number; // Unix timestamp
    end: number | null;
  }>;
  place: {
    title: string;
    address: string;
  } | null;
  price: string | null;
  images: Array<{
    image: string;
  }> | null;
  categories: string[];
  site_url: string | null;
  tags: string[];
}

interface KudaGoResponse {
  count: number;
  next: string | null;
  results: KudaGoEventResponse[];
}

const CITIES = {
  msk: 'Москва',
  spb: 'Санкт-Петербург',
  ekb: 'Екатеринбург',
  kzn: 'Казань',
  nsk: 'Новосибирск',
};

const CATEGORY_MAP: Record<string, Event['category']> = {
  concert: 'concert',
  exhibition: 'exhibition',
  festival: 'festival',
  theater: 'theater',
  party: 'party',
  fashion: 'fashion',
};

function mapCategory(categories: string[]): Event['category'] {
  if (!categories || categories.length === 0) {
    return null;
  }

  for (const category of categories) {
    const mapped = CATEGORY_MAP[category.toLowerCase()];
    if (mapped) {
      return mapped;
    }
  }

  return 'other';
}

function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  return html.replace(/<[^>]*>/g, '').trim() || null;
}

function extractPrice(priceString: string | null): {
  min: number | null;
  max: number | null;
} {
  if (!priceString) {
    return { min: null, max: null };
  }

  const numbers = priceString.match(/\d+/g);
  if (!numbers || numbers.length === 0) {
    return { min: null, max: null };
  }

  const parsed = numbers.map(Number);
  if (parsed.length === 1) {
    return { min: parsed[0], max: null };
  }

  return { min: Math.min(...parsed), max: Math.max(...parsed) };
}

function isPermanentDate(startUnix: number, endUnix: number | null): boolean {
  const startYear = new Date(startUnix * 1000).getFullYear();
  const endYear = endUnix ? new Date(endUnix * 1000).getFullYear() : null;
  // KudaGo uses years like 0001 and 9998 for permanent events
  return startYear < 1900 || (endYear !== null && endYear > 9000);
}

function findUpcomingDates(
  dates: Array<{ start: number; end: number | null }>,
  maxCount = 5
): Array<{ start: string; end: string | null }> {
  const now = Date.now();
  return dates
    .filter(d => d.start * 1000 >= now)
    .sort((a, b) => a.start - b.start)
    .slice(0, maxCount)
    .map(d => ({
      start: new Date(d.start * 1000).toISOString(),
      end: d.end ? new Date(d.end * 1000).toISOString() : null,
    }));
}

function parseEvent(rawEvent: KudaGoEventResponse, city: string): Event | null {
  try {
    // Validate required fields
    if (!rawEvent.id || !rawEvent.title || !rawEvent.dates || rawEvent.dates.length === 0) {
      console.warn(`Skipping event with missing required fields: ${rawEvent.title || 'Unknown'}`);
      return null;
    }

    const firstDate = rawEvent.dates[0];
    const permanent = isPermanentDate(firstDate.start, firstDate.end);

    // Compute upcoming dates from the full dates array
    const upcoming = permanent ? [] : findUpcomingDates(rawEvent.dates);

    // Skip non-permanent events with no future dates
    if (!permanent && upcoming.length === 0) {
      return null;
    }

    const nextOccurrence = upcoming.length > 0 ? upcoming[0].start : null;

    // Keep start_date for backward compat (use first date from API)
    const startDate = permanent
      ? new Date().toISOString()
      : new Date(firstDate.start * 1000).toISOString();
    const endDate = permanent
      ? null
      : firstDate.end ? new Date(firstDate.end * 1000).toISOString() : null;

    const priceData = extractPrice(rawEvent.price);
    const category = mapCategory(rawEvent.categories || []);

    const event: Event = {
      source: 'kudago',
      source_id: String(rawEvent.id),
      title: rawEvent.title,
      description: stripHtml(rawEvent.description),
      category,
      city,
      country: 'Россия',
      venue: rawEvent.place?.title || null,
      address: rawEvent.place?.address || null,
      start_date: startDate,
      end_date: endDate,
      is_permanent: permanent,
      url: rawEvent.site_url || null,
      image_url: rawEvent.images?.[0]?.image || null,
      price_min: priceData.min,
      price_max: priceData.max,
      currency: 'RUB',
      tags: rawEvent.tags || [],
      raw_data: rawEvent as unknown as Record<string, unknown>,
      next_occurrence: nextOccurrence,
      upcoming_dates: upcoming.length > 0 ? upcoming : null,
    };

    return event;
  } catch (error) {
    console.warn(`Error parsing event: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function fetchPagedEvents(
  citySlug: string,
  cityName: string,
  pageUrl: string,
  pageCount: number,
  maxPages: number
): Promise<Event[]> {
  const events: Event[] = [];

  try {
    const response = await fetch(pageUrl);

    if (!response.ok) {
      console.warn(`Failed to fetch events for ${cityName}: ${response.status}`);
      return events;
    }

    const data: KudaGoResponse = await response.json();

    // Parse events from this page
    if (data.results && Array.isArray(data.results)) {
      for (const rawEvent of data.results) {
        const event = parseEvent(rawEvent, cityName);
        if (event) {
          events.push(event);
        }
      }
    }

    // Follow pagination if not at max pages
    if (data.next && pageCount < maxPages) {
      const nextEvents = await fetchPagedEvents(citySlug, cityName, data.next, pageCount + 1, maxPages);
      events.push(...nextEvents);
    }

    return events;
  } catch (error) {
    console.warn(`Error fetching events for ${cityName}: ${error instanceof Error ? error.message : String(error)}`);
    return events;
  }
}

async function fetchCityEvents(citySlug: string, cityName: string): Promise<Event[]> {
  const now = Math.floor(Date.now() / 1000);
  const thirtyDaysFromNow = now + 30 * 24 * 60 * 60;

  const params = new URLSearchParams({
    actual_since: String(now),
    actual_until: String(thirtyDaysFromNow),
    fields: 'id,title,description,dates,place,price,images,categories,site_url,tags',
    expand: 'place',
    page_size: '100',
    text_format: 'plain',
    location: citySlug,
  });

  const url = `https://kudago.com/public-api/v1.4/events/?${params.toString()}`;

  const events = await fetchPagedEvents(citySlug, cityName, url, 1, 3);
  console.log(`Fetched ${events.length} events from ${cityName}`);

  return events;
}

export async function fetchKudaGoEvents(): Promise<Event[]> {
  const allEvents: Event[] = [];

  const cityEntries = Object.entries(CITIES);

  for (const [citySlug, cityName] of cityEntries) {
    const events = await fetchCityEvents(citySlug, cityName);
    allEvents.push(...events);
  }

  console.log(`Total events fetched from KudaGo: ${allEvents.length}`);

  return allEvents;
}

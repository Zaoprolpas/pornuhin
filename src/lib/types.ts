export interface Event {
  source: 'kudago' | 'ticketmaster' | 'openf1';
  source_id: string;
  title: string;
  description: string | null;
  category: 'concert' | 'exhibition' | 'festival' | 'sport' | 'fashion' | 'theater' | 'party' | 'other' | null;
  city: string | null;
  country: string;
  venue: string | null;
  address: string | null;
  start_date: string; // ISO 8601
  end_date: string | null;
  is_permanent: boolean;
  url: string | null;
  image_url: string | null;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  tags: string[];
  raw_data: Record<string, unknown>;
}

export interface FetchResult {
  source: string;
  fetched: number;
  errors: number;
  timestamp: string;
}

export interface CronResponse {
  success: boolean;
  results: FetchResult[];
  total_events: number;
  duration_ms: number;
}

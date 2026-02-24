import { Event } from '../types';

interface Meeting {
  meeting_key: number;
  meeting_name: string;
  location: string | null;
  country_name: string | null;
  country_code: string | null;
  circuit_short_name: string | null;
  date_start: string;
  date_end: string | null;
}

interface Session {
  session_key: number;
  meeting_key: number;
  session_type: string;
  session_name: string;
  date_start: string;
  date_end: string;
}

const BASE_URL = 'https://api.openf1.org/v1';

async function fetchWithFallback(
  endpoint: string,
  year: number,
  fallbackYear?: number
): Promise<any[]> {
  try {
    const url = `${BASE_URL}${endpoint}?year=${year}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.warn(
      `Failed to fetch from ${endpoint} for year ${year}:`,
      error instanceof Error ? error.message : 'Unknown error'
    );

    // Try fallback year if provided
    if (fallbackYear) {
      try {
        const fallbackUrl = `${BASE_URL}${endpoint}?year=${fallbackYear}`;
        const response = await fetch(fallbackUrl);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log(
          `Successfully fetched from fallback year ${fallbackYear}`
        );
        return Array.isArray(data) ? data : [];
      } catch (fallbackError) {
        console.warn(
          `Fallback also failed for year ${fallbackYear}:`,
          fallbackError instanceof Error ? fallbackError.message : 'Unknown error'
        );
      }
    }

    return [];
  }
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toISOString();
  } catch {
    return dateString;
  }
}

function buildSessionDescription(
  sessions: Session[],
  sessionsByType: Record<string, Session | undefined>
): string {
  const sessionEntries = [];

  const sessionTypes = ['Practice 1', 'Practice 2', 'Practice 3', 'Qualifying', 'Race', 'Sprint', 'Sprint Qualifying', 'Sprint Race'];

  for (const type of sessionTypes) {
    const sessionKey = type.toLowerCase().replace(/\s+/g, '_');
    const session = sessionsByType[sessionKey];

    if (session) {
      try {
        const date = new Date(session.date_start);
        const dateStr = date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        sessionEntries.push(`${type}: ${dateStr}`);
      } catch {
        sessionEntries.push(`${type}: ${session.date_start}`);
      }
    }
  }

  if (sessionEntries.length === 0) {
    return 'Formula 1 Grand Prix weekend';
  }

  return sessionEntries.join(', ');
}

function groupSessionsByType(sessions: Session[]): Record<string, Session | undefined> {
  const grouped: Record<string, Session | undefined> = {};

  for (const session of sessions) {
    const key = session.session_name.toLowerCase().replace(/\s+/g, '_');
    if (!grouped[key]) {
      grouped[key] = session;
    }
  }

  return grouped;
}

function getEarliestDate(sessions: Session[]): string {
  if (sessions.length === 0) return new Date().toISOString();

  const dates = sessions.map((s) => new Date(s.date_start).getTime());
  const earliest = new Date(Math.min(...dates));

  return earliest.toISOString();
}

function getLatestDate(sessions: Session[]): string {
  if (sessions.length === 0) return new Date().toISOString();

  const dates = sessions.map((s) => {
    const endDate = s.date_end || s.date_start;
    return new Date(endDate).getTime();
  });
  const latest = new Date(Math.max(...dates));

  return latest.toISOString();
}

export async function fetchF1Events(): Promise<Event[]> {
  const currentYear = new Date().getFullYear();
  const fallbackYear = currentYear - 1;

  console.log(
    `Fetching F1 events for year ${currentYear} (fallback: ${fallbackYear})`
  );

  // Fetch sessions and meetings with fallback
  const [sessions, meetings] = await Promise.all([
    fetchWithFallback('/sessions', currentYear, fallbackYear),
    fetchWithFallback('/meetings', currentYear, fallbackYear),
  ]);

  if (meetings.length === 0) {
    console.warn('No F1 meetings found');
    return [];
  }

  console.log(`Found ${meetings.length} meetings`);

  // Group sessions by meeting_key
  const sessionsByMeeting: Record<number, Session[]> = {};
  for (const session of sessions) {
    const meetingKey = session.meeting_key;
    if (!sessionsByMeeting[meetingKey]) {
      sessionsByMeeting[meetingKey] = [];
    }
    sessionsByMeeting[meetingKey].push(session);
  }

  // Create events for each meeting
  const events: Event[] = [];

  for (const meeting of meetings) {
    try {
      const meetingKey = meeting.meeting_key;
      const meetingSessions = sessionsByMeeting[meetingKey] || [];

      // Determine the year from session dates or use current year
      let year = currentYear;
      if (meetingSessions.length > 0) {
        const sessionYear = new Date(meetingSessions[0].date_start).getFullYear();
        year = sessionYear;
      }

      // Build session description
      const sessionsByType = groupSessionsByType(meetingSessions);
      const description = buildSessionDescription(
        meetingSessions,
        sessionsByType
      );

      // Get date range
      const startDate = getEarliestDate(meetingSessions);
      const endDate = getLatestDate(meetingSessions);

      // Build tags
      const tags = ['f1', 'formula1', 'motorsport'];
      if (meeting.country_name) {
        tags.push(meeting.country_name.toLowerCase().replace(/\s+/g, '_'));
      }

      // Create event
      const event: Event = {
        source: 'openf1',
        source_id: String(meetingKey),
        title: `F1 Grand Prix — ${meeting.meeting_name}`,
        description,
        category: 'sport',
        city: meeting.location || null,
        country: meeting.country_name || meeting.country_code || '',
        venue: meeting.circuit_short_name || null,
        address: null,
        start_date: startDate,
        end_date: endDate,
        is_permanent: false,
        url: `https://www.formula1.com/en/racing/${year}`,
        image_url: null,
        price_min: null,
        price_max: null,
        currency: 'USD',
        tags,
        raw_data: {
          meeting,
          sessions: meetingSessions,
        },
      };

      events.push(event);
    } catch (error) {
      console.warn(
        `Error processing meeting ${meeting.meeting_key}:`,
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  console.log(`Created ${events.length} events from F1 API`);

  return events;
}

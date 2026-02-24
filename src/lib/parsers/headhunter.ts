import { Vacancy } from '../types';

const API_BASE = 'https://api.hh.ru';
const MOSCOW_AREA_ID = '1';

// We fetch part-time + project + shift + flexible jobs — typical "подработка"
const QUERIES = [
  { employment: 'part', schedule: 'shift' },
  { employment: 'part', schedule: 'flexible' },
  { employment: 'project', schedule: 'flexible' },
  { employment: 'part', schedule: 'remote' },
];

interface HHVacancy {
  id: string;
  name: string;
  employer: { name: string } | null;
  salary: { from: number | null; to: number | null; currency: string; gross: boolean } | null;
  schedule: { id: string; name: string } | null;
  employment: { id: string; name: string } | null;
  experience: { id: string; name: string } | null;
  area: { id: string; name: string } | null;
  address: { metro: { station_name: string } | null } | null;
  alternate_url: string;
  accept_temporary: boolean;
  published_at: string;
}

interface HHResponse {
  found: number;
  pages: number;
  per_page: number;
  page: number;
  items: HHVacancy[];
}

function parseVacancy(raw: HHVacancy): Vacancy | null {
  if (!raw.id || !raw.name || !raw.salary) return null;

  // Convert gross salary to net (approximate: -13% NDFL)
  const grossMultiplier = raw.salary.gross ? 0.87 : 1;
  const salaryFrom = raw.salary.from ? Math.round(raw.salary.from * grossMultiplier) : null;
  const salaryTo = raw.salary.to ? Math.round(raw.salary.to * grossMultiplier) : null;

  // Skip if no salary info at all
  if (salaryFrom === null && salaryTo === null) return null;

  return {
    hh_id: raw.id,
    title: raw.name,
    company: raw.employer?.name || 'Unknown',
    salary_from: salaryFrom,
    salary_to: salaryTo,
    currency: raw.salary.currency || 'RUR',
    schedule: raw.schedule?.id || null,
    employment: raw.employment?.id || null,
    experience: raw.experience?.id || null,
    city: raw.area?.name || 'Москва',
    metro_station: raw.address?.metro?.station_name || null,
    url: raw.alternate_url,
    accept_temporary: raw.accept_temporary ?? false,
    published_at: raw.published_at,
  };
}

async function fetchPage(params: URLSearchParams, page: number): Promise<HHVacancy[]> {
  params.set('page', String(page));

  try {
    const response = await fetch(`${API_BASE}/vacancies?${params}`, {
      headers: {
        'User-Agent': 'TravelDataHub/1.0 (api@traveldatahub.com)',
        'Accept': 'application/json',
      },
    });

    if (response.status === 429) {
      console.warn('hh.ru rate limited, waiting 2s...');
      await new Promise((r) => setTimeout(r, 2000));
      return [];
    }

    if (!response.ok) {
      console.warn(`hh.ru HTTP ${response.status}`);
      return [];
    }

    const data: HHResponse = await response.json();
    return data.items || [];
  } catch (error) {
    console.warn('hh.ru fetch error:', error instanceof Error ? error.message : String(error));
    return [];
  }
}

export async function fetchHeadHunterVacancies(): Promise<Vacancy[]> {
  const seen = new Set<string>();
  const allVacancies: Vacancy[] = [];

  for (const q of QUERIES) {
    const params = new URLSearchParams({
      area: MOSCOW_AREA_ID,
      employment: q.employment,
      schedule: q.schedule,
      only_with_salary: 'true',
      order_by: 'salary_desc',
      per_page: '100',
    });

    // Fetch 2 pages per query = up to 200 per combo
    for (let page = 0; page < 2; page++) {
      const items = await fetchPage(params, page);

      for (const raw of items) {
        if (seen.has(raw.id)) continue;
        seen.add(raw.id);

        const vacancy = parseVacancy(raw);
        if (vacancy) allVacancies.push(vacancy);
      }

      if (items.length < 100) break; // no more pages
      await new Promise((r) => setTimeout(r, 250));
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  // Sort by highest salary, cap at 200
  allVacancies.sort((a, b) => (b.salary_from ?? b.salary_to ?? 0) - (a.salary_from ?? a.salary_to ?? 0));
  const result = allVacancies.slice(0, 200);

  console.log(`Total vacancies fetched from hh.ru: ${result.length}`);
  return result;
}

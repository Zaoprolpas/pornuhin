import { Vacancy } from '@/lib/types';

const SCHEDULE_LABELS: Record<string, { label: string; color: string }> = {
  shift: { label: 'Shift', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  flexible: { label: 'Flexible', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
  remote: { label: 'Remote', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  fullDay: { label: 'Full day', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

const EMPLOYMENT_LABELS: Record<string, string> = {
  part: 'Part-time',
  project: 'Project',
  probation: 'Internship',
  full: 'Full-time',
};

const EXPERIENCE_LABELS: Record<string, { label: string; color: string }> = {
  noExperience: { label: 'No exp needed', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  between1And3: { label: '1-3 years', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  between3And6: { label: '3-6 years', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
  moreThan6: { label: '6+ years', color: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
};

function formatSalary(from: number | null, to: number | null, currency: string): string {
  const symbol = currency === 'RUR' || currency === 'RUB' ? '₽' : currency;
  if (from && to && from !== to) {
    return `${from.toLocaleString('ru-RU')} – ${to.toLocaleString('ru-RU')} ${symbol}`;
  }
  if (from) return `from ${from.toLocaleString('ru-RU')} ${symbol}`;
  if (to) return `up to ${to.toLocaleString('ru-RU')} ${symbol}`;
  return '—';
}

export default function GigCard({ vacancy }: { vacancy: Vacancy }) {
  const schedule = vacancy.schedule ? SCHEDULE_LABELS[vacancy.schedule] : null;
  const employment = vacancy.employment ? EMPLOYMENT_LABELS[vacancy.employment] : null;
  const experience = vacancy.experience ? EXPERIENCE_LABELS[vacancy.experience] : null;

  return (
    <div className="group bg-gray-900 border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all hover:shadow-lg hover:shadow-black/20 flex flex-col">
      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Title + Salary */}
        <div>
          <h3 className="text-sm font-semibold text-gray-100 line-clamp-2 leading-snug mb-1.5">
            {vacancy.title}
          </h3>
          <div className="text-lg font-bold text-emerald-400">
            {formatSalary(vacancy.salary_from, vacancy.salary_to, vacancy.currency)}
          </div>
        </div>

        {/* Company */}
        <p className="text-xs text-gray-400 truncate">
          <span className="inline-block w-3.5 text-center mr-0.5">🏢</span>
          {vacancy.company}
        </p>

        {/* Metro */}
        {vacancy.metro_station && (
          <p className="text-xs text-gray-400 truncate">
            <span className="inline-block w-3.5 text-center mr-0.5">🚇</span>
            {vacancy.metro_station}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {schedule && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${schedule.color}`}>
              {schedule.label}
            </span>
          )}
          {employment && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-gray-800 text-gray-400 border-gray-700/50">
              {employment}
            </span>
          )}
          {experience && experience.label === 'No exp needed' && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${experience.color}`}>
              {experience.label}
            </span>
          )}
          {vacancy.accept_temporary && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border bg-yellow-500/15 text-yellow-400 border-yellow-500/30">
              Temporary
            </span>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <a
          href={vacancy.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-blue-400 bg-blue-950/40 border border-blue-900/50 rounded-lg hover:bg-blue-900/40 hover:text-blue-300 transition-colors"
        >
          Apply on hh.ru
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}

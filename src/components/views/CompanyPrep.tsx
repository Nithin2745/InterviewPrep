'use client';

import { useStore } from '@/lib/store';
import { COMPANIES } from '@/lib/data/companies';

export function CompanyPrep() {
  const { currentCompany, setCompany, completed, setProblem, toggleProblem } = useStore();

  const c = COMPANIES[currentCompany];
  if (!c) return null;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold mb-1">🏢 Company-Wise Prep</h1>
        <p className="text-sm text-[var(--muted)]">Target {Object.keys(COMPANIES).length} companies with curated problem sets and round-by-round strategy.</p>
      </div>

      {/* Company tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {Object.entries(COMPANIES).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setCompany(k)}
            className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
              currentCompany === k
                ? 'border-transparent'
                : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]'
            }`}
            style={currentCompany === k ? { background: 'var(--accent)', color: 'var(--accent-text)', boxShadow: 'var(--glow)' } : {}}
          >
            {v.name}
          </button>
        ))}
      </div>

      {/* Company info */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1" style={{ background: c.color }} />
        <h3 className="text-base font-bold mb-2" style={{ color: c.color }}>{c.name}</h3>
        <p className="text-xs text-[var(--muted)] leading-relaxed mb-3">{c.desc}</p>
        <div className="text-xs text-[var(--muted)] mb-2">
          Round pattern: <span className="text-[var(--text)] font-semibold">{c.round}</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {c.tags.map((t) => (
            <span key={t} className="text-[10px] px-2.5 py-1 rounded-full border border-[var(--border)] text-[var(--muted)] bg-[var(--card2)] font-medium">{t}</span>
          ))}
        </div>
      </div>

      {/* Problems */}
      <h2 className="text-base font-bold mb-3 pb-2.5 border-b border-[var(--border)]">📌 Frequently Asked Problems</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {c.problems.map((p, i) => {
          const isDone = completed.includes(p.id);
          return (
            <div
              key={p.id}
              className={`card-in group flex items-center gap-3 p-3 rounded-xl border bg-[var(--card)] transition-all hover:border-[var(--accent)] cursor-pointer ${isDone ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${0.03 * i}s` }}
              onClick={() => setProblem(p.id)}
            >
              <button
                onClick={(e) => { e.stopPropagation(); toggleProblem(p.id); }}
                className="w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all hover:scale-110"
                style={{ borderColor: isDone ? 'var(--green)' : 'var(--border)', background: isDone ? 'var(--green)' : 'transparent' }}
              >
                {isDone && (
                  <svg width="11" height="9" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <span className={`flex-1 text-sm font-medium ${isDone ? 'line-through' : ''}`}>{p.name}</span>
              {p.pattern && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                  {p.pattern}
                </span>
              )}
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${p.diff === 'easy' ? 'text-[var(--green)]' : p.diff === 'medium' ? 'text-[var(--amber)]' : 'text-[var(--red)]'}`} style={{
                background: p.diff === 'easy' ? 'color-mix(in srgb, var(--green) 13%, transparent)' : p.diff === 'medium' ? 'color-mix(in srgb, var(--amber) 13%, transparent)' : 'color-mix(in srgb, var(--red) 13%, transparent)',
              }}>
                {p.diff}
              </span>
              <a
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-[10px] font-bold px-2.5 py-1 rounded-md border border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all whitespace-nowrap"
              >
                LC ↗
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

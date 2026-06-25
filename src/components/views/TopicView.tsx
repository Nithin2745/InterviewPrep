'use client';

import { useStore } from '@/lib/store';
import { TOPICS } from '@/lib/data/topics';
import { useMemo } from 'react';
import { Search } from 'lucide-react';

export function TopicView() {
  const {
    currentTopic,
    completed,
    filter,
    setFilter,
    searchQuery,
    setSearch,
    setProblem,
    toggleProblem,
  } = useStore();

  const t = TOPICS[currentTopic];

  const probs = useMemo(() => {
    if (!t) return [];
    let result = t.problems;
    if (filter === 'easy') result = result.filter((p) => p.diff === 'easy');
    else if (filter === 'medium') result = result.filter((p) => p.diff === 'medium');
    else if (filter === 'hard') result = result.filter((p) => p.diff === 'hard');
    else if (filter === 'done') result = result.filter((p) => completed.includes(p.id));
    else if (filter === 'todo') result = result.filter((p) => !completed.includes(p.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.pattern.toLowerCase().includes(q));
    }
    return result;
  }, [t, filter, completed, searchQuery]);

  if (!t) return null;

  const done = t.problems.filter((p) => completed.includes(p.id)).length;
  const pct = Math.round((done / t.problems.length) * 100);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-3.5 h-3.5 rounded-full" style={{ background: t.color, boxShadow: `0 0 12px ${t.color}` }} />
        <h1 className="text-2xl font-extrabold">{t.name}</h1>
        <span className="text-xs px-3 py-1 rounded-full bg-[var(--card2)] text-[var(--muted)] font-semibold">
          {done}/{t.problems.length} done · {pct}%
        </span>
      </div>
      <p className="text-sm text-[var(--muted)] mb-4">{t.blurb}</p>
      <p className="text-xs text-[var(--muted)] mb-4">
        👆 Tap any problem to open its detail page with hints, pseudocode, and solutions in your preferred language.
      </p>

      {/* Progress bar */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-3 mb-4">
        <div className="h-2.5 bg-[var(--card2)] rounded-md overflow-hidden">
          <div className="h-full transition-all duration-1000" style={{ width: `${pct}%`, background: t.color }} />
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
        <input
          type="text"
          placeholder={`Search problems or patterns in ${t.name}...`}
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-xl text-sm py-2.5 pl-10 pr-4 focus:outline-none focus:border-[var(--accent)] transition-all"
          style={{ color: 'var(--text)' }}
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'easy', 'medium', 'hard', 'done', 'todo'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
              filter === f
                ? 'border-transparent'
                : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]'
            }`}
            style={filter === f ? { background: 'var(--accent)', color: 'var(--accent-text)', boxShadow: 'var(--glow)' } : {}}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Problem list — now as clickable cards (NO flipcards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
        {probs.length === 0 ? (
          <div className="col-span-full text-center py-10 text-[var(--muted)] text-sm">
            No problems match your filter. Try a different filter or search term.
          </div>
        ) : (
          probs.map((p, i) => {
            const isDone = completed.includes(p.id);
            return (
              <div
                key={p.id}
                className={`card-in group flex items-center gap-3 p-3 rounded-xl border bg-[var(--card)] transition-all hover:border-[var(--accent)] cursor-pointer ${
                  isDone ? 'opacity-60' : ''
                }`}
                style={{ animationDelay: `${0.03 * i}s` }}
                onClick={() => setProblem(p.id)}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProblem(p.id);
                  }}
                  className={`w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 ${
                    isDone ? 'pop' : ''
                  }`}
                  style={{
                    borderColor: isDone ? 'var(--green)' : 'var(--border)',
                    background: isDone ? 'var(--green)' : 'transparent',
                  }}
                >
                  {isDone && (
                    <svg width="11" height="9" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Name */}
                <span className={`flex-1 text-sm font-medium ${isDone ? 'line-through' : ''}`}>{p.name}</span>

                {/* Pattern chip */}
                {p.pattern && (
                  <span
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
                    style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}
                  >
                    {p.pattern}
                  </span>
                )}

                {/* Difficulty */}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                  p.diff === 'easy' ? 'text-[var(--green)]' : p.diff === 'medium' ? 'text-[var(--amber)]' : 'text-[var(--red)]'
                }`} style={{
                  background: p.diff === 'easy' ? 'color-mix(in srgb, var(--green) 13%, transparent)' : p.diff === 'medium' ? 'color-mix(in srgb, var(--amber) 13%, transparent)' : 'color-mix(in srgb, var(--red) 13%, transparent)',
                }}>
                  {p.diff}
                </span>

                {/* External link */}
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
          })
        )}
      </div>
    </div>
  );
}

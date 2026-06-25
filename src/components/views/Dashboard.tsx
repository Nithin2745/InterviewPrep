'use client';

import { useStore } from '@/lib/store';
import { TOPICS, getAllProblems } from '@/lib/data/topics';
import { Confetti } from '../Confetti';
import { useState } from 'react';
import { toast } from 'sonner';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function Dashboard() {
  const {
    completed,
    streak,
    activityLog,
    setView,
    setTopic,
    setProblem,
    toggleProblem,
    settings,
  } = useStore();

  const [confettiFire, setConfettiFire] = useState(0);

  const allP = getAllProblems();
  const doneAll = completed.length;
  const total = allP.length;
  const pct = Math.round((doneAll / total) * 100);
  const easy = allP.filter((p) => p.diff === 'easy');
  const med = allP.filter((p) => p.diff === 'medium');
  const hard = allP.filter((p) => p.diff === 'hard');
  const solvedToday = activityLog[todayStr()] || 0;

  const todo = allP.filter((p) => !completed.includes(p.id));
  const mediumsLeft = todo.filter((p) => p.diff === 'medium');
  const pick = mediumsLeft[0] || todo[0] || allP[0];

  const days: { ds: string; lvl: number; c: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const c = activityLog[ds] || 0;
    let lvl = 0;
    if (c >= 4) lvl = 4;
    else if (c === 3) lvl = 3;
    else if (c === 2) lvl = 2;
    else if (c === 1) lvl = 1;
    days.push({ ds, lvl, c });
  }

  const handleToggle = (id: string) => {
    const wasDone = completed.includes(id);
    toggleProblem(id);
    if (!wasDone) {
      setConfettiFire((f) => f + 1);
      toast.success(`Problem solved! Streak: ${streak + (completed.length ? 0 : 1)} 🔥`);
    }
  };

  return (
    <div>
      <Confetti fire={confettiFire} />

      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">📊 Dashboard</h1>
        <p className="text-sm text-[var(--muted)]">Track your placement preparation progress in real-time</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard delay="0.05s" icon="✅" label="Total Solved" value={doneAll} sub={`of ${total} problems`} color="var(--accent)" />
        <StatCard delay="0.1s" icon="🔥" label="Day Streak" value={streak} sub={streak >= 7 ? 'On fire!' : 'Keep it going'} color="var(--amber)" />
        <StatCard delay="0.15s" icon="⭐" label="Solved Today" value={solvedToday} sub={solvedToday >= 3 ? 'Goal smashed!' : 'Aim for 3+'} color="var(--green)" />
        <StatCard delay="0.2s" icon="📈" label="Overall %" value={`${pct}%`} sub={pct >= 50 ? 'Halfway there!' : 'Keep pushing'} color="var(--purple)" gradient />
      </div>

      {/* Today's Pick */}
      {pick && (
        <div className="rounded-2xl p-5 mb-6 border relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--card), var(--card2))', borderColor: 'var(--accent)', boxShadow: 'var(--glow)' }}>
          <div className="absolute -right-2 -top-2 text-[120px] opacity-[0.07]">★</div>
          <div className="relative">
            <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-2">★ Today's Pick</div>
            <h3 className="text-base font-bold mb-1.5">{pick.name}</h3>
            <div className="text-xs text-[var(--muted)] mb-3">
              {pick.pattern} · {pick.diff.toUpperCase()}
            </div>
            <div className="flex gap-2 flex-wrap">
              <a
                href={pick.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                Solve on LeetCode ↗
              </a>
              <button
                onClick={() => setProblem(pick.id)}
                className="px-3.5 py-2 rounded-lg text-xs font-bold border border-[var(--border)] transition-all hover:border-[var(--accent)]"
              >
                View Hint & Solution
              </button>
              {!completed.includes(pick.id) && (
                <button
                  onClick={() => handleToggle(pick.id)}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold border border-[var(--green)] text-[var(--green)] transition-all hover:bg-[var(--green)] hover:text-white"
                >
                  ✓ Mark Solved
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold">Overall Progress</span>
          <span className="text-lg font-extrabold text-[var(--accent)]">{pct}%</span>
        </div>
        <div className="h-2.5 bg-[var(--card2)] rounded-md overflow-hidden relative">
          <div
            className="h-full rounded-md relative shimmer transition-all duration-1000"
            style={{ width: `${pct}%`, background: 'var(--grad)' }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-[var(--muted)] flex-wrap">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--green)' }} /> Easy: {completed.filter((id) => easy.some((p) => p.id === id)).length}/{easy.length}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--amber)' }} /> Medium: {completed.filter((id) => med.some((p) => p.id === id)).length}/{med.length}</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: 'var(--red)' }} /> Hard: {completed.filter((id) => hard.some((p) => p.id === id)).length}/{hard.length}</span>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-bold">📅 Last 30 Days Activity</span>
          <span className="text-xs text-[var(--muted)]">Total: {days.reduce((a, d) => a + d.c, 0)}</span>
        </div>
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-1" style={{ gridTemplateColumns: 'repeat(15, 1fr)' }}>
          {days.map((d, i) => (
            <div
              key={i}
              className="aspect-square rounded-sm transition-all hover:scale-130 cursor-pointer relative group"
              style={{
                background: d.lvl === 0 ? 'var(--card2)' : d.lvl === 1 ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : d.lvl === 2 ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : d.lvl === 3 ? 'color-mix(in srgb, var(--accent) 75%, transparent)' : 'var(--accent)',
                boxShadow: d.lvl === 4 ? '0 0 6px var(--accent)' : 'none',
              }}
            >
              {d.c > 0 && (
                <div className="absolute bottom-[130%] left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                  {d.c} solved · {d.ds}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-[var(--muted)] justify-end">
          Less
          {[0, 1, 2, 3, 4].map((l) => (
            <span key={l} className="w-2.5 h-2.5 rounded-sm" style={{ background: l === 0 ? 'var(--card2)' : l === 1 ? 'color-mix(in srgb, var(--accent) 25%, transparent)' : l === 2 ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : l === 3 ? 'color-mix(in srgb, var(--accent) 75%, transparent)' : 'var(--accent)' }} />
          ))}
          More
        </div>
      </div>

      {/* Topics */}
      <h2 className="text-base font-bold mb-3 pb-2.5 border-b border-[var(--border)]">🎯 Topic Progress (click to open)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(TOPICS).map(([key, t], i) => {
          const done = t.problems.filter((p) => completed.includes(p.id)).length;
          const tpct = Math.round((done / t.problems.length) * 100);
          return (
            <button
              key={key}
              onClick={() => setTopic(key)}
              className="card-in text-left bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 transition-all hover:-translate-y-1 hover:border-[var(--accent)] relative overflow-hidden"
              style={{ animationDelay: `${0.05 * i}s` }}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 opacity-0 hover:opacity-100 transition-opacity" style={{ background: t.color }} />
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm text-white" style={{ background: t.color, opacity: 0.9 }}>{t.icon}</span>
                <h3 className="text-sm font-bold">{t.name}</h3>
              </div>
              <div className="h-1.5 bg-[var(--card2)] rounded-sm overflow-hidden">
                <div className="h-full transition-all duration-1000" style={{ width: `${tpct}%`, background: t.color }} />
              </div>
              <div className="flex justify-between text-xs text-[var(--muted)] mt-2">
                <span>{done}/{t.problems.length} solved</span>
                <span className="font-extrabold" style={{ color: t.color }}>{tpct}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, delay, gradient }: { icon: string; label: string; value: string | number; sub: string; color: string; delay: string; gradient?: boolean }) {
  return (
    <div className="card-in bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 relative overflow-hidden transition-all hover:-translate-y-1 hover:border-[var(--accent)]" style={{ animationDelay: delay }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 opacity-70" style={{ background: color }} />
      <span className="absolute top-3.5 right-4 text-2xl opacity-[0.18]">{icon}</span>
      <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider font-bold mb-2">{label}</div>
      <div className="text-3xl font-extrabold leading-none" style={gradient ? { background: 'var(--grad)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' } : { color }}>{value}</div>
      <div className="text-xs text-[var(--muted)] mt-1.5">{sub}</div>
    </div>
  );
}

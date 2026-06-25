'use client';

import { useStore } from '@/lib/store';
import { TOPICS } from '@/lib/data/topics';

export function RoadmapView() {
  const { roadmap, quizScore, quizTotal, completed, setTopic } = useStore();

  if (!roadmap) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)] mb-4">No roadmap generated yet. Take the assessment quiz first.</p>
        <button
          onClick={() => useStore.setState({ hasOnboarded: false })}
          className="px-5 py-2.5 rounded-lg text-white font-bold"
          style={{ background: 'var(--grad)' }}
        >
          Take Assessment
        </button>
      </div>
    );
  }

  const levelIcon = roadmap.level === 'beginner' ? '🌱' : roadmap.level === 'intermediate' ? '🚀' : '🏆';
  const levelColor = roadmap.level === 'beginner' ? 'var(--green)' : roadmap.level === 'intermediate' ? 'var(--accent)' : 'var(--amber)';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">🗺️ My Roadmap</h1>
        <p className="text-sm text-[var(--muted)]">Your personalized {roadmap.phases.length}-phase preparation plan based on your assessment.</p>
      </div>

      {/* Score banner */}
      <div className="rounded-2xl p-5 mb-5 border relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--card), var(--card2))', borderColor: levelColor, boxShadow: 'var(--glow)' }}>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-5xl">{levelIcon}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: levelColor }}>Your Level</div>
            <div className="text-2xl font-extrabold capitalize mb-1">{roadmap.level}</div>
            <div className="text-sm text-[var(--muted)]">Scored {quizScore}/{quizTotal} ({Math.round((quizScore! / quizTotal!) * 100)}%)</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold gradient-text">{roadmap.phases.length}</div>
            <div className="text-xs text-[var(--muted)] uppercase tracking-wider">phases</div>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-5">
        <p className="text-sm leading-relaxed mb-4">{roadmap.summary}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-bold text-[var(--green)] mb-2 uppercase tracking-wider">✓ Your Strengths</div>
            <ul className="space-y-1.5">
              {roadmap.strengths.map((s, i) => (
                <li key={i} className="text-xs flex items-start gap-2">
                  <span className="text-[var(--green)]">•</span>
                  <span className="text-[var(--text)]">{s}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs font-bold text-[var(--amber)] mb-2 uppercase tracking-wider">📈 Focus Areas</div>
            <ul className="space-y-1.5">
              {roadmap.weaknesses.map((w, i) => (
                <li key={i} className="text-xs flex items-start gap-2">
                  <span className="text-[var(--amber)]">•</span>
                  <span className="text-[var(--text)]">{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Phases */}
      <h2 className="text-base font-bold mb-3 pb-2.5 border-b border-[var(--border)]">📅 Phases</h2>
      <div className="space-y-3">
        {roadmap.phases.map((phase, i) => {
          const phaseDone = phase.problems.filter((id) => completed.includes(id)).length;
          const phasePct = phase.problems.length > 0 ? Math.round((phaseDone / phase.problems.length) * 100) : 0;
          return (
            <div key={i} className="card-in bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5" style={{ animationDelay: `${0.05 * i}s` }}>
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white flex-shrink-0" style={{ background: 'var(--grad)' }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold text-[var(--accent)]">{phase.week}</span>
                    {phaseDone === phase.problems.length && phase.problems.length > 0 && (
                      <span className="text-xs font-bold text-[var(--green)]">✓ Complete!</span>
                    )}
                  </div>
                  <h3 className="text-base font-bold">{phase.title}</h3>
                </div>
              </div>

              <p className="text-xs text-[var(--muted)] mb-3 leading-relaxed">{phase.focus}</p>

              {/* Topics */}
              <div className="flex gap-1.5 flex-wrap mb-3">
                {phase.topics.map((tk) => {
                  const t = TOPICS[tk];
                  if (!t) return null;
                  return (
                    <button
                      key={tk}
                      onClick={() => setTopic(tk)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all hover:opacity-80"
                      style={{ borderColor: t.color, color: t.color, background: `${t.color}11` }}
                    >
                      {t.icon} {t.name}
                    </button>
                  );
                })}
              </div>

              {/* Goal */}
              <div className="p-3 rounded-lg mb-3" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
                <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-1">🎯 Goal</div>
                <p className="text-xs text-[var(--text)] leading-relaxed">{phase.goal}</p>
              </div>

              {/* Progress */}
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[var(--muted)]">Problems progress</span>
                <span className="font-bold">{phaseDone}/{phase.problems.length} ({phasePct}%)</span>
              </div>
              <div className="h-1.5 bg-[var(--card2)] rounded-sm overflow-hidden">
                <div className="h-full transition-all duration-1000" style={{ width: `${phasePct}%`, background: 'var(--grad)' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Retake quiz */}
      <div className="text-center mt-6">
        <button
          onClick={() => {
            if (confirm('Retake the assessment quiz? Your current roadmap will be replaced.')) {
              useStore.setState({ hasOnboarded: false });
            }
          }}
          className="px-5 py-2.5 rounded-lg border border-[var(--border)] text-[var(--muted)] text-sm font-bold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all"
        >
          🔄 Retake Assessment Quiz
        </button>
      </div>
    </div>
  );
}

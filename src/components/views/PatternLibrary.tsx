'use client';

import { useStore } from '@/lib/store';
import { PATTERNS } from '@/lib/data/patterns';
import { useState } from 'react';
import { X } from 'lucide-react';

export function PatternLibrary() {
  const [openPattern, setOpenPattern] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">🧩 Pattern Library</h1>
        <p className="text-sm text-[var(--muted)]">Master the recurring DSA patterns. Each guide includes concept, when to use, step-by-step recipe, complexity, and a worked example.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(PATTERNS).map(([key, p], i) => (
          <button
            key={key}
            onClick={() => setOpenPattern(key)}
            className="card-in text-left bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 transition-all hover:-translate-y-1 hover:border-[var(--accent)]"
            style={{ animationDelay: `${0.03 * i}s` }}
          >
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="w-7 h-7 rounded-lg flex items-center justify-center text-sm text-white" style={{ background: 'var(--accent)', opacity: 0.9 }}>🧩</span>
              <h3 className="text-sm font-bold">{p.title}</h3>
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-3">{p.concept}</p>
            <div className="flex justify-between text-xs text-[var(--muted)] mt-3 pt-2 border-t border-[var(--border)]">
              <span>{p.whenToUse.length} use cases</span>
              <span className="text-[var(--accent)] font-bold">View guide →</span>
            </div>
          </button>
        ))}
      </div>

      {/* Modal */}
      {openPattern && PATTERNS[openPattern] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-5"
          style={{ background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpenPattern(null); }}
        >
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto card-in">
            <button
              onClick={() => setOpenPattern(null)}
              className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-[var(--card2)] flex items-center justify-center text-[var(--muted)] hover:bg-[var(--red)] hover:text-white transition-all"
            >
              <X size={16} />
            </button>
            <h2 className="text-xl font-extrabold gradient-text mb-1">{PATTERNS[openPattern].title}</h2>
            <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider px-2.5 py-1 rounded-full inline-block mb-4" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)' }}>
              {openPattern}
            </span>

            <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">Concept</h4>
            <p className="text-sm leading-relaxed mb-4">{PATTERNS[openPattern].concept}</p>

            <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">When to use</h4>
            <ul className="space-y-1.5 mb-4 ml-4">
              {PATTERNS[openPattern].whenToUse.map((w, i) => (
                <li key={i} className="text-sm list-disc">{w}</li>
              ))}
            </ul>

            <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">How to solve — step by step</h4>
            <ol className="space-y-2 mb-4 ml-4">
              {PATTERNS[openPattern].steps.map((s, i) => (
                <li key={i} className="text-sm list-decimal">
                  <b className="text-[var(--accent)]">Step {i + 1}.</b> {s}
                </li>
              ))}
            </ol>

            <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">Complexity</h4>
            <div className="flex gap-2 flex-wrap mb-4">
              <span className="text-xs px-3 py-1.5 rounded-lg bg-[var(--card2)] border border-[var(--border)]">
                <b style={{ color: 'var(--accent)' }}>{PATTERNS[openPattern].complexity}</b>
              </span>
            </div>

            <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">Worked example</h4>
            <p className="text-sm leading-relaxed">{PATTERNS[openPattern].example}</p>
          </div>
        </div>
      )}
    </div>
  );
}

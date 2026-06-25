'use client';

import { useState } from 'react';
import { APTITUDE_SECTIONS } from '@/lib/data/aptitude';
import { ChevronDown, Lightbulb, Calculator, BookOpen } from 'lucide-react';

export function Aptitude() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">🧮 Aptitude & Reasoning</h1>
        <p className="text-sm text-[var(--muted)]">Enhanced prep with tips, formulas, and worked examples. Essential for TCS, Infosys, Wipro and all mass recruiters.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {APTITUDE_SECTIONS.map((section, si) => (
          <div
            key={section.key}
            className="card-in bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 relative overflow-hidden"
            style={{ animationDelay: `${0.05 * si}s` }}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: section.color }} />
            <h3 className="text-base font-bold mb-3 flex items-center gap-2" style={{ color: section.color }}>
              <span className="text-lg">{section.icon}</span> {section.label}
            </h3>

            <div className="space-y-1">
              {section.topics.map((topic) => {
                const key = `${section.key}-${topic.name}`;
                const isOpen = expanded === key;
                return (
                  <div key={topic.name} className="border-b border-[var(--border)] last:border-b-0">
                    <button
                      onClick={() => setExpanded(isOpen ? null : key)}
                      className="w-full flex items-center justify-between py-2.5 text-left hover:pl-1.5 transition-all"
                    >
                      <span className="text-sm flex-1">{topic.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide ${
                          topic.imp === 'high' ? 'text-[var(--red)]' : topic.imp === 'med' ? 'text-[var(--amber)]' : 'text-[var(--green)]'
                        }`} style={{
                          background: topic.imp === 'high' ? 'color-mix(in srgb, var(--red) 15%, transparent)' : topic.imp === 'med' ? 'color-mix(in srgb, var(--amber) 15%, transparent)' : 'color-mix(in srgb, var(--green) 15%, transparent)',
                        }}>
                          {topic.imp === 'high' ? 'High' : topic.imp === 'med' ? 'Med' : 'Low'}
                        </span>
                        <ChevronDown size={14} className={`text-[var(--muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </button>
                    {isOpen && (
                      <div className="pb-3 space-y-2.5">
                        <div className="flex items-start gap-2">
                          <Lightbulb size={14} className="text-[var(--amber)] flex-shrink-0 mt-0.5" />
                          <p className="text-xs leading-relaxed text-[var(--text)]">{topic.tips}</p>
                        </div>
                        {topic.formula && (
                          <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}>
                            <Calculator size={14} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider mb-0.5">Formula</div>
                              <code className="text-xs font-mono" style={{ color: 'var(--text)' }}>{topic.formula}</code>
                            </div>
                          </div>
                        )}
                        {topic.example && (
                          <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: 'color-mix(in srgb, var(--green) 8%, transparent)' }}>
                            <BookOpen size={14} className="text-[var(--green)] flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-[10px] font-bold text-[var(--green)] uppercase tracking-wider mb-0.5">Example</div>
                              <p className="text-xs leading-relaxed text-[var(--text)]">{topic.example}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Resources */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-5">
        <h3 className="text-sm font-bold mb-3 text-[var(--accent)]">🔗 Recommended Aptitude Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            ['IndiaBix', 'https://www.indiabix.com', 'Best for practice tests & previous year papers'],
            ['PrepInsta', 'https://prepinsta.com', 'Company-specific aptitude papers'],
            ['GeeksForGeeks Aptitude', 'https://www.geeksforgeeks.org/aptitude-questions-and-answers/', 'Topic-wise practice'],
            ['TCS iON PrepHub', 'https://iontcs.com', 'Official TCS practice material'],
          ].map(([n, u, d]) => (
            <a
              key={n}
              href={u}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-[var(--card2)] border border-[var(--border)] hover:border-[var(--accent)] transition-all"
            >
              <div className="text-xs font-bold text-[var(--accent)] mb-0.5">{n} ↗</div>
              <div className="text-[11px] text-[var(--muted)]">{d}</div>
            </a>
          ))}
        </div>
      </div>

      {/* Strategy */}
      <div className="rounded-2xl p-5 border" style={{ background: 'color-mix(in srgb, var(--amber) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--amber) 20%, transparent)' }}>
        <h3 className="text-sm font-bold text-[var(--amber)] mb-2">⚡ Quick Strategy for Mass Recruiters</h3>
        <div className="text-xs text-[var(--muted)] leading-loose">
          <div><strong className="text-[var(--text)]">1.</strong> Spend 30 min/day on IndiaBix quant — focus on <strong className="text-[var(--text)]">Time & Work, TSD, Percentage</strong></div>
          <div><strong className="text-[var(--text)]">2.</strong> Practice 10 logical reasoning questions daily — series and seating arrangement are most common</div>
          <div><strong className="text-[var(--text)]">3.</strong> Read one English article daily to improve comprehension speed</div>
          <div><strong className="text-[var(--text)]">4.</strong> Attempt 1 full mock test per week under timed conditions</div>
        </div>
      </div>
    </div>
  );
}

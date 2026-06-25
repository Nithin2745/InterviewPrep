'use client';

import { useStore } from '@/lib/store';
import { THEMES } from '@/lib/themes';
import { TOPICS } from '@/lib/data/topics';
import { COMPANIES } from '@/lib/data/companies';
import type { Language } from '@/lib/types';
import { toast } from 'sonner';
import { useState } from 'react';

const LANGUAGES: { id: Language; label: string; icon: string }[] = [
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'java', label: 'Java', icon: '☕' },
  { id: 'cpp', label: 'C++', icon: '⚡' },
  { id: 'javascript', label: 'JavaScript', icon: '🟨' },
];

export function SettingsView() {
  const {
    settings,
    setTheme,
    setLanguage,
    toggleSetting,
    resetAllData,
    resetSettings,
    completed,
    streak,
    activityLog,
    quizScore,
    quizTotal,
    roadmap,
    retakeOnboarding,
  } = useStore();

  const [confirmReset, setConfirmReset] = useState(false);

  const totalProblems = Object.values(TOPICS).reduce((a, t) => a + t.problems.length, 0) +
    Object.values(COMPANIES).reduce((a, c) => a + c.problems.length, 0);
  const totalActivity = Object.values(activityLog).reduce((a, b) => a + b, 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold mb-1">⚙️ Settings</h1>
        <p className="text-sm text-[var(--muted)]">Customize appearance, language, content visibility, and manage your data.</p>
      </div>

      {/* Theme picker */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-4 card-in">
        <h3 className="text-sm font-bold mb-1 flex items-center gap-2">🎨 Appearance — Theme</h3>
        <p className="text-xs text-[var(--muted)] mb-4">Pick a visual theme. Changes apply instantly and persist across sessions.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTheme(t.id); toast.success(`Theme: ${t.name}`); }}
              className={`relative rounded-xl p-2 border-2 transition-all hover:-translate-y-0.5 ${
                settings.theme === t.id ? 'border-[var(--accent)]' : 'border-[var(--border)]'
              }`}
              style={settings.theme === t.id ? { boxShadow: 'var(--glow)' } : {}}
            >
              <div className="w-full h-12 rounded-md mb-1.5 relative overflow-hidden border border-[var(--border)]" style={{ background: t.vars['--bg'] }}>
                <div className="absolute top-1.5 left-1.5 right-7 h-2 rounded-sm" style={{ background: t.vars['--card'] }} />
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full" style={{ background: t.vars['--accent'] }} />
                <div className="absolute bottom-0 left-0 right-0 h-3.5" style={{ background: t.vars['--grad'] }} />
              </div>
              <div className="text-[10px] font-bold text-center">{t.name}</div>
              {settings.theme === t.id && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[var(--accent)] text-white text-[10px] flex items-center justify-center">✓</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Language preference */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-4 card-in">
        <h3 className="text-sm font-bold mb-1 flex items-center gap-2">💻 Programming Language Preference</h3>
        <p className="text-xs text-[var(--muted)] mb-4">Pseudocode and solutions will be displayed in this language on problem detail pages.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => { setLanguage(lang.id); toast.success(`Language: ${lang.label}`); }}
              className={`p-3 rounded-xl border-2 transition-all hover:-translate-y-0.5 ${
                settings.language === lang.id ? 'border-[var(--accent)]' : 'border-[var(--border)]'
              }`}
              style={settings.language === lang.id ? { background: 'color-mix(in srgb, var(--accent) 10%, transparent)', boxShadow: 'var(--glow)' } : {}}
            >
              <div className="text-2xl mb-1">{lang.icon}</div>
              <div className="text-xs font-bold">{lang.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Content toggles */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-4 card-in">
        <h3 className="text-sm font-bold mb-1 flex items-center gap-2">🛠️ Problem Detail Content</h3>
        <p className="text-xs text-[var(--muted)] mb-4">Control what appears on problem detail pages. Toggle off to hide spoilers while you practice.</p>

        <ToggleRow
          title="💡 Show Hints"
          desc="Display the hint section on problem detail pages"
          on={settings.showHints}
          onToggle={() => toggleSetting('showHints')}
        />
        <ToggleRow
          title="⌨️ Show Pseudocode"
          desc="Display language-agnostic pseudocode skeleton"
          on={settings.showPseudocode}
          onToggle={() => toggleSetting('showPseudocode')}
        />
        <ToggleRow
          title="📄 Show Full Solutions"
          desc="Display complete code solutions in your preferred language (where available)"
          on={settings.showSolutions}
          onToggle={() => toggleSetting('showSolutions')}
        />
        <ToggleRow
          title="🧩 Show Pattern Guide"
          desc="Display the pattern concept, steps, and worked example"
          on={settings.showPattern}
          onToggle={() => toggleSetting('showPattern')}
          last
        />
      </div>

      {/* Data stats */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-4 card-in">
        <h3 className="text-sm font-bold mb-1 flex items-center gap-2">📊 Your Data</h3>
        <p className="text-xs text-[var(--muted)] mb-4">All data is stored locally in your browser. Nothing is sent to any server.</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-[var(--card2)] border border-[var(--border)]">
            <div className="text-2xl font-extrabold text-[var(--accent)]">{completed.length}</div>
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1">Solved</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--card2)] border border-[var(--border)]">
            <div className="text-2xl font-extrabold text-[var(--amber)]">{streak}</div>
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1">Day Streak</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--card2)] border border-[var(--border)]">
            <div className="text-2xl font-extrabold text-[var(--green)]">{totalActivity}</div>
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1">Total Activity</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-[var(--card2)] border border-[var(--border)]">
            <div className="text-2xl font-extrabold text-[var(--purple)]">{quizScore !== null ? `${quizScore}/${quizTotal}` : '—'}</div>
            <div className="text-[10px] text-[var(--muted)] uppercase tracking-wider mt-1">Quiz Score</div>
          </div>
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-3">
          {totalProblems} total problems tracked across {Object.keys(TOPICS).length} topics and {Object.keys(COMPANIES).length} companies.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => { retakeOnboarding(); toast.info('Restarting assessment...'); }}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-xs font-bold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all bg-[var(--card2)]"
          >
            🔄 Retake Onboarding Quiz
          </button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl p-5 border card-in" style={{ background: 'color-mix(in srgb, var(--red) 6%, transparent)', borderColor: 'color-mix(in srgb, var(--red) 25%, transparent)' }}>
        <h3 className="text-sm font-bold text-[var(--red)] mb-1">⚠️ Danger Zone</h3>
        <p className="text-xs text-[var(--muted)] mb-4">These actions cannot be undone. Be careful.</p>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { resetSettings(); toast.success('Settings reset to defaults'); }}
            className="px-4 py-2 rounded-lg border border-[var(--red)] text-[var(--red)] text-xs font-bold hover:bg-[var(--red)] hover:text-white transition-all"
          >
            Reset Settings to Defaults
          </button>
          <button
            onClick={() => {
              if (confirmReset) {
                resetAllData();
                toast.success('All data reset');
              } else {
                setConfirmReset(true);
                toast.warning('Click again to confirm — this erases EVERYTHING');
                setTimeout(() => setConfirmReset(false), 3000);
              }
            }}
            className="px-4 py-2 rounded-lg border text-xs font-bold transition-all"
            style={{
              borderColor: confirmReset ? 'var(--red)' : 'var(--red)',
              background: confirmReset ? 'var(--red)' : 'transparent',
              color: confirmReset ? '#fff' : 'var(--red)',
            }}
          >
            {confirmReset ? '⚠️ Click to CONFIRM reset' : 'Reset ALL Data'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({ title, desc, on, onToggle, last }: { title: string; desc: string; on: boolean; onToggle: () => void; last?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-3 ${last ? '' : 'border-b border-[var(--border)]'}`}>
      <div className="flex-1 pr-4">
        <div className="text-sm font-semibold">{title}</div>
        <div className="text-xs text-[var(--muted)] mt-0.5">{desc}</div>
      </div>
      <button
        onClick={onToggle}
        className="relative w-11 h-6 rounded-full border transition-all flex-shrink-0"
        style={{
          background: on ? 'var(--accent)' : 'var(--card2)',
          borderColor: on ? 'var(--accent)' : 'var(--border)',
        }}
      >
        <span
          className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
          style={{
            left: on ? '22px' : '2px',
            background: on ? 'var(--accent-text)' : 'var(--muted)',
          }}
        />
      </button>
    </div>
  );
}

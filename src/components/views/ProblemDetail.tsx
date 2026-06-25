'use client';

import { useStore } from '@/lib/store';
import { getProblemById, getTopicByProblemId, TOPICS } from '@/lib/data/topics';
import { getSolution, hasMultilingualSolution } from '@/lib/data/solutions';
import { PATTERNS } from '@/lib/data/patterns';
import type { Language } from '@/lib/types';
import { useState } from 'react';
import { ArrowLeft, Check, ExternalLink, Lightbulb, Code2, BookOpen, Copy, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

const LANGUAGES: { id: Language; label: string; icon: string }[] = [
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'java', label: 'Java', icon: '☕' },
  { id: 'cpp', label: 'C++', icon: '⚡' },
  { id: 'javascript', label: 'JavaScript', icon: '🟨' },
];

export function ProblemDetail() {
  const {
    currentProblemId,
    setView,
    setTopic,
    toggleProblem,
    completed,
    settings,
    setLanguage,
  } = useStore();

  const [showHint, setShowHint] = useState(false);
  const [showPseudocode, setShowPseudocode] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [showPattern, setShowPattern] = useState(false);
  const [copied, setCopied] = useState(false);

  const problem = currentProblemId ? getProblemById(currentProblemId) : null;
  if (!problem) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)]">Problem not found.</p>
        <button onClick={() => setView('dashboard')} className="mt-4 text-[var(--accent)]">← Back to Dashboard</button>
      </div>
    );
  }

  const topicKey = getTopicByProblemId(problem.id);
  const topic = topicKey ? TOPICS[topicKey] : null;
  const isDone = completed.includes(problem.id);
  const pattern = problem.pattern ? PATTERNS[problem.pattern] : null;
  const hasMulti = hasMultilingualSolution(problem.id);
  const solution = getSolution(problem.id, settings.language);

  const handleToggle = () => {
    toggleProblem(problem.id);
    if (!isDone) toast.success(`Problem solved! 🔥`);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => topicKey ? setTopic(topicKey) : setView('dashboard')}
        className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Back to {topic?.name || 'Dashboard'}
      </button>

      {/* Header */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-5 relative overflow-hidden">
        {topic && <div className="absolute top-0 left-0 right-0 h-1" style={{ background: topic.color }} />}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {topic && (
                <button
                  onClick={() => setTopic(topicKey!)}
                  className="text-xs font-bold px-2.5 py-1 rounded-full transition-all hover:opacity-80"
                  style={{ background: `${topic.color}22`, color: topic.color }}
                >
                  {topic.icon} {topic.name}
                </button>
              )}
              {problem.pattern && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                  {problem.pattern}
                </span>
              )}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                problem.diff === 'easy' ? 'text-[var(--green)]' : problem.diff === 'medium' ? 'text-[var(--amber)]' : 'text-[var(--red)]'
              }`} style={{
                background: problem.diff === 'easy' ? 'color-mix(in srgb, var(--green) 13%, transparent)' : problem.diff === 'medium' ? 'color-mix(in srgb, var(--amber) 13%, transparent)' : 'color-mix(in srgb, var(--red) 13%, transparent)',
              }}>
                {problem.diff}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold mb-3">{problem.name}</h1>
            <div className="flex gap-2 flex-wrap">
              <a
                href={problem.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all hover:-translate-y-0.5"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                <ExternalLink size={14} /> Solve on LeetCode
              </a>
              <button
                onClick={() => setView('practice')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-all border-[var(--accent)] text-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] hover:-translate-y-0.5"
              >
                <Code2 size={14} /> Practice Now
              </button>
              <button
                onClick={handleToggle}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                  isDone
                    ? 'border-[var(--green)] text-[var(--green)] bg-[color-mix(in_srgb,var(--green)_10%,transparent)]'
                    : 'border-[var(--border)] text-[var(--text)] hover:border-[var(--green)] hover:text-[var(--green)]'
                }`}
              >
                <Check size={14} /> {isDone ? 'Solved' : 'Mark Solved'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hint Section */}
      {settings.showHints && (
        <Section
          icon={<Lightbulb size={18} />}
          title="Hint"
          color="var(--amber)"
          defaultOpen={false}
          open={showHint}
          onToggle={() => setShowHint(!showHint)}
        >
          <div className="p-4 rounded-xl border-l-2 text-sm leading-relaxed" style={{ background: 'color-mix(in srgb, var(--amber) 8%, transparent)', borderColor: 'var(--amber)' }}>
            {problem.hint}
          </div>
        </Section>
      )}

      {/* Pseudocode Section */}
      {settings.showPseudocode && (
        <Section
          icon={<Code2 size={18} />}
          title="Pseudocode"
          color="var(--purple)"
          defaultOpen={false}
          open={showPseudocode}
          onToggle={() => setShowPseudocode(!showPseudocode)}
        >
          <div className="relative">
            <button
              onClick={() => copyCode(problem.pseudocode)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)] transition-all z-10"
              title="Copy"
            >
              {copied ? <CheckCheck size={14} className="text-[var(--green)]" /> : <Copy size={14} />}
            </button>
            <pre className="p-4 rounded-xl overflow-x-auto text-xs leading-relaxed font-mono" style={{ background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              <code>{problem.pseudocode}</code>
            </pre>
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            📝 Language-agnostic pseudocode — focus on the algorithm steps, not syntax.
          </p>
        </Section>
      )}

      {/* Solution Section (multilingual) */}
      {settings.showSolutions && hasMulti && solution && (
        <Section
          icon={<Code2 size={18} />}
          title={`Solution in ${LANGUAGES.find((l) => l.id === settings.language)?.label}`}
          color="var(--green)"
          defaultOpen={false}
          open={showSolution}
          onToggle={() => setShowSolution(!showSolution)}
        >
          {/* Language selector */}
          <div className="flex gap-2 mb-3 flex-wrap">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  settings.language === lang.id
                    ? 'border-transparent'
                    : 'border-[var(--border)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--text)]'
                }`}
                style={settings.language === lang.id ? { background: 'var(--accent)', color: 'var(--accent-text)' } : {}}
              >
                {lang.icon} {lang.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <button
              onClick={() => copyCode(solution)}
              className="absolute top-3 right-3 p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--muted)] hover:text-[var(--accent)] transition-all z-10"
              title="Copy"
            >
              {copied ? <CheckCheck size={14} className="text-[var(--green)]" /> : <Copy size={14} />}
            </button>
            <pre className="p-4 rounded-xl overflow-x-auto text-xs leading-relaxed font-mono" style={{ background: 'var(--code-bg)', color: 'var(--text)', border: '1px solid var(--border)' }}>
              <code>{solution}</code>
            </pre>
          </div>
          <p className="text-xs text-[var(--muted)] mt-2">
            ✅ Production-ready solution in {LANGUAGES.find((l) => l.id === settings.language)?.label}. Switch languages above.
          </p>
        </Section>
      )}

      {settings.showSolutions && !hasMulti && (
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Code2 size={18} className="text-[var(--green)]" />
            <h3 className="font-bold text-sm">Full Solution</h3>
          </div>
          <p className="text-xs text-[var(--muted)]">
            A full multilingual solution for this problem isn't available yet. Use the pseudocode above as your guide —
            it's language-agnostic and shows the exact algorithm steps. Try implementing it in your preferred language,
            then check against the LeetCode editorial.
          </p>
        </div>
      )}

      {/* Pattern Guide */}
      {settings.showPattern && pattern && (
        <Section
          icon={<BookOpen size={18} />}
          title={`Pattern Guide: ${problem.pattern}`}
          color="var(--accent)"
          defaultOpen={false}
          open={showPattern}
          onToggle={() => setShowPattern(!showPattern)}
          renderContent={() => (
            <div>
              <p className="text-sm leading-relaxed mb-4">{pattern.concept}</p>
              <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2 mt-4">When to use</h4>
              <ul className="space-y-1.5 mb-4">
                {pattern.whenToUse.map((w, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-[var(--accent)] mt-0.5">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
              <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2 mt-4">Step-by-step solution</h4>
              <ol className="space-y-2 mb-4">
                {pattern.steps.map((s, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-xs font-bold text-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <div className="flex gap-2 flex-wrap mb-4">
                <span className="text-xs px-3 py-1.5 rounded-lg bg-[var(--card2)] border border-[var(--border)]">
                  ⏱️ <b style={{ color: 'var(--accent)' }}>{pattern.complexity}</b>
                </span>
              </div>
              <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2 mt-4">Worked example</h4>
              <p className="text-sm leading-relaxed">{pattern.example}</p>
            </div>
          )}
        />
      )}
    </div>
  );
}

function Section({
  icon,
  title,
  color,
  open,
  onToggle,
  children,
  renderContent,
  defaultOpen,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  open: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
  renderContent?: () => React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen || false);
  const isOpen = open !== undefined ? open : internalOpen;
  const toggle = () => {
    if (onToggle) onToggle();
    setInternalOpen(!internalOpen);
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl mb-4 overflow-hidden">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--card2)] transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span style={{ color }}>{icon}</span>
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
        <span className={`text-[var(--muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="p-4 pt-0">
          {renderContent ? renderContent() : children}
        </div>
      )}
    </div>
  );
}

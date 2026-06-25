'use client';

import { useStore } from '@/lib/store';
import { TOPICS, getAllProblems } from '@/lib/data/topics';
import { useState, useMemo } from 'react';
import { Search, CheckCircle2, ListFilter, ExternalLink } from 'lucide-react';

export function AllProblems() {
  const {
    completed,
    toggleProblem,
    setProblem,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [selectedPattern, setSelectedPattern] = useState<string>('all');

  const problems = useMemo(() => getAllProblems(), []);

  // Compile unique lists for filters
  const topics = useMemo(() => {
    return Object.entries(TOPICS).map(([key, t]) => ({
      key,
      name: t.name,
      icon: t.icon,
      color: t.color,
    }));
  }, []);

  const patterns = useMemo(() => {
    const pSet = new Set<string>();
    problems.forEach((p) => {
      if (p.pattern) pSet.add(p.pattern);
    });
    return Array.from(pSet).sort();
  }, [problems]);

  // Filter problems based on selections
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      // 1. Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesPattern = p.pattern?.toLowerCase().includes(q) || false;
        if (!matchesName && !matchesPattern) return false;
      }

      // 2. Difficulty
      if (selectedDifficulty !== 'all' && p.diff !== selectedDifficulty) {
        return false;
      }

      // 3. Status
      const isDone = completed.includes(p.id);
      if (selectedStatus === 'done' && !isDone) return false;
      if (selectedStatus === 'todo' && isDone) return false;

      // 4. Topic
      if (selectedTopic !== 'all') {
        // Find which topic this problem belongs to
        let belongsToTopic = false;
        const topicObj = TOPICS[selectedTopic];
        if (topicObj) {
          belongsToTopic = topicObj.problems.some((tp) => tp.id === p.id);
        }
        if (!belongsToTopic) return false;
      }

      // 5. Pattern
      if (selectedPattern !== 'all' && p.pattern !== selectedPattern) {
        return false;
      }

      return true;
    });
  }, [problems, searchQuery, selectedDifficulty, selectedStatus, selectedTopic, selectedPattern, completed]);

  // Get topic info for a given problem
  const getProblemTopicMeta = (probId: string) => {
    for (const [key, topic] of Object.entries(TOPICS)) {
      if (topic.problems.some((p) => p.id === probId)) {
        return { key, name: topic.name, color: topic.color, icon: topic.icon };
      }
    }
    return { key: '', name: 'General', color: '#888888', icon: '📌' };
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDifficulty('all');
    setSelectedStatus('all');
    setSelectedTopic('all');
    setSelectedPattern('all');
  };

  const hasActiveFilters = 
    searchQuery !== '' || 
    selectedDifficulty !== 'all' || 
    selectedStatus !== 'all' || 
    selectedTopic !== 'all' || 
    selectedPattern !== 'all';

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2">
          <span>📚</span> All LeetCode Problems
        </h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Explore and filter the complete question library of {problems.length} problems by DSA Pattern, Topic, and Difficulty.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-[var(--card)] border border-[var(--border)] p-5 rounded-2xl flex flex-col gap-4 shadow-sm">
        {/* Search & Reset */}
        <div className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
            <input
              type="text"
              placeholder="Search problems by name or pattern..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--card2)] border border-[var(--border)] rounded-xl text-xs py-3 pl-10 pr-4 focus:outline-none focus:border-[var(--accent)] transition-all text-[var(--text)]"
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-[var(--red)]/30 text-[var(--red)] bg-[var(--red)]/5 hover:bg-[var(--red)]/10 text-xs font-bold rounded-xl transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Filter Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Pattern Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">DSA Pattern</label>
            <select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value)}
              className="w-full bg-[var(--card2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[var(--accent)] text-[var(--text)] font-semibold"
            >
              <option value="all">All Patterns ({patterns.length})</option>
              {patterns.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">DSA Topic</label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full bg-[var(--card2)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[var(--accent)] text-[var(--text)] font-semibold"
            >
              <option value="all">All Topics ({topics.length})</option>
              {topics.map((t) => (
                <option key={t.key} value={t.key}>{t.icon} {t.name}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Difficulty</label>
            <div className="flex bg-[var(--card2)] border border-[var(--border)] p-1 rounded-xl">
              {['all', 'easy', 'medium', 'hard'].map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg capitalize transition-all ${
                    selectedDifficulty === d 
                      ? 'bg-[var(--card)] text-[var(--text)] shadow-sm' 
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Status</label>
            <div className="flex bg-[var(--card2)] border border-[var(--border)] p-1 rounded-xl">
              {['all', 'todo', 'done'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedStatus(s)}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg capitalize transition-all ${
                    selectedStatus === s 
                      ? 'bg-[var(--card)] text-[var(--text)] shadow-sm' 
                      : 'text-[var(--muted)] hover:text-[var(--text)]'
                  }`}
                >
                  {s === 'done' ? 'Solved' : s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Problems Count */}
      <div className="text-xs text-[var(--muted)] font-semibold px-1">
        Showing <span className="text-[var(--text)] font-bold">{filteredProblems.length}</span> of {problems.length} problems
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filteredProblems.length === 0 ? (
          <div className="col-span-full bg-[var(--card)] border border-[var(--border)] rounded-2xl py-14 text-center flex flex-col items-center justify-center gap-3">
            <span className="text-3xl">🔍</span>
            <div>
              <h3 className="font-bold text-sm text-[var(--text)]">No matching problems found</h3>
              <p className="text-xs text-[var(--muted)] mt-1">Try resetting the filters or modifying your query.</p>
            </div>
            <button
              onClick={clearFilters}
              className="mt-2 px-4 py-2 border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)]/10 text-xs font-bold rounded-xl transition-all"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          filteredProblems.map((p, i) => {
            const isDone = completed.includes(p.id);
            const topicMeta = getProblemTopicMeta(p.id);
            return (
              <div
                key={p.id}
                className={`flex items-center gap-3.5 p-3.5 rounded-xl border bg-[var(--card)] border-[var(--border)] transition-all hover:border-[var(--accent)] hover:-translate-y-[1px] hover:shadow-md cursor-pointer group ${
                  isDone ? 'opacity-70' : ''
                }`}
                style={{ animationDelay: `${0.02 * i}s` }}
                onClick={() => setProblem(p.id)}
              >
                {/* Complete checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleProblem(p.id);
                  }}
                  className={`w-5 h-5 rounded-md border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 ${
                    isDone ? 'bg-[var(--green)] border-[var(--green)]' : 'border-[var(--border)] bg-transparent'
                  }`}
                >
                  {isDone && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Problem details */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-sm font-bold truncate group-hover:text-[var(--accent)] transition-colors ${isDone ? 'line-through text-[var(--muted)]' : 'text-[var(--text)]'}`}>
                      {p.name}
                    </span>
                    {/* Difficulty */}
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                      p.diff === 'easy' ? 'text-[var(--green)]' : p.diff === 'medium' ? 'text-[var(--amber)]' : 'text-[var(--red)]'
                    }`} style={{
                      background: p.diff === 'easy' ? 'color-mix(in srgb, var(--green) 12%, transparent)' : p.diff === 'medium' ? 'color-mix(in srgb, var(--amber) 12%, transparent)' : 'color-mix(in srgb, var(--red) 12%, transparent)',
                    }}>
                      {p.diff}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-[10px] text-[var(--muted)] font-semibold">
                    {/* Topic badge */}
                    <span className="flex items-center gap-1 bg-[var(--card2)] border border-[var(--border)] px-2 py-0.5 rounded-md text-[var(--text)]">
                      <span>{topicMeta.icon}</span>
                      <span>{topicMeta.name}</span>
                    </span>

                    {/* Pattern badge */}
                    {p.pattern && (
                      <span className="bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-[var(--accent)] px-2 py-0.5 rounded-md">
                        🧩 {p.pattern}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] rounded-lg text-[var(--muted)] transition-all bg-[var(--card2)]"
                    title="Open on LeetCode"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

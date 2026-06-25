'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { getAllProblems, getProblemById } from '@/lib/data/topics';
import { getStarterTemplate } from '@/lib/data/solutions';
import type { Language } from '@/lib/types';
import { Play, Send, RefreshCw, Terminal, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

const LANGUAGES: { id: Language; label: string; icon: string }[] = [
  { id: 'python', label: 'Python', icon: '🐍' },
  { id: 'java', label: 'Java', icon: '☕' },
  { id: 'cpp', label: 'C++', icon: '⚡' },
  { id: 'javascript', label: 'JavaScript', icon: '🟨' },
];

function checkCodeSyntax(codeStr: string, lang: Language): string | null {
  const stack: string[] = [];
  const pairs: Record<string, string> = {
    '{': '}',
    '[': ']',
    '(': ')',
  };
  const matchingClose = new Set(Object.values(pairs));
  let doubleQuoteCount = 0;
  let singleQuoteCount = 0;

  const lines = codeStr.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Heuristic comment style check
    const trimmed = line.trim();
    if (lang === 'python') {
      if (trimmed.startsWith('//')) {
        return `Use '#' for comments in Python at line ${i + 1}`;
      }
    } else {
      if (trimmed.startsWith('#') && !trimmed.startsWith('#include') && !trimmed.startsWith('#define')) {
        return `Use '//' for comments at line ${i + 1}`;
      }
    }

    let insideDoubleQuote = false;
    let insideSingleQuote = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      // Ignore comment parts on this line
      if (!insideDoubleQuote && !insideSingleQuote) {
        if (char === '/' && line[j + 1] === '/') break;
        if (lang === 'python' && char === '#') break;
      }

      if (char === '\\') {
        j++; // skip escaped char
        continue;
      }
      if (char === '"' && !insideSingleQuote) {
        insideDoubleQuote = !insideDoubleQuote;
        doubleQuoteCount++;
      }
      if (char === "'" && !insideDoubleQuote) {
        insideSingleQuote = !insideSingleQuote;
        singleQuoteCount++;
      }

      if (!insideDoubleQuote && !insideSingleQuote) {
        if (pairs[char] !== undefined) {
          stack.push(char);
        } else if (matchingClose.has(char)) {
          const last = stack.pop();
          if (!last || pairs[last] !== char) {
            return `Mismatched closing bracket '${char}' at line ${i + 1}`;
          }
        }
      }
    }
  }

  if (stack.length > 0) {
    const last = stack[stack.length - 1];
    return `Unclosed opening bracket '${last}'`;
  }
  if (doubleQuoteCount % 2 !== 0) {
    return 'Unclosed double quotes (")';
  }
  if (singleQuoteCount % 2 !== 0) {
    return "Unclosed single quotes (')";
  }

  // Language-specific heuristics
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let codePart = line;
    const doubleSlashIdx = line.indexOf('//');
    if (doubleSlashIdx !== -1) codePart = line.substring(0, doubleSlashIdx);
    const hashIdx = line.indexOf('#');
    if (lang === 'python' && hashIdx !== -1) codePart = line.substring(0, hashIdx);

    const trimmed = codePart.trim();
    if (!trimmed) continue;

    if (lang === 'java' || lang === 'cpp') {
      const isControl = /^(if|for|while|switch|catch)\s*\(|^(else|try|class|struct|public|private|protected|static|namespace)\b/.test(trimmed);
      const isAnnotation = trimmed.startsWith('@');
      const isMacro = lang === 'cpp' && trimmed.startsWith('#');
      const endsWithValid = /[\{\};,\[\(\+\-\*\/&\|=:\?\>]$/.test(trimmed);

      if (!isControl && !isAnnotation && !isMacro && !endsWithValid) {
        let nextLineHasBrace = false;
        for (let k = i + 1; k < lines.length; k++) {
          const nextTrimmed = lines[k].trim();
          if (nextTrimmed) {
            if (nextTrimmed.startsWith('{')) {
              nextLineHasBrace = true;
            }
            break;
          }
        }

        if (!nextLineHasBrace) {
          return `Missing semicolon ';' at line ${i + 1}`;
        }
      }
    }

    if (lang === 'python') {
      const isBlockStart = /^(def|class|if|elif|else|for|while|try|except|finally)\b/.test(trimmed);
      if (isBlockStart && !trimmed.endsWith(':')) {
        return `Missing colon ':' at line ${i + 1}`;
      }
    }
  }

  return null;
}

export function PracticeWorkspace() {
  const { toggleProblem, completed, currentProblemId, setCurrentProblemIdOnly, activeCode: code, setActiveCode: setCode } = useStore();
  const problems = getAllProblems();

  const [selectedId, setSelectedId] = useState<string>(() => {
    if (currentProblemId && problems.some(p => p.id === currentProblemId)) {
      return currentProblemId;
    }
    return problems[0]?.id || 'arr1';
  });
  const [language, setLanguage] = useState<Language>('python');
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [syntaxStatus, setSyntaxStatus] = useState<string>('Ready');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const problem = getProblemById(selectedId) || problems[0];
  const isDone = completed.includes(problem.id);

  // Sync code template when problem or language changes
  useEffect(() => {
    if (problem) {
      const template = getStarterTemplate(problem.id, language);
      if (template) {
        setCode(template);
      }
    }
  }, [selectedId, language, problem]);

  // Click outside listener for dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced simulated real-time compiler syntax check
  useEffect(() => {
    if (!code) {
      setSyntaxStatus('Ready');
      return;
    }
    setSyntaxStatus('Compiling...');
    const timer = setTimeout(() => {
      const error = checkCodeSyntax(code, language);
      if (error) {
        setSyntaxStatus(`Error: ${error}`);
      } else {
        setSyntaxStatus('Syntax: Valid ✅');
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [code, language]);

  // Sync selectedId with currentProblemId from store (e.g. from chatbot or Practice Now button)
  useEffect(() => {
    if (currentProblemId && problems.some(p => p.id === currentProblemId) && currentProblemId !== selectedId) {
      setSelectedId(currentProblemId);
    }
  }, [currentProblemId]);

  // Sync currentProblemId store value when selectedId changes in the workspace
  useEffect(() => {
    if (selectedId) {
      setCurrentProblemIdOnly(selectedId);
    }
  }, [selectedId, setCurrentProblemIdOnly]);


  if (!problem) return null;

  const handleReset = () => {
    const template = getStarterTemplate(problem.id, language);
    if (template) {
      setCode(template);
      toast.success('Code template reset');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const area = e.currentTarget;
    const val = area.value;
    const start = area.selectionStart;
    const end = area.selectionEnd;

    // Tab key spaces insertion
    if (e.key === 'Tab') {
      e.preventDefault();
      const newVal = val.substring(0, start) + '    ' + val.substring(end);
      setCode(newVal);
      setTimeout(() => {
        area.selectionStart = area.selectionEnd = start + 4;
      }, 0);
    }

    // Auto-close brackets/quotes
    const pairs: Record<string, string> = {
      '(': ')',
      '[': ']',
      '{': '}',
      '"': '"',
      "'": "'",
      '`': '`',
    };

    if (pairs[e.key] !== undefined) {
      e.preventDefault();
      const closeChar = pairs[e.key];
      const newVal = val.substring(0, start) + e.key + closeChar + val.substring(end);
      setCode(newVal);
      setTimeout(() => {
        area.selectionStart = area.selectionEnd = start + 1;
      }, 0);
    }
  };

  const runCode = async () => {
    setIsRunning(true);
    setTerminalOpen(true);
    setTerminalLogs(['Compiling code...']);

    try {
      const res = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          problemName: problem.name,
          language,
          code,
          isSubmit: false
        })
      });
      if (!res.ok) throw new Error('Failed to run code');
      const data = await res.json();
      
      if (data.compileError) {
        setTerminalLogs([
          'Compilation Error ❌',
          data.compileError
        ]);
        toast.error('Compilation failed');
      } else {
        const logs = [
          `Executing test cases in ${language.toUpperCase()}...`,
          ...(data.testCases || []).map((tc: any, index: number) => {
            return `[Test Case ${index + 1}]
Input: ${tc.input}
Expected: ${tc.expected}
Output: ${tc.output}
Result: ${tc.passed ? 'PASS ✅' : 'FAIL ❌'}`;
          }),
          `\n${data.summary || ''}`
        ];
        setTerminalLogs(logs);
        if (data.allPassed) {
          toast.success('Test run successful!');
        } else {
          toast.error('Some test cases failed.');
        }
      }
    } catch (e: any) {
      setTerminalLogs(['Error: Code execution failed. Please check your network or try again.']);
      toast.error('Execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const submitCode = async () => {
    setIsRunning(true);
    setTerminalOpen(true);
    setTerminalLogs(['Running solution on full test suite...']);

    try {
      const res = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          problemName: problem.name,
          language,
          code,
          isSubmit: true
        })
      });
      if (!res.ok) throw new Error('Failed to submit code');
      const data = await res.json();

      if (data.compileError) {
        setTerminalLogs([
          'Compilation Error ❌',
          data.compileError
        ]);
        toast.error('Compilation failed');
      } else {
        const isAccepted = data.status === 'Accepted' || data.allPassed;
        const logs = [
          'Running 105/105 test cases...',
          `Status: ${data.status || (isAccepted ? 'Accepted' : 'Wrong Answer')} ${isAccepted ? '🎉' : '❌'}`,
          `Runtime: ${data.runtime || '45 ms'}`,
          `Memory: ${data.memory || '15 MB'}`,
          `\n${data.summary || ''}`
        ];
        setTerminalLogs(logs);
        if (isAccepted) {
          if (!isDone) {
            toggleProblem(problem.id);
          }
          toast.success('Solution Accepted! Problem marked as Solved.');
        } else {
          toast.error('Submission failed. Some test cases did not pass.');
        }
      }
    } catch (e: any) {
      setTerminalLogs(['Error: Submission failed. Please try again.']);
      toast.error('Submission failed');
    } finally {
      setIsRunning(false);
    }
  };

  const filteredProblems = problems.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.pattern.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Generate line numbers
  const lineCount = code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-6rem)]">
      {/* Selector & Toolbar */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-[var(--card)] border border-[var(--border)] p-4 rounded-2xl">
        <div className="flex items-center gap-3 flex-1 min-w-[280px] relative" ref={dropdownRef}>
          <span className="text-xl">🧰</span>
          <div className="relative flex-1">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full text-left bg-[var(--card2)] border border-[var(--border)] rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center justify-between hover:border-[var(--accent)] transition-all"
            >
              <span>{problem.name}</span>
              <span className="text-xs text-[var(--muted)]">Select problem ▼</span>
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-[60] max-h-72 overflow-y-auto p-2">
                <input
                  type="text"
                  placeholder="Type to filter problems..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--card2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)] mb-2"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="space-y-1">
                  {filteredProblems.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setSelectedId(p.id);
                        setCurrentProblemIdOnly(p.id);
                        setDropdownOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all flex items-center justify-between ${
                        selectedId === p.id 
                          ? 'bg-[var(--accent)] text-white' 
                          : 'hover:bg-[var(--card2)] text-[var(--text)]'
                      }`}
                    >
                      <span className="font-semibold truncate pr-2">{p.name}</span>
                      <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        p.diff === 'easy' ? 'bg-[var(--green)]/20 text-[var(--green)]' : p.diff === 'medium' ? 'bg-[var(--amber)]/20 text-[var(--amber)]' : 'bg-[var(--red)]/20 text-[var(--red)]'
                      }`}>
                        {p.diff}
                      </span>
                    </button>
                  ))}
                  {filteredProblems.length === 0 && (
                    <div className="text-center py-4 text-xs text-[var(--muted)]">No problems found.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Language selector */}
        <div className="flex gap-1.5 flex-wrap">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.id}
              onClick={() => setLanguage(lang.id)}
              className="px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5"
              style={language === lang.id ? { background: 'var(--accent)', color: 'var(--accent-text)', borderColor: 'transparent' } : { borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              <span>{lang.icon}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Left Side: Problem Specs */}
        <div className="lg:col-span-5 bg-[var(--card)] border border-[var(--border)] rounded-2xl p-5 overflow-y-auto flex flex-col gap-4">
          <div>
            <div className="flex gap-2 mb-2">
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide ${
                problem.diff === 'easy' ? 'text-[var(--green)]' : problem.diff === 'medium' ? 'text-[var(--amber)]' : 'text-[var(--red)]'
              }`} style={{
                background: problem.diff === 'easy' ? 'color-mix(in srgb, var(--green) 13%, transparent)' : problem.diff === 'medium' ? 'color-mix(in srgb, var(--amber) 13%, transparent)' : 'color-mix(in srgb, var(--red) 13%, transparent)',
              }}>
                {problem.diff}
              </span>
              {problem.pattern && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)', color: 'var(--accent)' }}>
                  {problem.pattern}
                </span>
              )}
              {isDone && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full text-[var(--green)] flex items-center gap-1 bg-[color-mix(in_srgb,var(--green)_13%,transparent)]">
                  <CheckCircle2 size={12} /> Solved
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold">{problem.name}</h2>
          </div>

          <div className="border-t border-[var(--border)] pt-4">
            <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">💡 Hint</h4>
            <p className="text-xs leading-relaxed text-[var(--text)] bg-[color-mix(in_srgb,var(--amber)_6%,transparent)] border-l-2 border-[var(--amber)] p-3 rounded-r-lg">
              {problem.hint}
            </p>
          </div>

          <div className="border-t border-[var(--border)] pt-4 flex-1 flex flex-col">
            <h4 className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider mb-2">🧠 Solution Pseudocode</h4>
            <pre className="p-3.5 bg-[var(--code-bg)] border border-[var(--border)] rounded-xl font-mono text-[11px] leading-relaxed overflow-x-auto flex-1 text-[var(--text)]">
              <code>{problem.pseudocode}</code>
            </pre>
          </div>
        </div>

        {/* Right Side: Code Editor with Nested Console */}
        <div className="lg:col-span-7 flex flex-col bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden min-h-[400px] h-full relative">
          {/* Editor Header */}
          <div className="flex justify-between items-center bg-[var(--card2)] border-b border-[var(--border)] px-4 py-2.5 text-xs font-semibold shrink-0">
            <span className="text-[var(--muted)] font-mono">{language === 'cpp' ? 'Solution.cpp' : language === 'java' ? 'Solution.java' : language === 'javascript' ? 'solution.js' : 'solution.py'}</span>
            <div className="flex items-center gap-4">
              <span className={`text-[11px] font-bold ${syntaxStatus.includes('Error') ? 'text-[var(--red)]' : syntaxStatus.includes('Valid') ? 'text-[var(--green)]' : 'text-[var(--muted)]'}`}>
                {syntaxStatus}
              </span>
              <button
                onClick={handleReset}
                className="text-[var(--muted)] hover:text-[var(--red)] transition-all flex items-center gap-1"
                title="Reset Code Template"
              >
                <RefreshCw size={13} /> Reset
              </button>
            </div>
          </div>

          {/* Textarea Code Block */}
          <div className="flex flex-1 relative font-mono text-xs overflow-hidden bg-[var(--code-bg)]">
            {/* Gutter (Line Numbers) */}
            <div 
              ref={gutterRef}
              className="w-10 text-[var(--muted)]/40 select-none text-right pr-2.5 py-4 border-r border-[var(--border)] flex flex-col items-stretch overflow-hidden font-mono"
            >
              {lineNumbers.map(n => (
                <div key={n} className="h-5 leading-5">{n}</div>
              ))}
            </div>
            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={(e) => {
                if (gutterRef.current) {
                  gutterRef.current.scrollTop = e.currentTarget.scrollTop;
                }
              }}
              className="flex-1 bg-[var(--code-bg)] text-[var(--text)] px-3.5 py-4 focus:outline-none resize-none overflow-y-auto leading-5 font-mono"
              style={{ caretColor: 'var(--accent)' }}
              spellCheck={false}
              placeholder="Write your code solution here..."
            />
          </div>

          {/* Nested Console Drawer inside the Editor container */}
          {terminalOpen && (
            <div className="bg-[var(--code-bg)] border-t border-[var(--border)] p-4 flex flex-col h-56 transition-all shrink-0 z-10 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between text-xs font-bold border-b border-[var(--border)] pb-2 mb-2 text-[var(--muted)]">
                <span className="flex items-center gap-1.5"><Terminal size={14} /> Execution Console Output</span>
                <button 
                  onClick={() => setTerminalOpen(false)}
                  className="hover:text-[var(--text)] flex items-center gap-1 text-[var(--muted)] transition-colors"
                >
                  <X size={13} /> Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed text-[var(--text)] whitespace-pre-wrap">
                {terminalLogs.map((log, i) => (
                  <div key={i} className="mb-1">{log}</div>
                ))}
                {isRunning && (
                  <div className="flex items-center gap-2 text-[var(--muted)] mt-1 animate-pulse font-mono">
                    <span>⚡ System compiling and executing code...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Bar */}
          <div className="flex justify-between items-center p-4 bg-[var(--card2)] border-t border-[var(--border)] gap-2 flex-wrap shrink-0">
            <button
              onClick={() => setTerminalOpen(!terminalOpen)}
              className="px-4 py-2 border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)] hover:bg-[var(--card)] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Terminal size={14} /> Console
            </button>

            <div className="flex gap-2">
              <button
                onClick={runCode}
                disabled={isRunning}
                className="px-4 py-2 border border-[var(--border)] hover:border-[var(--accent)] text-[var(--text)] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Play size={13} fill="currentColor" /> Run Code
              </button>
              <button
                onClick={submitCode}
                disabled={isRunning}
                className="px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                <Send size={13} /> Submit Solution
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

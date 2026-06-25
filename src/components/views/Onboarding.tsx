'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { QUIZ_QUESTIONS } from '@/lib/data/quiz';
import { generateRoadmap } from '@/lib/roadmap';
import { applyTheme } from '@/lib/themes';

function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function Onboarding() {
  const { settings, completeOnboarding } = useStore();
  const [phase, setPhase] = useState<'welcome' | 'quiz' | 'result'>('welcome');
  const [questions, setQuestions] = useState<typeof QUIZ_QUESTIONS>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  useEffect(() => {
    applyTheme(settings.theme);
    setQuestions(shuffle(QUIZ_QUESTIONS).slice(0, 5));
  }, [settings.theme]);

  const startQuiz = async () => {
    setQuizLoading(true);
    try {
      const res = await fetch('/api/quiz/generate');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions);
      } else {
        setQuestions(shuffle(QUIZ_QUESTIONS).slice(0, 5));
      }
    } catch (err) {
      console.warn("Failed to generate AI quiz, falling back to local questions:", err);
      setQuestions(shuffle(QUIZ_QUESTIONS).slice(0, 5));
    } finally {
      setQuizLoading(false);
      setCurrentQ(0);
      setAnswers([]);
      setSelected(null);
      setShowExplanation(false);
      setPhase('quiz');
    }
  };

  const q = questions[currentQ];

  const handleAnswer = (idx: number) => {
    if (showExplanation) return;
    setSelected(idx);
    setShowExplanation(true);
  };

  const handleNext = () => {
    const newAnswers = [...answers, selected!];
    setAnswers(newAnswers);
    setSelected(null);
    setShowExplanation(false);
    if (currentQ + 1 < questions.length) {
      setCurrentQ(currentQ + 1);
    } else {
      const score = newAnswers.filter((a, i) => a === questions[i].correct).length;
      const roadmap = generateRoadmap(score, questions.length);
      completeOnboarding(score, questions.length, roadmap);
      setPhase('result');
    }
  };

  if (phase === 'welcome') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full card-in">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">⚡</div>
            <h1 className="text-4xl font-extrabold gradient-text mb-3">Welcome to PlacementPrep</h1>
            <p className="text-[var(--muted)] text-lg">
              Your personalized LeetCode interview preparation tracker
            </p>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🎯 Let's assess your level first
            </h2>
            <p className="text-[var(--muted)] text-sm mb-4 leading-relaxed">
              Take a quick <strong className="text-[var(--text)]">{(questions.length || 5)}-question quiz</strong> covering DSA fundamentals,
              complexity analysis, and common patterns. Based on your score, we'll generate a
              personalized 8-12 week roadmap with recommended problems.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div className="text-center p-3 rounded-lg bg-[var(--card2)]">
                <div className="text-2xl mb-1">⏱️</div>
                <div className="text-xs text-[var(--muted)]">~2 min</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--card2)]">
                <div className="text-2xl mb-1">📝</div>
                <div className="text-xs text-[var(--muted)]">{(questions.length || 5)} questions</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-[var(--card2)]">
                <div className="text-2xl mb-1">🗺️</div>
                <div className="text-xs text-[var(--muted)]">Custom roadmap</div>
              </div>
            </div>
          </div>

          <button
            onClick={startQuiz}
            disabled={quizLoading}
            className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90 hover:-translate-y-0.5 flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ background: 'var(--grad)', color: 'var(--accent-text)', boxShadow: 'var(--glow)' }}
          >
            {quizLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Generating AI Quiz...</span>
              </>
            ) : (
              'Start Assessment →'
            )}
          </button>
          <p className="text-center text-xs text-[var(--muted)] mt-4">
            You can retake the quiz anytime from Settings
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'quiz') {
    const progress = (currentQ / QUIZ_QUESTIONS.length) * 100;
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="mb-6">
            <div className="flex justify-between text-sm text-[var(--muted)] mb-2">
              <span>Question {currentQ + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-[var(--card2)] rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-500"
                style={{ width: `${progress}%`, background: 'var(--grad)' }}
              />
            </div>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 card-in" key={currentQ}>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
                {q.topic}
              </span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${q.difficulty === 'easy' ? 'text-[var(--green)]' : q.difficulty === 'medium' ? 'text-[var(--amber)]' : 'text-[var(--red)]'}`}>
                {q.difficulty.toUpperCase()}
              </span>
            </div>

            <h2 className="text-lg font-semibold mb-5 leading-relaxed">{q.question}</h2>

            <div className="space-y-2.5">
              {q.options.map((opt, idx) => {
                const isCorrect = idx === q.correct;
                const isSelected = idx === selected;
                let style: React.CSSProperties = {};
                if (showExplanation) {
                  if (isCorrect) {
                    style = { borderColor: 'var(--green)', background: 'color-mix(in srgb, var(--green) 12%, transparent)' };
                  } else if (isSelected) {
                    style = { borderColor: 'var(--red)', background: 'color-mix(in srgb, var(--red) 12%, transparent)' };
                  }
                } else if (isSelected) {
                  style = { borderColor: 'var(--accent)', background: 'color-mix(in srgb, var(--accent) 12%, transparent)' };
                }
                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={showExplanation}
                    className="w-full text-left p-3.5 rounded-xl border border-[var(--border)] bg-[var(--card2)] transition-all hover:border-[var(--accent)] disabled:cursor-default flex items-center gap-3"
                    style={style}
                  >
                    <span className="w-6 h-6 rounded-full border-2 border-[var(--border)] flex items-center justify-center text-xs font-bold flex-shrink-0" style={isSelected || (showExplanation && isCorrect) ? { borderColor: 'currentColor', background: 'currentColor', color: 'var(--card)' } : {}}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="flex-1 text-sm">{opt}</span>
                    {showExplanation && isCorrect && <span className="text-[var(--green)]">✓</span>}
                    {showExplanation && isSelected && !isCorrect && <span className="text-[var(--red)]">✗</span>}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="mt-4 p-4 rounded-xl border" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', borderColor: 'color-mix(in srgb, var(--accent) 20%, transparent)' }}>
                <div className="text-xs font-bold text-[var(--accent)] mb-1.5">💡 EXPLANATION</div>
                <p className="text-sm text-[var(--text)] leading-relaxed">{q.explanation}</p>
              </div>
            )}

            {showExplanation && (
              <button
                onClick={handleNext}
                className="w-full mt-5 py-3 rounded-xl font-bold transition-all hover:opacity-90"
                style={{ background: 'var(--grad)', color: 'var(--accent-text)' }}
              >
                {currentQ + 1 < questions.length ? 'Next Question →' : 'See My Results →'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // result
  const score = answers.filter((a, i) => a === (questions[i] || QUIZ_QUESTIONS[i]).correct).length;
  const roadmap = generateRoadmap(score, questions.length || QUIZ_QUESTIONS.length);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full card-in">
        <div className="text-center mb-6">
          <div className="text-6xl mb-3">
            {roadmap.level === 'beginner' ? '🌱' : roadmap.level === 'intermediate' ? '🚀' : '🏆'}
          </div>
          <h1 className="text-3xl font-extrabold gradient-text mb-2">Assessment Complete!</h1>
          <p className="text-[var(--muted)]">
            You scored <strong className="text-[var(--text)]">{score}/{(questions.length || QUIZ_QUESTIONS.length)}</strong> —
            Level: <strong className="text-[var(--accent)] capitalize">{roadmap.level}</strong>
          </p>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <p className="text-sm leading-relaxed mb-4">{roadmap.summary}</p>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="text-xs font-bold text-[var(--green)] mb-2">✓ STRENGTHS</div>
              <ul className="space-y-1">
                {roadmap.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-[var(--muted)] flex items-start gap-1.5">
                    <span className="text-[var(--green)]">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold text-[var(--amber)] mb-2">📈 FOCUS AREAS</div>
              <ul className="space-y-1">
                {roadmap.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-[var(--muted)] flex items-start gap-1.5">
                    <span className="text-[var(--amber)]">•</span> {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 mb-6">
          <h3 className="font-bold mb-3 flex items-center gap-2">🗺️ Your Personalized Roadmap</h3>
          <div className="space-y-2">
            {roadmap.phases.slice(0, 3).map((phase, i) => (
              <div key={i} className="p-3 rounded-lg bg-[var(--card2)] border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[var(--accent)]">{phase.week}</span>
                  <span className="text-sm font-semibold">{phase.title}</span>
                </div>
                <p className="text-xs text-[var(--muted)]">{phase.focus}</p>
              </div>
            ))}
            <p className="text-xs text-center text-[var(--muted)] pt-1">
              + {roadmap.phases.length - 3} more phases — view full roadmap in the app
            </p>
          </div>
        </div>

        <button
          onClick={() => useStore.setState({ currentView: 'dashboard' })}
          className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:opacity-90 hover:-translate-y-0.5"
          style={{ background: 'var(--grad)', color: 'var(--accent-text)', boxShadow: 'var(--glow)' }}
        >
          Enter Dashboard →
        </button>
      </div>
    </div>
  );
}

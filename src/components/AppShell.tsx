'use client';

import { useStore } from '@/lib/store';
import { TOPICS } from '@/lib/data/topics';
import { COMPANIES } from '@/lib/data/companies';
import { Dashboard } from './views/Dashboard';
import { TopicView } from './views/TopicView';
import { ProblemDetail } from './views/ProblemDetail';
import { PatternLibrary } from './views/PatternLibrary';
import { CompanyPrep } from './views/CompanyPrep';
import { Aptitude } from './views/Aptitude';
import { Resources } from './views/Resources';
import { SettingsView } from './views/Settings';
import { RoadmapView } from './views/Roadmap';
import { PracticeWorkspace } from './views/PracticeWorkspace';
import { AllProblems } from './views/AllProblems';
import { PrepBot } from './PrepBot';
import { useState } from 'react';
import { Menu, X, Lock, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function doneCount(problems: { id: string }[], completed: string[]): number {
  return problems.filter((p) => completed.includes(p.id)).length;
}

export function AppShell() {
  const {
    currentView,
    setView,
    setTopic,
    setCompany,
    streak,
    completed,
    isLoggedIn,
    userEmail,
    loginUser,
    logoutUser,
  } = useStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
    try {
      const currentPayload = isSignUp ? {
        completed: useStore.getState().completed,
        activityLog: useStore.getState().activityLog,
        lastActiveDate: useStore.getState().lastActiveDate,
        streak: useStore.getState().streak,
        hasOnboarded: useStore.getState().hasOnboarded,
        quizScore: useStore.getState().quizScore,
        quizTotal: useStore.getState().quizTotal,
        roadmap: useStore.getState().roadmap,
        settings: useStore.getState().settings,
      } : null;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, trackerData: currentPayload }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      loginUser(data.email, data.trackerData);
      toast.success(isSignUp ? 'Account registered and synced! 🎉' : 'Logged in successfully! 🔑');
      setAuthModalOpen(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const navItem = (label: string, icon: string, onClick: () => void, active: boolean, pct?: string) => (
    <button
      onClick={() => { onClick(); setSidebarOpen(false); }}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all text-left hover:text-[var(--text)] hover:bg-[var(--card)]"
      style={{
        color: active ? 'var(--accent)' : 'var(--muted)',
        background: active ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'transparent',
        boxShadow: active ? 'inset 2px 0 0 var(--accent)' : 'none',
      }}
    >
      <span className="text-base flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {pct !== undefined && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--card2)]" style={{ color: 'var(--text)' }}>
          {pct}
        </span>
      )}
    </button>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile menu button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 right-4 z-50 md:hidden w-10 h-10 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--text)] flex items-center justify-center"
      >
        {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-screen w-60 bg-[var(--sidebar)] border-r border-[var(--border)] z-40 transition-transform duration-300 flex flex-col justify-between ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          {/* Brand */}
          <div className="p-4 border-b border-[var(--border)] relative overflow-hidden">
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'var(--grad)', opacity: 0.6 }} />
            <h1 className="text-base font-extrabold gradient-text tracking-tight">⚡ PlacementPrep</h1>
            <p className="text-[11px] text-[var(--muted)] mt-0.5">Live LeetCode Tracker</p>
          </div>

          {/* Streak */}
          <div className="m-2 p-3 rounded-xl text-center border" style={{ background: 'linear-gradient(135deg, color-mix(in srgb, var(--amber) 12%, transparent), color-mix(in srgb, var(--red) 8%, transparent))', borderColor: 'color-mix(in srgb, var(--amber) 25%, transparent)' }}>
            <span className="text-2xl inline-block flicker" style={{ filter: 'drop-shadow(0 0 8px color-mix(in srgb, var(--amber) 60%, transparent))' }}>🔥</span>
            <span className="text-xl font-extrabold block text-[var(--amber)]">{streak}</span>
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">Day Streak</span>
          </div>

          {/* Nav */}
          <div className="p-2">
            <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider px-3 pt-3 pb-1.5">Overview</div>
            {navItem('Dashboard', '📊', () => setView('dashboard'), currentView === 'dashboard')}
            {navItem('My Roadmap', '🗺️', () => setView('roadmap'), currentView === 'roadmap')}
            {navItem('Practice Workspace', '🧰', () => setView('practice'), currentView === 'practice')}
            {navItem('All Problems', '📚', () => setView('all-problems'), currentView === 'all-problems')}
            {navItem('Pattern Library', '🧩', () => setView('patterns'), currentView === 'patterns')}

            <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider px-3 pt-4 pb-1.5">DSA Topics</div>
            {Object.entries(TOPICS).map(([key, t]) => {
              const pct = Math.round(doneCount(t.problems, completed) / t.problems.length * 100);
              return (
                <button
                  key={key}
                  onClick={() => { setTopic(key); setSidebarOpen(false); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all text-left hover:text-[var(--text)] hover:bg-[var(--card)]"
                  style={{
                    color: currentView === 'topic' && useStore.getState().currentTopic === key ? 'var(--accent)' : 'var(--muted)',
                    background: currentView === 'topic' && useStore.getState().currentTopic === key ? 'color-mix(in srgb, var(--accent) 14%, transparent)' : 'transparent',
                    boxShadow: currentView === 'topic' && useStore.getState().currentTopic === key ? 'inset 2px 0 0 var(--accent)' : 'none',
                  }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: t.color, boxShadow: `0 0 8px ${t.color}` }} />
                  <span className="flex-1 text-left">{t.name}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${pct === 100 ? 'text-[var(--green)]' : ''}`} style={{ background: pct === 100 ? 'color-mix(in srgb, var(--green) 20%, transparent)' : 'var(--card2)', color: pct === 100 ? 'var(--green)' : 'var(--text)' }}>
                    {pct}%
                  </span>
                </button>
              );
            })}

            <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider px-3 pt-4 pb-1.5">Company Prep</div>
            {navItem('Company Wise', '🏢', () => setView('company'), currentView === 'company')}
            <div className="text-[10px] text-[var(--muted)] px-3 pb-1">{Object.keys(COMPANIES).length} companies</div>

            <div className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-wider px-3 pt-4 pb-1.5">Other</div>
            {navItem('Aptitude Prep', '🧮', () => setView('aptitude'), currentView === 'aptitude')}
            {navItem('Resources', '📚', () => setView('resources'), currentView === 'resources')}
            {navItem('Settings', '⚙️', () => setView('settings'), currentView === 'settings')}
          </div>
        </div>

        {/* User profile card at the bottom of the sidebar */}
        <div className="p-3 border-t border-[var(--border)] bg-[var(--card)] m-2 rounded-xl shrink-0">
          {isLoggedIn ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] text-[var(--muted)] uppercase font-bold tracking-wider">Logged In As</div>
                  <div className="text-xs font-semibold truncate text-[var(--text)]">{userEmail}</div>
                </div>
              </div>
              <button
                onClick={() => { logoutUser(); toast.success('Logged out successfully.'); }}
                className="w-full py-1.5 rounded-lg border border-[var(--red)] text-[var(--red)] text-[11px] font-bold hover:bg-[var(--red)] hover:text-white transition-all text-center"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] text-[var(--muted)] leading-relaxed">
                Sync progress across devices and secure your roadmap data.
              </div>
              <button
                onClick={() => { setError(''); setAuthModalOpen(true); }}
                className="w-full py-2 rounded-lg font-bold text-xs transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ background: 'var(--accent)', color: 'var(--accent-text)', boxShadow: 'var(--glow)' }}
              >
                Login / Sign Up
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 md:ml-60 p-6 md:p-8 min-h-screen">
        <div className="page-in max-w-7xl mx-auto">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'topic' && <TopicView />}
          {currentView === 'problem' && <ProblemDetail />}
          {currentView === 'patterns' && <PatternLibrary />}
          {currentView === 'company' && <CompanyPrep />}
          {currentView === 'aptitude' && <Aptitude />}
          {currentView === 'resources' && <Resources />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'roadmap' && <RoadmapView />}
          {currentView === 'practice' && <PracticeWorkspace />}
          {currentView === 'all-problems' && <AllProblems />}
        </div>
      </main>

      <PrepBot />

      {/* Authentication Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200"
            style={{ boxShadow: 'var(--shadow)' }}
          >
            {/* Header decoration */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'var(--grad)' }} />
            
            {/* Close Button */}
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--text)] transition-colors p-1.5 rounded-lg hover:bg-[var(--card2)]"
            >
              <X size={16} />
            </button>

            {/* Modal Heading */}
            <div className="text-center mb-6 mt-2">
              <h2 className="text-xl font-extrabold tracking-tight">
                {isSignUp ? '🚀 Create Your Account' : '🔑 Welcome Back'}
              </h2>
              <p className="text-xs text-[var(--muted)] mt-1">
                {isSignUp ? 'Save and synchronize your placement prep data' : 'Log in to sync your custom roadmap and solved items'}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex bg-[var(--card2)] border border-[var(--border)] p-1 rounded-xl mb-5">
              <button
                onClick={() => { setIsSignUp(false); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isSignUp ? 'bg-[var(--card)] text-[var(--text)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setIsSignUp(true); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isSignUp ? 'bg-[var(--card)] text-[var(--text)] shadow-sm' : 'text-[var(--muted)] hover:text-[var(--text)]'}`}
              >
                Register
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-4">
              {error && (
                <div className="p-3 text-xs rounded-xl bg-[var(--red)]/15 border border-[var(--red)]/35 text-[var(--red)] font-medium">
                  ⚠️ {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[var(--card2)] border border-[var(--border)] rounded-xl py-2.5 pl-9 pr-4 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[var(--text)] uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[var(--card2)] border border-[var(--border)] rounded-xl py-2.5 pl-9 pr-4 text-xs text-[var(--text)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-xs transition-all hover:opacity-90 flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                style={{ background: 'var(--grad)', color: 'var(--accent-text)', boxShadow: 'var(--glow)' }}
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{isSignUp ? 'Create Account & Sync' : 'Sign In & Load Data'}</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

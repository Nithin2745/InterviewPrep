'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, ThemeId, Language, ViewId, Roadmap } from './types';

interface TrackerState {
  // Progress
  completed: string[];
  activityLog: Record<string, number>; // dateStr -> count
  lastActiveDate: string | null;
  streak: number;

  // Onboarding
  hasOnboarded: boolean;
  quizScore: number | null;
  quizTotal: number | null;
  roadmap: Roadmap | null;

  // Settings
  settings: Settings;

  // Navigation
  currentView: ViewId;
  currentTopic: string;
  currentCompany: string;
  currentProblemId: string | null;
  filter: string;
  searchQuery: string;

  // Editor State
  activeCode: string;

  // Auth State
  userEmail: string | null;
  isLoggedIn: boolean;

  // Actions
  toggleProblem: (id: string) => void;
  isCompleted: (id: string) => boolean;
  setView: (view: ViewId) => void;
  setTopic: (key: string) => void;
  setCompany: (key: string) => void;
  setProblem: (id: string) => void;
  setFilter: (f: string) => void;
  setSearch: (q: string) => void;
  setActiveCode: (code: string) => void;
  setCurrentProblemIdOnly: (id: string | null) => void;
  setTheme: (t: ThemeId) => void;
  setLanguage: (l: Language) => void;
  toggleSetting: (key: keyof Omit<Settings, 'theme' | 'language'>) => void;
  completeOnboarding: (score: number, total: number, roadmap: Roadmap) => void;
  retakeOnboarding: () => void;
  resetAllData: () => void;
  resetSettings: () => void;

  // Auth Actions
  loginUser: (email: string, trackerData: any) => void;
  logoutUser: () => void;
  syncWithServer: () => Promise<void>;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function yesterdayStr(): string {
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return `${y.getFullYear()}-${String(y.getMonth() + 1).padStart(2, '0')}-${String(y.getDate()).padStart(2, '0')}`;
}

const defaultSettings: Settings = {
  theme: 'midnight',
  language: 'python',
  showHints: true,
  showPseudocode: true,
  showSolutions: true,
  showPattern: true,
};

export const useStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      completed: [],
      activityLog: {},
      lastActiveDate: null,
      streak: 0,

      hasOnboarded: false,
      quizScore: null,
      quizTotal: null,
      roadmap: null,

      settings: defaultSettings,

      currentView: 'dashboard',
      currentTopic: 'arrays',
      currentCompany: 'tcs',
      currentProblemId: null,
      filter: 'all',
      searchQuery: '',
      activeCode: '',

      userEmail: null,
      isLoggedIn: false,

      toggleProblem: (id) => {
        const state = get();
        const wasDone = state.completed.includes(id);
        let newCompleted: string[];
        let newStreak = state.streak;
        let newLastActive = state.lastActiveDate;
        let newActivity = { ...state.activityLog };

        if (wasDone) {
          newCompleted = state.completed.filter((x) => x !== id);
        } else {
          newCompleted = [...state.completed, id];
          // Update streak
          const today = todayStr();
          if (state.lastActiveDate !== today) {
            if (state.lastActiveDate === yesterdayStr()) {
              newStreak = state.streak + 1;
            } else if (state.lastActiveDate === null) {
              newStreak = 1;
            } else {
              newStreak = 1;
            }
            newLastActive = today;
          }
          newActivity[today] = (newActivity[today] || 0) + 1;
        }

        set({
          completed: newCompleted,
          streak: newStreak,
          lastActiveDate: newLastActive,
          activityLog: newActivity,
        });
        get().syncWithServer();
      },

      isCompleted: (id) => get().completed.includes(id),

      setView: (view) => set({ currentView: view }),
      setTopic: (key) => set({ currentTopic: key, currentView: 'topic', filter: 'all', searchQuery: '' }),
      setCompany: (key) => set({ currentCompany: key }),
      setProblem: (id) => set({ currentProblemId: id, currentView: 'problem' }),
      setFilter: (f) => set({ filter: f }),
      setSearch: (q) => set({ searchQuery: q }),
      setActiveCode: (code) => set({ activeCode: code }),
      setCurrentProblemIdOnly: (id) => set({ currentProblemId: id }),

      setTheme: (t) => {
        set({ settings: { ...get().settings, theme: t } });
        get().syncWithServer();
      },
      setLanguage: (l) => {
        set({ settings: { ...get().settings, language: l } });
        get().syncWithServer();
      },
      toggleSetting: (key) => {
        set({
          settings: { ...get().settings, [key]: !get().settings[key] },
        });
        get().syncWithServer();
      },

      completeOnboarding: (score, total, roadmap) => {
        set({ hasOnboarded: true, quizScore: score, quizTotal: total, roadmap });
        get().syncWithServer();
      },

      retakeOnboarding: () => {
        set({ hasOnboarded: false, currentView: 'onboarding' });
        get().syncWithServer();
      },

      resetAllData: () => {
        set({
          completed: [],
          activityLog: {},
          lastActiveDate: null,
          streak: 0,
          hasOnboarded: false,
          quizScore: null,
          quizTotal: null,
          roadmap: null,
          currentView: 'onboarding',
        });
        get().syncWithServer();
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
        get().syncWithServer();
      },

      loginUser: (email, trackerData) => {
        if (trackerData) {
          set({
            userEmail: email,
            isLoggedIn: true,
            completed: trackerData.completed || [],
            activityLog: trackerData.activityLog || {},
            lastActiveDate: trackerData.lastActiveDate || null,
            streak: trackerData.streak || 0,
            hasOnboarded: trackerData.hasOnboarded ?? false,
            quizScore: trackerData.quizScore ?? null,
            quizTotal: trackerData.quizTotal ?? null,
            roadmap: trackerData.roadmap || null,
            settings: { ...get().settings, ...(trackerData.settings || {}) },
          });
        } else {
          set({
            userEmail: email,
            isLoggedIn: true,
          });
          get().syncWithServer();
        }
      },

      logoutUser: () => {
        set({
          userEmail: null,
          isLoggedIn: false,
          completed: [],
          activityLog: {},
          lastActiveDate: null,
          streak: 0,
          hasOnboarded: false,
          quizScore: null,
          quizTotal: null,
          roadmap: null,
          currentView: 'onboarding',
        });
      },

      syncWithServer: async () => {
        const state = get();
        if (!state.isLoggedIn || !state.userEmail) return;

        try {
          const payload = {
            completed: state.completed,
            activityLog: state.activityLog,
            lastActiveDate: state.lastActiveDate,
            streak: state.streak,
            hasOnboarded: state.hasOnboarded,
            quizScore: state.quizScore,
            quizTotal: state.quizTotal,
            roadmap: state.roadmap,
            settings: state.settings,
          };

          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: state.userEmail, trackerData: payload }),
          });
        } catch (err) {
          console.error('Failed to sync progress with server:', err);
        }
      },
    }),
    {
      name: 'placement-tracker-v2',
    }
  )
);

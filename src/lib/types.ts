// Core type definitions for the Placement Prep Tracker

export type Language = 'python' | 'java' | 'cpp' | 'javascript';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ThemeId =
  | 'midnight'
  | 'pure-black'
  | 'pure-white'
  | 'aurora'
  | 'cyberpunk'
  | 'forest'
  | 'ocean';

export interface Problem {
  id: string;
  name: string;
  diff: Difficulty;
  pattern: string;
  url: string;
  hint: string;
  pseudocode: string;
  solutions?: Partial<Record<Language, string>>;
  companies?: string[];
}

export interface Topic {
  name: string;
  color: string;
  icon: string;
  blurb: string;
  problems: Problem[];
}

export interface Company {
  name: string;
  color: string;
  round: string;
  desc: string;
  tags: string[];
  problems: Problem[];
}

export interface Pattern {
  title: string;
  concept: string;
  whenToUse: string[];
  steps: string[];
  complexity: string;
  example: string;
}

export interface AptitudeTopic {
  name: string;
  imp: 'high' | 'med' | 'low';
  tips: string;
  formula?: string;
  example?: string;
}

export interface AptitudeSection {
  key: string;
  label: string;
  color: string;
  icon: string;
  topics: AptitudeTopic[];
}

export interface QuizQuestion {
  id: string;
  lang: Language | 'general';
  topic: string;
  difficulty: Difficulty;
  question: string;
  code?: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface RoadmapPhase {
  week: string;
  title: string;
  focus: string;
  topics: string[];
  problems: string[]; // problem ids
  goal: string;
}

export interface Roadmap {
  level: 'beginner' | 'intermediate' | 'advanced';
  score: number;
  total: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  phases: RoadmapPhase[];
}

export type ViewId =
  | 'dashboard'
  | 'topic'
  | 'problem'
  | 'patterns'
  | 'company'
  | 'aptitude'
  | 'resources'
  | 'settings'
  | 'onboarding'
  | 'practice'
  | 'roadmap'
  | 'all-problems';

export interface Settings {
  theme: ThemeId;
  language: Language;
  showHints: boolean;
  showPseudocode: boolean;
  showSolutions: boolean;
  showPattern: boolean;
}

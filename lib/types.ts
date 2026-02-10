export type FocusArea = 'mindset' | 'relationships' | 'physical' | 'partner' | 'postpartum';

export interface UserProfile {
  name: string;
  dueDate: string;
  focusAreas: FocusArea[];
  notificationsEnabled: boolean;
  onboardingComplete: boolean;
  createdAt: string;
}

export interface DailyPrompt {
  id: string;
  category: FocusArea;
  text: string;
  week: number;
}

export interface PromptResponse {
  id: string;
  promptId: string;
  promptText: string;
  category: FocusArea;
  response: string;
  date: string;
  savedToJournal: boolean;
}

export interface Memory {
  id: string;
  content: string;
  category: FocusArea | 'general';
  tags: string[];
  date: string;
}

export interface Task {
  id: string;
  title: string;
  category: 'first-trimester' | 'second-trimester' | 'third-trimester' | 'general';
  completed: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  category: FocusArea | 'general';
  date: string;
  fromPrompt: boolean;
}

export interface QuizResult {
  id: string;
  quizId: string;
  quizTitle: string;
  answers: Record<string, string>;
  score: number;
  insights: string;
  date: string;
}

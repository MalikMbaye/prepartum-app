import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';

export type FocusArea = 'mindset' | 'relationships' | 'physical';

interface UserProfile {
  id: string;
  name: string;
  dueDate: string | null;
  focusAreas: string[] | null;
  notificationsEnabled: boolean | null;
  onboardingCompleted: boolean | null;
  pregnancyWeek: number | null;
  createdAt: string | null;
}

interface DailyPrompt {
  id: string;
  title: string | null;
  body: string;
  category: string;
  weekNumber: number | null;
  dayOfWeek: number | null;
}

interface PromptResponseData {
  id: string;
  userId: string;
  promptId: string;
  responseText: string;
  completedAt: string | null;
  savedToJournal: boolean | null;
  prompt?: DailyPrompt;
}

interface MemoryData {
  id: string;
  userId: string;
  type: string;
  content: string;
  mediaUrl: string | null;
  tags: string[] | null;
  createdAt: string | null;
}

interface UserTaskData {
  id: string;
  userId: string;
  taskId: string;
  completed: boolean | null;
  completedAt: string | null;
  task: {
    id: string;
    title: string;
    description: string | null;
    category: string;
    isTemplate: boolean | null;
  };
}

interface JournalEntryData {
  id: string;
  userId: string;
  title: string | null;
  content: string;
  category: string | null;
  fromPrompt: boolean | null;
  createdAt: string | null;
}

interface QuizData {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  questionCount: number | null;
  estimatedMinutes: number | null;
  resultTypes: any;
}

interface QuizResultData {
  id: string;
  userId: string;
  quizId: string;
  answers: any;
  resultType: string | null;
  score: number | null;
  insights: string | null;
  completedAt: string | null;
}

export interface ScenarioData {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  openingPrompt: string | null;
  systemContext: string | null;
  role: string | null;
  practicePoints: string[] | null;
  contextSetup: string | null;
}

export interface RoleplaySessionData {
  id: string;
  userId: string;
  scenarioId: string;
  messages: { role: string; content: string }[] | null;
  feedback: any;
  completedAt: string | null;
  createdAt: string | null;
  scenario?: ScenarioData;
}

interface AppContextValue {
  profile: UserProfile | null;
  setProfile: (data: any) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  authToken: string | null;
  promptResponses: PromptResponseData[];
  addPromptResponse: (data: { promptId: string; responseText: string; savedToJournal?: boolean }) => Promise<void>;
  updatePromptResponse: (id: string, data: { responseText: string; savedToJournal?: boolean }) => Promise<void>;
  memories: MemoryData[];
  addMemory: (data: { content: string; type?: string; tags?: string[]; mediaUrl?: string }) => Promise<void>;
  updateMemory: (id: string, data: { content?: string; tags?: string[]; type?: string; mediaUrl?: string }) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  tasks: UserTaskData[];
  toggleTask: (id: string) => Promise<void>;
  addCustomTask: (data: { title: string; description?: string; category: string }) => Promise<void>;
  journalEntries: JournalEntryData[];
  addJournalEntry: (data: { title?: string; content: string; category?: string; fromPrompt?: boolean }) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  quizzes: QuizData[];
  quizResults: QuizResultData[];
  submitQuizResult: (data: { quizId: string; answers: any; resultType: string; score: number; insights: string }) => Promise<QuizResultData>;
  scenarios: ScenarioData[];
  roleplaySessions: RoleplaySessionData[];
  createRoleplaySession: (scenarioId: string) => Promise<RoleplaySessionData>;
  sendRoleplayMessage: (sessionId: string, content: string) => Promise<RoleplaySessionData>;
  generateRoleplayFeedback: (sessionId: string) => Promise<RoleplaySessionData>;
  prompts: DailyPrompt[];
  isLoading: boolean;
  refreshing: boolean;
  refreshData: () => Promise<void>;
  getWeeklyProgress: () => number;
  getPregnancyWeek: () => number;
  getWeeklyCompletedCount: () => number;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  getCurrentStreak: () => number;
}

const AppContext = createContext<AppContextValue | null>(null);
const USER_ID_KEY = '@prepartum_user_id';
const AUTH_TOKEN_KEY = '@prepartum_auth_token';

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [promptResponses, setPromptResponses] = useState<PromptResponseData[]>([]);
  const [memories, setMemories] = useState<MemoryData[]>([]);
  const [tasks, setTasks] = useState<UserTaskData[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryData[]>([]);
  const [quizzesData, setQuizzesData] = useState<QuizData[]>([]);
  const [quizResults, setQuizResults] = useState<QuizResultData[]>([]);
  const [scenariosData, setScenariosData] = useState<ScenarioData[]>([]);
  const [roleplaySessionsData, setRoleplaySessionsData] = useState<RoleplaySessionData[]>([]);
  const [prompts, setPrompts] = useState<DailyPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFromApi = useCallback(async (path: string) => {
    const baseUrl = getApiUrl();
    const url = new URL(path, baseUrl);
    const res = await fetch(url.toString(), { credentials: 'include' });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  async function loadUserData(userId: string) {
    const [resps, mems, tks, jrnl, prts, qzs, qrs, scns, rpSessions] = await Promise.all([
      fetchFromApi(`/api/users/${userId}/prompt-responses`),
      fetchFromApi(`/api/users/${userId}/memories`),
      fetchFromApi(`/api/users/${userId}/tasks`),
      fetchFromApi(`/api/users/${userId}/journal`),
      fetchFromApi('/api/prompts'),
      fetchFromApi('/api/quizzes'),
      fetchFromApi(`/api/users/${userId}/quiz-results`),
      fetchFromApi('/api/scenarios'),
      fetchFromApi(`/api/users/${userId}/roleplay-sessions`),
    ]);
    setPromptResponses(resps);
    setMemories(mems);
    setTasks(tks);
    setJournalEntries(jrnl);
    setPrompts(prts);
    setQuizzesData(qzs);
    setQuizResults(qrs);
    setScenariosData(scns);
    setRoleplaySessionsData(rpSessions);
  }

  async function loadData() {
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const storedUserId = await AsyncStorage.getItem(USER_ID_KEY);

      if (storedToken) {
        setAuthToken(storedToken);
        try {
          const baseUrl = getApiUrl();
          const res = await fetch(new URL('/api/auth/me', baseUrl).toString(), {
            headers: { 'Authorization': `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const user = await res.json();
            setProfileState(user);
            await loadUserData(user.id);
          } else {
            await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
            await AsyncStorage.removeItem(USER_ID_KEY);
            setAuthToken(null);
          }
        } catch (e) {
          console.error('Error restoring auth session:', e);
          await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
          setAuthToken(null);
        }
      } else if (storedUserId) {
        try {
          const user = await fetchFromApi(`/api/users/${storedUserId}`);
          setProfileState(user);
          await loadUserData(storedUserId);
        } catch (e) {
          console.error('Error loading user data:', e);
          await AsyncStorage.removeItem(USER_ID_KEY);
        }
      } else {
        try {
          const [prts, qzs, scns] = await Promise.all([
            fetchFromApi('/api/prompts'),
            fetchFromApi('/api/quizzes'),
            fetchFromApi('/api/scenarios'),
          ]);
          setPrompts(prts);
          setQuizzesData(qzs);
          setScenariosData(scns);
        } catch (e) {
          console.error('Error loading prompts:', e);
        }
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const baseUrl = getApiUrl();
    const url = new URL('/api/auth/login', baseUrl);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_ID_KEY, data.user.id);
    setAuthToken(data.token);
    setProfileState(data.user);
    await loadUserData(data.user.id);
  }

  async function register(name: string, email: string, password: string) {
    const baseUrl = getApiUrl();
    const url = new URL('/api/auth/register', baseUrl);
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
    await AsyncStorage.setItem(USER_ID_KEY, data.user.id);
    setAuthToken(data.token);
    setProfileState(data.user);
    await loadUserData(data.user.id);
  }

  async function setProfile(data: any) {
    try {
      let user;
      if (profile?.id) {
        const res = await apiRequest('PUT', `/api/users/${profile.id}`, data);
        user = await res.json();
      } else {
        const res = await apiRequest('POST', '/api/users', data);
        user = await res.json();
        await AsyncStorage.setItem(USER_ID_KEY, user.id);
        const [tks, prts, qzs, scns] = await Promise.all([
          fetchFromApi(`/api/users/${user.id}/tasks`),
          fetchFromApi('/api/prompts'),
          fetchFromApi('/api/quizzes'),
          fetchFromApi('/api/scenarios'),
        ]);
        setTasks(tks);
        setPrompts(prts);
        setQuizzesData(qzs);
        setScenariosData(scns);
      }
      setProfileState(user);
    } catch (e) {
      console.error('Error saving profile:', e);
      throw e;
    }
  }

  async function addPromptResponse(data: { promptId: string; responseText: string; savedToJournal?: boolean }) {
    if (!profile?.id) return;
    try {
      const res = await apiRequest('POST', `/api/users/${profile.id}/prompt-responses`, data);
      const response = await res.json();
      setPromptResponses(prev => [response, ...prev]);
    } catch (e) {
      console.error('Error adding prompt response:', e);
      throw e;
    }
  }

  async function updatePromptResponse(id: string, data: { responseText: string; savedToJournal?: boolean }) {
    if (!profile?.id) return;
    try {
      const res = await apiRequest('PUT', `/api/users/${profile.id}/prompt-responses/${id}`, data);
      const updated = await res.json();
      setPromptResponses(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
    } catch (e) {
      console.error('Error updating prompt response:', e);
      throw e;
    }
  }

  async function addMemory(data: { content: string; type?: string; tags?: string[]; mediaUrl?: string }) {
    if (!profile?.id) return;
    try {
      const res = await apiRequest('POST', `/api/users/${profile.id}/memories`, data);
      const memory = await res.json();
      setMemories(prev => [memory, ...prev]);
    } catch (e) {
      console.error('Error adding memory:', e);
      throw e;
    }
  }

  async function updateMemory(id: string, data: { content?: string; tags?: string[]; type?: string; mediaUrl?: string }) {
    if (!profile?.id) return;
    try {
      const res = await apiRequest('PUT', `/api/users/${profile.id}/memories/${id}`, data);
      const updated = await res.json();
      setMemories(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m));
    } catch (e) {
      console.error('Error updating memory:', e);
      throw e;
    }
  }

  async function deleteMemory(id: string) {
    if (!profile?.id) return;
    try {
      await apiRequest('DELETE', `/api/users/${profile.id}/memories/${id}`);
      setMemories(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      console.error('Error deleting memory:', e);
      throw e;
    }
  }

  async function toggleTask(id: string) {
    if (!profile?.id) return;
    try {
      const res = await apiRequest('PUT', `/api/users/${profile.id}/tasks/${id}/toggle`);
      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updated } : t));
    } catch (e) {
      console.error('Error toggling task:', e);
      throw e;
    }
  }

  async function addCustomTask(data: { title: string; description?: string; category: string }) {
    if (!profile?.id) return;
    try {
      const res = await apiRequest('POST', `/api/users/${profile.id}/tasks`, data);
      const newTask = await res.json();
      setTasks(prev => [...prev, newTask]);
    } catch (e) {
      console.error('Error adding custom task:', e);
      throw e;
    }
  }

  async function submitQuizResult(data: { quizId: string; answers: any; resultType: string; score: number; insights: string }): Promise<QuizResultData> {
    if (!profile?.id) throw new Error('No profile');
    try {
      const res = await apiRequest('POST', `/api/users/${profile.id}/quiz-results`, data);
      const result = await res.json();
      setQuizResults(prev => [result, ...prev]);
      return result;
    } catch (e) {
      console.error('Error submitting quiz result:', e);
      throw e;
    }
  }

  async function createRoleplaySession(scenarioId: string): Promise<RoleplaySessionData> {
    if (!profile?.id) throw new Error('No profile');
    try {
      const res = await apiRequest('POST', `/api/users/${profile.id}/roleplay-sessions`, { scenarioId });
      const session = await res.json();
      setRoleplaySessionsData(prev => [session, ...prev]);
      return session;
    } catch (e) {
      console.error('Error creating roleplay session:', e);
      throw e;
    }
  }

  async function sendRoleplayMessage(sessionId: string, content: string): Promise<RoleplaySessionData> {
    try {
      const res = await apiRequest('POST', `/api/roleplay-sessions/${sessionId}/message`, { content });
      const updated = await res.json();
      setRoleplaySessionsData(prev => prev.map(s => s.id === sessionId ? updated : s));
      return updated;
    } catch (e) {
      console.error('Error sending roleplay message:', e);
      throw e;
    }
  }

  async function generateRoleplayFeedback(sessionId: string): Promise<RoleplaySessionData> {
    try {
      const res = await apiRequest('POST', `/api/roleplay-sessions/${sessionId}/feedback`);
      const updated = await res.json();
      setRoleplaySessionsData(prev => prev.map(s => s.id === sessionId ? updated : s));
      return updated;
    } catch (e) {
      console.error('Error generating feedback:', e);
      throw e;
    }
  }

  async function addJournalEntry(data: { title?: string; content: string; category?: string; fromPrompt?: boolean }) {
    if (!profile?.id) return;
    try {
      const res = await apiRequest('POST', `/api/users/${profile.id}/journal`, data);
      const entry = await res.json();
      setJournalEntries(prev => [entry, ...prev]);
    } catch (e) {
      console.error('Error adding journal entry:', e);
      throw e;
    }
  }

  async function deleteJournalEntry(id: string) {
    if (!profile?.id) return;
    try {
      await apiRequest('DELETE', `/api/users/${profile.id}/journal/${id}`);
      setJournalEntries(prev => prev.filter(e => e.id !== id));
    } catch (e) {
      console.error('Error deleting journal entry:', e);
      throw e;
    }
  }

  function getWeeklyProgress(): number {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeekResponses = promptResponses.filter(r => {
      const date = r.completedAt ? new Date(r.completedAt) : new Date();
      return date >= weekStart;
    });
    return Math.min(thisWeekResponses.length / 7, 1);
  }

  function getPregnancyWeek(): number {
    if (!profile?.dueDate) return 0;
    const due = new Date(profile.dueDate);
    const now = new Date();
    const diffMs = due.getTime() - now.getTime();
    const diffWeeks = Math.ceil(diffMs / (7 * 24 * 60 * 60 * 1000));
    const week = 40 - diffWeeks;
    return Math.max(1, Math.min(week, 42));
  }

  function getWeeklyCompletedCount(): number {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return promptResponses.filter(r => {
      const date = r.completedAt ? new Date(r.completedAt) : new Date();
      return date >= weekStart;
    }).length;
  }

  async function signOut() {
    await AsyncStorage.clear();
    setProfileState(null);
    setAuthToken(null);
    setPromptResponses([]);
    setMemories([]);
    setTasks([]);
    setJournalEntries([]);
    setQuizResults([]);
    setRoleplaySessionsData([]);
  }

  async function deleteAccount() {
    if (!profile?.id) return;
    try {
      await apiRequest('DELETE', `/api/users/${profile.id}`);
      await signOut();
    } catch (e) {
      console.error('Error deleting account:', e);
      throw e;
    }
  }

  function getCurrentStreak(): number {
    if (promptResponses.length === 0) return 0;
    const dates = promptResponses
      .filter(r => r.completedAt)
      .map(r => {
        const d = new Date(r.completedAt!);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      });
    const uniqueDates = [...new Set(dates)].sort().reverse();
    if (uniqueDates.length === 0) return 0;

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

    let streak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const curr = new Date(uniqueDates[i - 1]);
      const prev = new Date(uniqueDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (86400000));
      if (diffDays === 1) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  async function refreshData() {
    if (!profile?.id) return;
    setRefreshing(true);
    try {
      const [resps, mems, tks, jrnl, prts, qzs, qrs, scns, rpSessions] = await Promise.all([
        fetchFromApi(`/api/users/${profile.id}/prompt-responses`),
        fetchFromApi(`/api/users/${profile.id}/memories`),
        fetchFromApi(`/api/users/${profile.id}/tasks`),
        fetchFromApi(`/api/users/${profile.id}/journal`),
        fetchFromApi('/api/prompts'),
        fetchFromApi('/api/quizzes'),
        fetchFromApi(`/api/users/${profile.id}/quiz-results`),
        fetchFromApi('/api/scenarios'),
        fetchFromApi(`/api/users/${profile.id}/roleplay-sessions`),
      ]);
      setPromptResponses(resps);
      setMemories(mems);
      setTasks(tks);
      setJournalEntries(jrnl);
      setPrompts(prts);
      setQuizzesData(qzs);
      setQuizResults(qrs);
      setScenariosData(scns);
      setRoleplaySessionsData(rpSessions);
    } catch (e) {
      console.error('Error refreshing data:', e);
    } finally {
      setRefreshing(false);
    }
  }

  const value = useMemo(() => ({
    profile,
    setProfile,
    login,
    register,
    authToken,
    promptResponses,
    addPromptResponse,
    updatePromptResponse,
    memories,
    addMemory,
    updateMemory,
    deleteMemory,
    tasks,
    toggleTask,
    addCustomTask,
    journalEntries,
    addJournalEntry,
    deleteJournalEntry,
    quizzes: quizzesData,
    quizResults,
    submitQuizResult,
    scenarios: scenariosData,
    roleplaySessions: roleplaySessionsData,
    createRoleplaySession,
    sendRoleplayMessage,
    generateRoleplayFeedback,
    prompts,
    isLoading,
    refreshing,
    refreshData,
    getWeeklyProgress,
    getPregnancyWeek,
    getWeeklyCompletedCount,
    signOut,
    deleteAccount,
    getCurrentStreak,
  }), [profile, authToken, promptResponses, memories, tasks, journalEntries, quizzesData, quizResults, scenariosData, roleplaySessionsData, prompts, isLoading, refreshing]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

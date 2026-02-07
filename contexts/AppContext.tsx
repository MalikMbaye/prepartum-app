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

interface AppContextValue {
  profile: UserProfile | null;
  setProfile: (data: any) => Promise<void>;
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
  prompts: DailyPrompt[];
  isLoading: boolean;
  refreshing: boolean;
  refreshData: () => Promise<void>;
  getWeeklyProgress: () => number;
  getPregnancyWeek: () => number;
  getWeeklyCompletedCount: () => number;
}

const AppContext = createContext<AppContextValue | null>(null);
const USER_ID_KEY = '@prepartum_user_id';

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [promptResponses, setPromptResponses] = useState<PromptResponseData[]>([]);
  const [memories, setMemories] = useState<MemoryData[]>([]);
  const [tasks, setTasks] = useState<UserTaskData[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryData[]>([]);
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

  async function loadData() {
    try {
      const storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
      if (storedUserId) {
        try {
          const user = await fetchFromApi(`/api/users/${storedUserId}`);
          setProfileState(user);
          const [resps, mems, tks, jrnl, prts] = await Promise.all([
            fetchFromApi(`/api/users/${storedUserId}/prompt-responses`),
            fetchFromApi(`/api/users/${storedUserId}/memories`),
            fetchFromApi(`/api/users/${storedUserId}/tasks`),
            fetchFromApi(`/api/users/${storedUserId}/journal`),
            fetchFromApi('/api/prompts'),
          ]);
          setPromptResponses(resps);
          setMemories(mems);
          setTasks(tks);
          setJournalEntries(jrnl);
          setPrompts(prts);
        } catch (e) {
          console.error('Error loading user data:', e);
          await AsyncStorage.removeItem(USER_ID_KEY);
        }
      } else {
        try {
          const prts = await fetchFromApi('/api/prompts');
          setPrompts(prts);
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
        const [tks, prts] = await Promise.all([
          fetchFromApi(`/api/users/${user.id}/tasks`),
          fetchFromApi('/api/prompts'),
        ]);
        setTasks(tks);
        setPrompts(prts);
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

  async function refreshData() {
    if (!profile?.id) return;
    setRefreshing(true);
    try {
      const [resps, mems, tks, jrnl, prts] = await Promise.all([
        fetchFromApi(`/api/users/${profile.id}/prompt-responses`),
        fetchFromApi(`/api/users/${profile.id}/memories`),
        fetchFromApi(`/api/users/${profile.id}/tasks`),
        fetchFromApi(`/api/users/${profile.id}/journal`),
        fetchFromApi('/api/prompts'),
      ]);
      setPromptResponses(resps);
      setMemories(mems);
      setTasks(tks);
      setJournalEntries(jrnl);
      setPrompts(prts);
    } catch (e) {
      console.error('Error refreshing data:', e);
    } finally {
      setRefreshing(false);
    }
  }

  const value = useMemo(() => ({
    profile,
    setProfile,
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
    prompts,
    isLoading,
    refreshing,
    refreshData,
    getWeeklyProgress,
    getPregnancyWeek,
    getWeeklyCompletedCount,
  }), [profile, promptResponses, memories, tasks, journalEntries, prompts, isLoading, refreshing]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

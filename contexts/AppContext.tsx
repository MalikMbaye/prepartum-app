import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, PromptResponse, Memory, Task, JournalEntry, FocusArea } from '@/lib/types';
import { defaultTasks } from '@/lib/tasks-data';

interface AppContextValue {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => Promise<void>;
  promptResponses: PromptResponse[];
  addPromptResponse: (response: PromptResponse) => Promise<void>;
  memories: Memory[];
  addMemory: (memory: Memory) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  tasks: Task[];
  toggleTask: (id: string) => Promise<void>;
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteJournalEntry: (id: string) => Promise<void>;
  isLoading: boolean;
  getWeeklyProgress: () => number;
  getPregnancyWeek: () => number;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEYS = {
  PROFILE: '@prepartum_profile',
  PROMPT_RESPONSES: '@prepartum_prompts',
  MEMORIES: '@prepartum_memories',
  TASKS: '@prepartum_tasks',
  JOURNAL: '@prepartum_journal',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile | null>(null);
  const [promptResponses, setPromptResponses] = useState<PromptResponse[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [profileData, promptData, memoryData, taskData, journalData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
        AsyncStorage.getItem(STORAGE_KEYS.PROMPT_RESPONSES),
        AsyncStorage.getItem(STORAGE_KEYS.MEMORIES),
        AsyncStorage.getItem(STORAGE_KEYS.TASKS),
        AsyncStorage.getItem(STORAGE_KEYS.JOURNAL),
      ]);

      if (profileData) setProfileState(JSON.parse(profileData));
      if (promptData) setPromptResponses(JSON.parse(promptData));
      if (memoryData) setMemories(JSON.parse(memoryData));
      if (taskData) {
        setTasks(JSON.parse(taskData));
      } else {
        setTasks(defaultTasks);
        await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(defaultTasks));
      }
      if (journalData) setJournalEntries(JSON.parse(journalData));
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function setProfile(p: UserProfile) {
    setProfileState(p);
    await AsyncStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(p));
  }

  async function addPromptResponse(response: PromptResponse) {
    const updated = [response, ...promptResponses];
    setPromptResponses(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.PROMPT_RESPONSES, JSON.stringify(updated));
  }

  async function addMemory(memory: Memory) {
    const updated = [memory, ...memories];
    setMemories(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updated));
  }

  async function deleteMemory(id: string) {
    const updated = memories.filter(m => m.id !== id);
    setMemories(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.MEMORIES, JSON.stringify(updated));
  }

  async function toggleTask(id: string) {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    setTasks(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updated));
  }

  async function addJournalEntry(entry: JournalEntry) {
    const updated = [entry, ...journalEntries];
    setJournalEntries(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(updated));
  }

  async function deleteJournalEntry(id: string) {
    const updated = journalEntries.filter(e => e.id !== id);
    setJournalEntries(updated);
    await AsyncStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(updated));
  }

  function getWeeklyProgress(): number {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const thisWeekResponses = promptResponses.filter(r => new Date(r.date) >= weekStart);
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

  const value = useMemo(() => ({
    profile,
    setProfile,
    promptResponses,
    addPromptResponse,
    memories,
    addMemory,
    deleteMemory,
    tasks,
    toggleTask,
    journalEntries,
    addJournalEntry,
    deleteJournalEntry,
    isLoading,
    getWeeklyProgress,
    getPregnancyWeek,
  }), [profile, promptResponses, memories, tasks, journalEntries, isLoading]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}

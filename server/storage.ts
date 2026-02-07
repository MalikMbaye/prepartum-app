import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users, prompts, userPromptResponses, memories, tasks, userTasks,
  journalEntries, quizzes, quizQuestions, userQuizResults,
  roleplayScenarios, roleplaySessions,
  type User, type InsertUser, type Prompt, type PromptResponse,
  type Memory, type Task, type UserTask, type JournalEntry,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;

  getPromptsByWeek(weekNumber: number): Promise<Prompt[]>;
  getPromptsByCategory(category: string): Promise<Prompt[]>;
  getAllPrompts(): Promise<Prompt[]>;

  getUserPromptResponses(userId: string): Promise<(PromptResponse & { prompt?: Prompt })[]>;
  createPromptResponse(data: { userId: string; promptId: string; responseText: string; savedToJournal?: boolean }): Promise<PromptResponse>;
  updatePromptResponse(id: string, userId: string, data: { responseText: string; savedToJournal?: boolean }): Promise<PromptResponse | undefined>;

  getUserMemories(userId: string): Promise<Memory[]>;
  createMemory(data: { userId: string; type: string; content: string; mediaUrl?: string; tags?: string[] }): Promise<Memory>;
  deleteMemory(id: string, userId: string): Promise<boolean>;

  getTemplateTasks(): Promise<Task[]>;
  getUserTasks(userId: string): Promise<(UserTask & { task: Task })[]>;
  createUserTask(data: { userId: string; taskId: string }): Promise<UserTask>;
  toggleUserTask(id: string, userId: string): Promise<UserTask | undefined>;
  initUserTasks(userId: string): Promise<void>;

  getUserJournalEntries(userId: string): Promise<JournalEntry[]>;
  createJournalEntry(data: { userId: string; title?: string; content: string; category?: string; fromPrompt?: boolean; promptResponseId?: string }): Promise<JournalEntry>;
  deleteJournalEntry(id: string, userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async getPromptsByWeek(weekNumber: number): Promise<Prompt[]> {
    return db.select().from(prompts).where(eq(prompts.weekNumber, weekNumber));
  }

  async getPromptsByCategory(category: string): Promise<Prompt[]> {
    return db.select().from(prompts).where(eq(prompts.category, category));
  }

  async getAllPrompts(): Promise<Prompt[]> {
    return db.select().from(prompts);
  }

  async getUserPromptResponses(userId: string): Promise<(PromptResponse & { prompt?: Prompt })[]> {
    const responses = await db.select().from(userPromptResponses)
      .where(eq(userPromptResponses.userId, userId))
      .orderBy(desc(userPromptResponses.completedAt));

    const result = [];
    for (const r of responses) {
      const [prompt] = await db.select().from(prompts).where(eq(prompts.id, r.promptId));
      result.push({ ...r, prompt });
    }
    return result;
  }

  async createPromptResponse(data: { userId: string; promptId: string; responseText: string; savedToJournal?: boolean }): Promise<PromptResponse> {
    const [response] = await db.insert(userPromptResponses).values({
      userId: data.userId,
      promptId: data.promptId,
      responseText: data.responseText,
      savedToJournal: data.savedToJournal ?? false,
    }).returning();
    return response;
  }

  async updatePromptResponse(id: string, userId: string, data: { responseText: string; savedToJournal?: boolean }): Promise<PromptResponse | undefined> {
    const [existing] = await db.select().from(userPromptResponses)
      .where(and(eq(userPromptResponses.id, id), eq(userPromptResponses.userId, userId)));
    if (!existing) return undefined;

    const updateData: any = { responseText: data.responseText };
    if (data.savedToJournal !== undefined) updateData.savedToJournal = data.savedToJournal;

    const [updated] = await db.update(userPromptResponses)
      .set(updateData)
      .where(eq(userPromptResponses.id, id))
      .returning();
    return updated;
  }

  async getUserMemories(userId: string): Promise<Memory[]> {
    return db.select().from(memories)
      .where(eq(memories.userId, userId))
      .orderBy(desc(memories.createdAt));
  }

  async createMemory(data: { userId: string; type: string; content: string; mediaUrl?: string; tags?: string[] }): Promise<Memory> {
    const [memory] = await db.insert(memories).values({
      userId: data.userId,
      type: data.type || "text",
      content: data.content,
      mediaUrl: data.mediaUrl,
      tags: data.tags || [],
    }).returning();
    return memory;
  }

  async deleteMemory(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(memories).where(and(eq(memories.id, id), eq(memories.userId, userId))).returning();
    return result.length > 0;
  }

  async getTemplateTasks(): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.isTemplate, true));
  }

  async getUserTasks(userId: string): Promise<(UserTask & { task: Task })[]> {
    const userTaskRows = await db.select().from(userTasks)
      .where(eq(userTasks.userId, userId));

    const result = [];
    for (const ut of userTaskRows) {
      const [task] = await db.select().from(tasks).where(eq(tasks.id, ut.taskId));
      if (task) {
        result.push({ ...ut, task });
      }
    }
    return result;
  }

  async createUserTask(data: { userId: string; taskId: string }): Promise<UserTask> {
    const [ut] = await db.insert(userTasks).values({
      userId: data.userId,
      taskId: data.taskId,
      completed: false,
    }).returning();
    return ut;
  }

  async toggleUserTask(id: string, userId: string): Promise<UserTask | undefined> {
    const [existing] = await db.select().from(userTasks)
      .where(and(eq(userTasks.id, id), eq(userTasks.userId, userId)));
    if (!existing) return undefined;

    const [updated] = await db.update(userTasks).set({
      completed: !existing.completed,
      completedAt: !existing.completed ? new Date() : null,
    }).where(eq(userTasks.id, id)).returning();
    return updated;
  }

  async initUserTasks(userId: string): Promise<void> {
    const existing = await db.select().from(userTasks).where(eq(userTasks.userId, userId));
    if (existing.length > 0) return;

    const templateTasks = await this.getTemplateTasks();
    for (const t of templateTasks) {
      await db.insert(userTasks).values({ userId, taskId: t.id, completed: false });
    }
  }

  async getUserJournalEntries(userId: string): Promise<JournalEntry[]> {
    return db.select().from(journalEntries)
      .where(eq(journalEntries.userId, userId))
      .orderBy(desc(journalEntries.createdAt));
  }

  async createJournalEntry(data: { userId: string; title?: string; content: string; category?: string; fromPrompt?: boolean; promptResponseId?: string }): Promise<JournalEntry> {
    const [entry] = await db.insert(journalEntries).values({
      userId: data.userId,
      title: data.title,
      content: data.content,
      category: data.category || "general",
      fromPrompt: data.fromPrompt ?? false,
      promptResponseId: data.promptResponseId,
    }).returning();
    return entry;
  }

  async deleteJournalEntry(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(journalEntries).where(and(eq(journalEntries.id, id), eq(journalEntries.userId, userId))).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();

import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users, prompts, userPromptResponses, memories, tasks, userTasks,
  journalEntries, quizzes, quizQuestions, userQuizResults,
  roleplayScenarios, roleplaySessions,
  intakeQuestions, intakeResponses, pregnancyWeeks,
  type User, type InsertUser, type Prompt, type PromptResponse,
  type Memory, type Task, type UserTask, type JournalEntry,
  type Quiz, type QuizQuestion, type QuizResult,
  type RoleplayScenario, type RoleplaySession,
  type IntakeQuestion, type IntakeResponse, type PregnancyWeek,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getUserByEmail(email: string): Promise<User | undefined>;

  getPromptsByWeek(weekNumber: number): Promise<Prompt[]>;
  getPromptsByCategory(category: string): Promise<Prompt[]>;
  getAllPrompts(): Promise<Prompt[]>;

  getUserPromptResponses(userId: string): Promise<(PromptResponse & { prompt?: Prompt })[]>;
  createPromptResponse(data: { userId: string; promptId: string; responseText: string; savedToJournal?: boolean }): Promise<PromptResponse>;
  updatePromptResponse(id: string, userId: string, data: { responseText: string; savedToJournal?: boolean }): Promise<PromptResponse | undefined>;

  getUserMemories(userId: string): Promise<Memory[]>;
  createMemory(data: { userId: string; type: string; content?: string; title?: string; memoryDate?: string; mediaUrls?: string[]; mediaThumbnailUrl?: string; tags?: string[]; trimester?: number }): Promise<Memory>;
  updateMemory(id: string, userId: string, data: { content?: string; title?: string; memoryDate?: string; tags?: string[]; type?: string; mediaUrls?: string[]; mediaThumbnailUrl?: string; trimester?: number }): Promise<Memory | undefined>;
  deleteMemory(id: string, userId: string): Promise<boolean>;

  getTemplateTasks(): Promise<Task[]>;
  getUserTasks(userId: string): Promise<(UserTask & { task: Task })[]>;
  createUserTask(data: { userId: string; taskId: string }): Promise<UserTask>;
  createCustomTask(userId: string, data: { title: string; description?: string; category: string }): Promise<UserTask & { task: Task }>;
  toggleUserTask(id: string, userId: string): Promise<UserTask | undefined>;
  initUserTasks(userId: string): Promise<void>;

  getUserJournalEntries(userId: string): Promise<JournalEntry[]>;
  createJournalEntry(data: { userId: string; title?: string; content: string; category?: string; fromPrompt?: boolean; promptResponseId?: string }): Promise<JournalEntry>;
  deleteJournalEntry(id: string, userId: string): Promise<boolean>;

  getAllQuizzes(): Promise<Quiz[]>;
  getQuizWithQuestions(quizId: string): Promise<{ quiz: Quiz; questions: QuizQuestion[] } | undefined>;
  getUserQuizResults(userId: string): Promise<QuizResult[]>;
  createQuizResult(data: { userId: string; quizId: string; answers: any; resultType: string; score: number; insights: string }): Promise<QuizResult>;

  getAllScenarios(): Promise<RoleplayScenario[]>;
  getScenario(id: string): Promise<RoleplayScenario | undefined>;
  getUserSessions(userId: string): Promise<(RoleplaySession & { scenario?: RoleplayScenario })[]>;
  getSession(id: string): Promise<(RoleplaySession & { scenario?: RoleplayScenario }) | undefined>;
  createSession(data: { userId: string; scenarioId: string; messages: any[] }): Promise<RoleplaySession>;
  updateSession(id: string, data: { messages?: any[]; feedback?: any; completedAt?: Date | null }): Promise<RoleplaySession | undefined>;

  getAllIntakeQuestions(): Promise<IntakeQuestion[]>;
  getUserIntakeResponses(userId: string): Promise<IntakeResponse[]>;
  saveIntakeResponse(data: { userId: string; questionId: string; answer: string; answerData?: any }): Promise<IntakeResponse>;
  deleteUserIntakeResponses(userId: string): Promise<void>;

  getAllPregnancyWeeks(): Promise<PregnancyWeek[]>;
  getPregnancyWeek(weekNumber: number): Promise<PregnancyWeek | undefined>;
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

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    return result.length > 0;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
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
      .orderBy(desc(memories.memoryDate), desc(memories.createdAt));
  }

  async createMemory(data: {
    userId: string;
    type: string;
    content?: string;
    title?: string;
    memoryDate?: string;
    mediaUrls?: string[];
    mediaThumbnailUrl?: string;
    tags?: string[];
    trimester?: number;
  }): Promise<Memory> {
    const [memory] = await db.insert(memories).values({
      userId: data.userId,
      type: data.type || "text",
      title: data.title,
      content: data.content,
      memoryDate: data.memoryDate || new Date().toISOString().split('T')[0],
      mediaUrls: data.mediaUrls || [],
      mediaThumbnailUrl: data.mediaThumbnailUrl,
      tags: data.tags || [],
      trimester: data.trimester,
    }).returning();
    return memory;
  }

  async updateMemory(id: string, userId: string, data: {
    content?: string;
    title?: string;
    memoryDate?: string;
    tags?: string[];
    type?: string;
    mediaUrls?: string[];
    mediaThumbnailUrl?: string;
    trimester?: number;
  }): Promise<Memory | undefined> {
    const [existing] = await db.select().from(memories)
      .where(and(eq(memories.id, id), eq(memories.userId, userId)));
    if (!existing) return undefined;

    const updateData: any = { updatedAt: new Date() };
    if (data.content !== undefined) updateData.content = data.content;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.memoryDate !== undefined) updateData.memoryDate = data.memoryDate;
    if (data.tags !== undefined) updateData.tags = data.tags;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.mediaUrls !== undefined) updateData.mediaUrls = data.mediaUrls;
    if (data.mediaThumbnailUrl !== undefined) updateData.mediaThumbnailUrl = data.mediaThumbnailUrl;
    if (data.trimester !== undefined) updateData.trimester = data.trimester;

    const [updated] = await db.update(memories)
      .set(updateData)
      .where(eq(memories.id, id))
      .returning();
    return updated;
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

  async createCustomTask(userId: string, data: { title: string; description?: string; category: string }): Promise<UserTask & { task: Task }> {
    const [task] = await db.insert(tasks).values({
      title: data.title,
      description: data.description || null,
      category: data.category,
      isTemplate: false,
    }).returning();

    const [ut] = await db.insert(userTasks).values({
      userId,
      taskId: task.id,
      completed: false,
    }).returning();

    return { ...ut, task };
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

  async getAllQuizzes(): Promise<Quiz[]> {
    return db.select().from(quizzes).orderBy(quizzes.createdAt);
  }

  async getQuizWithQuestions(quizId: string): Promise<{ quiz: Quiz; questions: QuizQuestion[] } | undefined> {
    const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId));
    if (!quiz) return undefined;
    const questions = await db.select().from(quizQuestions)
      .where(eq(quizQuestions.quizId, quizId))
      .orderBy(quizQuestions.orderNumber);
    return { quiz, questions };
  }

  async getUserQuizResults(userId: string): Promise<QuizResult[]> {
    return db.select().from(userQuizResults)
      .where(eq(userQuizResults.userId, userId))
      .orderBy(desc(userQuizResults.completedAt));
  }

  async createQuizResult(data: { userId: string; quizId: string; answers: any; resultType: string; score: number; insights: string }): Promise<QuizResult> {
    const [result] = await db.insert(userQuizResults).values({
      userId: data.userId,
      quizId: data.quizId,
      answers: data.answers,
      resultType: data.resultType,
      score: data.score,
      insights: data.insights,
    }).returning();
    return result;
  }

  async getAllScenarios(): Promise<RoleplayScenario[]> {
    return db.select().from(roleplayScenarios);
  }

  async getScenario(id: string): Promise<RoleplayScenario | undefined> {
    const [scenario] = await db.select().from(roleplayScenarios).where(eq(roleplayScenarios.id, id));
    return scenario;
  }

  async getUserSessions(userId: string): Promise<(RoleplaySession & { scenario?: RoleplayScenario })[]> {
    const sessions = await db.select().from(roleplaySessions)
      .where(eq(roleplaySessions.userId, userId))
      .orderBy(desc(roleplaySessions.createdAt));
    const result = [];
    for (const s of sessions) {
      const [scenario] = await db.select().from(roleplayScenarios).where(eq(roleplayScenarios.id, s.scenarioId));
      result.push({ ...s, scenario });
    }
    return result;
  }

  async getSession(id: string): Promise<(RoleplaySession & { scenario?: RoleplayScenario }) | undefined> {
    const [session] = await db.select().from(roleplaySessions).where(eq(roleplaySessions.id, id));
    if (!session) return undefined;
    const [scenario] = await db.select().from(roleplayScenarios).where(eq(roleplayScenarios.id, session.scenarioId));
    return { ...session, scenario };
  }

  async createSession(data: { userId: string; scenarioId: string; messages: any[] }): Promise<RoleplaySession> {
    const [session] = await db.insert(roleplaySessions).values({
      userId: data.userId,
      scenarioId: data.scenarioId,
      messages: data.messages,
    }).returning();
    return session;
  }

  async updateSession(id: string, data: { messages?: any[]; feedback?: any; completedAt?: Date | null }): Promise<RoleplaySession | undefined> {
    const updateData: any = {};
    if (data.messages !== undefined) updateData.messages = data.messages;
    if (data.feedback !== undefined) updateData.feedback = data.feedback;
    if (data.completedAt !== undefined) updateData.completedAt = data.completedAt;
    const [updated] = await db.update(roleplaySessions).set(updateData).where(eq(roleplaySessions.id, id)).returning();
    return updated;
  }

  async getAllIntakeQuestions(): Promise<IntakeQuestion[]> {
    return db.select().from(intakeQuestions).orderBy(intakeQuestions.orderNumber);
  }

  async getUserIntakeResponses(userId: string): Promise<IntakeResponse[]> {
    return db.select().from(intakeResponses)
      .where(eq(intakeResponses.userId, userId))
      .orderBy(intakeResponses.createdAt);
  }

  async saveIntakeResponse(data: { userId: string; questionId: string; answer: string; answerData?: any }): Promise<IntakeResponse> {
    await db.delete(intakeResponses).where(
      and(eq(intakeResponses.userId, data.userId), eq(intakeResponses.questionId, data.questionId))
    );
    const [response] = await db.insert(intakeResponses).values({
      userId: data.userId,
      questionId: data.questionId,
      answer: data.answer,
      answerData: data.answerData || null,
    }).returning();
    return response;
  }

  async deleteUserIntakeResponses(userId: string): Promise<void> {
    await db.delete(intakeResponses).where(eq(intakeResponses.userId, userId));
  }

  async getAllPregnancyWeeks(): Promise<PregnancyWeek[]> {
    return db.select().from(pregnancyWeeks).orderBy(pregnancyWeeks.weekNumber);
  }

  async getPregnancyWeek(weekNumber: number): Promise<PregnancyWeek | undefined> {
    const [week] = await db.select().from(pregnancyWeeks).where(eq(pregnancyWeeks.weekNumber, weekNumber));
    return week;
  }
}

export const storage = new DatabaseStorage();

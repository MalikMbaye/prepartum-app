import { sql } from "drizzle-orm";
import {
  pgTable, text, varchar, uuid, integer, boolean, timestamp, date, time, jsonb
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  dueDate: date("due_date"),
  pregnancyWeek: integer("pregnancy_week"),
  focusAreas: text("focus_areas").array(),
  notificationTime: time("notification_time"),
  notificationsEnabled: boolean("notifications_enabled").default(true),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const prompts = pgTable("prompts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title"),
  body: text("body").notNull(),
  category: text("category").notNull(),
  weekNumber: integer("week_number"),
  dayOfWeek: integer("day_of_week"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userPromptResponses = pgTable("user_prompt_responses", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  promptId: uuid("prompt_id").notNull().references(() => prompts.id, { onDelete: "cascade" }),
  responseText: text("response_text").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow(),
  savedToJournal: boolean("saved_to_journal").default(false),
});

export const memories = pgTable("memories", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("text"),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  tags: text("tags").array(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category").notNull(),
  isTemplate: boolean("is_template").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const userTasks = pgTable("user_tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  taskId: uuid("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const quizzes = pgTable("quizzes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  questionCount: integer("question_count"),
  estimatedMinutes: integer("estimated_minutes"),
  resultTypes: jsonb("result_types"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const quizQuestions = pgTable("quiz_questions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  questionText: text("question_text").notNull(),
  options: jsonb("options"),
  orderNumber: integer("order_number"),
});

export const userQuizResults = pgTable("user_quiz_results", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizId: uuid("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
  answers: jsonb("answers"),
  resultType: text("result_type"),
  score: integer("score"),
  insights: text("insights"),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow(),
});

export const roleplayScenarios = pgTable("roleplay_scenarios", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  category: text("category"),
  openingPrompt: text("opening_prompt"),
  systemContext: text("system_context"),
});

export const roleplaySessions = pgTable("roleplay_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  scenarioId: uuid("scenario_id").notNull().references(() => roleplayScenarios.id, { onDelete: "cascade" }),
  messages: jsonb("messages"),
  feedback: text("feedback"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  category: text("category").default("general"),
  promptResponseId: uuid("prompt_response_id").references(() => userPromptResponses.id, { onDelete: "set null" }),
  fromPrompt: boolean("from_prompt").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPromptResponseSchema = createInsertSchema(userPromptResponses).omit({ id: true, completedAt: true });
export const insertMemorySchema = createInsertSchema(memories).omit({ id: true, createdAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertUserTaskSchema = createInsertSchema(userTasks).omit({ id: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, createdAt: true });
export const insertQuizResultSchema = createInsertSchema(userQuizResults).omit({ id: true, completedAt: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Prompt = typeof prompts.$inferSelect;
export type PromptResponse = typeof userPromptResponses.$inferSelect;
export type Memory = typeof memories.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type UserTask = typeof userTasks.$inferSelect;
export type Quiz = typeof quizzes.$inferSelect;
export type QuizQuestion = typeof quizQuestions.$inferSelect;
export type QuizResult = typeof userQuizResults.$inferSelect;
export type RoleplayScenario = typeof roleplayScenarios.$inferSelect;
export type RoleplaySession = typeof roleplaySessions.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;

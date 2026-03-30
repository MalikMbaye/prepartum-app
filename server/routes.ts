import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { calculateUserProfile } from "./profile-calculator";
import { getDailyPrompts } from "./daily-prompts";
import { updateUserSeasonWeekly, runSeasonUpdateForAllUsers } from "./season-updater";
import Anthropic from "@anthropic-ai/sdk";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { milestones, userMilestones } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import multer from "multer";
import { Client } from "@replit/object-storage";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const JWT_SECRET = process.env.SESSION_SECRET;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
let _objectStorageClient: Client | null = null;
function getObjectStorageClient(): Client {
  if (!_objectStorageClient) {
    _objectStorageClient = new Client();
  }
  return _objectStorageClient;
}

function authMiddleware(req: Request, res: Response, next: Function) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireOwnership(req: Request, res: Response, next: Function) {
  const requestedUserId = req.params.userId;
  const authenticatedUserId = (req as any).userId;
  if (requestedUserId && requestedUserId !== authenticatedUserId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {

  app.get("/privacy", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Privacy Policy — PrePartum</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #FFF8F5; color: #5D5066; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 16px; line-height: 1.7; padding: 40px 24px 80px; }
    .wrap { max-width: 680px; margin: 0 auto; }
    h1 { font-family: Georgia, serif; font-size: 28px; color: #5D5066; margin-bottom: 8px; }
    .meta { font-size: 13px; color: #9B8A99; margin-bottom: 32px; }
    h2 { font-family: Georgia, serif; font-size: 20px; color: #5D5066; margin-top: 36px; margin-bottom: 10px; }
    p { margin-bottom: 14px; }
    ul { padding-left: 20px; margin-bottom: 14px; }
    li { margin-bottom: 6px; }
    .disclaimer { background: #F5E1DA; border-radius: 10px; padding: 16px 20px; margin-top: 36px; font-size: 14px; }
    a { color: #7B6E8E; }
  </style>
</head>
<body>
<div class="wrap">
  <h1>PrePartum Privacy Policy</h1>
  <p class="meta">Last updated: March 30, 2026</p>

  <p>PrePartum is a prenatal wellness tool designed to support your emotional and mental preparation for motherhood. Your privacy matters deeply to us.</p>

  <h2>What We Collect</h2>
  <p>We collect the information you provide when using PrePartum, including:</p>
  <ul>
    <li>Your name and email address</li>
    <li>Your due date and pregnancy week</li>
    <li>Intake questionnaire responses</li>
    <li>Daily reflection answers and journal entries</li>
    <li>Photos and voice recordings you add to your memory bank</li>
    <li>A unique user ID generated when you create your account</li>
  </ul>

  <h2>Why We Collect It</h2>
  <p>We use your information to personalize your experience, deliver relevant daily reflections, power the app's features, and improve the quality of the content we provide. We do not use your data for advertising.</p>

  <h2>Who We Share It With</h2>
  <p>We share your data only with the third-party services required to operate the app:</p>
  <ul>
    <li><strong>Anthropic</strong> — used only for the AI roleplay feature, and only the content of that conversation is shared</li>
    <li><strong>Apple / Google</strong> — for app distribution through their respective stores</li>
  </ul>
  <p>We never sell your data. We never share your personal information with advertisers or data brokers.</p>

  <h2>How Long We Keep It</h2>
  <p>We retain your data for as long as your account exists. If you delete your account, all of your personal data is permanently deleted from our systems within 30 days.</p>

  <h2>Your Rights</h2>
  <p>You can delete all your data at any time from the Settings screen in the app. You may also request a copy of your data or ask us to correct inaccurate information by contacting us.</p>

  <h2>Contact</h2>
  <p>If you have questions about this Privacy Policy or how your data is handled, please contact us at <a href="mailto:privacy@prepartumapp.com">privacy@prepartumapp.com</a>.</p>

  <div class="disclaimer">
    <strong>Medical Disclaimer:</strong> PrePartum is a wellness app, not a medical application. It does not provide medical advice, diagnosis, or treatment. It is not a substitute for professional care. Always consult a qualified healthcare provider for medical concerns during pregnancy.
  </div>
</div>
</body>
</html>`);
  });

  app.get("/terms", (_req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Terms of Service — PrePartum</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #FFF8F5; color: #5D5066; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 16px; line-height: 1.7; padding: 40px 24px 80px; }
    .wrap { max-width: 680px; margin: 0 auto; }
    h1 { font-family: Georgia, serif; font-size: 28px; color: #5D5066; margin-bottom: 8px; }
    .meta { font-size: 13px; color: #9B8A99; margin-bottom: 32px; }
    h2 { font-family: Georgia, serif; font-size: 20px; color: #5D5066; margin-top: 36px; margin-bottom: 10px; }
    p { margin-bottom: 14px; }
    ul { padding-left: 20px; margin-bottom: 14px; }
    li { margin-bottom: 6px; }
    a { color: #7B6E8E; }
  </style>
</head>
<body>
<div class="wrap">
  <h1>PrePartum Terms of Service</h1>
  <p class="meta">Last updated: March 30, 2026</p>

  <p>By using PrePartum, you agree to these Terms of Service. Please read them carefully.</p>

  <h2>What PrePartum Is</h2>
  <p>PrePartum is a prenatal wellness tool designed to support your mental and emotional preparation for motherhood. It provides daily reflections, journaling tools, a memory bank, task checklists, self-discovery quizzes, and AI-assisted practice conversations.</p>
  <p>PrePartum is not a medical application. It is not a substitute for professional mental health care, therapy, obstetric care, or any other medical or clinical service. If you are experiencing a mental health crisis or a medical emergency, please contact a qualified professional or emergency services immediately.</p>

  <h2>Your Content</h2>
  <p>You own your journal entries, voice notes, memories, and all other content you create within PrePartum. We store your content on your behalf to provide the service. We do not claim ownership of anything you write, record, or upload.</p>
  <p>By using the app, you grant PrePartum a limited license to store and display your content solely for the purpose of providing the service to you.</p>

  <h2>Acceptable Use</h2>
  <p>You agree to use PrePartum only for its intended personal wellness purposes. You agree not to:</p>
  <ul>
    <li>Attempt to access or misuse another user's account or data</li>
    <li>Reverse engineer, copy, or redistribute any part of the app</li>
    <li>Use the app in any way that violates applicable laws</li>
    <li>Use the AI roleplay feature to generate harmful or abusive content</li>
  </ul>

  <h2>Limitation of Liability</h2>
  <p>PrePartum is provided "as is" without warranties of any kind. We are not liable for any health outcomes, decisions you make based on app content, or any indirect, incidental, or consequential damages arising from your use of the app.</p>
  <p>The wellness content in PrePartum is for informational and reflective purposes only. Always consult a qualified healthcare provider for medical questions during your pregnancy.</p>

  <h2>Account Deletion</h2>
  <p>You may delete your account and all associated data at any time from the Settings screen. Upon deletion, your data will be permanently removed from our systems within 30 days.</p>

  <h2>Governing Law</h2>
  <p>These Terms of Service are governed by the laws of the State of California, without regard to its conflict of law provisions.</p>

  <h2>Changes to These Terms</h2>
  <p>We may update these Terms from time to time. We will notify you of significant changes through the app. Continued use of PrePartum after changes are posted constitutes your acceptance of the updated Terms.</p>

  <h2>Contact</h2>
  <p>For questions about these Terms, please contact us at <a href="mailto:support@prepartumapp.com">support@prepartumapp.com</a>.</p>
</div>
</body>
</html>`);
  });

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;
      if (!email || !password || !name) {
        return res.status(400).json({ message: "Email, password, and name are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const existing = await storage.getUserByEmail(email.toLowerCase().trim());
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
      });
      await storage.initUserTasks(user.id);
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
      const { passwordHash: _, ...safeUser } = user;
      res.json({ user: safeUser, token });
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const user = await storage.getUserByEmail(email.toLowerCase().trim());
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
      const { passwordHash: _, ...safeUser } = user;
      res.json({ user: safeUser, token });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await storage.getUser(decoded.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { passwordHash: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    try {
      const user = await storage.createUser(req.body);
      await storage.initUserTasks(user.id);
      res.json(user);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) return res.status(404).json({ message: "User not found" });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/prompts", async (req: Request, res: Response) => {
    try {
      const { week, category } = req.query;
      let result;
      if (week) {
        result = await storage.getPromptsByWeek(Number(week));
      } else if (category) {
        result = await storage.getPromptsByCategory(String(category));
      } else {
        result = await storage.getAllPrompts();
      }
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users/:userId/daily-prompts", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const dailyPrompts = await getDailyPrompts(req.params.userId);
      res.json(dailyPrompts);
    } catch (e: any) {
      console.error("Daily prompts error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/update-season", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const result = await updateUserSeasonWeekly(req.params.userId);
      res.json(result);
    } catch (e: any) {
      console.error("Season update error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/admin/update-all-seasons", authMiddleware, async (_req: Request, res: Response) => {
    try {
      const result = await runSeasonUpdateForAllUsers();
      res.json(result);
    } catch (e: any) {
      console.error("Batch season update error:", e);
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users/:userId/prompt-responses", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const responses = await storage.getUserPromptResponses(req.params.userId);
      res.json(responses);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/prompt-responses", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const response = await storage.createPromptResponse({
        userId: req.params.userId,
        ...req.body,
      });
      res.json(response);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/users/:userId/prompt-responses/:id", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updatePromptResponse(req.params.id, req.params.userId, req.body);
      if (!updated) return res.status(404).json({ message: "Response not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/users/:userId/memories", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const result = await storage.getUserMemories(req.params.userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/memories", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const memory = await storage.createMemory({ userId: req.params.userId, ...req.body });
      res.json(memory);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/users/:userId/memories/:id", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateMemory(req.params.id, req.params.userId, req.body);
      if (!updated) return res.status(404).json({ message: "Memory not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/users/:userId/memories/:id", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteMemory(req.params.id, req.params.userId);
      if (!deleted) return res.status(404).json({ message: "Memory not found" });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users/:userId/tasks", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      await storage.initUserTasks(req.params.userId);
      const result = await storage.getUserTasks(req.params.userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/tasks", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const result = await storage.createCustomTask(req.params.userId, req.body);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/users/:userId/tasks/:id/toggle", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const ut = await storage.toggleUserTask(req.params.id, req.params.userId);
      if (!ut) return res.status(404).json({ message: "Task not found" });
      res.json(ut);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users/:userId/journal", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const result = await storage.getUserJournalEntries(req.params.userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/journal", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const entry = await storage.createJournalEntry({ userId: req.params.userId, ...req.body });
      res.json(entry);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/users/:userId/journal/:id", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteJournalEntry(req.params.id, req.params.userId);
      if (!deleted) return res.status(404).json({ message: "Entry not found" });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/quizzes", async (req: Request, res: Response) => {
    try {
      const result = await storage.getAllQuizzes();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/quizzes/:id", async (req: Request, res: Response) => {
    try {
      const result = await storage.getQuizWithQuestions(req.params.id);
      if (!result) return res.status(404).json({ message: "Quiz not found" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users/:userId/quiz-results", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const result = await storage.getUserQuizResults(req.params.userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/quiz-results", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const result = await storage.createQuizResult({
        userId: req.params.userId,
        ...req.body,
      });
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/scenarios", async (req: Request, res: Response) => {
    try {
      const result = await storage.getAllScenarios();
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/scenarios/:id", async (req: Request, res: Response) => {
    try {
      const result = await storage.getScenario(req.params.id);
      if (!result) return res.status(404).json({ message: "Scenario not found" });
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users/:userId/roleplay-sessions", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const result = await storage.getUserSessions(req.params.userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/roleplay-sessions", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const { scenarioId } = req.body;
      const scenario = await storage.getScenario(scenarioId);
      if (!scenario) return res.status(404).json({ message: "Scenario not found" });

      const initialMessages = [
        { role: "assistant", content: scenario.openingPrompt }
      ];
      const session = await storage.createSession({
        userId: req.params.userId,
        scenarioId,
        messages: initialMessages,
      });
      const fullSession = await storage.getSession(session.id);
      res.json(fullSession);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/roleplay-sessions/:id/message", async (req: Request, res: Response) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) return res.status(404).json({ message: "Session not found" });

      const scenario = session.scenario;
      if (!scenario) return res.status(400).json({ message: "Scenario not found for session" });

      const { content } = req.body;
      const messages = (session.messages as any[]) || [];
      messages.push({ role: "user", content });

      const anthropic = new Anthropic({
        apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      });

      const apiMessages = messages.map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 300,
        system: scenario.systemContext || "You are a helpful roleplay partner. Stay in character.",
        messages: apiMessages,
      });

      const aiContent = response.content?.[0];
      if (!aiContent) {
        return res.status(500).json({ error: "AI response was empty" });
      }
      const aiText = aiContent.type === "text" ? aiContent.text : "";
      messages.push({ role: "assistant", content: aiText });

      const updated = await storage.updateSession(req.params.id, { messages });
      res.json({ ...updated, scenario });
    } catch (e: any) {
      console.error("AI conversation error:", e);
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  app.post("/api/roleplay-sessions/:id/feedback", async (req: Request, res: Response) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) return res.status(404).json({ message: "Session not found" });

      const scenario = session.scenario;
      if (!scenario) return res.status(400).json({ message: "Scenario not found" });

      const messages = (session.messages as any[]) || [];
      const practicePoints = (scenario.practicePoints as string[]) || [];

      const anthropic = new Anthropic({
        apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      });

      const conversationSummary = messages.map((m: any) =>
        `${m.role === "user" ? "User" : scenario.role}: ${m.content}`
      ).join("\n");

      const feedbackPrompt = `You are an empathetic communication coach analyzing a practice conversation. The user was practicing: "${scenario.title}" — ${scenario.description}

The practice points were:
${practicePoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Here is the conversation:
${conversationSummary}

Provide feedback in this exact JSON format:
{
  "overallScore": <number 1-5>,
  "summary": "<2-3 sentences of warm, encouraging overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": ["<area for growth 1>", "<area for growth 2>"],
  "practicePointScores": [
    {"point": "<practice point text>", "score": <1-5>, "note": "<brief note>"}
  ],
  "encouragement": "<a warm, motivating closing message>"
}

Be encouraging and constructive. Focus on what they did well first. Use warm, supportive language appropriate for an expectant mother. Return ONLY valid JSON.`;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 1000,
        messages: [{ role: "user", content: feedbackPrompt }],
      });

      const feedbackContent = response.content?.[0];
      if (!feedbackContent) {
        return res.status(500).json({ error: "AI response was empty" });
      }
      const feedbackText = feedbackContent.type === "text" ? feedbackContent.text : "{}";
      let feedback;
      try {
        const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
        feedback = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: feedbackText, overallScore: 3 };
      } catch {
        feedback = { summary: feedbackText, overallScore: 3, strengths: [], improvements: [] };
      }

      const updated = await storage.updateSession(req.params.id, {
        feedback,
        completedAt: new Date(),
      });
      res.json({ ...updated, scenario });
    } catch (e: any) {
      console.error("Feedback generation error:", e);
      res.status(500).json({ message: "Failed to generate feedback" });
    }
  });

  app.get("/api/intake-questions", async (req: Request, res: Response) => {
    try {
      const questions = await storage.getAllIntakeQuestions();
      res.json(questions);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users/:userId/intake-responses", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const responses = await storage.getUserIntakeResponses(req.params.userId);
      res.json(responses);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/intake-responses", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const { questionId, answer, answerData } = req.body;
      const response = await storage.saveIntakeResponse({
        userId: req.params.userId,
        questionId,
        answer,
        answerData,
      });
      res.json(response);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/intake/complete", authMiddleware, requireOwnership, async (req: Request, res: Response) => {
    try {
      const profile = await calculateUserProfile(req.params.userId);
      const user = await storage.getUser(req.params.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json({ user, profile });
    } catch (e: any) {
      console.error("Profile calculation error:", e);
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/milestones", async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string | undefined;
      const allMilestones = await db.select().from(milestones).orderBy(milestones.weekNumber);
      if (!userId) {
        return res.json(allMilestones.map(m => ({ ...m, isCompleted: false })));
      }
      const userMs = await db.select().from(userMilestones).where(eq(userMilestones.userId, userId));
      const completedSet = new Set(userMs.filter(um => um.isCompleted).map(um => um.milestoneId));
      res.json(allMilestones.map(m => ({ ...m, isCompleted: completedSet.has(m.id) })));
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/milestones/:id/complete", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId, isCompleted } = req.body;
      if (!userId) return res.status(400).json({ message: "userId required" });
      const [existing] = await db.select().from(userMilestones)
        .where(and(eq(userMilestones.userId, userId), eq(userMilestones.milestoneId, id)));
      if (existing) {
        const [updated] = await db.update(userMilestones)
          .set({ isCompleted, completedAt: isCompleted ? new Date() : null })
          .where(eq(userMilestones.id, existing.id))
          .returning();
        return res.json(updated);
      }
      const [created] = await db.insert(userMilestones)
        .values({ userId, milestoneId: id, isCompleted, completedAt: isCompleted ? new Date() : null })
        .returning();
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/upload", authMiddleware, upload.single("file"), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file provided" });
      }
      const file = req.file;
      const userId = (req as any).userId;
      const ext = file.originalname.split('.').pop() || 'bin';
      const objectKey = `memories/${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const client = getObjectStorageClient();
      const uploadResult = await client.uploadFromBytes(objectKey, file.buffer, {
        headers: { "Content-Type": file.mimetype },
      });

      if (!uploadResult.ok) {
        throw new Error("Upload failed: " + uploadResult.error?.message);
      }

      const publicUrl = `https://objectstorage.replit.com/${objectKey}`;

      res.json({
        url: publicUrl,
        storagePath: objectKey,
        mimeType: file.mimetype,
        fileSize: file.size,
      });
    } catch (e: any) {
      console.error("Upload error:", e);
      res.status(500).json({ message: e.message || "Upload failed" });
    }
  });

  app.get("/api/pregnancy-weeks", async (req: Request, res: Response) => {
    try {
      const weeks = await storage.getAllPregnancyWeeks();
      res.json(weeks);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/pregnancy-weeks/:weekNumber", async (req: Request, res: Response) => {
    try {
      let weekNumber = parseInt(req.params.weekNumber, 10);
      if (isNaN(weekNumber)) return res.status(400).json({ error: "Invalid week number" });
      if (weekNumber < 1) weekNumber = 1;
      if (weekNumber > 40) weekNumber = 40;
      const week = await storage.getPregnancyWeek(weekNumber);
      if (!week) return res.status(404).json({ error: "Week not found" });
      res.json(week);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

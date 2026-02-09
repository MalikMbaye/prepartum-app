import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import Anthropic from "@anthropic-ai/sdk";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "prepartum-secret-key";

export async function registerRoutes(app: Express): Promise<Server> {

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

  app.get("/api/users/:userId/prompt-responses", async (req: Request, res: Response) => {
    try {
      const responses = await storage.getUserPromptResponses(req.params.userId);
      res.json(responses);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/prompt-responses", async (req: Request, res: Response) => {
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

  app.put("/api/users/:userId/prompt-responses/:id", async (req: Request, res: Response) => {
    try {
      const updated = await storage.updatePromptResponse(req.params.id, req.params.userId, req.body);
      if (!updated) return res.status(404).json({ message: "Response not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.get("/api/users/:userId/memories", async (req: Request, res: Response) => {
    try {
      const result = await storage.getUserMemories(req.params.userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/memories", async (req: Request, res: Response) => {
    try {
      const memory = await storage.createMemory({ userId: req.params.userId, ...req.body });
      res.json(memory);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/users/:userId/memories/:id", async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateMemory(req.params.id, req.params.userId, req.body);
      if (!updated) return res.status(404).json({ message: "Memory not found" });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/users/:userId/memories/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deleteMemory(req.params.id, req.params.userId);
      if (!deleted) return res.status(404).json({ message: "Memory not found" });
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users/:userId/tasks", async (req: Request, res: Response) => {
    try {
      await storage.initUserTasks(req.params.userId);
      const result = await storage.getUserTasks(req.params.userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/tasks", async (req: Request, res: Response) => {
    try {
      const result = await storage.createCustomTask(req.params.userId, req.body);
      res.json(result);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.put("/api/users/:userId/tasks/:id/toggle", async (req: Request, res: Response) => {
    try {
      const ut = await storage.toggleUserTask(req.params.id, req.params.userId);
      if (!ut) return res.status(404).json({ message: "Task not found" });
      res.json(ut);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.get("/api/users/:userId/journal", async (req: Request, res: Response) => {
    try {
      const result = await storage.getUserJournalEntries(req.params.userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/journal", async (req: Request, res: Response) => {
    try {
      const entry = await storage.createJournalEntry({ userId: req.params.userId, ...req.body });
      res.json(entry);
    } catch (e: any) {
      res.status(400).json({ message: e.message });
    }
  });

  app.delete("/api/users/:userId/journal/:id", async (req: Request, res: Response) => {
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

  app.get("/api/users/:userId/quiz-results", async (req: Request, res: Response) => {
    try {
      const result = await storage.getUserQuizResults(req.params.userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/quiz-results", async (req: Request, res: Response) => {
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

  app.get("/api/users/:userId/roleplay-sessions", async (req: Request, res: Response) => {
    try {
      const result = await storage.getUserSessions(req.params.userId);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e.message });
    }
  });

  app.post("/api/users/:userId/roleplay-sessions", async (req: Request, res: Response) => {
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

      const aiContent = response.content[0];
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

      const feedbackText = response.content[0].type === "text" ? response.content[0].text : "{}";
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

  const httpServer = createServer(app);
  return httpServer;
}

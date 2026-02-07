import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {

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

  const httpServer = createServer(app);
  return httpServer;
}

import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertProjectSchema, insertFileSchema, insertIssueSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Projects routes
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.status(200).json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error fetching projects" });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: "Invalid project data" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.status(200).json(project);
    } catch (error) {
      res.status(500).json({ message: "Error fetching project" });
    }
  });

  // Files routes
  app.get("/api/projects/:projectId/files", async (req, res) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const files = await storage.getFilesByProject(projectId);
      res.status(200).json(files);
    } catch (error) {
      res.status(500).json({ message: "Error fetching files" });
    }
  });

  app.post("/api/files", async (req, res) => {
    try {
      const validatedData = insertFileSchema.parse(req.body);
      const file = await storage.createFile(validatedData);
      res.status(201).json(file);
    } catch (error) {
      res.status(400).json({ message: "Invalid file data" });
    }
  });

  app.get("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      res.status(200).json(file);
    } catch (error) {
      res.status(500).json({ message: "Error fetching file" });
    }
  });

  app.put("/api/files/:id", async (req, res) => {
    try {
      const fileId = parseInt(req.params.id);
      const file = await storage.getFile(fileId);
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const updatedFile = await storage.updateFile(fileId, req.body);
      res.status(200).json(updatedFile);
    } catch (error) {
      res.status(500).json({ message: "Error updating file" });
    }
  });

  // Issues routes
  app.get("/api/files/:fileId/issues", async (req, res) => {
    try {
      const fileId = parseInt(req.params.fileId);
      const issues = await storage.getIssuesByFile(fileId);
      res.status(200).json(issues);
    } catch (error) {
      res.status(500).json({ message: "Error fetching issues" });
    }
  });

  app.post("/api/issues", async (req, res) => {
    try {
      const validatedData = insertIssueSchema.parse(req.body);
      const issue = await storage.createIssue(validatedData);
      res.status(201).json(issue);
    } catch (error) {
      res.status(400).json({ message: "Invalid issue data" });
    }
  });

  app.put("/api/issues/:id", async (req, res) => {
    try {
      const issueId = parseInt(req.params.id);
      const issue = await storage.getIssue(issueId);
      
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      const updatedIssue = await storage.updateIssue(issueId, req.body);
      res.status(200).json(updatedIssue);
    } catch (error) {
      res.status(500).json({ message: "Error updating issue" });
    }
  });

  app.delete("/api/issues/:id", async (req, res) => {
    try {
      const issueId = parseInt(req.params.id);
      const issue = await storage.getIssue(issueId);
      
      if (!issue) {
        return res.status(404).json({ message: "Issue not found" });
      }
      
      await storage.deleteIssue(issueId);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting issue" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

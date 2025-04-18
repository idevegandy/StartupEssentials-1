import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: integer("user_id").references(() => users.id),
});

export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  path: text("path").notNull(),
  content: text("content"),
  projectId: integer("project_id").references(() => projects.id),
  hasErrors: boolean("has_errors").default(false),
});

export const issues = pgTable("issues", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").references(() => files.id),
  line: integer("line"),
  column: integer("column"),
  severity: text("severity").notNull(), // 'high', 'medium', 'low'
  message: text("message").notNull(),
  code: text("code").notNull(),
  suggestion: text("suggestion"),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  description: true,
  userId: true,
});

export const insertFileSchema = createInsertSchema(files).pick({
  name: true,
  path: true,
  content: true,
  projectId: true,
  hasErrors: true,
});

export const insertIssueSchema = createInsertSchema(issues).pick({
  fileId: true,
  line: true,
  column: true,
  severity: true,
  message: true,
  code: true,
  suggestion: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

export type InsertIssue = z.infer<typeof insertIssueSchema>;
export type Issue = typeof issues.$inferSelect;

import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['super_admin', 'restaurant_admin']);
export const restaurantStatusEnum = pgEnum('restaurant_status', ['active', 'pending', 'inactive']);

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default('restaurant_admin'),
  restaurantId: integer("restaurant_id").references(() => restaurants.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Restaurant schema
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  status: restaurantStatusEnum("status").notNull().default('active'),
  primaryColor: text("primary_color").default('#3b82f6'),
  backgroundColor: text("background_color").default('#ffffff'),
  facebook: text("facebook"),
  instagram: text("instagram"),
  whatsapp: text("whatsapp"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Category schema
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Menu item schema
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: text("price").notNull(),
  image: text("image"),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: 'cascade' }),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  order: integer("order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ id: true, createdAt: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true, createdAt: true });

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Restaurant = typeof restaurants.$inferSelect;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

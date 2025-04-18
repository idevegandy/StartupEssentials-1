import { pgTable, text, serial, integer, boolean, timestamp, uniqueIndex, json, foreignKey, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Role enum for user types
export const roleEnum = pgEnum('role', ['super_admin', 'restaurant_admin']);

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default('restaurant_admin'),
  restaurantId: integer("restaurant_id").references(() => restaurants.id, { onDelete: 'set null' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users relationships
export const usersRelations = relations(users, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [users.restaurantId],
    references: [restaurants.id],
    relationName: "restaurant_admin"
  }),
}));

// Restaurants table
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  primaryColor: text("primary_color").default("#14b8a6"),
  backgroundColor: text("background_color").default("#ffffff"),
  facebookLink: text("facebook_link"),
  instagramLink: text("instagram_link"),
  websiteLink: text("website_link"),
  description: text("description"),
  phone: text("phone"),
  address: text("address"),
  rtl: boolean("rtl").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => {
  return {
    slugIdx: uniqueIndex("restaurant_slug_idx").on(table.slug),
  };
});

// Restaurant relationships
export const restaurantsRelations = relations(restaurants, ({ many, one }) => ({
  categories: many(categories),
  admin: many(users, { relationName: "restaurant_admin" }),
}));

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon").default("utensils"),
  displayOrder: integer("display_order").default(0),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Category relationships
export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [categories.restaurantId],
    references: [restaurants.id],
  }),
  items: many(items),
}));

// Items table
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in cents
  image: text("image"),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: 'cascade' }),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Item relationships
export const itemsRelations = relations(items, ({ one }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Select schemas
export const selectUserSchema = createSelectSchema(users);
export const selectRestaurantSchema = createSelectSchema(restaurants);
export const selectCategorySchema = createSelectSchema(categories);
export const selectItemSchema = createSelectSchema(items);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertItem = z.infer<typeof insertItemSchema>;

export type User = typeof users.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Item = typeof items.$inferSelect;

import { pgTable, text, serial, integer, boolean, json, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table (both super admins and restaurant admins)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("restaurant_admin"), // super_admin or restaurant_admin
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Restaurants table
export const restaurants = pgTable("restaurants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug"), // URL-friendly slug for the restaurant
  description: text("description"),
  logo: text("logo"), // URL to logo image
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  adminId: integer("admin_id").notNull().references(() => users.id),
  status: text("status").notNull().default("setup"), // active, inactive, setup
  primaryColor: text("primary_color").default("#e65100"),
  secondaryColor: text("secondary_color").default("#f57c00"),
  rtl: boolean("rtl").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("utensils"),
  displayOrder: integer("display_order").default(0),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Menu items table
export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // Price in shekels (stored as integer)
  discountPrice: integer("discount_price"), // Optional discount price
  image: text("image"), // URL to item image
  featured: boolean("featured").default(false),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Social Media Links table
export const socialMediaLinks = pgTable("social_media_links", {
  id: serial("id").primaryKey(),
  platform: text("platform").notNull(), // facebook, instagram, whatsapp, etc.
  url: text("url").notNull(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// QR Codes table
export const qrCodes = pgTable("qr_codes", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  restaurantId: integer("restaurant_id").notNull().references(() => restaurants.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Activity Logs table
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(),
  details: json("details"),
  entityType: text("entity_type"), // restaurant, user, menu_item, etc.
  entityId: integer("entity_id"), // ID of the entity
  restaurantId: integer("restaurant_id").references(() => restaurants.id), // Optional, if associated with a restaurant
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertRestaurantSchema = createInsertSchema(restaurants).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertCategorySchema = createInsertSchema(categories).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertSocialMediaLinkSchema = createInsertSchema(socialMediaLinks).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertQRCodeSchema = createInsertSchema(qrCodes).omit({
  id: true, 
  createdAt: true
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true, 
  createdAt: true
});

// Export types using z.infer
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRestaurant = z.infer<typeof insertRestaurantSchema>;
export type Restaurant = typeof restaurants.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItems.$inferSelect;

export type InsertSocialMediaLink = z.infer<typeof insertSocialMediaLinkSchema>;
export type SocialMediaLink = typeof socialMediaLinks.$inferSelect;

export type InsertQRCode = z.infer<typeof insertQRCodeSchema>;
export type QRCode = typeof qrCodes.$inferSelect;

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  restaurants: many(restaurants),
  activityLogs: many(activityLogs)
}));

export const restaurantsRelations = relations(restaurants, ({ one, many }) => ({
  admin: one(users, {
    fields: [restaurants.adminId],
    references: [users.id]
  }),
  categories: many(categories),
  menuItems: many(menuItems),
  socialMediaLinks: many(socialMediaLinks),
  qrCodes: many(qrCodes),
  activityLogs: many(activityLogs)
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [categories.restaurantId],
    references: [restaurants.id]
  }),
  menuItems: many(menuItems)
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(categories, {
    fields: [menuItems.categoryId],
    references: [categories.id]
  }),
  restaurant: one(restaurants, {
    fields: [menuItems.restaurantId],
    references: [restaurants.id]
  })
}));

export const socialMediaLinksRelations = relations(socialMediaLinks, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [socialMediaLinks.restaurantId],
    references: [restaurants.id]
  })
}));

export const qrCodesRelations = relations(qrCodes, ({ one }) => ({
  restaurant: one(restaurants, {
    fields: [qrCodes.restaurantId],
    references: [restaurants.id]
  })
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id]
  }),
  restaurant: one(restaurants, {
    fields: [activityLogs.restaurantId],
    references: [restaurants.id]
  })
}));

import { restaurants, categories, menuItems, users, type User, type InsertUser, type Restaurant, type InsertRestaurant, type Category, type InsertCategory, type MenuItem, type InsertMenuItem } from "@shared/schema";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { pool } from "./db";
import { eq, and } from "drizzle-orm";

// Use Postgres for sessions
const PostgresSessionStore = connectPg(session);

// Storage interface
export interface IStorage {
  // User related methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Restaurant related methods
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantBySlug(slug: string): Promise<Restaurant | undefined>;
  getAllRestaurants(): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurant: Partial<Restaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: number): Promise<boolean>;
  
  // Category related methods
  getCategory(id: number): Promise<Category | undefined>;
  getCategoriesByRestaurantId(restaurantId: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // MenuItem related methods
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  getMenuItemsByCategoryId(categoryId: number): Promise<MenuItem[]>;
  getMenuItemsByRestaurantId(restaurantId: number): Promise<MenuItem[]>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, menuItem: Partial<MenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    try {
      console.log(`[storage] Getting user with ID: ${id}`);
      const result = await db.select().from(users).where(eq(users.id, id));
      
      if (result.length === 0) {
        console.log(`[storage] No user found with ID: ${id}`);
        return undefined;
      }
      
      console.log(`[storage] Found user: ${result[0].username}, role: ${result[0].role}`);
      return result[0];
    } catch (error) {
      console.error("[storage] Error getting user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username));
      return result[0];
    } catch (error) {
      console.error("Error getting user by username:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email));
      return result[0];
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values(insertUser).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const result = await db.update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    try {
      const result = await db.select().from(restaurants).where(eq(restaurants.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting restaurant:", error);
      return undefined;
    }
  }

  async getRestaurantBySlug(slug: string): Promise<Restaurant | undefined> {
    try {
      const result = await db.select().from(restaurants).where(eq(restaurants.slug, slug));
      return result[0];
    } catch (error) {
      console.error("Error getting restaurant by slug:", error);
      return undefined;
    }
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    try {
      return await db.select().from(restaurants);
    } catch (error) {
      console.error("Error getting all restaurants:", error);
      return [];
    }
  }

  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    try {
      const result = await db.insert(restaurants).values(insertRestaurant).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating restaurant:", error);
      throw error;
    }
  }

  async updateRestaurant(id: number, restaurantData: Partial<Restaurant>): Promise<Restaurant | undefined> {
    try {
      const result = await db.update(restaurants)
        .set(restaurantData)
        .where(eq(restaurants.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating restaurant:", error);
      return undefined;
    }
  }

  async deleteRestaurant(id: number): Promise<boolean> {
    try {
      // First delete all related users
      await db.delete(users).where(eq(users.restaurantId, id));
      
      // Then delete the restaurant (categories and menu items will be deleted by cascade)
      const result = await db.delete(restaurants).where(eq(restaurants.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      return false;
    }
  }

  async getCategory(id: number): Promise<Category | undefined> {
    try {
      const result = await db.select().from(categories).where(eq(categories.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting category:", error);
      return undefined;
    }
  }

  async getCategoriesByRestaurantId(restaurantId: number): Promise<Category[]> {
    try {
      return await db.select().from(categories).where(eq(categories.restaurantId, restaurantId));
    } catch (error) {
      console.error("Error getting categories by restaurant ID:", error);
      return [];
    }
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    try {
      const result = await db.insert(categories).values(insertCategory).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    try {
      const result = await db.update(categories)
        .set(categoryData)
        .where(eq(categories.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating category:", error);
      return undefined;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      // Menu items will be deleted by cascade
      const result = await db.delete(categories).where(eq(categories.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting category:", error);
      return false;
    }
  }

  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    try {
      const result = await db.select().from(menuItems).where(eq(menuItems.id, id));
      return result[0];
    } catch (error) {
      console.error("Error getting menu item:", error);
      return undefined;
    }
  }

  async getMenuItemsByCategoryId(categoryId: number): Promise<MenuItem[]> {
    try {
      return await db.select().from(menuItems).where(eq(menuItems.categoryId, categoryId));
    } catch (error) {
      console.error("Error getting menu items by category ID:", error);
      return [];
    }
  }

  async getMenuItemsByRestaurantId(restaurantId: number): Promise<MenuItem[]> {
    try {
      return await db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
    } catch (error) {
      console.error("Error getting menu items by restaurant ID:", error);
      return [];
    }
  }

  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    try {
      const result = await db.insert(menuItems).values(insertMenuItem).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating menu item:", error);
      throw error;
    }
  }

  async updateMenuItem(id: number, menuItemData: Partial<MenuItem>): Promise<MenuItem | undefined> {
    try {
      const result = await db.update(menuItems)
        .set(menuItemData)
        .where(eq(menuItems.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating menu item:", error);
      return undefined;
    }
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    try {
      const result = await db.delete(menuItems).where(eq(menuItems.id, id)).returning();
      return result.length > 0;
    } catch (error) {
      console.error("Error deleting menu item:", error);
      return false;
    }
  }
}

export const storage = new DatabaseStorage();

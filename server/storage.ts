import { users, restaurants, categories, items, type User, type InsertUser, type Restaurant, type InsertRestaurant, type Category, type InsertCategory, type Item, type InsertItem } from "@shared/schema";
import { db } from "./db";
import { eq, and, asc, desc, isNull } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Session store
  sessionStore: session.SessionStore;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<Omit<InsertUser, 'password'>>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Restaurant operations
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantBySlug(slug: string): Promise<Restaurant | undefined>;
  getRestaurants(): Promise<Restaurant[]>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, data: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: number): Promise<boolean>;
  getRestaurantAdmin(restaurantId: number): Promise<User | undefined>;
  
  // Category operations
  getCategories(restaurantId: number): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  
  // Item operations
  getItems(categoryId: number): Promise<Item[]>;
  getItemsByRestaurant(restaurantId: number): Promise<Item[]>;
  getItem(id: number): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: number, data: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;
  
  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUser(id: number, data: Partial<Omit<InsertUser, 'password'>>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({...data, updatedAt: new Date()})
      .where(eq(users.id, id))
      .returning();
    return user;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id));
    return true;
  }
  
  // Restaurant operations
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }
  
  async getRestaurantBySlug(slug: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.slug, slug));
    return restaurant;
  }
  
  async getRestaurants(): Promise<Restaurant[]> {
    return await db.select().from(restaurants).orderBy(desc(restaurants.createdAt));
  }
  
  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const [restaurant] = await db
      .insert(restaurants)
      .values(insertRestaurant)
      .returning();
    return restaurant;
  }
  
  async updateRestaurant(id: number, data: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const [restaurant] = await db
      .update(restaurants)
      .set({...data, updatedAt: new Date()})
      .where(eq(restaurants.id, id))
      .returning();
    return restaurant;
  }
  
  async deleteRestaurant(id: number): Promise<boolean> {
    await db.delete(restaurants).where(eq(restaurants.id, id));
    return true;
  }
  
  async getRestaurantAdmin(restaurantId: number): Promise<User | undefined> {
    const [admin] = await db
      .select()
      .from(users)
      .where(and(
        eq(users.restaurantId, restaurantId),
        eq(users.role, 'restaurant_admin')
      ));
    return admin;
  }
  
  // Category operations
  async getCategories(restaurantId: number): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, restaurantId))
      .orderBy(asc(categories.displayOrder));
  }
  
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values(insertCategory)
      .returning();
    return category;
  }
  
  async updateCategory(id: number, data: Partial<InsertCategory>): Promise<Category | undefined> {
    const [category] = await db
      .update(categories)
      .set({...data, updatedAt: new Date()})
      .where(eq(categories.id, id))
      .returning();
    return category;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    await db.delete(categories).where(eq(categories.id, id));
    return true;
  }
  
  // Item operations
  async getItems(categoryId: number): Promise<Item[]> {
    return await db
      .select()
      .from(items)
      .where(eq(items.categoryId, categoryId))
      .orderBy(asc(items.displayOrder));
  }
  
  async getItemsByRestaurant(restaurantId: number): Promise<Item[]> {
    const restaurantCategories = await this.getCategories(restaurantId);
    const categoryIds = restaurantCategories.map(cat => cat.id);
    
    if (categoryIds.length === 0) return [];
    
    return await db
      .select()
      .from(items)
      .where(
        categoryIds.map(id => eq(items.categoryId, id)).reduce((acc, curr) => curr)
      )
      .orderBy(asc(items.displayOrder));
  }
  
  async getItem(id: number): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }
  
  async createItem(insertItem: InsertItem): Promise<Item> {
    const [item] = await db
      .insert(items)
      .values(insertItem)
      .returning();
    return item;
  }
  
  async updateItem(id: number, data: Partial<InsertItem>): Promise<Item | undefined> {
    const [item] = await db
      .update(items)
      .set({...data, updatedAt: new Date()})
      .where(eq(items.id, id))
      .returning();
    return item;
  }
  
  async deleteItem(id: number): Promise<boolean> {
    await db.delete(items).where(eq(items.id, id));
    return true;
  }
}

export const storage = new DatabaseStorage();

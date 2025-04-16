import { restaurants, categories, menuItems, users, type User, type InsertUser, type Restaurant, type InsertRestaurant, type Category, type InsertCategory, type MenuItem, type InsertMenuItem } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private restaurants: Map<number, Restaurant>;
  private categories: Map<number, Category>;
  private menuItems: Map<number, MenuItem>;
  sessionStore: session.SessionStore;
  
  private userCurrentId: number;
  private restaurantCurrentId: number;
  private categoryCurrentId: number;
  private menuItemCurrentId: number;

  constructor() {
    this.users = new Map();
    this.restaurants = new Map();
    this.categories = new Map();
    this.menuItems = new Map();
    
    this.userCurrentId = 1;
    this.restaurantCurrentId = 1;
    this.categoryCurrentId = 1;
    this.menuItemCurrentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Add a default super admin
    this.users.set(1, {
      id: 1,
      name: "Super Admin",
      username: "admin",
      email: "admin@example.com",
      password: "$2b$10$QzgLhV6RvyJJPP9cDEG32eA4TOMCNjmhi8YAZbZuAMUlO1.U5o1rm", // "password"
      role: "super_admin",
      restaurantId: null,
      createdAt: new Date(),
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id, createdAt: new Date() };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Restaurant methods
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }
  
  async getRestaurantBySlug(slug: string): Promise<Restaurant | undefined> {
    return Array.from(this.restaurants.values()).find(
      (restaurant) => restaurant.slug === slug,
    );
  }
  
  async getAllRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }
  
  async createRestaurant(insertRestaurant: InsertRestaurant): Promise<Restaurant> {
    const id = this.restaurantCurrentId++;
    const restaurant: Restaurant = { ...insertRestaurant, id, createdAt: new Date() };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }
  
  async updateRestaurant(id: number, restaurantData: Partial<Restaurant>): Promise<Restaurant | undefined> {
    const restaurant = this.restaurants.get(id);
    if (!restaurant) return undefined;
    
    const updatedRestaurant = { ...restaurant, ...restaurantData };
    this.restaurants.set(id, updatedRestaurant);
    return updatedRestaurant;
  }
  
  async deleteRestaurant(id: number): Promise<boolean> {
    // Also delete associated categories, menu items, and admin users
    const categories = await this.getCategoriesByRestaurantId(id);
    for (const category of categories) {
      await this.deleteCategory(category.id);
    }
    
    const users = Array.from(this.users.values()).filter(user => user.restaurantId === id);
    for (const user of users) {
      await this.deleteUser(user.id);
    }
    
    return this.restaurants.delete(id);
  }
  
  // Category methods
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }
  
  async getCategoriesByRestaurantId(restaurantId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.restaurantId === restaurantId,
    );
  }
  
  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryCurrentId++;
    const category: Category = { ...insertCategory, id, createdAt: new Date() };
    this.categories.set(id, category);
    return category;
  }
  
  async updateCategory(id: number, categoryData: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    
    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }
  
  async deleteCategory(id: number): Promise<boolean> {
    // Also delete associated menu items
    const menuItems = await this.getMenuItemsByCategoryId(id);
    for (const menuItem of menuItems) {
      await this.deleteMenuItem(menuItem.id);
    }
    
    return this.categories.delete(id);
  }
  
  // MenuItem methods
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }
  
  async getMenuItemsByCategoryId(categoryId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(
      (menuItem) => menuItem.categoryId === categoryId,
    );
  }
  
  async getMenuItemsByRestaurantId(restaurantId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(
      (menuItem) => menuItem.restaurantId === restaurantId,
    );
  }
  
  async createMenuItem(insertMenuItem: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemCurrentId++;
    const menuItem: MenuItem = { ...insertMenuItem, id, createdAt: new Date() };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }
  
  async updateMenuItem(id: number, menuItemData: Partial<MenuItem>): Promise<MenuItem | undefined> {
    const menuItem = this.menuItems.get(id);
    if (!menuItem) return undefined;
    
    const updatedMenuItem = { ...menuItem, ...menuItemData };
    this.menuItems.set(id, updatedMenuItem);
    return updatedMenuItem;
  }
  
  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }
}

export const storage = new MemStorage();

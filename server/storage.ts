import { 
  users, User, InsertUser,
  restaurants, Restaurant, InsertRestaurant,
  categories, Category, InsertCategory,
  menuItems, MenuItem, InsertMenuItem,
  socialMediaLinks, SocialMediaLink, InsertSocialMediaLink,
  qrCodes, QRCode, InsertQRCode,
  activityLogs, ActivityLog, InsertActivityLog 
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, asc } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Restaurant operations
  getRestaurant(id: number): Promise<Restaurant | undefined>;
  getRestaurantBySlug(slug: string): Promise<Restaurant | undefined>;
  createRestaurant(restaurant: InsertRestaurant): Promise<Restaurant>;
  updateRestaurant(id: number, restaurantData: Partial<InsertRestaurant>): Promise<Restaurant | undefined>;
  deleteRestaurant(id: number): Promise<boolean>;
  getAllRestaurants(): Promise<Restaurant[]>;
  getRestaurantsByAdminId(adminId: number): Promise<Restaurant[]>;

  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: number): Promise<boolean>;
  getCategoriesByRestaurantId(restaurantId: number): Promise<Category[]>;

  // Menu item operations
  getMenuItem(id: number): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, menuItemData: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
  getMenuItemsByRestaurantId(restaurantId: number): Promise<MenuItem[]>;
  getMenuItemsByCategoryId(categoryId: number): Promise<MenuItem[]>;

  // Social media operations
  getSocialMediaLink(id: number): Promise<SocialMediaLink | undefined>;
  createSocialMediaLink(link: InsertSocialMediaLink): Promise<SocialMediaLink>;
  updateSocialMediaLink(id: number, linkData: Partial<InsertSocialMediaLink>): Promise<SocialMediaLink | undefined>;
  deleteSocialMediaLink(id: number): Promise<boolean>;
  getSocialMediaLinksByRestaurantId(restaurantId: number): Promise<SocialMediaLink[]>;

  // QR code operations
  getQRCode(id: number): Promise<QRCode | undefined>;
  createQRCode(qrCode: InsertQRCode): Promise<QRCode>;
  deleteQRCode(id: number): Promise<boolean>;
  getQRCodesByRestaurantId(restaurantId: number): Promise<QRCode[]>;

  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsByRestaurantId(restaurantId: number): Promise<ActivityLog[]>;
  getRecentActivityLogs(limit: number): Promise<ActivityLog[]>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private restaurants: Map<number, Restaurant>;
  private categories: Map<number, Category>;
  private menuItems: Map<number, MenuItem>;
  private socialMediaLinks: Map<number, SocialMediaLink>;
  private qrCodes: Map<number, QRCode>;
  private activityLogs: Map<number, ActivityLog>;

  private userIdCounter: number = 1;
  private restaurantIdCounter: number = 1;
  private categoryIdCounter: number = 1;
  private menuItemIdCounter: number = 1;
  private socialMediaLinkIdCounter: number = 1;
  private qrCodeIdCounter: number = 1;
  private activityLogIdCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.restaurants = new Map();
    this.categories = new Map();
    this.menuItems = new Map();
    this.socialMediaLinks = new Map();
    this.qrCodes = new Map();
    this.activityLogs = new Map();

    // Initialize with a super admin user
    this.createUser({
      username: "admin",
      password: "admin123", // In a real app, this would be hashed
      name: "Super Admin",
      email: "admin@example.com",
      role: "super_admin"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = {
      ...userData,
      role: userData.role || "restaurant_admin", // Ensure role is never undefined
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;

    const updatedUser: User = {
      ...existingUser,
      ...userData,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Restaurant operations
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    return this.restaurants.get(id);
  }

  async createRestaurant(restaurantData: InsertRestaurant): Promise<Restaurant> {
    const id = this.restaurantIdCounter++;
    const now = new Date();
    const restaurant: Restaurant = {
      ...restaurantData,
      // Ensure all required fields have values
      address: restaurantData.address || null,
      phone: restaurantData.phone || null,
      email: restaurantData.email || null,
      description: restaurantData.description || null,
      logo: restaurantData.logo || null,
      status: restaurantData.status || "setup",
      primaryColor: restaurantData.primaryColor || null,
      secondaryColor: restaurantData.secondaryColor || null,
      rtl: restaurantData.rtl ?? true,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.restaurants.set(id, restaurant);
    return restaurant;
  }

  async updateRestaurant(id: number, restaurantData: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const existingRestaurant = this.restaurants.get(id);
    if (!existingRestaurant) return undefined;

    const updatedRestaurant: Restaurant = {
      ...existingRestaurant,
      ...restaurantData,
      updatedAt: new Date()
    };
    this.restaurants.set(id, updatedRestaurant);
    return updatedRestaurant;
  }

  async deleteRestaurant(id: number): Promise<boolean> {
    return this.restaurants.delete(id);
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values());
  }

  async getRestaurantsByAdminId(adminId: number): Promise<Restaurant[]> {
    return Array.from(this.restaurants.values()).filter(restaurant => restaurant.adminId === adminId);
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const now = new Date();
    const category: Category = {
      ...categoryData,
      description: categoryData.description || null,
      icon: categoryData.icon || null,
      displayOrder: categoryData.displayOrder || 0,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const existingCategory = this.categories.get(id);
    if (!existingCategory) return undefined;

    const updatedCategory: Category = {
      ...existingCategory,
      ...categoryData,
      updatedAt: new Date()
    };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getCategoriesByRestaurantId(restaurantId: number): Promise<Category[]> {
    return Array.from(this.categories.values())
      .filter(category => category.restaurantId === restaurantId)
      .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }

  // Menu item operations
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    return this.menuItems.get(id);
  }

  async createMenuItem(menuItemData: InsertMenuItem): Promise<MenuItem> {
    const id = this.menuItemIdCounter++;
    const now = new Date();
    const menuItem: MenuItem = {
      ...menuItemData,
      description: menuItemData.description || null,
      image: menuItemData.image || null,
      discountPrice: menuItemData.discountPrice || null,
      featured: menuItemData.featured || null,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.menuItems.set(id, menuItem);
    return menuItem;
  }

  async updateMenuItem(id: number, menuItemData: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const existingMenuItem = this.menuItems.get(id);
    if (!existingMenuItem) return undefined;

    const updatedMenuItem: MenuItem = {
      ...existingMenuItem,
      ...menuItemData,
      updatedAt: new Date()
    };
    this.menuItems.set(id, updatedMenuItem);
    return updatedMenuItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    return this.menuItems.delete(id);
  }

  async getMenuItemsByRestaurantId(restaurantId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(item => item.restaurantId === restaurantId);
  }

  async getMenuItemsByCategoryId(categoryId: number): Promise<MenuItem[]> {
    return Array.from(this.menuItems.values()).filter(item => item.categoryId === categoryId);
  }

  // Social media operations
  async getSocialMediaLink(id: number): Promise<SocialMediaLink | undefined> {
    return this.socialMediaLinks.get(id);
  }

  async createSocialMediaLink(linkData: InsertSocialMediaLink): Promise<SocialMediaLink> {
    const id = this.socialMediaLinkIdCounter++;
    const now = new Date();
    const link: SocialMediaLink = {
      ...linkData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.socialMediaLinks.set(id, link);
    return link;
  }

  async updateSocialMediaLink(id: number, linkData: Partial<InsertSocialMediaLink>): Promise<SocialMediaLink | undefined> {
    const existingLink = this.socialMediaLinks.get(id);
    if (!existingLink) return undefined;

    const updatedLink: SocialMediaLink = {
      ...existingLink,
      ...linkData,
      updatedAt: new Date()
    };
    this.socialMediaLinks.set(id, updatedLink);
    return updatedLink;
  }

  async deleteSocialMediaLink(id: number): Promise<boolean> {
    return this.socialMediaLinks.delete(id);
  }

  async getSocialMediaLinksByRestaurantId(restaurantId: number): Promise<SocialMediaLink[]> {
    return Array.from(this.socialMediaLinks.values()).filter(link => link.restaurantId === restaurantId);
  }

  // QR code operations
  async getQRCode(id: number): Promise<QRCode | undefined> {
    return this.qrCodes.get(id);
  }

  async createQRCode(qrCodeData: InsertQRCode): Promise<QRCode> {
    const id = this.qrCodeIdCounter++;
    const now = new Date();
    const qrCode: QRCode = {
      ...qrCodeData,
      id,
      createdAt: now
    };
    this.qrCodes.set(id, qrCode);
    return qrCode;
  }

  async deleteQRCode(id: number): Promise<boolean> {
    return this.qrCodes.delete(id);
  }

  async getQRCodesByRestaurantId(restaurantId: number): Promise<QRCode[]> {
    return Array.from(this.qrCodes.values()).filter(qrCode => qrCode.restaurantId === restaurantId);
  }

  // Activity log operations
  async createActivityLog(logData: InsertActivityLog): Promise<ActivityLog> {
    const id = this.activityLogIdCounter++;
    const now = new Date();
    const log: ActivityLog = {
      ...logData,
      restaurantId: logData.restaurantId || null,
      userId: logData.userId || null,
      details: logData.details || {},
      entityType: logData.entityType || null,
      entityId: logData.entityId || null,
      id,
      createdAt: now
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async getActivityLogsByRestaurantId(restaurantId: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter(log => log.restaurantId === restaurantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

// Database storage implementation

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const now = new Date();
    const [updatedUser] = await db
      .update(users)
      .set({ ...userData, updatedAt: now })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return !!result;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  // Restaurant operations
  async getRestaurant(id: number): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id));
    return restaurant;
  }

  async createRestaurant(restaurantData: InsertRestaurant): Promise<Restaurant> {
    const [restaurant] = await db.insert(restaurants).values(restaurantData).returning();
    return restaurant;
  }

  async updateRestaurant(id: number, restaurantData: Partial<InsertRestaurant>): Promise<Restaurant | undefined> {
    const now = new Date();
    const [updatedRestaurant] = await db
      .update(restaurants)
      .set({ ...restaurantData, updatedAt: now })
      .where(eq(restaurants.id, id))
      .returning();
    return updatedRestaurant;
  }

  async deleteRestaurant(id: number): Promise<boolean> {
    const result = await db.delete(restaurants).where(eq(restaurants.id, id));
    return !!result;
  }

  async getAllRestaurants(): Promise<Restaurant[]> {
    return db.select().from(restaurants);
  }

  async getRestaurantsByAdminId(adminId: number): Promise<Restaurant[]> {
    return db.select().from(restaurants).where(eq(restaurants.adminId, adminId));
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(categoryData: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  }

  async updateCategory(id: number, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const now = new Date();
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...categoryData, updatedAt: now })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return !!result;
  }

  async getCategoriesByRestaurantId(restaurantId: number): Promise<Category[]> {
    return db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, restaurantId))
      .orderBy(asc(categories.displayOrder));
  }

  // Menu item operations
  async getMenuItem(id: number): Promise<MenuItem | undefined> {
    const [menuItem] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return menuItem;
  }

  async createMenuItem(menuItemData: InsertMenuItem): Promise<MenuItem> {
    const [menuItem] = await db.insert(menuItems).values(menuItemData).returning();
    return menuItem;
  }

  async updateMenuItem(id: number, menuItemData: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const now = new Date();
    const [updatedMenuItem] = await db
      .update(menuItems)
      .set({ ...menuItemData, updatedAt: now })
      .where(eq(menuItems.id, id))
      .returning();
    return updatedMenuItem;
  }

  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id));
    return !!result;
  }

  async getMenuItemsByRestaurantId(restaurantId: number): Promise<MenuItem[]> {
    return db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
  }

  async getMenuItemsByCategoryId(categoryId: number): Promise<MenuItem[]> {
    return db.select().from(menuItems).where(eq(menuItems.categoryId, categoryId));
  }

  // Social media operations
  async getSocialMediaLink(id: number): Promise<SocialMediaLink | undefined> {
    const [link] = await db.select().from(socialMediaLinks).where(eq(socialMediaLinks.id, id));
    return link;
  }

  async createSocialMediaLink(linkData: InsertSocialMediaLink): Promise<SocialMediaLink> {
    const [link] = await db.insert(socialMediaLinks).values(linkData).returning();
    return link;
  }

  async updateSocialMediaLink(id: number, linkData: Partial<InsertSocialMediaLink>): Promise<SocialMediaLink | undefined> {
    const now = new Date();
    const [updatedLink] = await db
      .update(socialMediaLinks)
      .set({ ...linkData, updatedAt: now })
      .where(eq(socialMediaLinks.id, id))
      .returning();
    return updatedLink;
  }

  async deleteSocialMediaLink(id: number): Promise<boolean> {
    const result = await db.delete(socialMediaLinks).where(eq(socialMediaLinks.id, id));
    return !!result;
  }

  async getSocialMediaLinksByRestaurantId(restaurantId: number): Promise<SocialMediaLink[]> {
    return db.select().from(socialMediaLinks).where(eq(socialMediaLinks.restaurantId, restaurantId));
  }

  // QR code operations
  async getQRCode(id: number): Promise<QRCode | undefined> {
    const [qrCode] = await db.select().from(qrCodes).where(eq(qrCodes.id, id));
    return qrCode;
  }

  async createQRCode(qrCodeData: InsertQRCode): Promise<QRCode> {
    const [qrCode] = await db.insert(qrCodes).values(qrCodeData).returning();
    return qrCode;
  }

  async deleteQRCode(id: number): Promise<boolean> {
    const result = await db.delete(qrCodes).where(eq(qrCodes.id, id));
    return !!result;
  }

  async getQRCodesByRestaurantId(restaurantId: number): Promise<QRCode[]> {
    return db.select().from(qrCodes).where(eq(qrCodes.restaurantId, restaurantId));
  }

  // Activity log operations
  async createActivityLog(logData: InsertActivityLog): Promise<ActivityLog> {
    const [log] = await db.insert(activityLogs).values(logData).returning();
    return log;
  }

  async getActivityLogsByRestaurantId(restaurantId: number): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.restaurantId, restaurantId))
      .orderBy(desc(activityLogs.createdAt));
  }

  async getRecentActivityLogs(limit: number): Promise<ActivityLog[]> {
    return db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }
}

// Initialize the storage
export const storage = new DatabaseStorage();

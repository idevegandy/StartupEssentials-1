import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { db } from "./db";
import { eq } from "drizzle-orm";
import * as schema from "../shared/schema";
import session from 'express-session';
import memorystore from 'memorystore';
import {
  insertUserSchema,
  insertRestaurantSchema,
  insertCategorySchema,
  insertMenuItemSchema,
  insertSocialMediaLinkSchema,
  insertQRCodeSchema,
  insertActivityLogSchema
} from "@shared/schema";

// Augment express-session with our custom properties
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Auth-related types and middleware
interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role: string;
  };
}

const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session || req.session.userId === undefined) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await storage.getUser(Number(req.session.userId));
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }

  req.user = {
    id: user.id,
    role: user.role
  };

  next();
};

const superAdminMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Forbidden: Super admin access required" });
  }
  next();
};

const validateOwnership = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { restaurantId } = req.params;
  
  if (!restaurantId) {
    return next();
  }
  
  // Super admins can access any restaurant
  if (req.user?.role === "super_admin") {
    return next();
  }
  
  const restaurant = await storage.getRestaurant(Number(restaurantId));
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }
  
  // Check if the restaurant belongs to the logged-in user
  if (restaurant.adminId !== req.user?.id) {
    return res.status(403).json({ message: "Forbidden: You don't have access to this restaurant" });
  }
  
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Add session management
  const MemoryStore = memorystore(session);

  app.use(session({
    cookie: { maxAge: 86400000 }, // 24 hours
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    secret: process.env.SESSION_SECRET || 'my-secret',
    resave: false,
    saveUninitialized: false
  }));

  // Authentication Routes
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) { // In a real app, use proper password hashing
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Store user ID in session
      req.session.userId = user.id;
      
      // Create an activity log
      await storage.createActivityLog({
        userId: user.id,
        action: "login",
        details: { username },
        entityType: "user",
        entityId: user.id
      });
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/me', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = await storage.getUser(req.user?.id || 0);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User Routes
  app.get('/api/users', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/users/:id', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/users', authMiddleware, superAdminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const newUser = await storage.createUser(userData);
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "create",
        details: { username: newUser.username },
        entityType: "user",
        entityId: newUser.id
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Create user error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/users/:id', authMiddleware, superAdminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const userData = insertUserSchema.partial().parse(req.body);
      const updatedUser = await storage.updateUser(id, userData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "update",
        details: { username: updatedUser.username },
        entityType: "user",
        entityId: updatedUser.id
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Update user error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/users/:id', authMiddleware, superAdminMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deleting the only super admin
      if (user.role === "super_admin") {
        const allUsers = await storage.getAllUsers();
        const superAdmins = allUsers.filter(u => u.role === "super_admin");
        if (superAdmins.length <= 1) {
          return res.status(400).json({ message: "Cannot delete the only super admin" });
        }
      }
      
      const deleted = await storage.deleteUser(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "delete",
        details: { username: user.username },
        entityType: "user",
        entityId: id
      });
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Restaurant Routes
  app.get('/api/restaurants', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let restaurants;
      
      if (req.user?.role === "super_admin") {
        restaurants = await storage.getAllRestaurants();
      } else {
        restaurants = await storage.getRestaurantsByAdminId(req.user?.id || 0);
      }
      
      res.json(restaurants);
    } catch (error) {
      console.error('Get restaurants error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/restaurants/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const restaurant = await storage.getRestaurant(id);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Check if user has access to this restaurant
      if (req.user?.role !== "super_admin" && restaurant.adminId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You don't have access to this restaurant" });
      }
      
      res.json(restaurant);
    } catch (error) {
      console.error('Get restaurant error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/restaurants', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      let restaurantData = req.body;
      
      // If not a super admin, set the adminId to the current user
      if (req.user?.role !== "super_admin") {
        restaurantData = { ...restaurantData, adminId: req.user?.id };
      }
      
      const validatedData = insertRestaurantSchema.parse(restaurantData);
      const newRestaurant = await storage.createRestaurant(validatedData);
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "create",
        details: { name: newRestaurant.name },
        entityType: "restaurant",
        entityId: newRestaurant.id,
        restaurantId: newRestaurant.id
      });
      
      res.status(201).json(newRestaurant);
    } catch (error) {
      console.error('Create restaurant error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/restaurants/:id', authMiddleware, validateOwnership, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // If not a super admin, prevent changing adminId
      let restaurantData = req.body;
      if (req.user?.role !== "super_admin" && 'adminId' in restaurantData) {
        delete restaurantData.adminId;
      }
      
      const validatedData = insertRestaurantSchema.partial().parse(restaurantData);
      const updatedRestaurant = await storage.updateRestaurant(id, validatedData);
      
      if (!updatedRestaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "update",
        details: { name: updatedRestaurant.name },
        entityType: "restaurant",
        entityId: updatedRestaurant.id,
        restaurantId: updatedRestaurant.id
      });
      
      res.json(updatedRestaurant);
    } catch (error) {
      console.error('Update restaurant error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/restaurants/:id', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const deleted = await storage.deleteRestaurant(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Create an activity log
      await storage.createActivityLog({
        userId: (req as AuthenticatedRequest).user?.id,
        action: "delete",
        details: { name: restaurant.name },
        entityType: "restaurant",
        entityId: id
      });
      
      res.json({ message: "Restaurant deleted successfully" });
    } catch (error) {
      console.error('Delete restaurant error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Category Routes
  app.get('/api/restaurants/:restaurantId/categories', authMiddleware, validateOwnership, async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const categories = await storage.getCategoriesByRestaurantId(restaurantId);
      res.json(categories);
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/restaurants/:restaurantId/categories', authMiddleware, validateOwnership, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const categoryData = { ...req.body, restaurantId };
      const validatedData = insertCategorySchema.parse(categoryData);
      const newCategory = await storage.createCategory(validatedData);
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "create",
        details: { name: newCategory.name },
        entityType: "category",
        entityId: newCategory.id,
        restaurantId
      });
      
      res.status(201).json(newCategory);
    } catch (error) {
      console.error('Create category error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/categories/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check access rights
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      if (req.user?.role !== "super_admin" && restaurant.adminId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You don't have access to this restaurant" });
      }
      
      // Prevent changing restaurantId
      const categoryData = { ...req.body };
      delete categoryData.restaurantId;
      
      const validatedData = insertCategorySchema.partial().parse(categoryData);
      const updatedCategory = await storage.updateCategory(id, validatedData);
      
      if (!updatedCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "update",
        details: { name: updatedCategory.name },
        entityType: "category",
        entityId: updatedCategory.id,
        restaurantId: category.restaurantId
      });
      
      res.json(updatedCategory);
    } catch (error) {
      console.error('Update category error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/categories/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check access rights
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      if (req.user?.role !== "super_admin" && restaurant.adminId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You don't have access to this restaurant" });
      }
      
      const deleted = await storage.deleteCategory(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "delete",
        details: { name: category.name },
        entityType: "category",
        entityId: id,
        restaurantId: category.restaurantId
      });
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error('Delete category error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Menu Item Routes
  app.get('/api/restaurants/:restaurantId/menu-items', authMiddleware, validateOwnership, async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const menuItems = await storage.getMenuItemsByRestaurantId(restaurantId);
      res.json(menuItems);
    } catch (error) {
      console.error('Get menu items error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/categories/:categoryId/menu-items', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check access rights
      const restaurant = await storage.getRestaurant(category.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      if (req.user?.role !== "super_admin" && restaurant.adminId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You don't have access to this restaurant" });
      }
      
      const menuItems = await storage.getMenuItemsByCategoryId(categoryId);
      res.json(menuItems);
    } catch (error) {
      console.error('Get menu items by category error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/restaurants/:restaurantId/menu-items', authMiddleware, validateOwnership, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      // Verify that the category belongs to this restaurant
      const categoryId = req.body.categoryId;
      if (categoryId) {
        const category = await storage.getCategory(categoryId);
        if (!category || category.restaurantId !== restaurantId) {
          return res.status(400).json({ message: "Category does not belong to this restaurant" });
        }
      }
      
      const menuItemData = { ...req.body, restaurantId };
      const validatedData = insertMenuItemSchema.parse(menuItemData);
      const newMenuItem = await storage.createMenuItem(validatedData);
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "create",
        details: { name: newMenuItem.name },
        entityType: "menuItem",
        entityId: newMenuItem.id,
        restaurantId
      });
      
      res.status(201).json(newMenuItem);
    } catch (error) {
      console.error('Create menu item error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/menu-items/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid menu item ID" });
      }
      
      const menuItem = await storage.getMenuItem(id);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Check access rights
      const restaurant = await storage.getRestaurant(menuItem.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      if (req.user?.role !== "super_admin" && restaurant.adminId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You don't have access to this restaurant" });
      }
      
      // Verify that the category belongs to this restaurant if changing category
      if (req.body.categoryId && req.body.categoryId !== menuItem.categoryId) {
        const category = await storage.getCategory(req.body.categoryId);
        if (!category || category.restaurantId !== menuItem.restaurantId) {
          return res.status(400).json({ message: "Category does not belong to this restaurant" });
        }
      }
      
      // Prevent changing restaurantId
      const menuItemData = { ...req.body };
      delete menuItemData.restaurantId;
      
      const validatedData = insertMenuItemSchema.partial().parse(menuItemData);
      const updatedMenuItem = await storage.updateMenuItem(id, validatedData);
      
      if (!updatedMenuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "update",
        details: { name: updatedMenuItem.name },
        entityType: "menuItem",
        entityId: updatedMenuItem.id,
        restaurantId: menuItem.restaurantId
      });
      
      res.json(updatedMenuItem);
    } catch (error) {
      console.error('Update menu item error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/menu-items/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid menu item ID" });
      }
      
      const menuItem = await storage.getMenuItem(id);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Check access rights
      const restaurant = await storage.getRestaurant(menuItem.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      if (req.user?.role !== "super_admin" && restaurant.adminId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You don't have access to this restaurant" });
      }
      
      const deleted = await storage.deleteMenuItem(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "delete",
        details: { name: menuItem.name },
        entityType: "menuItem",
        entityId: id,
        restaurantId: menuItem.restaurantId
      });
      
      res.json({ message: "Menu item deleted successfully" });
    } catch (error) {
      console.error('Delete menu item error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Social Media Routes
  app.get('/api/restaurants/:restaurantId/social-media', authMiddleware, validateOwnership, async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const socialMediaLinks = await storage.getSocialMediaLinksByRestaurantId(restaurantId);
      res.json(socialMediaLinks);
    } catch (error) {
      console.error('Get social media links error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/restaurants/:restaurantId/social-media', authMiddleware, validateOwnership, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const linkData = { ...req.body, restaurantId };
      const validatedData = insertSocialMediaLinkSchema.parse(linkData);
      const newLink = await storage.createSocialMediaLink(validatedData);
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "create",
        details: { platform: newLink.platform },
        entityType: "socialMediaLink",
        entityId: newLink.id,
        restaurantId
      });
      
      res.status(201).json(newLink);
    } catch (error) {
      console.error('Create social media link error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/social-media/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid social media link ID" });
      }
      
      const link = await storage.getSocialMediaLink(id);
      if (!link) {
        return res.status(404).json({ message: "Social media link not found" });
      }
      
      // Check access rights
      const restaurant = await storage.getRestaurant(link.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      if (req.user?.role !== "super_admin" && restaurant.adminId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You don't have access to this restaurant" });
      }
      
      // Prevent changing restaurantId
      const linkData = { ...req.body };
      delete linkData.restaurantId;
      
      const validatedData = insertSocialMediaLinkSchema.partial().parse(linkData);
      const updatedLink = await storage.updateSocialMediaLink(id, validatedData);
      
      if (!updatedLink) {
        return res.status(404).json({ message: "Social media link not found" });
      }
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "update",
        details: { platform: updatedLink.platform },
        entityType: "socialMediaLink",
        entityId: updatedLink.id,
        restaurantId: link.restaurantId
      });
      
      res.json(updatedLink);
    } catch (error) {
      console.error('Update social media link error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/social-media/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid social media link ID" });
      }
      
      const link = await storage.getSocialMediaLink(id);
      if (!link) {
        return res.status(404).json({ message: "Social media link not found" });
      }
      
      // Check access rights
      const restaurant = await storage.getRestaurant(link.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      if (req.user?.role !== "super_admin" && restaurant.adminId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You don't have access to this restaurant" });
      }
      
      const deleted = await storage.deleteSocialMediaLink(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Social media link not found" });
      }
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "delete",
        details: { platform: link.platform },
        entityType: "socialMediaLink",
        entityId: id,
        restaurantId: link.restaurantId
      });
      
      res.json({ message: "Social media link deleted successfully" });
    } catch (error) {
      console.error('Delete social media link error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // QR Code Routes
  app.get('/api/restaurants/:restaurantId/qr-codes', authMiddleware, validateOwnership, async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const qrCodes = await storage.getQRCodesByRestaurantId(restaurantId);
      res.json(qrCodes);
    } catch (error) {
      console.error('Get QR codes error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/restaurants/:restaurantId/qr-codes', authMiddleware, validateOwnership, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const qrCodeData = { ...req.body, restaurantId };
      const validatedData = insertQRCodeSchema.parse(qrCodeData);
      const newQRCode = await storage.createQRCode(validatedData);
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "create",
        details: { label: newQRCode.label },
        entityType: "qrCode",
        entityId: newQRCode.id,
        restaurantId
      });
      
      res.status(201).json(newQRCode);
    } catch (error) {
      console.error('Create QR code error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete('/api/qr-codes/:id', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid QR code ID" });
      }
      
      const qrCode = await storage.getQRCode(id);
      if (!qrCode) {
        return res.status(404).json({ message: "QR code not found" });
      }
      
      // Check access rights
      const restaurant = await storage.getRestaurant(qrCode.restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      if (req.user?.role !== "super_admin" && restaurant.adminId !== req.user?.id) {
        return res.status(403).json({ message: "Forbidden: You don't have access to this restaurant" });
      }
      
      const deleted = await storage.deleteQRCode(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "QR code not found" });
      }
      
      // Create an activity log
      await storage.createActivityLog({
        userId: req.user?.id,
        action: "delete",
        details: { label: qrCode.label },
        entityType: "qrCode",
        entityId: id,
        restaurantId: qrCode.restaurantId
      });
      
      res.json({ message: "QR code deleted successfully" });
    } catch (error) {
      console.error('Delete QR code error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Activity Log Routes
  app.get('/api/activity', authMiddleware, superAdminMiddleware, async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activityLogs = await storage.getRecentActivityLogs(limit);
      res.json(activityLogs);
    } catch (error) {
      console.error('Get activity logs error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/restaurants/:restaurantId/activity', authMiddleware, validateOwnership, async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const activityLogs = await storage.getActivityLogsByRestaurantId(restaurantId);
      res.json(activityLogs);
    } catch (error) {
      console.error('Get restaurant activity logs error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Public Restaurant Menu Route by ID - no authentication required
  app.get('/api/public/restaurants/:restaurantId/menu', async (req: Request, res: Response) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      if (isNaN(restaurantId)) {
        return res.status(400).json({ message: "Invalid restaurant ID" });
      }
      
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Only return active restaurants
      if (restaurant.status !== 'active') {
        return res.status(404).json({ message: "Restaurant menu not available" });
      }
      
      const categories = await storage.getCategoriesByRestaurantId(restaurantId);
      const menuItems = await storage.getMenuItemsByRestaurantId(restaurantId);
      const socialMediaLinks = await storage.getSocialMediaLinksByRestaurantId(restaurantId);
      
      // Group menu items by category
      const categorizedMenu = categories.map(category => {
        const items = menuItems.filter(item => item.categoryId === category.id);
        return {
          ...category,
          items
        };
      });
      
      // Create the public menu response
      const publicMenu = {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          description: restaurant.description,
          logo: restaurant.logo,
          primaryColor: restaurant.primaryColor,
          secondaryColor: restaurant.secondaryColor,
          rtl: restaurant.rtl,
          phone: restaurant.phone,
          address: restaurant.address
        },
        categories: categorizedMenu,
        socialMediaLinks
      };
      
      res.json(publicMenu);
    } catch (error) {
      console.error('Get public menu error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Public Restaurant Menu Route by Slug - no authentication required
  app.get('/api/public/restaurants/by-slug/:slug/menu', async (req: Request, res: Response) => {
    try {
      const { slug } = req.params;
      
      const restaurant = await storage.getRestaurantBySlug(slug);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Only return active restaurants
      if (restaurant.status !== 'active') {
        return res.status(404).json({ message: "Restaurant menu not available" });
      }
      
      const restaurantId = restaurant.id;
      const categories = await storage.getCategoriesByRestaurantId(restaurantId);
      const menuItems = await storage.getMenuItemsByRestaurantId(restaurantId);
      const socialMediaLinks = await storage.getSocialMediaLinksByRestaurantId(restaurantId);
      
      // Group menu items by category
      const categorizedMenu = categories.map(category => {
        const items = menuItems.filter(item => item.categoryId === category.id);
        return {
          ...category,
          items
        };
      });
      
      // Create the public menu response
      const publicMenu = {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          description: restaurant.description,
          logo: restaurant.logo,
          primaryColor: restaurant.primaryColor,
          secondaryColor: restaurant.secondaryColor,
          rtl: restaurant.rtl,
          phone: restaurant.phone,
          address: restaurant.address
        },
        categories: categorizedMenu,
        socialMediaLinks
      };
      
      res.json(publicMenu);
    } catch (error) {
      console.error('Get public menu error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Dev route to add some initial test data (only in development)
  if (process.env.NODE_ENV !== 'production') {
    app.post('/api/dev/seed-test-data', async (req: Request, res: Response) => {
      try {
        // Create restaurant admin if doesn't exist
        const adminExists = await storage.getUserByUsername('restaurant_admin');
        let restaurantAdmin;
        
        if (!adminExists) {
          restaurantAdmin = await storage.createUser({
            username: 'restaurant_admin',
            password: 'admin123', // In real app, this would be hashed
            name: 'Restaurant Manager',
            email: 'manager@example.com',
            role: 'restaurant_admin'
          });
        } else {
          restaurantAdmin = adminExists;
        }

        // Create restaurants with real icons
        const restaurants = [
          {
            name: 'Falafel House',
            slug: 'falafel-house',
            address: 'HaHashmonaim 10, Tel Aviv',
            description: 'Authentic falafel and hummus served fresh daily.',
            status: 'active',
            adminId: restaurantAdmin.id,
            primaryColor: '#4CAF50',
            logo: 'https://cdn.iconscout.com/icon/free/png-256/free-falafel-kebab-food-emoj-symbol-30700.png',
            phone: '+972 3-555-1234',
            email: 'info@falafelhouse.com',
            rtl: true
          },
          {
            name: 'Shawarma Palace',
            slug: 'shawarma-palace',
            address: 'Ben Yehuda 50, Jerusalem',
            description: 'Traditional shawarma and middle eastern cuisine.',
            status: 'active',
            adminId: restaurantAdmin.id,
            primaryColor: '#FF9800',
            logo: 'https://cdn-icons-png.flaticon.com/512/6978/6978255.png',
            phone: '+972 2-555-7890',
            email: 'contact@shawarmapalace.com',
            rtl: true
          },
          {
            name: 'Hummus Haven',
            slug: 'hummus-haven',
            address: 'Rothschild 22, Tel Aviv',
            description: 'The best hummus in town, served with fresh pita.',
            status: 'active',
            adminId: restaurantAdmin.id,
            primaryColor: '#8D6E63',
            logo: 'https://cdn-icons-png.flaticon.com/512/2553/2553691.png',
            phone: '+972 3-555-4321',
            email: 'info@hummushaven.com',
            rtl: true
          }
        ];

        for (const restaurantData of restaurants) {
          // Check if restaurant already exists
          const existingRestaurants = await db.select()
            .from(schema.restaurants)
            .where(eq(schema.restaurants.name, restaurantData.name));
          
          if (existingRestaurants.length === 0) {
            const restaurant = await storage.createRestaurant(restaurantData);
            
            // Log activity without user ID for seed data
            await storage.createActivityLog({
              userId: null,
              action: 'create_restaurant',
              restaurantId: restaurant.id,
              details: { name: restaurant.name },
              entityType: 'restaurant',
              entityId: restaurant.id
            });
          }
        }

        res.json({ message: 'Test data created successfully' });
      } catch (error) {
        console.error('Error creating test data:', error);
        res.status(500).json({ message: 'Internal server error' });
      }
    });
  }

  const httpServer = createServer(app);

  return httpServer;
}

import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { insertRestaurantSchema, insertCategorySchema, insertMenuItemSchema, users } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

// Simple middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is super admin
const isSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated() && req.user.role === "super_admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden: Super Admin access required" });
};

// Middleware to check if user is restaurant admin for specific restaurant
const isRestaurantAdmin = (restaurantIdParam: string = "id") => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const restaurantId = parseInt(req.params[restaurantIdParam]);
    
    if (req.user.role === "super_admin" || 
        (req.user.role === "restaurant_admin" && req.user.restaurantId === restaurantId)) {
      return next();
    }
    
    res.status(403).json({ message: "Forbidden: Not authorized for this restaurant" });
  };
};

// File upload helper
const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "uploads");

async function ensureUploadDirExists() {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error("Error creating upload directory:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes (/api/login, /api/logout, /api/register, /api/user)
  setupAuth(app);
  
  // Ensure upload directory exists
  await ensureUploadDirExists();
  
  // Restaurants routes
  app.get("/api/restaurants", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role === "super_admin") {
        // Super admin can see all restaurants
        const restaurants = await storage.getAllRestaurants();
        res.json(restaurants);
      } else if (req.user.role === "restaurant_admin" && req.user.restaurantId) {
        // Restaurant admin can only see their own restaurant
        const restaurant = await storage.getRestaurant(req.user.restaurantId);
        res.json(restaurant ? [restaurant] : []);
      } else {
        res.json([]);
      }
    } catch (error) {
      res.status(500).json({ message: "Error fetching restaurants" });
    }
  });
  
  app.get("/api/restaurants/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const restaurant = await storage.getRestaurant(id);
      
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Check if user has permission to view this restaurant
      if (req.user.role !== "super_admin" && req.user.restaurantId !== id) {
        return res.status(403).json({ message: "Not authorized to view this restaurant" });
      }
      
      res.json(restaurant);
    } catch (error) {
      res.status(500).json({ message: "Error fetching restaurant" });
    }
  });
  
  app.post("/api/restaurants", isSuperAdmin, async (req, res) => {
    try {
      const restaurantData = insertRestaurantSchema.parse(req.body.restaurant);
      const userData = req.body.user;
      
      // Check if restaurant slug already exists
      const existingRestaurant = await storage.getRestaurantBySlug(restaurantData.slug);
      if (existingRestaurant) {
        return res.status(400).json({ message: "Restaurant slug already exists" });
      }
      
      // Check if user email already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User email already exists" });
      }
      
      // Create restaurant
      const restaurant = await storage.createRestaurant(restaurantData);
      
      // Create restaurant admin
      const user = await storage.createUser({
        name: userData.name,
        username: userData.email.split('@')[0], // Generate username from email
        email: userData.email,
        password: await hashPassword(userData.password),
        role: "restaurant_admin",
        restaurantId: restaurant.id
      });
      
      res.status(201).json({ restaurant, user });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating restaurant" });
    }
  });
  
  app.put("/api/restaurants/:id", isSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const restaurantData = req.body;
      
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Update restaurant
      const updatedRestaurant = await storage.updateRestaurant(id, restaurantData);
      
      res.json(updatedRestaurant);
    } catch (error) {
      res.status(500).json({ message: "Error updating restaurant" });
    }
  });
  
  app.delete("/api/restaurants/:id", isSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Delete restaurant and all associated data
      await storage.deleteRestaurant(id);
      
      res.json({ message: "Restaurant deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting restaurant" });
    }
  });
  
  // Categories routes
  app.get("/api/restaurants/:id/categories", isAuthenticated, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      
      // Check if user has permission to view this restaurant's categories
      if (req.user.role !== "super_admin" && req.user.restaurantId !== restaurantId) {
        return res.status(403).json({ message: "Not authorized to view this restaurant's categories" });
      }
      
      const categories = await storage.getCategoriesByRestaurantId(restaurantId);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Error fetching categories" });
    }
  });
  
  app.post("/api/restaurants/:id/categories", isRestaurantAdmin("id"), async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      const categoryData = insertCategorySchema.parse(req.body);
      
      // Create category
      const category = await storage.createCategory({
        ...categoryData,
        restaurantId
      });
      
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating category" });
    }
  });
  
  app.put("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const categoryData = req.body;
      
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if user has permission to update this category
      if (req.user.role !== "super_admin" && req.user.restaurantId !== category.restaurantId) {
        return res.status(403).json({ message: "Not authorized to update this category" });
      }
      
      // Update category
      const updatedCategory = await storage.updateCategory(id, categoryData);
      
      res.json(updatedCategory);
    } catch (error) {
      res.status(500).json({ message: "Error updating category" });
    }
  });
  
  app.delete("/api/categories/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if user has permission to delete this category
      if (req.user.role !== "super_admin" && req.user.restaurantId !== category.restaurantId) {
        return res.status(403).json({ message: "Not authorized to delete this category" });
      }
      
      // Delete category
      await storage.deleteCategory(id);
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting category" });
    }
  });
  
  // Menu items routes
  app.get("/api/categories/:id/items", isAuthenticated, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      
      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if user has permission to view this category's items
      if (req.user.role !== "super_admin" && req.user.restaurantId !== category.restaurantId) {
        return res.status(403).json({ message: "Not authorized to view this category's items" });
      }
      
      const items = await storage.getMenuItemsByCategoryId(categoryId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Error fetching menu items" });
    }
  });
  
  app.get("/api/restaurants/:id/items", isAuthenticated, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      
      // Check if user has permission to view this restaurant's items
      if (req.user.role !== "super_admin" && req.user.restaurantId !== restaurantId) {
        return res.status(403).json({ message: "Not authorized to view this restaurant's items" });
      }
      
      const items = await storage.getMenuItemsByRestaurantId(restaurantId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Error fetching menu items" });
    }
  });
  
  app.post("/api/categories/:id/items", isAuthenticated, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const menuItemData = insertMenuItemSchema.parse(req.body);
      
      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if user has permission to add items to this category
      if (req.user.role !== "super_admin" && req.user.restaurantId !== category.restaurantId) {
        return res.status(403).json({ message: "Not authorized to add items to this category" });
      }
      
      // Create menu item
      const menuItem = await storage.createMenuItem({
        ...menuItemData,
        categoryId,
        restaurantId: category.restaurantId
      });
      
      res.status(201).json(menuItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating menu item" });
    }
  });
  
  app.put("/api/items/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const menuItemData = req.body;
      
      const menuItem = await storage.getMenuItem(id);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Check if user has permission to update this menu item
      if (req.user.role !== "super_admin" && req.user.restaurantId !== menuItem.restaurantId) {
        return res.status(403).json({ message: "Not authorized to update this menu item" });
      }
      
      // Update menu item
      const updatedMenuItem = await storage.updateMenuItem(id, menuItemData);
      
      res.json(updatedMenuItem);
    } catch (error) {
      res.status(500).json({ message: "Error updating menu item" });
    }
  });
  
  app.delete("/api/items/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const menuItem = await storage.getMenuItem(id);
      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }
      
      // Check if user has permission to delete this menu item
      if (req.user.role !== "super_admin" && req.user.restaurantId !== menuItem.restaurantId) {
        return res.status(403).json({ message: "Not authorized to delete this menu item" });
      }
      
      // Delete menu item
      await storage.deleteMenuItem(id);
      
      res.json({ message: "Menu item deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting menu item" });
    }
  });
  
  // Public menu route
  app.get("/api/menus/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      
      const restaurant = await storage.getRestaurantBySlug(slug);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      const categories = await storage.getCategoriesByRestaurantId(restaurant.id);
      
      // Get menu items for each category
      const categoriesWithItems = await Promise.all(
        categories.map(async (category) => {
          const items = await storage.getMenuItemsByCategoryId(category.id);
          return {
            ...category,
            items
          };
        })
      );
      
      res.json({
        restaurant,
        categories: categoriesWithItems
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching menu" });
    }
  });
  
  // Restaurant users routes
  app.get("/api/restaurants/:id/users", isSuperAdmin, async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.id);
      
      // Get all users from database
      const allUsers = await db.select({
        id: users.id,
        name: users.name,
        username: users.username,
        email: users.email,
        role: users.role,
        restaurantId: users.restaurantId,
        createdAt: users.createdAt
      }).from(users).where(eq(users.restaurantId, restaurantId));
      
      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching restaurant users:", error);
      res.status(500).json({ message: "Error fetching restaurant users" });
    }
  });
  
  app.put("/api/users/:id", isSuperAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userData = req.body;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Hash password if provided
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      // Update user
      const updatedUser = await storage.updateUser(id, userData);
      
      // Remove password from response
      if (updatedUser) {
        const { password, ...userResponse } = updatedUser;
        res.json(userResponse);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

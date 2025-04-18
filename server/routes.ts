import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { json } from "express";
import path from "path";
import { insertRestaurantSchema, insertUserSchema, insertCategorySchema, insertItemSchema } from "@shared/schema";
import { randomBytes } from "crypto";

// Import route modules
import activityLogsRoutes from "./routes/activityLogs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  const { checkRole, checkRestaurantAccess } = setupAuth(app);
  
  // Register modular routes
  app.use('/api/activities', activityLogsRoutes);
  
  // Super Admin Routes
  
  // Get all restaurants
  app.get("/api/restaurants", checkRole(['super_admin']), async (req, res) => {
    try {
      const restaurants = await storage.getRestaurants();
      
      // Get admin for each restaurant
      const restaurantsWithAdmins = await Promise.all(
        restaurants.map(async (restaurant) => {
          const admin = await storage.getRestaurantAdmin(restaurant.id);
          return {
            ...restaurant,
            admin
          };
        })
      );
      
      res.json(restaurantsWithAdmins);
    } catch (error) {
      console.error("Error fetching restaurants:", error);
      res.status(500).json({ message: "Failed to fetch restaurants" });
    }
  });
  
  // Create a new restaurant with admin
  app.post("/api/restaurants", checkRole(['super_admin']), async (req, res) => {
    try {
      const { restaurant, admin } = req.body;
      
      // Validate data
      const validRestaurant = insertRestaurantSchema.parse(restaurant);
      const validAdmin = insertUserSchema.parse({
        ...admin,
        role: 'restaurant_admin'
      });
      
      // Check for duplicate slug
      const existingRestaurant = await storage.getRestaurantBySlug(validRestaurant.slug);
      if (existingRestaurant) {
        return res.status(400).json({ message: "Restaurant URL slug already exists" });
      }
      
      // Check for duplicate email
      const existingUser = await storage.getUserByEmail(validAdmin.email);
      if (existingUser) {
        return res.status(400).json({ message: "Admin email already exists" });
      }
      
      // Create restaurant
      const createdRestaurant = await storage.createRestaurant(validRestaurant);
      
      // Create admin user for the restaurant
      const hashedPassword = await hashPassword(validAdmin.password);
      const createdAdmin = await storage.createUser({
        ...validAdmin,
        password: hashedPassword,
        restaurantId: createdRestaurant.id
      });
      
      res.status(201).json({
        restaurant: createdRestaurant,
        admin: {
          ...createdAdmin,
          password: undefined
        }
      });
    } catch (error) {
      console.error("Error creating restaurant:", error);
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  });
  
  // Get a single restaurant
  app.get("/api/restaurants/:id", checkRole(['super_admin', 'restaurant_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // For restaurant admins, check if they own the restaurant
      if (req.user.role === 'restaurant_admin' && req.user.restaurantId !== id) {
        return res.status(403).json({ message: "Unauthorized access to restaurant" });
      }
      
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Get admin details
      const admin = await storage.getRestaurantAdmin(restaurant.id);
      
      res.json({
        ...restaurant,
        admin: admin ? {
          ...admin,
          password: undefined
        } : null
      });
    } catch (error) {
      console.error("Error fetching restaurant:", error);
      res.status(500).json({ message: "Failed to fetch restaurant" });
    }
  });
  
  // Update a restaurant
  app.put("/api/restaurants/:id", checkRole(['super_admin', 'restaurant_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // For restaurant admins, check if they own the restaurant
      if (req.user.role === 'restaurant_admin' && req.user.restaurantId !== id) {
        return res.status(403).json({ message: "Unauthorized access to restaurant" });
      }
      
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Update restaurant
      const updatedRestaurant = await storage.updateRestaurant(id, req.body);
      
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating restaurant:", error);
      res.status(500).json({ message: "Failed to update restaurant" });
    }
  });
  
  // Update restaurant status (active/inactive)
  app.patch("/api/restaurants/:id", checkRole(['super_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // If toggling active status, log it
      if ('isActive' in req.body) {
        console.log(`Toggling restaurant ${id} active status to: ${req.body.isActive}`);
      }
      
      // Update restaurant
      const updatedRestaurant = await storage.updateRestaurant(id, req.body);
      
      res.json(updatedRestaurant);
    } catch (error) {
      console.error("Error updating restaurant status:", error);
      res.status(500).json({ message: "Failed to update restaurant status" });
    }
  });
  
  // Delete a restaurant
  app.delete("/api/restaurants/:id", checkRole(['super_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const restaurant = await storage.getRestaurant(id);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Find and delete associated admin
      const admin = await storage.getRestaurantAdmin(id);
      if (admin) {
        await storage.deleteUser(admin.id);
      }
      
      // Delete the restaurant
      await storage.deleteRestaurant(id);
      
      res.status(200).json({ message: "Restaurant and admin deleted successfully" });
    } catch (error) {
      console.error("Error deleting restaurant:", error);
      res.status(500).json({ message: "Failed to delete restaurant" });
    }
  });
  
  // Reset admin password
  app.post("/api/restaurants/:id/reset-password", checkRole(['super_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Find admin associated with this restaurant
      const admin = await storage.getRestaurantAdmin(id);
      if (!admin) {
        return res.status(404).json({ message: "Restaurant admin not found" });
      }
      
      // Generate a random password or use provided one
      const newPassword = req.body.password || randomBytes(8).toString('hex');
      const hashedPassword = await hashPassword(newPassword);
      
      // Update admin's password
      await storage.updateUser(admin.id, { 
        password: hashedPassword 
      });
      
      res.json({ 
        message: "Password reset successfully", 
        email: admin.email,
        password: newPassword 
      });
    } catch (error) {
      console.error("Error resetting password:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });
  
  // Category Routes
  
  // Get categories for a restaurant
  app.get("/api/restaurants/:restaurantId/categories", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // If logged in as restaurant admin, check if they own this restaurant
      if (req.isAuthenticated() && req.user.role === 'restaurant_admin' && req.user.restaurantId !== restaurantId) {
        return res.status(403).json({ message: "Unauthorized access to restaurant categories" });
      }
      
      const categories = await storage.getCategories(restaurantId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  
  // Create a category
  app.post("/api/restaurants/:restaurantId/categories", checkRole(['super_admin', 'restaurant_admin']), async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      
      // For restaurant admins, check if they own the restaurant
      if (req.user.role === 'restaurant_admin' && req.user.restaurantId !== restaurantId) {
        return res.status(403).json({ message: "Unauthorized access to restaurant" });
      }
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Validate and create category
      const validCategory = insertCategorySchema.parse({
        ...req.body,
        restaurantId
      });
      
      const category = await storage.createCategory(validCategory);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });
  
  // Update a category
  app.put("/api/categories/:id", checkRole(['super_admin', 'restaurant_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the category
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // For restaurant admins, check if they own the restaurant this category belongs to
      if (req.user.role === 'restaurant_admin' && req.user.restaurantId !== category.restaurantId) {
        return res.status(403).json({ message: "Unauthorized access to category" });
      }
      
      // Update category
      const updatedCategory = await storage.updateCategory(id, req.body);
      
      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ message: "Failed to update category" });
    }
  });
  
  // Delete a category
  app.delete("/api/categories/:id", checkRole(['super_admin', 'restaurant_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the category
      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // For restaurant admins, check if they own the restaurant this category belongs to
      if (req.user.role === 'restaurant_admin' && req.user.restaurantId !== category.restaurantId) {
        return res.status(403).json({ message: "Unauthorized access to category" });
      }
      
      // Delete category
      await storage.deleteCategory(id);
      
      res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ message: "Failed to delete category" });
    }
  });
  
  // Item Routes
  
  // Get items for a category
  app.get("/api/categories/:categoryId/items", async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      
      // Check if category exists
      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // If logged in as restaurant admin, check if they own this restaurant
      if (req.isAuthenticated() && req.user.role === 'restaurant_admin' && req.user.restaurantId !== category.restaurantId) {
        return res.status(403).json({ message: "Unauthorized access to category items" });
      }
      
      const items = await storage.getItems(categoryId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });
  
  // Get all items for a restaurant
  app.get("/api/restaurants/:restaurantId/items", async (req, res) => {
    try {
      const restaurantId = parseInt(req.params.restaurantId);
      
      // Check if restaurant exists
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // If logged in as restaurant admin, check if they own this restaurant
      if (req.isAuthenticated() && req.user.role === 'restaurant_admin' && req.user.restaurantId !== restaurantId) {
        return res.status(403).json({ message: "Unauthorized access to restaurant items" });
      }
      
      const items = await storage.getItemsByRestaurant(restaurantId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ message: "Failed to fetch items" });
    }
  });
  
  // Create an item
  app.post("/api/categories/:categoryId/items", checkRole(['super_admin', 'restaurant_admin']), async (req, res) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      
      // Check if category exists
      const category = await storage.getCategory(categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // For restaurant admins, check if they own the restaurant this category belongs to
      if (req.user.role === 'restaurant_admin' && req.user.restaurantId !== category.restaurantId) {
        return res.status(403).json({ message: "Unauthorized access to category" });
      }
      
      // Validate and create item
      const validItem = insertItemSchema.parse({
        ...req.body,
        categoryId
      });
      
      const item = await storage.createItem(validItem);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating item:", error);
      res.status(500).json({ message: "Failed to create item" });
    }
  });
  
  // Update an item
  app.put("/api/items/:id", checkRole(['super_admin', 'restaurant_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the item
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Get the category to check restaurant ownership
      const category = await storage.getCategory(item.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // For restaurant admins, check if they own the restaurant this item belongs to
      if (req.user.role === 'restaurant_admin' && req.user.restaurantId !== category.restaurantId) {
        return res.status(403).json({ message: "Unauthorized access to item" });
      }
      
      // Update item
      const updatedItem = await storage.updateItem(id, req.body);
      
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating item:", error);
      res.status(500).json({ message: "Failed to update item" });
    }
  });
  
  // Delete an item
  app.delete("/api/items/:id", checkRole(['super_admin', 'restaurant_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the item
      const item = await storage.getItem(id);
      if (!item) {
        return res.status(404).json({ message: "Item not found" });
      }
      
      // Get the category to check restaurant ownership
      const category = await storage.getCategory(item.categoryId);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // For restaurant admins, check if they own the restaurant this item belongs to
      if (req.user.role === 'restaurant_admin' && req.user.restaurantId !== category.restaurantId) {
        return res.status(403).json({ message: "Unauthorized access to item" });
      }
      
      // Delete item
      await storage.deleteItem(id);
      
      res.status(200).json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ message: "Failed to delete item" });
    }
  });
  
  // Public Menu Route
  
  // Get public menu data by slug
  app.get("/api/menus/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;
      
      // Find the restaurant by slug
      const restaurant = await storage.getRestaurantBySlug(slug);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      
      // Get all categories
      const categories = await storage.getCategories(restaurant.id);
      
      // Get all items for each category
      const categoriesWithItems = await Promise.all(
        categories.map(async (category) => {
          const items = await storage.getItems(category.id);
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
      console.error("Error fetching menu:", error);
      res.status(500).json({ message: "Failed to fetch menu" });
    }
  });
  
  // Create http server
  const httpServer = createServer(app);

  return httpServer;
}

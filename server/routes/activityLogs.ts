import { Router } from "express";
import { storage } from "../storage";
import { Request, Response, NextFunction } from "express";

const router = Router();

// Super Admin only middleware
const superAdminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (req.user && req.user.role === 'super_admin') {
    return next();
  }
  
  return res.status(403).json({ message: "Access denied. Super Admin access required." });
};

// Get all activity logs with pagination (Super Admin only)
router.get("/", superAdminOnly, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
    const restaurantId = req.query.restaurantId ? parseInt(req.query.restaurantId as string) : undefined;
    
    const logs = await storage.getActivityLogs({ 
      userId, 
      restaurantId, 
      limit, 
      offset 
    });
    
    // Get total count for pagination
    const total = await storage.countActivityLogs({ userId, restaurantId });
    
    res.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total
      }
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ message: "Failed to fetch activity logs" });
  }
});

// Get activity logs for a specific user (Super Admin only)
router.get("/user/:userId", superAdminOnly, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    // Verify user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const logs = await storage.getActivityLogsByUser(userId, limit, offset);
    const total = await storage.countActivityLogs({ userId });
    
    res.json({
      logs,
      user,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total
      }
    });
  } catch (error) {
    console.error("Error fetching user activity logs:", error);
    res.status(500).json({ message: "Failed to fetch user activity logs" });
  }
});

// Get activity logs for a specific restaurant (Super Admin only)
router.get("/restaurant/:restaurantId", superAdminOnly, async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
    
    // Verify restaurant exists
    const restaurant = await storage.getRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    const logs = await storage.getActivityLogsByRestaurant(restaurantId, limit, offset);
    const total = await storage.countActivityLogs({ restaurantId });
    
    res.json({
      logs,
      restaurant,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total
      }
    });
  } catch (error) {
    console.error("Error fetching restaurant activity logs:", error);
    res.status(500).json({ message: "Failed to fetch restaurant activity logs" });
  }
});

export default router;
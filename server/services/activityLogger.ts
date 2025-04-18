import { Request } from "express";
import { User, InsertActivityLog, activityLogs } from "@shared/schema";
import { db } from "../db";

export interface ActivityLoggerOptions {
  user: User;
  activityType: InsertActivityLog["activityType"];
  description: string;
  metadata?: Record<string, any>;
  restaurantId?: number;
  request?: Request;
}

export async function logActivity({
  user,
  activityType,
  description,
  metadata = {},
  restaurantId,
  request
}: ActivityLoggerOptions) {
  try {
    const activityLog: InsertActivityLog = {
      userId: user.id,
      activityType,
      description,
      metadata,
      restaurantId: restaurantId || user.restaurantId || undefined,
      ipAddress: request?.ip,
      userAgent: request?.headers["user-agent"],
    };

    // Log the activity to the database
    const [insertedLog] = await db.insert(activityLogs).values(activityLog).returning();
    
    // Log to console in dev mode
    if (process.env.NODE_ENV === "development") {
      console.log(`Activity Log: ${user.name} (${user.email}) - ${activityType}: ${description}`);
    }
    
    return insertedLog;
  } catch (error) {
    console.error("Error logging activity:", error);
    // Don't throw - activity logging should never break the application flow
    return null;
  }
}
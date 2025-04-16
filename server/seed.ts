import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedInitialData() {
  try {
    // Check if there are any users in the system
    const users = Array.from((storage as any).users.values());
    
    if (users.length === 0) {
      console.log("Seeding initial super admin user...");
      
      // Create a super admin user
      await storage.createUser({
        username: "admin",
        name: "Super Admin",
        email: "admin@example.com",
        password: await hashPassword("Admin123!"),
        role: "super_admin",
      });
      
      console.log("Created super admin user:");
      console.log("Username: admin");
      console.log("Password: Admin123!");
      console.log("Please change this password after first login.");
    }
  } catch (error) {
    console.error("Error seeding initial data:", error);
  }
}
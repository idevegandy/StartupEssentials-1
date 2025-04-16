import { db } from './db';
import { users, restaurants, categories, menuItems } from '@shared/schema';
import { hashPassword } from './auth';

export async function seedInitialData() {
  try {
    console.log("🌱 Checking if database needs seeding...");
    
    // Check if we have any users already
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      console.log("🌱 No users found, seeding database...");
      
      // Create super admin user
      const hashedPassword = await hashPassword("Admin123!");
      
      const [superAdmin] = await db.insert(users).values({
        name: "Super Admin",
        username: "admin",
        email: "admin@example.com",
        password: hashedPassword,
        role: "super_admin"
      }).returning();
      
      console.log(`🌱 Created super admin user: ${superAdmin.username}`);
      
      // Create a sample restaurant
      const [restaurant] = await db.insert(restaurants).values({
        name: "Sample Restaurant",
        slug: "sample-restaurant",
        logo: null,
        status: "active",
        primaryColor: "#3b82f6",
        backgroundColor: "#ffffff"
      }).returning();
      
      console.log(`🌱 Created sample restaurant: ${restaurant.name}`);
      
      // Create restaurant admin
      const restaurantAdminPassword = await hashPassword("password123");
      
      const [restaurantAdmin] = await db.insert(users).values({
        name: "Restaurant Admin",
        username: "restaurant1",
        email: "restaurant@example.com",
        password: restaurantAdminPassword,
        role: "restaurant_admin",
        restaurantId: restaurant.id
      }).returning();
      
      console.log(`🌱 Created restaurant admin: ${restaurantAdmin.username}`);
      
      // Create sample categories
      const categoryData = [
        { name: "Appetizers", icon: "UtensilsCrossed", restaurantId: restaurant.id, order: 1 },
        { name: "Main Courses", icon: "Beef", restaurantId: restaurant.id, order: 2 },
        { name: "Desserts", icon: "IceCream", restaurantId: restaurant.id, order: 3 }
      ];
      
      const seededCategories = await Promise.all(
        categoryData.map(async (category) => {
          const [result] = await db.insert(categories).values(category).returning();
          return result;
        })
      );
      
      console.log(`🌱 Created ${seededCategories.length} sample categories`);
      
      // Create sample menu items
      const menuItemsData = [
        { 
          name: "Hummus Plate", 
          description: "Creamy hummus with warm pita bread", 
          price: "32₪", 
          image: null, 
          categoryId: seededCategories[0].id, 
          restaurantId: restaurant.id, 
          order: 1 
        },
        { 
          name: "Mixed Grill", 
          description: "Assortment of grilled meats with vegetables", 
          price: "89₪", 
          image: null, 
          categoryId: seededCategories[1].id, 
          restaurantId: restaurant.id, 
          order: 1 
        },
        { 
          name: "Malabi", 
          description: "Traditional milk pudding with rose water", 
          price: "28₪", 
          image: null, 
          categoryId: seededCategories[2].id, 
          restaurantId: restaurant.id, 
          order: 1 
        }
      ];
      
      const seededMenuItems = await Promise.all(
        menuItemsData.map(async (item) => {
          const [result] = await db.insert(menuItems).values(item).returning();
          return result;
        })
      );
      
      console.log(`🌱 Created ${seededMenuItems.length} sample menu items`);
      console.log("🌱 Database seeding completed successfully");
    } else {
      console.log("🌱 Database already has users, skipping seed");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
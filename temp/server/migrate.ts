import { db } from './db';
import { users, restaurants, categories, menuItems } from '@shared/schema';
import { hashPassword } from './auth';
import { log } from './vite';

export async function migrateDatabase() {
  try {
    log("🔄 Creating database schema...");

    // Create tables in the correct order
    await db.execute(`
      CREATE TABLE IF NOT EXISTS restaurants (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        logo TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        primary_color TEXT DEFAULT '#3b82f6',
        background_color TEXT DEFAULT '#ffffff',
        facebook TEXT,
        instagram TEXT,
        whatsapp TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'restaurant_admin',
        restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        icon TEXT,
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        price TEXT NOT NULL,
        image TEXT,
        category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
        "order" INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    log("✅ Database schema created successfully");
    
    // Check if super admin exists
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      log("🌱 Seeding initial data...");
      
      // Create super admin
      const adminPassword = await hashPassword("Admin123!");
      const [superAdmin] = await db.insert(users).values({
        name: "Super Admin",
        username: "admin",
        email: "admin@example.com",
        password: adminPassword,
        role: "super_admin"
      }).returning();
      
      log(`✅ Created super admin: ${superAdmin.username}`);
      
      // Create a demo restaurant
      const [restaurant] = await db.insert(restaurants).values({
        name: "Demo Restaurant",
        slug: "demo-restaurant",
        primaryColor: "#3b82f6",
        backgroundColor: "#ffffff",
        status: "active"
      }).returning();
      
      log(`✅ Created demo restaurant: ${restaurant.name}`);
      
      // Create restaurant admin
      const restaurantAdminPassword = await hashPassword("Password123!");
      const [restaurantAdmin] = await db.insert(users).values({
        name: "Restaurant Manager",
        username: "manager",
        email: "manager@example.com",
        password: restaurantAdminPassword,
        role: "restaurant_admin",
        restaurantId: restaurant.id
      }).returning();
      
      log(`✅ Created restaurant admin: ${restaurantAdmin.username}`);
      
      // Create sample categories
      const categoryData = [
        { 
          name: "Appetizers", 
          icon: "UtensilsCrossed", 
          restaurantId: restaurant.id, 
          order: 1 
        },
        { 
          name: "Main Courses", 
          icon: "Beef", 
          restaurantId: restaurant.id, 
          order: 2 
        },
        { 
          name: "Desserts", 
          icon: "IceCream", 
          restaurantId: restaurant.id, 
          order: 3 
        }
      ];
      
      const seededCategories = await Promise.all(
        categoryData.map(async (category) => {
          const [result] = await db.insert(categories).values(category).returning();
          return result;
        })
      );
      
      log(`✅ Created ${seededCategories.length} sample categories`);
      
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
      
      log(`✅ Created ${seededMenuItems.length} sample menu items`);
      log("✅ Initial data seeded successfully");
    } else {
      log("ℹ️ Database already has users, skipping seed");
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error in database migration:", error);
    return false;
  }
}
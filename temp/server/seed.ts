import { db } from './db';
import { users, restaurants, categories, items } from '@shared/schema';
import { hashPassword } from './auth';

export async function seedInitialData() {
  try {
    console.log("🌱 Checking if database needs seeding...");
    
    // Check if we have any users already
    const existingUsers = await db.select().from(users);
    
    if (existingUsers.length === 0) {
      console.log("🌱 No users found, seeding database...");
      
      // 1. Create super admin user
      const superAdminPassword = await hashPassword("SuperSecure123");
      
      const [superAdmin] = await db.insert(users).values({
        name: "Super Admin",
        email: "superadmin@example.com",
        password: superAdminPassword,
        role: "super_admin"
      }).returning();
      
      console.log(`🌱 Created super admin user: ${superAdmin.email}`);
      
      // 2. Create restaurant data
      const restaurantData = [
        {
          name: "Falafel Express",
          slug: "falafel-express",
          logo: "https://via.placeholder.com/150",
          primaryColor: "#22c55e", // Green
          backgroundColor: "#ffffff",
          facebookLink: "https://facebook.com/falafelexpress",
          instagramLink: "https://instagram.com/falafelexpress",
          websiteLink: "https://falafelexpress.com",
          description: "Best falafel in town!"
        },
        {
          name: "Pizza Bazaar",
          slug: "pizza-bazaar",
          logo: "https://via.placeholder.com/150",
          primaryColor: "#ef4444", // Red
          backgroundColor: "#f8fafc",
          facebookLink: "https://facebook.com/pizzabazaar",
          instagramLink: "https://instagram.com/pizzabazaar",
          websiteLink: "https://pizzabazaar.com",
          description: "Authentic Italian pizza"
        },
        {
          name: "Sushi Delight",
          slug: "sushi-delight",
          logo: "https://via.placeholder.com/150",
          primaryColor: "#3b82f6", // Blue
          backgroundColor: "#f1f5f9",
          facebookLink: "https://facebook.com/sushidelight",
          instagramLink: "https://instagram.com/sushidelight",
          websiteLink: "https://sushidelight.com",
          description: "Fresh sushi and Japanese cuisine"
        }
      ];
      
      // Insert restaurants and create their admins
      for (const restaurantInfo of restaurantData) {
        // Create restaurant
        const [restaurant] = await db.insert(restaurants).values(restaurantInfo).returning();
        console.log(`🌱 Created restaurant: ${restaurant.name}`);
        
        // Create restaurant admin
        const adminPassword = await hashPassword("Admin1234");
        
        const [restaurantAdmin] = await db.insert(users).values({
          name: `${restaurant.name} Admin`,
          email: `admin+${restaurant.slug}@example.com`,
          password: adminPassword,
          role: "restaurant_admin",
          restaurantId: restaurant.id
        }).returning();
        
        console.log(`🌱 Created restaurant admin: ${restaurantAdmin.email}`);
        
        // Create categories for this restaurant
        const categoryData = [
          { 
            name: "Main Dishes", 
            icon: "Utensils", 
            displayOrder: 1,
            restaurantId: restaurant.id 
          },
          { 
            name: "Drinks", 
            icon: "Coffee", 
            displayOrder: 2,
            restaurantId: restaurant.id 
          }
        ];
        
        // If it's a specific restaurant, add a custom category
        if (restaurant.slug === "falafel-express") {
          categoryData.push({ 
            name: "Sides", 
            icon: "Salad", 
            displayOrder: 3,
            restaurantId: restaurant.id 
          });
        } else if (restaurant.slug === "pizza-bazaar") {
          categoryData.push({ 
            name: "Desserts", 
            icon: "IceCream", 
            displayOrder: 3,
            restaurantId: restaurant.id 
          });
        }
        
        const createdCategories = [];
        
        for (const category of categoryData) {
          const [createdCategory] = await db.insert(categories).values(category).returning();
          createdCategories.push(createdCategory);
        }
        
        console.log(`🌱 Created ${createdCategories.length} categories for ${restaurant.name}`);
        
        // Create items for each category
        for (const category of createdCategories) {
          // Generic items based on restaurant type
          let menuItems: { 
            name: string; 
            description: string; 
            price: number; 
            image: string | null; 
            categoryId: number;
            displayOrder: number;
          }[] = [];
          
          if (restaurant.slug === "falafel-express") {
            if (category.name === "Main Dishes") {
              menuItems = [
                {
                  name: "Falafel Plate",
                  description: "5 falafel balls served with hummus, tahini and salad",
                  price: 4500, // 45₪ (stored in cents)
                  image: "https://via.placeholder.com/150",
                  categoryId: category.id,
                  displayOrder: 1
                },
                {
                  name: "Falafel in Pita",
                  description: "Freshly made falafel in pita with all the toppings",
                  price: 2500, // 25₪
                  image: "https://via.placeholder.com/150",
                  categoryId: category.id,
                  displayOrder: 2
                }
              ];
            } else if (category.name === "Drinks") {
              menuItems = [
                {
                  name: "Mint Lemonade",
                  description: "Freshly squeezed lemonade with mint",
                  price: 1500, // 15₪
                  image: null,
                  categoryId: category.id,
                  displayOrder: 1
                },
                {
                  name: "Soft Drink",
                  description: "Various soft drinks",
                  price: 1000, // 10₪
                  image: null,
                  categoryId: category.id,
                  displayOrder: 2
                }
              ];
            } else if (category.name === "Sides") {
              menuItems = [
                {
                  name: "French Fries",
                  description: "Crispy french fries",
                  price: 1500, // 15₪
                  image: null,
                  categoryId: category.id,
                  displayOrder: 1
                },
                {
                  name: "Israeli Salad",
                  description: "Chopped tomatoes, cucumbers, onions with olive oil and lemon",
                  price: 1800, // 18₪
                  image: null,
                  categoryId: category.id,
                  displayOrder: 2
                }
              ];
            }
          } else if (restaurant.slug === "pizza-bazaar") {
            if (category.name === "Main Dishes") {
              menuItems = [
                {
                  name: "Margherita Pizza",
                  description: "Tomato sauce, mozzarella, and basil",
                  price: 4900, // 49₪
                  image: "https://via.placeholder.com/150",
                  categoryId: category.id,
                  displayOrder: 1
                },
                {
                  name: "Pepperoni Pizza",
                  description: "Tomato sauce, mozzarella, and pepperoni",
                  price: 5900, // 59₪
                  image: "https://via.placeholder.com/150",
                  categoryId: category.id,
                  displayOrder: 2
                }
              ];
            } else if (category.name === "Drinks") {
              menuItems = [
                {
                  name: "Soft Drink",
                  description: "Various soft drinks",
                  price: 1000, // 10₪
                  image: null,
                  categoryId: category.id,
                  displayOrder: 1
                },
                {
                  name: "Beer",
                  description: "Local and imported beers",
                  price: 2000, // 20₪
                  image: null,
                  categoryId: category.id,
                  displayOrder: 2
                }
              ];
            } else if (category.name === "Desserts") {
              menuItems = [
                {
                  name: "Tiramisu",
                  description: "Classic Italian dessert",
                  price: 2900, // 29₪
                  image: null,
                  categoryId: category.id,
                  displayOrder: 1
                },
                {
                  name: "Chocolate Cake",
                  description: "Rich chocolate cake with vanilla ice cream",
                  price: 2500, // 25₪
                  image: null,
                  categoryId: category.id,
                  displayOrder: 2
                }
              ];
            }
          } else if (restaurant.slug === "sushi-delight") {
            if (category.name === "Main Dishes") {
              menuItems = [
                {
                  name: "Salmon Sushi Combo",
                  description: "8 pieces of salmon sushi with miso soup",
                  price: 6900, // 69₪
                  image: "https://via.placeholder.com/150",
                  categoryId: category.id,
                  displayOrder: 1
                },
                {
                  name: "Mixed Sushi Platter",
                  description: "12 pieces of mixed sushi",
                  price: 8900, // 89₪
                  image: "https://via.placeholder.com/150",
                  categoryId: category.id,
                  displayOrder: 2
                }
              ];
            } else if (category.name === "Drinks") {
              menuItems = [
                {
                  name: "Japanese Green Tea",
                  description: "Authentic Japanese green tea",
                  price: 1500, // 15₪
                  image: null,
                  categoryId: category.id,
                  displayOrder: 1
                },
                {
                  name: "Sake",
                  description: "Japanese rice wine",
                  price: 2500, // 25₪
                  image: null,
                  categoryId: category.id,
                  displayOrder: 2
                }
              ];
            }
          }
          
          // Insert items for this category
          for (const item of menuItems) {
            await db.insert(items).values(item).returning();
          }
          
          console.log(`🌱 Created ${menuItems.length} items for ${category.name} in ${restaurant.name}`);
        }
      }
      
      console.log("🌱 Database seeding completed successfully");
    } else {
      console.log("🌱 Database already has users, skipping seed");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}
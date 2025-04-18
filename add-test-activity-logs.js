/**
 * Script to add test activity logs to the database
 */
import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

async function addTestActivityLogs() {
  try {
    console.log('Connecting to database...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    // Login as super admin
    console.log('Fetching super admin user...');
    const { rows: [superAdmin] } = await pool.query(`
      SELECT * FROM users 
      WHERE role = 'super_admin' 
      LIMIT 1
    `);

    if (!superAdmin) {
      console.error('No super admin user found');
      return;
    }

    // Log a few different activity types for this user
    const activityTypes = [
      { type: 'login', description: 'User logged in' },
      { type: 'update_settings', description: 'System settings updated' },
      { type: 'create_restaurant', description: 'Created new restaurant "Test Restaurant"' },
      { type: 'update_restaurant', description: 'Updated restaurant information' },
      { type: 'create_category', description: 'Added new menu category "Desserts"' },
    ];

    console.log(`Adding ${activityTypes.length} activity logs for user: ${superAdmin.email}...`);

    // Get current timestamp
    const now = new Date();
    
    // Add each activity log with a different timestamp (some minutes apart)
    for (let i = 0; i < activityTypes.length; i++) {
      const activity = activityTypes[i];
      const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000)); // 5 minutes apart
      
      await pool.query(`
        INSERT INTO activity_logs 
        (user_id, activity_type, description, timestamp, metadata, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        superAdmin.id, 
        activity.type, 
        activity.description, 
        timestamp,
        JSON.stringify({ test: true, demoData: true }),
        '127.0.0.1',
        'Test Script'
      ]);
      
      console.log(`Added activity log: ${activity.type} at ${timestamp.toISOString()}`);
    }

    // Get all restaurant admins
    console.log('Fetching restaurant admin users...');
    const { rows: restaurantAdmins } = await pool.query(`
      SELECT * FROM users 
      WHERE role = 'restaurant_admin' 
      LIMIT 5
    `);

    if (restaurantAdmins.length === 0) {
      console.error('No restaurant admin users found');
    } else {
      // For each restaurant admin, add a couple of logs
      for (const admin of restaurantAdmins) {
        console.log(`Adding activity logs for user: ${admin.email}...`);
        
        // Get current timestamp
        const adminNow = new Date();
        
        // Add login activity
        await pool.query(`
          INSERT INTO activity_logs 
          (user_id, activity_type, description, timestamp, metadata, ip_address, user_agent, restaurant_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          admin.id, 
          'login', 
          'User logged in', 
          new Date(adminNow.getTime() - (10 * 60 * 1000)), // 10 minutes ago
          JSON.stringify({ test: true, demoData: true }),
          '127.0.0.1',
          'Test Script',
          admin.restaurant_id
        ]);
        
        // Add item creation activity
        await pool.query(`
          INSERT INTO activity_logs 
          (user_id, activity_type, description, timestamp, metadata, ip_address, user_agent, restaurant_id)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          admin.id, 
          'create_item', 
          'Added new menu item "Special Dish"', 
          new Date(adminNow.getTime() - (5 * 60 * 1000)), // 5 minutes ago
          JSON.stringify({ test: true, demoData: true, itemName: 'Special Dish' }),
          '127.0.0.1',
          'Test Script',
          admin.restaurant_id
        ]);
        
        console.log(`Added 2 activity logs for admin: ${admin.email} (restaurant ID: ${admin.restaurant_id})`);
      }
    }

    console.log('Successfully added test activity logs');
    await pool.end();
    
  } catch (error) {
    console.error('Error adding test activity logs:', error);
  }
}

addTestActivityLogs();
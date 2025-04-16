/**
 * Script to add test restaurants via API
 */
import fetch from 'node-fetch';

async function addTestRestaurants() {
  try {
    // Step 1: Login as super admin
    console.log('Logging in as admin...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'superadmin', password: 'Admin123!' })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Login failed: ${errorData.message || loginResponse.statusText}`);
    }

    // Get session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Step 2: Create test restaurant data
    console.log('Creating test restaurant data...');
    const seedResponse = await fetch('http://localhost:5000/api/dev/seed-test-data', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies 
      }
    });

    if (!seedResponse.ok) {
      const errorData = await seedResponse.json();
      throw new Error(`Seeding failed: ${errorData.message || seedResponse.statusText}`);
    }

    const result = await seedResponse.json();
    console.log('Success:', result.message);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

addTestRestaurants();
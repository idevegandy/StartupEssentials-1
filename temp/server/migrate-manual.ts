import { pool } from './db';

async function migrateManually() {
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Check if columns exist
    const checkPhoneColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'restaurants' AND column_name = 'phone'
    `);
    
    const checkAddressColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'restaurants' AND column_name = 'address'
    `);
    
    const checkRtlColumn = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'restaurants' AND column_name = 'rtl'
    `);
    
    // Add columns if they don't exist
    if (checkPhoneColumn.rowCount === 0) {
      console.log('Adding phone column to restaurants table...');
      await client.query(`
        ALTER TABLE restaurants
        ADD COLUMN phone TEXT
      `);
    }
    
    if (checkAddressColumn.rowCount === 0) {
      console.log('Adding address column to restaurants table...');
      await client.query(`
        ALTER TABLE restaurants
        ADD COLUMN address TEXT
      `);
    }
    
    if (checkRtlColumn.rowCount === 0) {
      console.log('Adding rtl column to restaurants table...');
      await client.query(`
        ALTER TABLE restaurants
        ADD COLUMN rtl BOOLEAN DEFAULT TRUE
      `);
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (error) {
    // Rollback in case of error
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
  } finally {
    // Release the client
    client.release();
  }
}

// Run the migration
migrateManually()
  .then(() => {
    console.log('Migration script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration script failed:', error);
    process.exit(1);
  });
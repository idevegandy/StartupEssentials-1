
import { pool } from './server/db.ts';
import fs from 'fs';
import { exec } from 'child_process';

async function backupDatabase() {
  try {
    // Get connection string from pool
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL not found');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;

    // Execute pg_dump
    exec(`pg_dump "${connectionString}" > ${filename}`, (error, stdout, stderr) => {
      if (error) {
        console.error('Backup failed:', error);
        return;
      }
      console.log(`Database backup saved to ${filename}`);
    });

  } catch (error) {
    console.error('Backup error:', error);
  } finally {
    await pool.end();
  }
}

backupDatabase();

// update-passwords.js
const { Client } = require('pg');
const crypto = require('crypto');

// Database connection config
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924',
  port: 5432,
});

// The roles to update
const rolesToUpdate = ['Administrator', 'Dean', 'Program Chair', 'Staff'];
// The new password and its SHA-256 hash
const newPassword = 'demo123';
const newHash = crypto.createHash('sha256').update(newPassword).digest('hex');

async function updatePasswords() {
  try {
    await client.connect();
    console.log('Connected to database.');

    // Get user_ids for the specified roles
    const res = await client.query(
      `SELECT u.user_id, u.email, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.name = ANY($1)`,
      [rolesToUpdate]
    );
    if (res.rows.length === 0) {
      console.log('No users found for the specified roles.');
      return;
    }
    console.log('Users to update:', res.rows.map(u => `${u.email} (${u.role_name})`).join(', '));

    // Update password_hash for each user
    for (const user of res.rows) {
      await client.query(
        'UPDATE users SET password_hash = $1 WHERE user_id = $2',
        [newHash, user.user_id]
      );
      console.log(`Updated password for ${user.email} (${user.role_name})`);
    }
    console.log('All specified users updated successfully.');
  } catch (err) {
    console.error('Error updating passwords:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

updatePasswords();

/*
Instructions:
1. Install dependencies:
   npm install pg bcrypt
2. Edit the database connection config above with your credentials.
3. Run the script:
   node update-passwords.js
*/ 
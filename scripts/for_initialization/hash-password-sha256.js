// hash-password-sha256.js
const crypto = require('crypto');

function hashPasswordSHA256(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Example usage:
const password = process.argv[2]; // Pass the password as a command-line argument
if (!password) {
  console.error('Usage: node hash-password-sha256.js <password>');
  process.exit(1);
}
const hash = hashPasswordSHA256(password);
console.log('SHA-256 hash:', hash);
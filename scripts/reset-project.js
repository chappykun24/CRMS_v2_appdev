const fs = require('fs');
const path = require('path');

console.log('🧹 Resetting project...');

// Remove node_modules
if (fs.existsSync('node_modules')) {
  console.log('Removing node_modules...');
  fs.rmSync('node_modules', { recursive: true, force: true });
}

// Remove .expo
if (fs.existsSync('.expo')) {
  console.log('Removing .expo...');
  fs.rmSync('.expo', { recursive: true, force: true });
}

// Remove package-lock.json
if (fs.existsSync('package-lock.json')) {
  console.log('Removing package-lock.json...');
  fs.unlinkSync('package-lock.json');
}

console.log('✅ Project reset complete!');
console.log('Run "npm install" to reinstall dependencies.'); 
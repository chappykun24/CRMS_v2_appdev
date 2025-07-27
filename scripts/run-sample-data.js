const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration - matching the project's database.js
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'crms_v2_db',
  password: 'care0924', // Updated to match project configuration
  port: 5432,
});

async function runSampleData() {
  try {
    console.log('🚀 Starting to load sample AppDev data...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'sample-appdev-data.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await pool.query(sqlContent);
    
    console.log('✅ Sample data loaded successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log('• 30 students enrolled in BSIT-3A');
    console.log('• 4 main assessments (Web Dev, React, Backend, Full-Stack)');
    console.log('• 16 sub-assessments (4 per main assessment)');
    console.log('• 90% grading completion rate');
    console.log('• 87% pass rate');
    console.log('• Realistic AppDev-related content');
    
    console.log('\n🎯 Assessment Topics:');
    console.log('1. Web Development Fundamentals (HTML5, CSS3, JavaScript)');
    console.log('2. React Application Development (React, Redux, Material-UI)');
    console.log('3. Backend API Development (Node.js, Express, MongoDB)');
    console.log('4. Full-Stack Application (Complete project)');
    
    console.log('\n📝 Sub-Assessment Examples:');
    console.log('• HTML Structure & Semantics');
    console.log('• CSS Styling & Layout');
    console.log('• JavaScript Functionality');
    console.log('• React Components');
    console.log('• State Management');
    console.log('• API Integration');
    console.log('• And more...');
    
  } catch (error) {
    console.error('❌ Error loading sample data:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
runSampleData(); 
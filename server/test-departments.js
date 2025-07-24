const pool = require('./database');

async function testDepartments() {
  try {
    console.log('Testing departments query...');
    
    // Test the exact query from the departments endpoint
    const result = await pool.query('SELECT department_id, name, department_abbreviation FROM departments ORDER BY name');
    
    console.log('Departments found:', result.rows.length);
    console.log('Departments:', result.rows);
    
  } catch (error) {
    console.error('Error testing departments query:', error);
  } finally {
    await pool.end();
  }
}

testDepartments(); 
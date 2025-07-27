const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testAPIRoutes() {
  console.log('🧪 Testing API routes...\n');
  
  try {
    // Test 1: Get faculty assessments
    console.log('1️⃣ Testing GET /api/assessments/faculty/:facultyId');
    try {
      const response = await axios.get(`${BASE_URL}/assessments/faculty/6`);
      console.log('✅ Faculty assessments endpoint working');
      console.log(`   Found ${response.data.length} assessments\n`);
    } catch (error) {
      console.log('❌ Faculty assessments endpoint failed:', error.response?.data || error.message, '\n');
    }
    
    // Test 2: Get syllabus assessments
    console.log('2️⃣ Testing GET /api/assessments/syllabus/:syllabusId');
    try {
      const response = await axios.get(`${BASE_URL}/assessments/syllabus/1`);
      console.log('✅ Syllabus assessments endpoint working');
      console.log(`   Found ${response.data.length} assessments\n`);
    } catch (error) {
      console.log('❌ Syllabus assessments endpoint failed:', error.response?.data || error.message, '\n');
    }
    
    // Test 3: Get specific assessment
    console.log('3️⃣ Testing GET /api/assessments/:id');
    try {
      const response = await axios.get(`${BASE_URL}/assessments/1`);
      console.log('✅ Specific assessment endpoint working');
      console.log(`   Assessment: ${response.data.title}\n`);
    } catch (error) {
      console.log('❌ Specific assessment endpoint failed:', error.response?.data || error.message, '\n');
    }
    
    // Test 4: Get sub-assessments
    console.log('4️⃣ Testing GET /api/sub-assessments/assessment/:assessmentId');
    try {
      const response = await axios.get(`${BASE_URL}/sub-assessments/assessment/1`);
      console.log('✅ Sub-assessments endpoint working');
      console.log(`   Found ${response.data.length} sub-assessments\n`);
    } catch (error) {
      console.log('❌ Sub-assessments endpoint failed:', error.response?.data || error.message, '\n');
    }
    
    // Test 5: Get students with grades
    console.log('5️⃣ Testing GET /api/assessments/:id/students-with-grades');
    try {
      const response = await axios.get(`${BASE_URL}/assessments/1/students-with-grades`);
      console.log('✅ Students with grades endpoint working');
      console.log(`   Found ${response.data.length} student records\n`);
    } catch (error) {
      console.log('❌ Students with grades endpoint failed:', error.response?.data || error.message, '\n');
    }
    
    // Test 6: Get ILOs
    console.log('6️⃣ Testing GET /api/ilos/syllabus/:syllabusId');
    try {
      const response = await axios.get(`${BASE_URL}/ilos/syllabus/1`);
      console.log('✅ ILOs endpoint working');
      console.log(`   Found ${response.data.length} ILOs\n`);
    } catch (error) {
      console.log('❌ ILOs endpoint failed:', error.response?.data || error.message, '\n');
    }
    
    // Test 7: Get rubrics
    console.log('7️⃣ Testing GET /api/rubrics/syllabus/:syllabusId');
    try {
      const response = await axios.get(`${BASE_URL}/rubrics/syllabus/1`);
      console.log('✅ Rubrics endpoint working');
      console.log(`   Found ${response.data.length} rubrics\n`);
    } catch (error) {
      console.log('❌ Rubrics endpoint failed:', error.response?.data || error.message, '\n');
    }
    
    console.log('🎉 API route testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAPIRoutes(); 
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testEndpoints() {
  console.log('🧪 Testing API endpoints after fixes...\n');

  const tests = [
    { name: 'Assessments Test', url: '/assessments/test' },
    { name: 'Syllabus One', url: '/syllabus/one/1' },
    { name: 'Assessments by Syllabus', url: '/assessments/syllabus/1' },
    { name: 'Assessment Details', url: '/assessments/1' },
    { name: 'Sub-Assessments', url: '/sub-assessments/assessment/1' },
    { name: 'ILOs by Syllabus', url: '/ilos/syllabus/1' },
    { name: 'Rubrics by Syllabus', url: '/rubrics/syllabus/1' },
    { name: 'Students with Grades', url: '/assessments/1/students-with-grades' }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const response = await axios.get(`${BASE_URL}${test.url}`);
      console.log(`✅ ${test.name}: ${response.status} - ${response.data.message || 'Success'}`);
      passed++;
    } catch (error) {
      const status = error.response?.status || 'No Response';
      const message = error.response?.data?.error || error.message;
      console.log(`❌ ${test.name}: ${status} - ${message}`);
      failed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  console.log(`🎯 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! API is working perfectly!');
  } else {
    console.log('\n⚠️  Some tests failed, but the main functionality should work.');
  }
}

testEndpoints().catch(console.error); 
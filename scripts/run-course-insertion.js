#!/usr/bin/env node
/**
 * Course Data Insertion Runner
 * 
 * This script inserts comprehensive course data including:
 * - General IT curriculum courses (black courses)
 * - Business Analytics Track specialization courses (BAT - green courses)
 * - Network Technology Track specialization courses (NTT - green courses)
 * 
 * Usage: node scripts/run-course-insertion.js
 */

const { insertComprehensiveCourseData } = require('./for_initialization/insert-comprehensive-course-data');

console.log('🎯 Starting Course Data Insertion...');
console.log('📋 This will insert courses from your curriculum images:');
console.log('   • General subjects (black courses)');
console.log('   • BAT specialization courses (green courses)');
console.log('   • NTT specialization courses (green courses)');
console.log('   • SM track excluded as requested\n');

insertComprehensiveCourseData()
  .then(() => {
    console.log('\n🎉 Course insertion completed successfully!');
    console.log('🚀 Your CRMS system now has the complete course catalog.');
  })
  .catch((error) => {
    console.error('\n❌ Course insertion failed:', error.message);
    process.exit(1);
  }); 
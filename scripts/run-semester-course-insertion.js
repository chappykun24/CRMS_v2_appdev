#!/usr/bin/env node
/**
 * Semester-Based Course Data Insertion Runner
 * 
 * This script properly distributes courses across semesters:
 * - 1st Semester: All first semester courses (1st-4th year)
 * - 2nd Semester: All second semester courses (1st-4th year)  
 * - Summer: Third year summer courses (IT 331, IT 332)
 * 
 * Usage: node scripts/run-semester-course-insertion.js
 */

const { insertCoursesBySemester } = require('./for_initialization/insert-courses-by-semester');

console.log('🎯 Starting Semester-Based Course Data Insertion...');
console.log('📋 This will properly distribute courses across semesters:');
console.log('   • 1st Semester: First semester courses (Years 1-4)');
console.log('   • 2nd Semester: Second semester courses (Years 1-4)');
console.log('   • Summer: Third year summer courses');
console.log('   • BAT & NTT specialization courses distributed appropriately\n');

insertCoursesBySemester()
  .then(() => {
    console.log('\n🎉 Semester-based course insertion completed successfully!');
    console.log('🚀 Your CRMS system now has courses properly distributed across semesters.');
  })
  .catch((error) => {
    console.error('\n❌ Semester-based course insertion failed:', error.message);
    process.exit(1);
  }); 
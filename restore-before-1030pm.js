const { execSync } = require('child_process');

console.log('🕘 Restoring to version before 10:30 PM...');
console.log('📝 Commit: 9566c9dbcc437ab6efdb0a9932de989ec505897e');
console.log('📋 Message: new adjustment for database and grading system functionalitites');

try {
  // Try to use Git to restore
  execSync('git reset --hard 9566c9dbcc437ab6efdb0a9932de989ec505897e', { stdio: 'inherit' });
  console.log('✅ Successfully restored to version before 10:30 PM!');
  console.log('🔄 Your app should now be back to the working state.');
} catch (error) {
  console.log('❌ Git command failed. Please try these steps:');
  console.log('1. Restart your terminal/computer');
  console.log('2. Then run: git reset --hard 9566c9dbcc437ab6efdb0a9932de989ec505897e');
  console.log('3. Or manually copy files from that commit');
} 
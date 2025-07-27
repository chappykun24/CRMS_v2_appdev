const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Recent commits from your history
const commits = [
    { hash: '348469eb6e6f1e1a4aa82bfe3c8209718d423315', message: 'many adjustments for the db and assessmnt' },
    { hash: '9566c9dbcc437ab6efdb0a9932de989ec505897e', message: 'new adjustment for database and grading system functionalitites' },
    { hash: 'da9a92f44899f4f420104f201dc90efc7859a694', message: 'fix nav bars' },
    { hash: '71c3dc9964af25f1a8ca3158cebf243e2eda69ce', message: 'few adjustments' },
    { hash: 'ecd8727de3e5e566e88b059983a7007020576d92', message: 'usermanagement fix, polishing the public view' },
    { hash: '41397a76ccd9d6949cad0dbe5732d6b6fd4891dc', message: 'photo fix' },
    { hash: '849c6aa6690231b3377cf47a65467185be846ae5', message: 'iimage added on students uplaoding functioning' },
    { hash: '434ce7e25ba1a8e4d82b8a8fd2dc67a793c25ffa', message: 'photo added' },
    { hash: 'b88848174f132000a824e649c713e8866793ace0', message: 'fixed the other UI, and add photo storage' },
    { hash: '1c8ae1775d4ef7a4f4eb9ebd3f8854a3160171e4', message: 'table view enrolled fixed' }
];

console.log('🔧 CRMS Version Restorer');
console.log('========================\n');

console.log('Available versions to restore:');
commits.forEach((commit, index) => {
    console.log(`${index + 1}. ${commit.hash.substring(0, 8)} - ${commit.message}`);
});

console.log('\nTo restore a version:');
console.log('1. Choose a number from the list above');
console.log('2. Run: node restore-version.js <number>');
console.log('3. Or run: node restore-version.js <commit-hash>');

// If a version number or hash is provided
if (process.argv[2]) {
    const input = process.argv[2];
    let targetCommit;
    
    // Check if it's a number (1-10)
    const versionNumber = parseInt(input);
    if (versionNumber >= 1 && versionNumber <= commits.length) {
        targetCommit = commits[versionNumber - 1];
    } else {
        // Check if it's a commit hash
        targetCommit = commits.find(c => c.hash.startsWith(input));
    }
    
    if (targetCommit) {
        console.log(`\n🔄 Restoring to: ${targetCommit.message}`);
        console.log(`📝 Commit: ${targetCommit.hash}`);
        
        try {
            // Try to use Git if available
            execSync(`git reset --hard ${targetCommit.hash}`, { stdio: 'inherit' });
            console.log('✅ Version restored successfully!');
        } catch (error) {
            console.log('❌ Git command failed. You may need to:');
            console.log('1. Restart your terminal to get Git working');
            console.log('2. Or manually copy files from the commit');
            console.log(`3. Or use: git reset --hard ${targetCommit.hash}`);
        }
    } else {
        console.log('❌ Invalid version number or commit hash');
    }
} 
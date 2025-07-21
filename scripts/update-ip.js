const fs = require('fs');
const path = require('path');

// Script to manually update IP address in API configuration
async function updateIPAddress() {
  try {
    console.log('🔍 Getting current IP address...');
    
    // Get IP using ipconfig (Windows)
    const { exec } = require('child_process');
    
    exec('ipconfig | findstr "IPv4"', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error getting IP:', error);
        return;
      }
      
      // Parse the IP address from the output
      const ipMatch = stdout.match(/(\d+\.\d+\.\d+\.\d+)/);
      if (ipMatch) {
        const newIP = ipMatch[1];
        console.log('✅ Detected IP:', newIP);
        
        // Update the API configuration file
        updateAPIConfig(newIP);
      } else {
        console.log('❌ Could not detect IP address');
        console.log('📋 Output:', stdout);
      }
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

function updateAPIConfig(newIP) {
  try {
    const apiFilePath = path.join(__dirname, '..', 'utils', 'api.js');
    
    // Read the current file
    let content = fs.readFileSync(apiFilePath, 'utf8');
    
    // Update the IP address in the getLocalIP function
    const ipRegex = /return '(\d+\.\d+\.\d+\.\d+)';/;
    const newContent = content.replace(ipRegex, `return '${newIP}';`);
    
    // Write the updated content back
    fs.writeFileSync(apiFilePath, newContent, 'utf8');
    
    console.log('✅ Updated API configuration with new IP:', newIP);
    console.log('📁 File updated:', apiFilePath);
    console.log('🔄 Please restart your app to apply changes');
    
  } catch (error) {
    console.error('❌ Error updating API config:', error);
  }
}

// Run the script
if (require.main === module) {
  updateIPAddress();
}

module.exports = { updateIPAddress, updateAPIConfig }; 
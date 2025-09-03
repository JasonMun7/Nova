#!/usr/bin/env node

const { exec } = require("child_process");
const { promisify } = require("util");

const execAsync = promisify(exec);

async function getApplicationNames() {
  try {
    console.log("🔍 Discovering macOS Application Names...\n");

    // Get all .app files in /Applications
    const { stdout: appsList } = await execAsync(
      'ls /Applications | grep "\\.app$"'
    );
    const apps = appsList
      .trim()
      .split("\n")
      .filter((app) => app.length > 0);

    console.log("📱 Available Applications:");
    console.log("=".repeat(50));

    for (const app of apps) {
      const appName = app.replace(".app", "");
      const appPath = `/Applications/${app}`;

      try {
        // Try to get the bundle identifier
        const { stdout: bundleId } = await execAsync(
          `osascript -e 'tell application "${appName}" to get id' 2>/dev/null || echo "N/A"`
        );

        // Try to get the actual name that AppleScript recognizes
        const { stdout: actualName } = await execAsync(
          `osascript -e 'tell application "${appName}" to get name' 2>/dev/null || echo "${appName}"`
        );

        console.log(`📦 ${appName}`);
        console.log(`   Path: ${appPath}`);
        console.log(`   AppleScript Name: ${actualName.trim()}`);
        console.log(`   Bundle ID: ${bundleId.trim()}`);
        console.log("");
      } catch (error) {
        console.log(`📦 ${appName} (Bundle ID not accessible)`);
        console.log(`   Path: ${appPath}`);
        console.log("");
      }
    }

    console.log("\n💡 Common Application Names for Nova:");
    console.log("=".repeat(50));
    console.log('• "Google Chrome" (not "Chrome")');
    console.log('• "Visual Studio Code" or "VS Code"');
    console.log('• "IntelliJ IDEA CE"');
    console.log('• "iTerm2" or "iTerm"');
    console.log('• "Cursor"');
    console.log('• "Figma"');
    console.log('• "Discord"');
    console.log('• "Slack"');
    console.log('• "Spotify"');
    console.log('• "Safari"');
    console.log('• "Terminal"');
    console.log('• "Finder"');

    console.log("\n🧪 Testing Common Commands:");
    console.log("=".repeat(50));

    const testApps = ["Google Chrome", "Safari", "Terminal", "Finder"];

    for (const app of testApps) {
      try {
        await execAsync(`osascript -e 'tell application "${app}" to get name'`);
        console.log(`✅ "${app}" - Works!`);
      } catch (error) {
        console.log(`❌ "${app}" - Failed: ${error.message.split("\n")[0]}`);
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// Run the script
getApplicationNames();

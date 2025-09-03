import { exec } from "child_process";
import { promisify } from "util";
import { AppConfig, Action, SystemInfo, AppInfo } from "../../types/types";

const execAsync = promisify(exec);

export class AutomationService {
  private runningApps: Map<string, number> = new Map();

  async getSystemInfo(): Promise<SystemInfo> {
    const platform = process.platform;
    const architecture = process.arch;

    const [availableApps, runningApps, browserTabs] = await Promise.all([
      this.getAvailableApps(),
      this.getRunningApps(),
      this.getBrowserTabs(),
    ]);

    return {
      platform,
      architecture,
      availableApps,
      runningApps,
      browserTabs,
    };
  }

  // Method to get all available applications with their correct names
  async getAllApplications(): Promise<
    Array<{ name: string; bundleId: string; path: string }>
  > {
    try {
      const { stdout: appsList } = await execAsync(
        'ls /Applications | grep "\\.app$"'
      );
      const apps = appsList
        .trim()
        .split("\n")
        .filter((app) => app.length > 0);

      const applications = [];

      for (const app of apps) {
        const appName = app.replace(".app", "");
        const appPath = `/Applications/${app}`;

        try {
          // Get bundle ID
          const { stdout: bundleId } = await execAsync(
            `osascript -e 'tell application "${appName}" to get id' 2>/dev/null || echo "N/A"`
          );

          applications.push({
            name: appName,
            bundleId: bundleId.trim(),
            path: appPath,
          });
        } catch (error) {
          applications.push({
            name: appName,
            bundleId: "N/A",
            path: appPath,
          });
        }
      }

      return applications;
    } catch (error) {
      console.error("Failed to get all applications:", error);
      return [];
    }
  }

  async executeAction(action: Action): Promise<boolean> {
    try {
      console.log(`Executing action: ${action.type} on ${action.target}`);

      switch (action.type) {
        case "launch":
          return await this.launchApp(action.target, action.params);
        case "open":
          return await this.openInApp(action.target, action.params);
        case "close":
          return await this.closeApp(action.target);
        case "arrange":
          return await this.arrangeWindows(action.params);
        case "focus":
          return await this.focusApp(action.target);
        case "set_dnd":
          return await this.setDoNotDisturb(action.params?.enabled);
        case "browser_tab":
          return await this.manageBrowserTab(action.target, action.params);
        default:
          console.warn(`Unknown action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error(`Failed to execute action ${action.type}:`, error);
      return false;
    }
  }

  private async launchApp(
    appName: string,
    params?: Record<string, any>
  ): Promise<boolean> {
    try {
      // Get the correct application name for macOS
      const correctAppName = await this.getCorrectAppName(appName);
      console.log(`Launching app: ${appName} -> ${correctAppName}`);

      const bundleId = this.getBundleId(correctAppName);
      let command: string;

      if (bundleId) {
        command = `open -b "${bundleId}"`;
      } else {
        command = `open -a "${correctAppName}"`;
      }

      // Add additional parameters
      if (params?.urls && Array.isArray(params.urls)) {
        // For browser apps, open URLs
        for (const url of params.urls) {
          await execAsync(`open -a "${correctAppName}" "${url}"`);
        }
        return true;
      } else if (params?.folder) {
        // For file manager apps, open folder
        command += ` "${params.folder}"`;
      } else if (params?.file) {
        // For editor apps, open file
        command += ` "${params.file}"`;
      }

      await execAsync(command);
      return true;
    } catch (error) {
      console.error(`Failed to launch ${appName}:`, error);
      return false;
    }
  }

  private async openInApp(
    target: string,
    params?: Record<string, any>
  ): Promise<boolean> {
    try {
      const correctAppName = await this.getCorrectAppName(target);

      if (params?.url) {
        await execAsync(`open -a "${correctAppName}" "${params.url}"`);
      } else if (params?.file) {
        await execAsync(`open -a "${correctAppName}" "${params.file}"`);
      } else {
        return false;
      }
      return true;
    } catch (error) {
      console.error(`Failed to open in ${target}:`, error);
      return false;
    }
  }

  private async closeApp(appName: string): Promise<boolean> {
    try {
      const correctAppName = await this.getCorrectAppName(appName);
      const bundleId = this.getBundleId(correctAppName);

      if (bundleId) {
        await execAsync(
          `osascript -e 'tell application id "${bundleId}" to quit'`
        );
      } else {
        await execAsync(
          `osascript -e 'tell application "${correctAppName}" to quit'`
        );
      }
      return true;
    } catch (error) {
      console.error(`Failed to close ${appName}:`, error);
      return false;
    }
  }

  private async arrangeWindows(params?: Record<string, any>): Promise<boolean> {
    try {
      // This is a simplified window arrangement
      // In a full implementation, you'd use tools like yabai or AppleScript
      console.log("Window arrangement requested:", params);

      if (params?.layout === "side-by-side") {
        // Use AppleScript to arrange windows side by side
        const script = `
          tell application "System Events"
            set frontApp to first application process whose frontmost is true
            set frontWindow to first window of frontApp
            set bounds of frontWindow to {0, 0, 960, 1080}
          end tell
        `;
        await execAsync(`osascript -e '${script}'`);
      }

      return true;
    } catch (error) {
      console.error("Failed to arrange windows:", error);
      return false;
    }
  }

  private async focusApp(appName: string): Promise<boolean> {
    try {
      const correctAppName = await this.getCorrectAppName(appName);
      const bundleId = this.getBundleId(correctAppName);

      if (bundleId) {
        await execAsync(
          `osascript -e 'tell application id "${bundleId}" to activate'`
        );
      } else {
        await execAsync(
          `osascript -e 'tell application "${correctAppName}" to activate'`
        );
      }
      return true;
    } catch (error) {
      console.error(`Failed to focus ${appName}:`, error);
      return false;
    }
  }

  private async setDoNotDisturb(enabled?: boolean): Promise<boolean> {
    try {
      const state = enabled ? "on" : "off";
      await execAsync(
        `osascript -e 'tell application "System Events" to set do not disturb to ${state}'`
      );
      return true;
    } catch (error) {
      console.error("Failed to set Do Not Disturb:", error);
      return false;
    }
  }

  private async manageBrowserTab(
    action: string,
    params?: Record<string, any>
  ): Promise<boolean> {
    try {
      // This would integrate with Chrome DevTools Protocol
      // For now, we'll use basic URL opening
      if (params?.url) {
        await execAsync(`open "${params.url}"`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to manage browser tab:", error);
      return false;
    }
  }

  private async getAvailableApps(): Promise<AppInfo[]> {
    try {
      const { stdout } = await execAsync(
        'ls /Applications | grep ".app" | sed "s/.app$//"'
      );
      const appNames = stdout
        .trim()
        .split("\n")
        .filter((name) => name.length > 0);

      return appNames.map((name) => ({
        name,
        isRunning: false,
      }));
    } catch (error) {
      console.error("Failed to get available apps:", error);
      return [];
    }
  }

  private async getRunningApps(): Promise<AppInfo[]> {
    try {
      const { stdout } = await execAsync(
        "ps aux | grep -E \"\\.app/\" | grep -v grep | awk '{print $11}' | sort | uniq"
      );
      const runningApps = stdout
        .trim()
        .split("\n")
        .filter((app) => app.length > 0);

      return runningApps.map((app) => ({
        name: app.split("/").pop()?.replace(".app", "") || app,
        path: app,
        isRunning: true,
      }));
    } catch (error) {
      console.error("Failed to get running apps:", error);
      return [];
    }
  }

  private async getBrowserTabs(): Promise<any[]> {
    // This would integrate with Chrome DevTools Protocol
    // For now, return empty array
    return [];
  }

  private getBundleId(appName: string): string | null {
    const bundleIds: Record<string, string> = {
      "Google Chrome": "com.google.Chrome",
      Chrome: "com.google.Chrome", // Alias for convenience
      Safari: "com.apple.Safari",
      Firefox: "org.mozilla.firefox",
      "VS Code": "com.microsoft.VSCode",
      "Visual Studio Code": "com.microsoft.VSCode", // Alias
      Terminal: "com.apple.Terminal",
      Finder: "com.apple.finder",
      Slack: "com.tinyspeck.slackmacgap",
      Discord: "com.hnc.Discord",
      Spotify: "com.spotify.client",
      iTerm: "com.googlecode.iterm2",
      iTerm2: "com.googlecode.iterm2", // Alias
      Cursor: "com.todesktop.230313mzl4w4u92", // Cursor IDE
      "IntelliJ IDEA CE": "com.jetbrains.intellij.ce",
      Figma: "com.figma.Desktop",
      Docker: "com.docker.docker",
      Obsidian: "md.obsidian",
    };

    return bundleIds[appName] || null;
  }

  // Utility method to get the correct application name for macOS
  async getCorrectAppName(appName: string): Promise<string> {
    try {
      // First, try to get the bundle ID
      const bundleId = this.getBundleId(appName);
      if (bundleId) {
        // Try to get the actual app name from the bundle
        const { stdout } = await execAsync(
          `osascript -e 'tell application id "${bundleId}" to get name'`
        );
        return stdout.trim().replace(/"/g, "");
      }

      // If no bundle ID, try common variations
      const variations = [
        appName,
        `Google ${appName}`, // For Chrome
        `${appName}.app`,
        appName.replace(/\.app$/, ""),
      ];

      for (const variation of variations) {
        try {
          await execAsync(
            `osascript -e 'tell application "${variation}" to get name'`
          );
          return variation;
        } catch {
          // Continue to next variation
        }
      }

      return appName; // Return original if nothing works
    } catch (error) {
      console.error(`Failed to get correct app name for ${appName}:`, error);
      return appName;
    }
  }
}

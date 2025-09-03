import path from "path";
import { app, ipcMain } from "electron";
import serve from "electron-serve";
import { createWindow } from "./helpers";
import { OllamaClient } from "./services/ollama";
import { AutomationService } from "./services/automation";
import { WorkspaceService } from "./services/workspace";
import { Command, Action } from "../types/types";

const isProd = process.env.NODE_ENV === "production";

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

// Initialize services
const ollama = new OllamaClient();
const automation = new AutomationService();
const workspaceService = new WorkspaceService();

(async () => {
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  if (isProd) {
    await mainWindow.loadURL("app://./home");
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/home`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on("window-all-closed", () => {
  app.quit();
});

// IPC Handlers
ipcMain.handle("process-command", async (event, commandText: string) => {
  try {
    const systemInfo = await automation.getSystemInfo();
    const availableApps = systemInfo.availableApps.map((app) => app.name);

    const systemContext = `
Platform: ${systemInfo.platform}
Architecture: ${systemInfo.architecture}
Running Apps: ${systemInfo.runningApps.map((app) => app.name).join(", ")}
Available Apps: ${availableApps.join(", ")}
    `.trim();

    const actions = await ollama.processCommand(
      commandText,
      systemContext,
      availableApps
    );

    // Execute actions
    const results = [];
    for (const action of actions) {
      const success = await automation.executeAction(action);
      results.push({ action, success });
    }

    return {
      success: true,
      actions,
      results,
    };
  } catch (error) {
    console.error("Command processing failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

ipcMain.handle("get-system-info", async () => {
  return await automation.getSystemInfo();
});

ipcMain.handle("get-all-applications", async () => {
  return await automation.getAllApplications();
});

ipcMain.handle("test-ollama", async () => {
  return await ollama.testConnection();
});

ipcMain.handle("get-workspaces", async () => {
  return await workspaceService.getAllWorkspaces();
});

ipcMain.handle(
  "create-workspace",
  async (event, name: string, description?: string) => {
    return await workspaceService.createWorkspace(name, description);
  }
);

ipcMain.handle(
  "save-workspace",
  async (event, workspaceId: string, updates: any) => {
    return await workspaceService.updateWorkspace(workspaceId, updates);
  }
);

ipcMain.handle("delete-workspace", async (event, workspaceId: string) => {
  return await workspaceService.deleteWorkspace(workspaceId);
});

ipcMain.handle("get-settings", async () => {
  return await workspaceService.getSettings();
});

ipcMain.handle("update-settings", async (event, settings: any) => {
  return await workspaceService.updateSettings(settings);
});

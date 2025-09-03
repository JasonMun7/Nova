import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import path from "path";
import {
  Workspace,
  AppConfig,
  BrowserTab,
  WindowLayout,
} from "../../types/types";

interface DatabaseSchema {
  workspaces: Workspace[];
  settings: {
    defaultWorkspacePath: string;
    ollamaUrl: string;
    ollamaModel: string;
  };
}

export class WorkspaceService {
  private db: Low<DatabaseSchema>;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(process.cwd(), "data", "workspaces.json");
    this.initializeDatabase();
  }

  private async initializeDatabase(): Promise<void> {
    const adapter = new JSONFile<DatabaseSchema>(this.dbPath);
    this.db = new Low(adapter, {
      workspaces: [],
      settings: {
        defaultWorkspacePath: path.join(process.cwd(), "workspaces"),
        ollamaUrl: "http://localhost:11434",
        ollamaModel: "llama3.2:latest",
      },
    });

    await this.db.read();
  }

  async createWorkspace(
    name: string,
    description?: string,
    apps?: AppConfig[],
    browserTabs?: BrowserTab[],
    layout?: WindowLayout
  ): Promise<Workspace> {
    const workspace: Workspace = {
      id: this.generateId(),
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      apps: apps || [],
      browserTabs: browserTabs || [],
      layout: layout || { type: "side-by-side" },
      settings: {
        enableDND: false,
        focusMode: false,
        closeOtherApps: false,
        restoreBrowserState: true,
      },
    };

    this.db.data.workspaces.push(workspace);
    await this.db.write();

    return workspace;
  }

  async getWorkspace(id: string): Promise<Workspace | null> {
    await this.db.read();
    return this.db.data.workspaces.find((w) => w.id === id) || null;
  }

  async getAllWorkspaces(): Promise<Workspace[]> {
    await this.db.read();
    return this.db.data.workspaces;
  }

  async updateWorkspace(
    id: string,
    updates: Partial<Workspace>
  ): Promise<Workspace | null> {
    await this.db.read();

    const workspaceIndex = this.db.data.workspaces.findIndex(
      (w) => w.id === id
    );
    if (workspaceIndex === -1) {
      return null;
    }

    const workspace = this.db.data.workspaces[workspaceIndex];
    const updatedWorkspace = {
      ...workspace,
      ...updates,
      updatedAt: new Date(),
    };

    this.db.data.workspaces[workspaceIndex] = updatedWorkspace;
    await this.db.write();

    return updatedWorkspace;
  }

  async deleteWorkspace(id: string): Promise<boolean> {
    await this.db.read();

    const initialLength = this.db.data.workspaces.length;
    this.db.data.workspaces = this.db.data.workspaces.filter(
      (w) => w.id !== id
    );

    if (this.db.data.workspaces.length < initialLength) {
      await this.db.write();
      return true;
    }

    return false;
  }

  async saveCurrentStateAsWorkspace(
    name: string,
    description?: string
  ): Promise<Workspace | null> {
    try {
      // This would capture the current system state
      // For now, we'll create a basic workspace
      const workspace = await this.createWorkspace(name, description);
      return workspace;
    } catch (error) {
      console.error("Failed to save current state as workspace:", error);
      return null;
    }
  }

  async exportWorkspace(id: string): Promise<string | null> {
    const workspace = await this.getWorkspace(id);
    if (!workspace) {
      return null;
    }

    return JSON.stringify(workspace, null, 2);
  }

  async importWorkspace(workspaceData: string): Promise<Workspace | null> {
    try {
      const workspace = JSON.parse(workspaceData) as Workspace;

      // Validate workspace structure
      if (!workspace.name || !workspace.id) {
        throw new Error("Invalid workspace data");
      }

      // Generate new ID to avoid conflicts
      workspace.id = this.generateId();
      workspace.createdAt = new Date();
      workspace.updatedAt = new Date();

      this.db.data.workspaces.push(workspace);
      await this.db.write();

      return workspace;
    } catch (error) {
      console.error("Failed to import workspace:", error);
      return null;
    }
  }

  async getSettings(): Promise<DatabaseSchema["settings"]> {
    await this.db.read();
    return this.db.data.settings;
  }

  async updateSettings(
    settings: Partial<DatabaseSchema["settings"]>
  ): Promise<void> {
    await this.db.read();
    this.db.data.settings = { ...this.db.data.settings, ...settings };
    await this.db.write();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Workspace templates
  async createTemplate(
    name: string,
    apps: AppConfig[],
    browserTabs: BrowserTab[],
    layout: WindowLayout
  ): Promise<Workspace> {
    return this.createWorkspace(
      `${name} Template`,
      `Template for ${name} workspace`,
      apps,
      browserTabs,
      layout
    );
  }

  // Common workspace templates
  async createDevelopmentWorkspace(): Promise<Workspace> {
    return this.createTemplate(
      "Development",
      [
        { name: "VS Code", focus: true },
        {
          name: "Terminal",
          position: { x: 0, y: 0 },
          size: { width: 800, height: 600 },
        },
        { name: "Chrome" },
      ],
      [
        { url: "https://github.com", active: true },
        { url: "https://stackoverflow.com" },
        { url: "https://developer.mozilla.org" },
      ],
      { type: "side-by-side" }
    );
  }

  async createInterviewWorkspace(): Promise<Workspace> {
    return this.createTemplate(
      "Interview",
      [
        { name: "Chrome", focus: true },
        {
          name: "VS Code",
          position: { x: 960, y: 0 },
          size: { width: 960, height: 1080 },
        },
      ],
      [
        { url: "https://leetcode.com", active: true },
        { url: "https://docs.google.com" },
      ],
      { type: "side-by-side" }
    );
  }
}

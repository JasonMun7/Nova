import { contextBridge, ipcRenderer, IpcRendererEvent } from "electron";

const handler = {
  send(channel: string, value: unknown) {
    ipcRenderer.send(channel, value);
  },
  on(channel: string, callback: (...args: unknown[]) => void) {
    const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
      callback(...args);
    ipcRenderer.on(channel, subscription);

    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  // Nova-specific IPC methods
  async processCommand(commandText: string) {
    return await ipcRenderer.invoke("process-command", commandText);
  },
  async getSystemInfo() {
    return await ipcRenderer.invoke("get-system-info");
  },
  async getAllApplications() {
    return await ipcRenderer.invoke("get-all-applications");
  },
  async testOllama() {
    return await ipcRenderer.invoke("test-ollama");
  },
  async getWorkspaces() {
    return await ipcRenderer.invoke("get-workspaces");
  },
  async createWorkspace(name: string, description?: string) {
    return await ipcRenderer.invoke("create-workspace", name, description);
  },
  async saveWorkspace(workspaceId: string, updates: any) {
    return await ipcRenderer.invoke("save-workspace", workspaceId, updates);
  },
  async deleteWorkspace(workspaceId: string) {
    return await ipcRenderer.invoke("delete-workspace", workspaceId);
  },
  async getSettings() {
    return await ipcRenderer.invoke("get-settings");
  },
  async updateSettings(settings: any) {
    return await ipcRenderer.invoke("update-settings", settings);
  },
};

contextBridge.exposeInMainWorld("ipc", handler);

export type IpcHandler = typeof handler;

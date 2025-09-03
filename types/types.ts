export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  apps: AppConfig[];
  browserTabs: BrowserTab[];
  layout: WindowLayout;
  settings: WorkspaceSettings;
}

export interface AppConfig {
  name: string;
  bundleId?: string;
  path?: string;
  args?: string[];
  position?: WindowPosition;
  size?: WindowSize;
  focus?: boolean;
}

export interface BrowserTab {
  url: string;
  title?: string;
  active?: boolean;
  pinned?: boolean;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowLayout {
  type: "side-by-side" | "stacked" | "grid" | "custom";
  arrangement?: WindowArrangement[];
}

export interface WindowArrangement {
  appName: string;
  position: WindowPosition;
  size: WindowSize;
  zIndex?: number;
}

export interface WorkspaceSettings {
  enableDND?: boolean;
  focusMode?: boolean;
  closeOtherApps?: boolean;
  restoreBrowserState?: boolean;
}

export interface Command {
  id: string;
  text: string;
  timestamp: Date;
  status: "pending" | "processing" | "completed" | "failed";
  result?: CommandResult;
}

export interface CommandResult {
  actions: Action[];
  success: boolean;
  message?: string;
  error?: string;
}

export interface Action {
  type:
    | "launch"
    | "open"
    | "close"
    | "arrange"
    | "focus"
    | "set_dnd"
    | "browser_tab";
  target: string;
  params?: Record<string, any>;
  delay?: number;
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    repeat_penalty?: number;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export interface SystemInfo {
  platform: string;
  architecture: string;
  availableApps: AppInfo[];
  runningApps: AppInfo[];
  browserTabs: BrowserTab[];
}

export interface AppInfo {
  name: string;
  bundleId?: string;
  path?: string;
  isRunning: boolean;
  pid?: number;
}

export interface UIState {
  currentWorkspace?: Workspace;
  commandHistory: Command[];
  isProcessing: boolean;
  systemInfo: SystemInfo;
  settings: AppSettings;
}

export interface AppSettings {
  ollamaUrl: string;
  ollamaModel: string;
  enableVoice: boolean;
  enableTTS: boolean;
  defaultWorkspacePath: string;
}

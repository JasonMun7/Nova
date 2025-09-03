import axios, { AxiosInstance } from "axios";
import { Action, OllamaRequest, OllamaResponse } from "../../types/types";

export class OllamaClient {
  private client: AxiosInstance;
  private model: string;

  constructor(
    baseUrl: string = "http://localhost:11434",
    model: string = "llama3.2:latest"
  ) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 60000,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.model = model;
  }

  async processCommand(
    userCommand: string,
    systemContext: string,
    availableApps: string[],
    currentWorkspace?: string
  ): Promise<Action[]> {
    const systemPrompt = this.buildSystemPrompt(
      systemContext,
      availableApps,
      currentWorkspace
    );

    const request: OllamaRequest = {
      model: this.model,
      prompt: `${systemPrompt}\n\nUser Command: ${userCommand}`,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        top_k: 40,
        repeat_penalty: 1.1,
      },
    };

    try {
      const response = await this.client.post<OllamaResponse>(
        "/api/generate",
        request
      );

      if (!response.data.response) {
        throw new Error("No response from Ollama");
      }

      return this.parseActions(response.data.response);
    } catch (error) {
      console.error("Ollama API error:", error);
      throw new Error(
        `Failed to process command: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private buildSystemPrompt(
    systemContext: string,
    availableApps: string[],
    currentWorkspace?: string
  ): string {
    return `You are Nova, an AI assistant that helps users manage their workspace by automating applications, browser tabs, and system settings.

CONTEXT:
${systemContext}

AVAILABLE APPLICATIONS:
${availableApps.join(", ")}

${currentWorkspace ? `CURRENT WORKSPACE: ${currentWorkspace}` : ""}

INSTRUCTIONS:
1. Parse the user's command and understand their intent
2. Generate a JSON array of actions to execute
3. Each action should have: type, target, and optional params
4. Supported action types:
   - "launch": Launch an application
   - "open": Open a file or URL in an app
   - "close": Close an application
   - "arrange": Arrange windows in a specific layout
   - "focus": Focus on a specific application
   - "set_dnd": Enable/disable Do Not Disturb
   - "browser_tab": Open/close browser tabs

RESPONSE FORMAT:
Return ONLY a valid JSON array of actions. Example:
[
  {"type": "launch", "target": "Chrome", "params": {"urls": ["https://example.com"]}},
  {"type": "launch", "target": "VS Code", "params": {"folder": "/path/to/project"}},
  {"type": "set_dnd", "target": "system", "params": {"enabled": true}}
]

Be precise and only include necessary actions.`;
  }

  private parseActions(content: string): Action[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("No JSON array found in response");
      }

      const actions = JSON.parse(jsonMatch[0]);

      // Validate actions structure
      if (!Array.isArray(actions)) {
        throw new Error("Response is not an array");
      }

      return actions.map((action, index) => {
        if (!action.type || !action.target) {
          throw new Error(
            `Invalid action at index ${index}: missing type or target`
          );
        }
        return action as Action;
      });
    } catch (error) {
      console.error("Failed to parse actions:", error);
      console.error("Raw content:", content);
      throw new Error(
        `Failed to parse AI response: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get("/api/tags");
      return response.status === 200;
    } catch (error) {
      console.error("Ollama connection test failed:", error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get("/api/tags");
      if (response.data.models) {
        return response.data.models.map((model: any) => model.name);
      }
      return [];
    } catch (error) {
      console.error("Failed to get available models:", error);
      return [];
    }
  }

  updateModel(model: string): void {
    this.model = model;
  }

  updateBaseUrl(baseUrl: string): void {
    this.client.defaults.baseURL = baseUrl;
  }
}

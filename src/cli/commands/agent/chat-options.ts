// src/cli/commands/agent/chat-options.ts
export interface ChatCommandOptions {
  model?: string;
  system?: string;
  temp?: number;
  noHistory?: boolean;
}

export interface Config {
  apiKey: string | null;
  defaultProfile: string;
  profiles: Record<string, Profile>;
  lastUsed: string;
}

export interface Profile {
  models: string[];
  temperature: number;
  maxTokens: number;
}

export interface Model {
  id: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: number;
    completion?: number;
  };
  top_provider?: string;
  created?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  name?: string;
}

export interface ChatOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
}

export interface ModelResponse {
  model: string;
  content?: string;
  error?: string;
}
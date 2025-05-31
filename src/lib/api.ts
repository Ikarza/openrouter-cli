import { delay } from './utils.js';
import chalk from 'chalk';
import type { Model, ChatMessage, ChatOptions, StreamChunk } from '../types/index.js';

const API_BASE_URL = 'https://openrouter.ai/api/v1';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export class OpenRouterClient {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/openrouter-cli',
      'X-Title': 'OpenRouter CLI',
      ...options.headers
    };

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delayMs = retryAfter ? parseInt(retryAfter) * 1000 : INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.log(chalk.yellow(`Rate limited. Retrying in ${delayMs / 1000} seconds...`));
          await delay(delayMs);
          continue;
        }

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`API Error (${response.status}): ${error}`);
        }

        return await response.json() as T;
      } catch (error) {
        lastError = error as Error;
        if (attempt < MAX_RETRIES - 1) {
          const delayMs = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.log(chalk.yellow(`Request failed. Retrying in ${delayMs / 1000} seconds...`));
          await delay(delayMs);
        }
      }
    }

    throw lastError || new Error('Request failed after maximum retries');
  }

  async getModels(): Promise<Model[]> {
    try {
      const response = await this.makeRequest<{ data: Model[] }>('/models');
      return response.data || [];
    } catch (error) {
      console.error(chalk.red('Failed to fetch models:', (error as Error).message));
      return [];
    }
  }

  async chat(messages: ChatMessage[], model: string, options: ChatOptions = {}): Promise<string> {
    const body = {
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
      stream: false
    };

    const response = await this.makeRequest<{
      choices: Array<{
        message: {
          content: string;
        };
      }>;
    }>('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    return response.choices[0]?.message?.content || '';
  }

  async *streamChat(
    messages: ChatMessage[], 
    model: string, 
    options: ChatOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const url = `${API_BASE_URL}/chat/completions`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/openrouter-cli',
      'X-Title': 'OpenRouter CLI'
    };

    const body = JSON.stringify({
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
      stream: true
    });

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith(': ')) continue; // Skip comments
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') return;
            
            try {
              const chunk = JSON.parse(data) as StreamChunk;
              if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta) {
                const content = chunk.choices[0].delta.content;
                if (content) {
                  yield content;
                }
              }
            } catch (e) {
              // Skip invalid JSON
              console.error('Failed to parse SSE chunk:', e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const models = await this.getModels();
      return models.length > 0;
    } catch (error) {
      return false;
    }
  }
}

export default OpenRouterClient;
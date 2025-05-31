import { delay } from './utils.js';
import chalk from 'chalk';

const API_BASE_URL = 'https://openrouter.ai/api/v1';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

export class OpenRouterClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/openrouter-cli',
      'X-Title': 'OpenRouter CLI',
      ...options.headers
    };

    let lastError;
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

        return await response.json();
      } catch (error) {
        lastError = error;
        if (attempt < MAX_RETRIES - 1) {
          const delayMs = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.log(chalk.yellow(`Request failed. Retrying in ${delayMs / 1000} seconds...`));
          await delay(delayMs);
        }
      }
    }

    throw lastError || new Error('Request failed after maximum retries');
  }

  async getModels() {
    try {
      const response = await this.makeRequest('/models');
      return response.data || [];
    } catch (error) {
      console.error(chalk.red('Failed to fetch models:', error.message));
      return [];
    }
  }

  async chat(messages, model, options = {}) {
    const body = {
      model,
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
      stream: options.stream || false
    };

    if (options.stream) {
      return this.streamChat(body);
    }

    const response = await this.makeRequest('/chat/completions', {
      method: 'POST',
      body: JSON.stringify(body)
    });

    return response.choices[0].message.content;
  }

  async streamChat(body) {
    const url = `${API_BASE_URL}/chat/completions`;
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://github.com/openrouter-cli',
      'X-Title': 'OpenRouter CLI'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, stream: true })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    return response.body;
  }

  async validateApiKey() {
    try {
      const models = await this.getModels();
      return models.length > 0;
    } catch (error) {
      return false;
    }
  }
}

export default OpenRouterClient;
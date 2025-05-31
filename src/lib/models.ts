import OpenRouterClient from './api.js';
import chalk from 'chalk';
import ora from 'ora';
import { truncateText } from './utils.js';
import type { Model } from '../types/index.js';

export class ModelManager {
  private client: OpenRouterClient;
  private models: Model[] = [];
  private lastFetch: number | null = null;
  private readonly cacheTimeout = 300000; // 5 minutes

  constructor(apiKey: string) {
    this.client = new OpenRouterClient(apiKey);
  }

  async fetchModels(force: boolean = false): Promise<Model[]> {
    if (!force && this.lastFetch && Date.now() - this.lastFetch < this.cacheTimeout) {
      return this.models;
    }

    const spinner = ora('Fetching available models...').start();
    
    try {
      this.models = await this.client.getModels();
      this.lastFetch = Date.now();
      spinner.succeed('Models fetched successfully');
      return this.models;
    } catch (error) {
      spinner.fail('Failed to fetch models');
      throw error;
    }
  }

  async listModels(options: { filter?: string; force?: boolean } = {}): Promise<Model[]> {
    const models = await this.fetchModels(options.force);
    
    if (options.filter) {
      const filterLower = options.filter.toLowerCase();
      return models.filter(model => 
        model.id.toLowerCase().includes(filterLower) ||
        (model.name && model.name.toLowerCase().includes(filterLower))
      );
    }
    
    return models;
  }

  async searchModels(query: string): Promise<Model[]> {
    const models = await this.fetchModels();
    const queryLower = query.toLowerCase();
    
    return models.filter(model => {
      const idMatch = model.id.toLowerCase().includes(queryLower);
      const nameMatch = model.name && model.name.toLowerCase().includes(queryLower);
      const descMatch = model.description && model.description.toLowerCase().includes(queryLower);
      
      return idMatch || nameMatch || descMatch;
    });
  }

  async getModelInfo(modelId: string): Promise<Model | undefined> {
    const models = await this.fetchModels();
    return models.find(model => model.id === modelId);
  }

  formatModelList(models: Model[], verbose: boolean = false): string {
    if (models.length === 0) {
      return chalk.yellow('No models found');
    }

    // Sort models: free models first, then by ID
    const sortedModels = [...models].sort((a, b) => {
      const aIsFree = this.isFreeModel(a);
      const bIsFree = this.isFreeModel(b);
      
      if (aIsFree && !bIsFree) return -1;
      if (!aIsFree && bIsFree) return 1;
      return a.id.localeCompare(b.id);
    });

    const output: string[] = [];
    
    for (const model of sortedModels) {
      const pricing = this.formatPricing(model.pricing);
      const context = model.context_length ? `Context: ${model.context_length.toLocaleString()}` : '';
      const isFree = this.isFreeModel(model);
      
      let line = chalk.cyan(model.id);
      
      if (isFree) {
        line += chalk.green(' (free)');
      }
      
      if (model.name && model.name !== model.id) {
        line += chalk.gray(` (${model.name})`);
      }
      
      if (verbose) {
        const details: string[] = [];
        if (context) details.push(context);
        if (!isFree && pricing) details.push(pricing);
        if (model.description) {
          details.push(chalk.gray(truncateText(model.description, 60)));
        }
        
        if (details.length > 0) {
          line += '\n  ' + details.join(' | ');
        }
      } else {
        const details: string[] = [];
        if (context) details.push(context);
        if (!isFree && pricing) details.push(pricing);
        
        if (details.length > 0) {
          line += chalk.gray(' - ' + details.join(' | '));
        }
      }
      
      output.push(line);
    }
    
    return output.join('\n');
  }

  private isFreeModel(model: Model): boolean {
    if (!model.pricing) return true;
    return model.pricing.prompt === 0 && model.pricing.completion === 0;
  }

  private formatPricing(pricing?: { prompt?: number; completion?: number }): string | null {
    if (!pricing) return null;
    
    const prompt = pricing.prompt ? `$${pricing.prompt}/1K` : null;
    const completion = pricing.completion ? `$${pricing.completion}/1K` : null;
    
    if (prompt && completion) {
      return `Pricing: ${prompt} prompt, ${completion} completion`;
    } else if (prompt) {
      return `Pricing: ${prompt}`;
    }
    
    return null;
  }

  async getModelsByOrganization(): Promise<Map<string, Model[]>> {
    const models = await this.fetchModels();
    const grouped = new Map<string, Model[]>();
    
    for (const model of models) {
      const org = this.extractOrganization(model.id);
      if (!grouped.has(org)) {
        grouped.set(org, []);
      }
      grouped.get(org)!.push(model);
    }
    
    // Sort models within each organization
    for (const [org, orgModels] of grouped) {
      grouped.set(org, orgModels.sort((a, b) => {
        const aIsFree = this.isFreeModel(a);
        const bIsFree = this.isFreeModel(b);
        
        if (aIsFree && !bIsFree) return -1;
        if (!aIsFree && bIsFree) return 1;
        return a.id.localeCompare(b.id);
      }));
    }
    
    return grouped;
  }

  extractOrganization(modelId: string): string {
    const parts = modelId.split('/');
    return parts.length > 1 && parts[0] ? parts[0] : 'other';
  }

  async getOrganizations(): Promise<string[]> {
    const grouped = await this.getModelsByOrganization();
    return Array.from(grouped.keys()).sort();
  }

  formatModelInfo(model: Model | undefined): string {
    if (!model) {
      return chalk.red('Model not found');
    }

    const lines: string[] = [];
    const isFree = this.isFreeModel(model);
    
    lines.push(chalk.bold.cyan(`Model: ${model.id}`) + (isFree ? chalk.green(' (free)') : ''));
    
    if (model.name && model.name !== model.id) {
      lines.push(`Name: ${model.name}`);
    }
    
    if (model.description) {
      lines.push(`Description: ${model.description}`);
    }
    
    if (model.context_length) {
      lines.push(`Context Length: ${model.context_length.toLocaleString()} tokens`);
    }
    
    if (model.pricing) {
      const pricing = this.formatPricing(model.pricing);
      if (pricing) {
        lines.push(pricing);
      }
    } else if (isFree) {
      lines.push(chalk.green('Pricing: Free'));
    }
    
    if (model.top_provider) {
      lines.push(`Provider: ${model.top_provider}`);
    }
    
    if (model.created) {
      const date = new Date(model.created * 1000).toLocaleDateString();
      lines.push(`Created: ${date}`);
    }
    
    return lines.join('\n');
  }
}

export default ModelManager;
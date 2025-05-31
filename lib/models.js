import OpenRouterClient from './api.js';
import chalk from 'chalk';
import ora from 'ora';
import { truncateText } from './utils.js';

export class ModelManager {
  constructor(apiKey) {
    this.client = new OpenRouterClient(apiKey);
    this.models = [];
    this.lastFetch = null;
    this.cacheTimeout = 300000; // 5 minutes
  }

  async fetchModels(force = false) {
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

  async listModels(options = {}) {
    const models = await this.fetchModels(options.force);
    
    if (options.filter) {
      const filtered = models.filter(model => 
        model.id.toLowerCase().includes(options.filter.toLowerCase()) ||
        (model.name && model.name.toLowerCase().includes(options.filter.toLowerCase()))
      );
      return filtered;
    }
    
    return models;
  }

  async searchModels(query) {
    const models = await this.fetchModels();
    const queryLower = query.toLowerCase();
    
    return models.filter(model => {
      const idMatch = model.id.toLowerCase().includes(queryLower);
      const nameMatch = model.name && model.name.toLowerCase().includes(queryLower);
      const descMatch = model.description && model.description.toLowerCase().includes(queryLower);
      
      return idMatch || nameMatch || descMatch;
    });
  }

  async getModelInfo(modelId) {
    const models = await this.fetchModels();
    return models.find(model => model.id === modelId);
  }

  formatModelList(models, verbose = false) {
    if (models.length === 0) {
      return chalk.yellow('No models found');
    }

    const output = [];
    
    for (const model of models) {
      const pricing = this.formatPricing(model.pricing);
      const context = model.context_length ? `Context: ${model.context_length.toLocaleString()}` : '';
      
      let line = chalk.cyan(model.id);
      
      if (model.name && model.name !== model.id) {
        line += chalk.gray(` (${model.name})`);
      }
      
      if (verbose) {
        const details = [];
        if (context) details.push(context);
        if (pricing) details.push(pricing);
        if (model.description) {
          details.push(chalk.gray(truncateText(model.description, 60)));
        }
        
        if (details.length > 0) {
          line += '\n  ' + details.join(' | ');
        }
      } else {
        const details = [];
        if (context) details.push(context);
        if (pricing) details.push(pricing);
        
        if (details.length > 0) {
          line += chalk.gray(' - ' + details.join(' | '));
        }
      }
      
      output.push(line);
    }
    
    return output.join('\n');
  }

  formatPricing(pricing) {
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

  formatModelInfo(model) {
    if (!model) {
      return chalk.red('Model not found');
    }

    const lines = [];
    
    lines.push(chalk.bold.cyan(`Model: ${model.id}`));
    
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
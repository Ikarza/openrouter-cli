import * as fs from 'fs/promises';
import * as path from 'path';
import { homedir } from 'os';
import chalk from 'chalk';

export interface Template {
  name: string;
  system?: string;
  prompt?: string;
  models?: string[];
  temperature?: number;
  maxTokens?: number;
  createdAt: Date;
  updatedAt: Date;
}

export class TemplateManager {
  private templatesDir: string;
  private templatesFile: string;

  constructor() {
    this.templatesDir = path.join(homedir(), '.openrouter-cli');
    this.templatesFile = path.join(this.templatesDir, 'templates.json');
  }

  private async ensureTemplatesFile(): Promise<void> {
    try {
      await fs.access(this.templatesFile);
    } catch {
      await fs.writeFile(this.templatesFile, JSON.stringify([], null, 2));
    }
  }

  async loadTemplates(): Promise<Template[]> {
    await this.ensureTemplatesFile();
    const data = await fs.readFile(this.templatesFile, 'utf-8');
    return JSON.parse(data);
  }

  async saveTemplates(templates: Template[]): Promise<void> {
    await fs.writeFile(this.templatesFile, JSON.stringify(templates, null, 2));
  }

  async create(template: Omit<Template, 'createdAt' | 'updatedAt'>): Promise<void> {
    const templates = await this.loadTemplates();
    
    if (templates.find(t => t.name === template.name)) {
      throw new Error(`Template '${template.name}' already exists`);
    }

    const newTemplate: Template = {
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    templates.push(newTemplate);
    await this.saveTemplates(templates);
    console.log(chalk.green(`✓ Template '${template.name}' created successfully`));
  }

  async get(name: string): Promise<Template | null> {
    const templates = await this.loadTemplates();
    return templates.find(t => t.name === name) || null;
  }

  async list(): Promise<Template[]> {
    return await this.loadTemplates();
  }

  async update(name: string, updates: Partial<Omit<Template, 'name' | 'createdAt' | 'updatedAt'>>): Promise<void> {
    const templates = await this.loadTemplates();
    const index = templates.findIndex(t => t.name === name);
    
    if (index === -1) {
      throw new Error(`Template '${name}' not found`);
    }

    const existingTemplate = templates[index];
    if (!existingTemplate) {
      throw new Error(`Template '${name}' not found`);
    }
    
    templates[index] = {
      ...existingTemplate,
      ...updates,
      name: existingTemplate.name,
      createdAt: existingTemplate.createdAt,
      updatedAt: new Date()
    };

    await this.saveTemplates(templates);
    console.log(chalk.green(`✓ Template '${name}' updated successfully`));
  }

  async delete(name: string): Promise<void> {
    const templates = await this.loadTemplates();
    const filtered = templates.filter(t => t.name !== name);
    
    if (filtered.length === templates.length) {
      throw new Error(`Template '${name}' not found`);
    }

    await this.saveTemplates(filtered);
    console.log(chalk.green(`✓ Template '${name}' deleted successfully`));
  }

  async applyTemplate(name: string, userPrompt?: string): Promise<{
    prompt: string;
    models?: string[];
    temperature?: number;
    maxTokens?: number;
  }> {
    const template = await this.get(name);
    
    if (!template) {
      throw new Error(`Template '${name}' not found`);
    }

    let finalPrompt = '';
    
    if (template.system) {
      finalPrompt = template.system + '\n\n';
    }
    
    if (template.prompt) {
      finalPrompt += template.prompt;
      if (userPrompt) {
        finalPrompt = finalPrompt.replace(/\{prompt\}/g, userPrompt);
      }
    } else if (userPrompt) {
      finalPrompt += userPrompt;
    }

    return {
      prompt: finalPrompt,
      models: template.models,
      temperature: template.temperature,
      maxTokens: template.maxTokens
    };
  }
}

export const templateManager = new TemplateManager();
import inquirer from 'inquirer';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import OpenRouterClient from './api.js';
import { formatStreamingBox } from './utils.js';
import profileManager from './profiles.js';
import configManager from './config.js';
import { ModelManager } from './models.js';
import type { ChatMessage, Profile, Model } from '../types/index.js';

export class ChatInterface {
  private client: OpenRouterClient;
  private conversation: ChatMessage[] = [];
  private activeModels: string[] = [];
  private currentProfile: Profile;
  private currentProfileName: string;
  private modelManager: ModelManager;

  constructor(apiKey: string) {
    this.client = new OpenRouterClient(apiKey);
    this.currentProfile = profileManager.getProfile();
    this.currentProfileName = 'default';
    this.modelManager = new ModelManager(apiKey);
  }

  async init(options: { profile?: string; model?: string } = {}): Promise<void> {
    const config = configManager.getConfig();
    
    if (options.profile) {
      this.currentProfile = profileManager.getProfile(options.profile);
      this.currentProfileName = options.profile;
    } else {
      this.currentProfile = profileManager.getProfile();
      this.currentProfileName = config.defaultProfile;
    }

    if (options.model) {
      this.activeModels = [options.model];
    } else if (this.currentProfile.models.length === 0) {
      // No models in profile, prompt user to select
      const selectedModel = await this.selectModel();
      if (selectedModel) {
        this.activeModels = [selectedModel];
      } else {
        throw new Error('No model selected. Cannot start chat.');
      }
    } else {
      // Ask user if they want to use profile models or select a new one
      const { useProfileModels } = await inquirer.prompt<{ useProfileModels: boolean }>([
        {
          type: 'confirm',
          name: 'useProfileModels',
          message: `Use models from profile "${this.currentProfileName}"? (${this.currentProfile.models.join(', ')})`,
          default: true
        }
      ]);

      if (useProfileModels) {
        this.activeModels = this.currentProfile.models;
      } else {
        const selectedModel = await this.selectModel();
        if (selectedModel) {
          this.activeModels = [selectedModel];
        } else {
          // Fall back to profile models if selection cancelled
          this.activeModels = this.currentProfile.models;
        }
      }
    }

    console.log(chalk.bold.green('OpenRouter Chat Interface'));
    console.log(chalk.gray('Type /help for available commands'));
    console.log(chalk.gray('Press Enter to send (or press Enter on empty line for multiline)'));
    console.log(chalk.gray('Type /exit or press Ctrl+C to quit\n'));
    
    console.log(chalk.cyan('Active models:'), this.activeModels.join(', '));
    console.log();
  }

  async run(): Promise<void> {
    while (true) {
      try {
        const input = await this.getMultilineInput();
        
        if (!input.trim()) continue;
        
        if (input.startsWith('/')) {
          const handled = await this.handleCommand(input);
          if (handled === 'exit') break;
          continue;
        }

        await this.sendMessage(input);
      } catch (error) {
        if ((error as Error).message === 'User force closed the prompt') {
          break;
        }
        console.error(chalk.red('Error:', (error as Error).message));
      }
    }
    
    console.log(chalk.yellow('\nGoodbye!'));
  }

  private async getMultilineInput(): Promise<string> {
    const lines: string[] = [];
    let lineCount = 0;
    
    while (true) {
      const { line } = await inquirer.prompt<{ line: string }>([
        {
          type: 'input',
          name: 'line',
          message: lineCount === 0 ? chalk.bold.blue('You:') : '',
          prefix: lineCount > 0 ? '... ' : ''
        }
      ]);
      
      // If first line is a command, return immediately
      if (lineCount === 0 && line.startsWith('/')) {
        return line;
      }
      
      // If first line is not empty and user pressed enter, submit immediately
      if (lineCount === 0 && line.trim() !== '') {
        return line;
      }
      
      // For multiline input, empty line still ends input
      if (line === '' && lines.length > 0) {
        break;
      }
      
      lines.push(line);
      lineCount++;
    }
    
    return lines.join('\n');
  }

  private async handleCommand(command: string): Promise<string | null> {
    const [cmd, ...args] = command.split(' ');
    
    switch (cmd) {
      case '/exit':
      case '/quit':
        return 'exit';
        
      case '/help':
        this.showHelp();
        break;
        
      case '/models':
        console.log(chalk.cyan('Active models:'), this.activeModels.join(', '));
        break;
        
      case '/switch':
        await this.switchModel(args.join(' '));
        break;
        
      case '/profile':
        await this.switchProfile(args.join(' '));
        break;
        
      case '/clear':
        this.conversation = [];
        console.log(chalk.green('Conversation cleared'));
        break;
        
      case '/save':
        await this.saveConversation(args.join(' '));
        break;
        
      default:
        console.log(chalk.red(`Unknown command: ${cmd}`));
        console.log(chalk.gray('Type /help for available commands'));
    }
    
    return null;
  }

  private showHelp(): void {
    console.log(chalk.bold('\nAvailable commands:'));
    console.log('  /help          - Show this help message');
    console.log('  /models        - Show active models');
    console.log('  /switch [id]   - Switch to a different model (interactive if no ID provided)');
    console.log('  /profile <name>- Switch to a different profile');
    console.log('  /clear         - Clear conversation history');
    console.log('  /save <file>   - Save conversation to file');
    console.log('  /exit, /quit   - Exit the chat\n');
  }

  private async switchModel(modelId: string): Promise<void> {
    if (!modelId) {
      // Use interactive selection if no model ID provided
      const selectedModel = await this.selectModel();
      if (selectedModel) {
        this.activeModels = [selectedModel];
        console.log(chalk.green(`Switched to model: ${selectedModel}`));
      }
      return;
    }
    
    this.activeModels = [modelId];
    console.log(chalk.green(`Switched to model: ${modelId}`));
  }

  private async switchProfile(profileName: string): Promise<void> {
    if (!profileName) {
      const selected = await profileManager.selectProfile();
      profileName = selected;
    }
    
    try {
      this.currentProfile = profileManager.getProfile(profileName);
      this.currentProfileName = profileName;
      this.activeModels = this.currentProfile.models;
      console.log(chalk.green(`Switched to profile: ${profileName}`));
      console.log(chalk.cyan('Active models:'), this.activeModels.join(', '));
    } catch (error) {
      console.log(chalk.red((error as Error).message));
    }
  }

  private async sendMessage(content: string): Promise<void> {
    this.conversation.push({ role: 'user', content });
    
    console.log(); // Add spacing before responses
    
    // Process models sequentially to avoid overlapping streams
    for (const model of this.activeModels) {
      await this.streamModelResponse(model);
      if (this.activeModels.indexOf(model) < this.activeModels.length - 1) {
        console.log(); // Add spacing between models
      }
    }
    console.log(); // Add spacing after all responses
  }

  private async streamModelResponse(model: string): Promise<void> {
    const conversationForModel = this.conversation.filter(
      msg => msg.role !== 'assistant' || msg.model === model
    );
    
    const streamBox = formatStreamingBox(model);
    streamBox.printHeader();
    
    let fullResponse = '';
    
    try {
      const stream = this.client.streamChat(
        conversationForModel,
        model,
        {
          temperature: this.currentProfile.temperature,
          maxTokens: this.currentProfile.maxTokens,
          stream: true
        }
      );
      
      for await (const chunk of stream) {
        fullResponse += chunk;
        streamBox.printChunk(chunk);
      }
      
      streamBox.printFooter();
      
      // Add to conversation history
      this.conversation.push({
        role: 'assistant',
        content: fullResponse,
        model
      });
      
    } catch (error) {
      streamBox.printChunk(chalk.red(`Error: ${(error as Error).message}`));
      streamBox.printFooter();
    }
  }

  private async saveConversation(filename: string): Promise<void> {
    if (!filename) {
      filename = `conversation-${new Date().toISOString().replace(/:/g, '-')}.json`;
    }
    
    try {
      await fs.writeFile(filename, JSON.stringify(this.conversation, null, 2));
      console.log(chalk.green(`Conversation saved to ${filename}`));
    } catch (error) {
      console.log(chalk.red(`Failed to save conversation: ${(error as Error).message}`));
    }
  }

  private async selectModel(): Promise<string | null> {
    try {
      // First, ask if user wants to browse by organization or search
      const { selectionMode } = await inquirer.prompt<{ selectionMode: 'browse' | 'search' | 'all' }>([
        {
          type: 'list',
          name: 'selectionMode',
          message: 'How would you like to select a model?',
          choices: [
            { name: 'Browse by organization', value: 'browse' },
            { name: 'Search models', value: 'search' },
            { name: 'View all models', value: 'all' }
          ]
        }
      ]);

      let models: Model[] = [];
      
      if (selectionMode === 'browse') {
        // Get organizations
        const organizations = await this.modelManager.getOrganizations();
        const { selectedOrg } = await inquirer.prompt<{ selectedOrg: string }>([
          {
            type: 'list',
            name: 'selectedOrg',
            message: 'Select an organization:',
            choices: organizations,
            pageSize: 15
          }
        ]);
        
        const grouped = await this.modelManager.getModelsByOrganization();
        models = grouped.get(selectedOrg) || [];
      } else if (selectionMode === 'search') {
        const { searchQuery } = await inquirer.prompt<{ searchQuery: string }>([
          {
            type: 'input',
            name: 'searchQuery',
            message: 'Enter search query:',
            validate: input => input.trim().length > 0 || 'Please enter a search query'
          }
        ]);
        
        models = await this.modelManager.searchModels(searchQuery);
        
        if (models.length === 0) {
          console.log(chalk.yellow('No models found matching your search.'));
          return null;
        }
      } else {
        models = await this.modelManager.listModels();
      }

      // Format models for selection
      const choices = models.map(model => {
        const isFree = !model.pricing || (model.pricing.prompt === 0 && model.pricing.completion === 0);
        const contextStr = model.context_length ? ` (${model.context_length.toLocaleString()} tokens)` : '';
        const freeLabel = isFree ? chalk.green(' [FREE]') : '';
        const name = model.name && model.name !== model.id ? ` - ${model.name}` : '';
        
        return {
          name: `${model.id}${name}${contextStr}${freeLabel}`,
          value: model.id,
          short: model.id
        };
      });

      const { selectedModel } = await inquirer.prompt<{ selectedModel: string }>([
        {
          type: 'list',
          name: 'selectedModel',
          message: 'Select a model:',
          choices,
          pageSize: 15
        }
      ]);

      return selectedModel;
    } catch (error) {
      console.error(chalk.red('Error selecting model:', (error as Error).message));
      return null;
    }
  }
}

export async function startChat(apiKey: string, options: { profile?: string; model?: string } = {}): Promise<void> {
  const chat = new ChatInterface(apiKey);
  await chat.init(options);
  await chat.run();
}

export async function askQuestion(
  apiKey: string, 
  question: string, 
  options: { profile?: string; model?: string } = {}
): Promise<void> {
  const client = new OpenRouterClient(apiKey);
  const profile = profileManager.getProfile(options.profile);
  const models = options.model ? [options.model] : profile.models;
  
  console.log(); // Add spacing
  
  // Process models sequentially to avoid overlapping streams
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    if (!model) continue; // Skip if model is undefined
    
    const streamBox = formatStreamingBox(model);
    streamBox.printHeader();
    
    try {
      const stream = client.streamChat(
        [{ role: 'user', content: question }],
        model,
        {
          temperature: profile.temperature,
          maxTokens: profile.maxTokens,
          stream: true
        }
      );
      
      for await (const chunk of stream) {
        streamBox.printChunk(chunk);
      }
      
      streamBox.printFooter();
    } catch (error) {
      streamBox.printChunk(chalk.red(`Error: ${(error as Error).message}`));
      streamBox.printFooter();
    }
    
    if (i < models.length - 1) {
      console.log(); // Add spacing between models
    }
  }
  console.log(); // Add spacing after responses
}
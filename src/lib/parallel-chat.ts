import inquirer from 'inquirer';
import chalk from 'chalk';
import OpenRouterClient from './api.js';
import profileManager from './profiles.js';
import configManager from './config.js';
import { ModelManager } from './models.js';
import type { ChatMessage, Profile, Model } from '../types/index.js';

export class ParallelChatInterface {
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

  async init(options: { profile?: string; model?: string; models?: string[] } = {}): Promise<void> {
    const config = configManager.getConfig();
    
    if (options.models && options.models.length > 0) {
      this.activeModels = options.models;
    } else if (options.model) {
      this.activeModels = [options.model];
    } else if (options.profile) {
      this.currentProfile = profileManager.getProfile(options.profile);
      this.currentProfileName = options.profile;
      this.activeModels = this.currentProfile.models;
    } else {
      this.currentProfile = profileManager.getProfile();
      this.currentProfileName = config.defaultProfile;
      this.activeModels = this.currentProfile.models;
    }

    if (this.activeModels.length === 0) {
      const selectedModel = await this.selectModel();
      if (selectedModel) {
        this.activeModels = [selectedModel];
      } else {
        throw new Error('No model selected. Cannot start chat.');
      }
    }

    console.log(chalk.bold.green('\n🚀 OpenRouter Parallel Chat'));
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.cyan('Active models:'), this.activeModels.map(m => chalk.bold(m)).join(', '));
    console.log(chalk.gray('Type your messages below. Each response will stream in parallel.\n'));
  }

  async run(): Promise<void> {
    while (true) {
      try {
        const { message } = await inquirer.prompt<{ message: string }>([
          {
            type: 'input',
            name: 'message',
            message: chalk.bold.blue('You:'),
            validate: input => input.trim().length > 0 || 'Please enter a message'
          }
        ]);
        
        if (message.trim().toLowerCase() === '/exit' || message.trim().toLowerCase() === '/quit') {
          break;
        }

        await this.sendMessage(message);
        console.log(); // Add spacing after responses
      } catch (error) {
        if ((error as Error).message === 'User force closed the prompt') {
          break;
        }
        console.error(chalk.red('Error:', (error as Error).message));
      }
    }
    
    console.log(chalk.yellow('\nGoodbye! 👋'));
  }

  private async sendMessage(content: string): Promise<void> {
    this.conversation.push({ role: 'user', content });
    
    console.log('\n' + chalk.gray('─'.repeat(60)));
    console.log(chalk.gray('🔄 Streaming responses from all models in parallel...'));
    console.log(chalk.gray('─'.repeat(60)) + '\n');
    
    // Create response containers for each model
    const responses: { [model: string]: string } = {};
    const streamingState: { [model: string]: boolean } = {};
    
    // Initialize state
    this.activeModels.forEach(model => {
      responses[model] = '';
      streamingState[model] = true;
    });

    // Start streaming from all models in parallel
    const promises = this.activeModels.map(async (model) => {
      try {
        const conversationForModel = this.conversation.filter(
          msg => msg.role !== 'assistant' || msg.model === model
        );
        
        console.log(chalk.cyan(`📡 ${model}:`), chalk.gray('Starting stream...'));
        
        const stream = this.client.streamChat(
          conversationForModel,
          model,
          {
            temperature: this.currentProfile.temperature,
            maxTokens: this.currentProfile.maxTokens,
            stream: true
          }
        );
        
        let fullResponse = '';
        for await (const chunk of stream) {
          fullResponse += chunk;
          responses[model] = fullResponse;
          
          // Print update for this model
          process.stdout.write(`\r${chalk.cyan(model)}: ${fullResponse.slice(-50)}...`);
        }
        
        streamingState[model] = false;
        console.log(`\n${chalk.green('✅')} ${chalk.cyan(model)}: ${chalk.gray('Complete')}`);
        
        // Add to conversation history
        this.conversation.push({
          role: 'assistant',
          content: fullResponse,
          model
        });
        
        return { model, content: fullResponse };
      } catch (error) {
        streamingState[model] = false;
        console.log(`\n${chalk.red('❌')} ${chalk.cyan(model)}: ${chalk.red((error as Error).message)}`);
        return { model, content: '', error: (error as Error).message };
      }
    });

    // Wait for all models to complete
    await Promise.all(promises);
    
    console.log('\n' + chalk.gray('─'.repeat(60)));
    console.log(chalk.bold('📋 Full Responses:'));
    console.log(chalk.gray('─'.repeat(60)));
    
    // Display all full responses
    this.activeModels.forEach(model => {
      const response = responses[model];
      if (response) {
        console.log(`\n${chalk.bold.cyan(`🤖 ${model}:`)}`);
        console.log(chalk.gray('┌' + '─'.repeat(58) + '┐'));
        
        // Word wrap the response
        const lines = this.wrapText(response, 56);
        lines.forEach(line => {
          console.log(chalk.gray('│ ') + line.padEnd(56) + chalk.gray(' │'));
        });
        
        console.log(chalk.gray('└' + '─'.repeat(58) + '┘'));
      }
    });
  }

  private wrapText(text: string, width: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= width) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  private async selectModel(): Promise<string | null> {
    try {
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

export async function startParallelChat(
  apiKey: string, 
  options: { profile?: string; model?: string; models?: string[] } = {}
): Promise<void> {
  const chat = new ParallelChatInterface(apiKey);
  await chat.init(options);
  await chat.run();
}
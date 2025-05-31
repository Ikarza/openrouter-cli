import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { promises as fs } from 'fs';
import OpenRouterClient from './api.js';
import { formatModelResponse } from './utils.js';
import profileManager from './profiles.js';

export class ChatInterface {
  constructor(apiKey) {
    this.client = new OpenRouterClient(apiKey);
    this.conversation = [];
    this.activeModels = [];
    this.currentProfile = null;
  }

  async init(options = {}) {
    if (options.profile) {
      this.currentProfile = profileManager.getProfile(options.profile);
    } else {
      this.currentProfile = profileManager.getProfile();
    }

    if (options.model) {
      this.activeModels = [options.model];
    } else {
      this.activeModels = this.currentProfile.models;
    }

    console.log(chalk.bold.green('OpenRouter Chat Interface'));
    console.log(chalk.gray('Type /help for available commands'));
    console.log(chalk.gray('Press Enter twice or use Ctrl+D to send message'));
    console.log(chalk.gray('Type /exit or press Ctrl+C to quit\n'));
    
    console.log(chalk.cyan('Active models:'), this.activeModels.join(', '));
    console.log();
  }

  async run() {
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
        if (error.message === 'User force closed the prompt') {
          break;
        }
        console.error(chalk.red('Error:', error.message));
      }
    }
    
    console.log(chalk.yellow('\nGoodbye!'));
  }

  async getMultilineInput() {
    const lines = [];
    let lineCount = 0;
    
    while (true) {
      const { line } = await inquirer.prompt([
        {
          type: 'input',
          name: 'line',
          message: lineCount === 0 ? chalk.bold.blue('You:') : '',
          prefix: lineCount > 0 ? '... ' : ''
        }
      ]);
      
      if (line === '' && lines.length > 0) {
        break;
      }
      
      lines.push(line);
      lineCount++;
    }
    
    return lines.join('\n');
  }

  async handleCommand(command) {
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

  showHelp() {
    console.log(chalk.bold('\nAvailable commands:'));
    console.log('  /help          - Show this help message');
    console.log('  /models        - Show active models');
    console.log('  /switch <id>   - Switch to a different model');
    console.log('  /profile <name>- Switch to a different profile');
    console.log('  /clear         - Clear conversation history');
    console.log('  /save <file>   - Save conversation to file');
    console.log('  /exit, /quit   - Exit the chat\n');
  }

  async switchModel(modelId) {
    if (!modelId) {
      console.log(chalk.red('Please provide a model ID'));
      return;
    }
    
    this.activeModels = [modelId];
    console.log(chalk.green(`Switched to model: ${modelId}`));
  }

  async switchProfile(profileName) {
    if (!profileName) {
      const selected = await profileManager.selectProfile();
      profileName = selected;
    }
    
    try {
      this.currentProfile = profileManager.getProfile(profileName);
      this.activeModels = this.currentProfile.models;
      console.log(chalk.green(`Switched to profile: ${profileName}`));
      console.log(chalk.cyan('Active models:'), this.activeModels.join(', '));
    } catch (error) {
      console.log(chalk.red(error.message));
    }
  }

  async sendMessage(content) {
    this.conversation.push({ role: 'user', content });
    
    const responses = await Promise.all(
      this.activeModels.map(model => this.getModelResponse(model))
    );
    
    console.log();
    
    for (const response of responses) {
      if (response.error) {
        console.log(formatModelResponse(response.model, 
          chalk.red(`Error: ${response.error}`)));
      } else {
        console.log(formatModelResponse(response.model, response.content));
        this.conversation.push({ 
          role: 'assistant', 
          content: response.content,
          model: response.model 
        });
      }
      console.log();
    }
  }

  async getModelResponse(model) {
    const spinner = ora(`${model} is thinking...`).start();
    
    try {
      const response = await this.client.chat(
        this.conversation.filter(msg => msg.role !== 'assistant' || msg.model === model),
        model,
        {
          temperature: this.currentProfile.temperature,
          maxTokens: this.currentProfile.maxTokens
        }
      );
      
      spinner.stop();
      return { model, content: response };
    } catch (error) {
      spinner.stop();
      return { model, error: error.message };
    }
  }

  async saveConversation(filename) {
    if (!filename) {
      filename = `conversation-${new Date().toISOString().replace(/:/g, '-')}.json`;
    }
    
    try {
      await fs.writeFile(filename, JSON.stringify(this.conversation, null, 2));
      console.log(chalk.green(`Conversation saved to ${filename}`));
    } catch (error) {
      console.log(chalk.red(`Failed to save conversation: ${error.message}`));
    }
  }
}

export async function startChat(apiKey, options = {}) {
  const chat = new ChatInterface(apiKey);
  await chat.init(options);
  await chat.run();
}

export async function askQuestion(apiKey, question, options = {}) {
  const client = new OpenRouterClient(apiKey);
  const profile = profileManager.getProfile(options.profile);
  const models = options.model ? [options.model] : profile.models;
  
  const spinner = ora('Thinking...').start();
  
  try {
    const responses = await Promise.all(
      models.map(async (model) => {
        try {
          const response = await client.chat(
            [{ role: 'user', content: question }],
            model,
            {
              temperature: profile.temperature,
              maxTokens: profile.maxTokens
            }
          );
          return { model, content: response };
        } catch (error) {
          return { model, error: error.message };
        }
      })
    );
    
    spinner.stop();
    
    for (const response of responses) {
      if (response.error) {
        console.log(formatModelResponse(response.model, 
          chalk.red(`Error: ${response.error}`)));
      } else {
        console.log(formatModelResponse(response.model, response.content));
      }
      console.log();
    }
  } catch (error) {
    spinner.stop();
    console.error(chalk.red('Error:', error.message));
  }
}
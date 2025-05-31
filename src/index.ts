#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import configManager from './lib/config.js';
import { ModelManager } from './lib/models.js';
import profileManager from './lib/profiles.js';
import { startChat, askQuestion } from './lib/chat.js';
import OpenRouterClient from './lib/api.js';

const program = new Command();

program
  .name('orb')
  .description('Orb CLI - Multi-model AI chat interface')
  .version('1.0.0');

// Config commands
const config = program
  .command('config')
  .description('Manage configuration');

config
  .command('set-key <key>')
  .description('Set your OpenRouter API key')
  .action(async (key: string) => {
    try {
      await configManager.init();
      
      // Validate the API key
      const client = new OpenRouterClient(key);
      const isValid = await client.validateApiKey();
      
      if (!isValid) {
        console.log(chalk.red('Invalid API key. Please check your key and try again.'));
        return;
      }
      
      await configManager.setApiKey(key);
      console.log(chalk.green('API key set successfully'));
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

config
  .command('show')
  .description('Show current configuration')
  .action(async () => {
    try {
      await configManager.init();
      const configData = configManager.getConfig();
      
      console.log(chalk.bold('Current Configuration:'));
      console.log(`API Key: ${configData.apiKey ? chalk.green('Set') : chalk.red('Not set')}`);
      console.log(`Default Profile: ${configData.defaultProfile}`);
      console.log(`Profiles: ${Object.keys(configData.profiles).join(', ')}`);
      console.log(`Last Used: ${configData.lastUsed}`);
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

config
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    try {
      const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset the configuration?',
          default: false
        }
      ]);
      
      if (confirm) {
        await configManager.init();
        await configManager.reset();
        console.log(chalk.green('Configuration reset successfully'));
      }
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

// Models commands
const models = program
  .command('models')
  .description('Manage and explore available models');

models
  .command('list')
  .description('List all available models')
  .option('-v, --verbose', 'Show detailed information')
  .option('-f, --filter <query>', 'Filter models by name')
  .action(async (options: { verbose?: boolean; filter?: string }) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      const modelManager = new ModelManager(apiKey);
      const modelList = await modelManager.listModels({ filter: options.filter });
      console.log(modelManager.formatModelList(modelList, options.verbose));
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

models
  .command('search <query>')
  .description('Search for models')
  .action(async (query: string) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      const modelManager = new ModelManager(apiKey);
      const results = await modelManager.searchModels(query);
      console.log(modelManager.formatModelList(results, true));
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

models
  .command('info <model-id>')
  .description('Get detailed information about a model')
  .action(async (modelId: string) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      const modelManager = new ModelManager(apiKey);
      const model = await modelManager.getModelInfo(modelId);
      console.log(modelManager.formatModelInfo(model));
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

models
  .command('browse')
  .description('Browse models by organization')
  .option('-o, --org <organization>', 'Filter by specific organization')
  .action(async (options: { org?: string }) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      const modelManager = new ModelManager(apiKey);
      
      if (options.org) {
        // Show models for specific organization
        const grouped = await modelManager.getModelsByOrganization();
        const models = grouped.get(options.org);
        
        if (!models || models.length === 0) {
          console.log(chalk.yellow(`No models found for organization: ${options.org}`));
          return;
        }
        
        console.log(chalk.bold.cyan(`\n${options.org} Models:\n`));
        console.log(modelManager.formatModelList(models, true));
      } else {
        // Interactive organization selection
        const organizations = await modelManager.getOrganizations();
        
        const { selectedOrg } = await inquirer.prompt<{ selectedOrg: string }>([
          {
            type: 'list',
            name: 'selectedOrg',
            message: 'Select an organization to browse models:',
            choices: organizations.map(org => ({
              name: org,
              value: org
            })),
            pageSize: 15
          }
        ]);
        
        const grouped = await modelManager.getModelsByOrganization();
        const models = grouped.get(selectedOrg) || [];
        
        console.log(chalk.bold.cyan(`\n${selectedOrg} Models:\n`));
        console.log(modelManager.formatModelList(models, true));
        
        // Ask if user wants to see another organization
        const { continueBrowsing } = await inquirer.prompt<{ continueBrowsing: boolean }>([
          {
            type: 'confirm',
            name: 'continueBrowsing',
            message: 'Browse another organization?',
            default: false
          }
        ]);
        
        if (continueBrowsing) {
          // Recursively call the browse command
          await program.commands.find(cmd => cmd.name() === 'models')
            ?.commands.find(cmd => cmd.name() === 'browse')
            ?.parseAsync([], { from: 'user' });
        }
      }
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

// Profile commands
const profile = program
  .command('profile')
  .description('Manage model presets');

profile
  .command('create <name>')
  .description('Create a new profile')
  .action(async (name: string) => {
    try {
      await configManager.init();
      await profileManager.createProfile(name);
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

profile
  .command('list')
  .description('List all profiles')
  .action(async () => {
    try {
      await configManager.init();
      await profileManager.listProfiles();
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

profile
  .command('use <name>')
  .description('Set default profile')
  .action(async (name: string) => {
    try {
      await configManager.init();
      await profileManager.useProfile(name);
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

profile
  .command('edit <name>')
  .description('Edit a profile')
  .action(async (name: string) => {
    try {
      await configManager.init();
      await profileManager.editProfile(name);
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

profile
  .command('delete <name>')
  .description('Delete a profile')
  .action(async (name: string) => {
    try {
      await configManager.init();
      await profileManager.deleteProfile(name);
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

// Chat command
program
  .command('chat')
  .description('Start interactive chat session')
  .option('-p, --profile <name>', 'Use specific profile')
  .option('-m, --model <model-id>', 'Use specific model')
  .action(async (options: { profile?: string; model?: string }) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      await startChat(apiKey, options);
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

// Ask command
program
  .command('ask <question>')
  .description('Ask a one-time question')
  .option('-p, --profile <name>', 'Use specific profile')
  .option('-m, --model <model-id>', 'Use specific model')
  .action(async (question: string, options: { profile?: string; model?: string }) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      await askQuestion(apiKey, question, options);
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
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
  .action(async (key) => {
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
      console.error(chalk.red('Error:', error.message));
    }
  });

config
  .command('show')
  .description('Show current configuration')
  .action(async () => {
    try {
      await configManager.init();
      const config = configManager.getConfig();
      
      console.log(chalk.bold('Current Configuration:'));
      console.log(`API Key: ${config.apiKey ? chalk.green('Set') : chalk.red('Not set')}`);
      console.log(`Default Profile: ${config.defaultProfile}`);
      console.log(`Profiles: ${Object.keys(config.profiles).join(', ')}`);
      console.log(`Last Used: ${config.lastUsed}`);
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
    }
  });

config
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    try {
      const { confirm } = await inquirer.prompt([
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
      console.error(chalk.red('Error:', error.message));
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
  .action(async (options) => {
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
      console.error(chalk.red('Error:', error.message));
    }
  });

models
  .command('search <query>')
  .description('Search for models')
  .action(async (query) => {
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
      console.error(chalk.red('Error:', error.message));
    }
  });

models
  .command('info <model-id>')
  .description('Get detailed information about a model')
  .action(async (modelId) => {
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
      console.error(chalk.red('Error:', error.message));
    }
  });

// Profile commands
const profile = program
  .command('profile')
  .description('Manage model presets');

profile
  .command('create <name>')
  .description('Create a new profile')
  .action(async (name) => {
    try {
      await configManager.init();
      await profileManager.createProfile(name);
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
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
      console.error(chalk.red('Error:', error.message));
    }
  });

profile
  .command('use <name>')
  .description('Set default profile')
  .action(async (name) => {
    try {
      await configManager.init();
      await profileManager.useProfile(name);
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
    }
  });

profile
  .command('edit <name>')
  .description('Edit a profile')
  .action(async (name) => {
    try {
      await configManager.init();
      await profileManager.editProfile(name);
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
    }
  });

profile
  .command('delete <name>')
  .description('Delete a profile')
  .action(async (name) => {
    try {
      await configManager.init();
      await profileManager.deleteProfile(name);
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
    }
  });

// Chat command
program
  .command('chat')
  .description('Start interactive chat session')
  .option('-p, --profile <name>', 'Use specific profile')
  .option('-m, --model <model-id>', 'Use specific model')
  .action(async (options) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      await startChat(apiKey, options);
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
    }
  });

// Ask command
program
  .command('ask <question>')
  .description('Ask a one-time question')
  .option('-p, --profile <name>', 'Use specific profile')
  .option('-m, --model <model-id>', 'Use specific model')
  .action(async (question, options) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      await askQuestion(apiKey, question, options);
    } catch (error) {
      console.error(chalk.red('Error:', error.message));
    }
  });

// Parse arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
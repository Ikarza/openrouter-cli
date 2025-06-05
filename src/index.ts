#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import * as fs from 'fs/promises';
import configManager from './lib/config.js';
import { ModelManager } from './lib/models.js';
import profileManager from './lib/profiles.js';
import { startChat, askQuestion } from './lib/chat.js';
import OpenRouterClient from './lib/api.js';
import { templateManager } from './lib/templates.js';
import { BatchProcessor, chainPrompts } from './lib/batch.js';
import { ConversationExporter, ConversationImporter } from './lib/export.js';
import { CodeIntegration } from './lib/code-integration.js';

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

// Template commands
const template = program
  .command('template')
  .description('Manage prompt templates');

template
  .command('create <name>')
  .description('Create a new template')
  .option('-s, --system <system>', 'System prompt')
  .option('-p, --prompt <prompt>', 'Template prompt (use {prompt} as placeholder)')
  .option('-m, --models <models...>', 'Default models for this template')
  .option('-t, --temperature <temp>', 'Default temperature', parseFloat)
  .option('--max-tokens <tokens>', 'Default max tokens', parseInt)
  .action(async (name: string, options: any) => {
    try {
      await configManager.init();
      await templateManager.create({
        name,
        system: options.system,
        prompt: options.prompt,
        models: options.models,
        temperature: options.temperature,
        maxTokens: options.maxTokens
      });
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

template
  .command('list')
  .description('List all templates')
  .action(async () => {
    try {
      await configManager.init();
      const templates = await templateManager.list();
      
      if (templates.length === 0) {
        console.log(chalk.yellow('No templates found.'));
        return;
      }
      
      console.log(chalk.bold('Templates:'));
      templates.forEach(t => {
        console.log(`\n${chalk.cyan(t.name)}`);
        if (t.system) console.log(`  System: ${t.system.substring(0, 50)}...`);
        if (t.prompt) console.log(`  Prompt: ${t.prompt.substring(0, 50)}...`);
        if (t.models) console.log(`  Models: ${t.models.join(', ')}`);
        if (t.temperature) console.log(`  Temperature: ${t.temperature}`);
        if (t.maxTokens) console.log(`  Max Tokens: ${t.maxTokens}`);
      });
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

template
  .command('delete <name>')
  .description('Delete a template')
  .action(async (name: string) => {
    try {
      await configManager.init();
      const { confirm } = await inquirer.prompt<{ confirm: boolean }>([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Delete template '${name}'?`,
          default: false
        }
      ]);
      
      if (confirm) {
        await templateManager.delete(name);
      }
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
  .option('-t, --template <name>', 'Use a template')
  .option('-f, --file <path>', 'Include file content in the prompt')
  .option('--files <paths...>', 'Include multiple files')
  .action(async (question: string, options: { profile?: string; model?: string; template?: string; file?: string; files?: string[] }) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      let finalPrompt = question;
      let templateOptions: any = {};
      
      // Apply template if specified
      if (options.template) {
        const result = await templateManager.applyTemplate(options.template, question);
        finalPrompt = result.prompt;
        templateOptions = {
          models: result.models,
          temperature: result.temperature,
          maxTokens: result.maxTokens
        };
      }
      
      // Handle file input
      if (options.file || options.files) {
        const codeIntegration = new CodeIntegration();
        
        if (options.file) {
          const fileInfo = await codeIntegration.getFileInfo(options.file);
          finalPrompt = codeIntegration.formatFilePrompt(fileInfo, finalPrompt);
        } else if (options.files) {
          const analysis = await codeIntegration.analyzeMultipleFiles(options.files);
          finalPrompt = codeIntegration.formatMultipleFilesPrompt(analysis, finalPrompt);
        }
      }
      
      // Merge options
      const mergedOptions = {
        ...options,
        ...templateOptions,
        model: options.model || templateOptions.models?.[0]
      };
      
      await askQuestion(apiKey, finalPrompt, mergedOptions);
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

// Batch command
program
  .command('batch <file>')
  .description('Process multiple prompts from a file')
  .option('-m, --models <models...>', 'Models to use', ['gpt-3.5-turbo'])
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json, csv, markdown)', 'json')
  .option('-t, --temperature <temp>', 'Temperature', parseFloat)
  .option('--max-tokens <tokens>', 'Max tokens', parseInt)
  .action(async (file: string, options: any) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      const processor = new BatchProcessor();
      await processor.processFile(file, options.models, {
        temperature: options.temperature,
        maxTokens: options.maxTokens,
        output: options.output,
        format: options.format
      });
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

// Chain command
program
  .command('chain')
  .description('Chain multiple prompts together')
  .option('-m, --models <models...>', 'Models to use', ['gpt-3.5-turbo'])
  .option('-s, --steps <steps...>', 'Chain steps (use {input} for previous output)')
  .option('-t, --temperature <temp>', 'Temperature', parseFloat)
  .option('--max-tokens <tokens>', 'Max tokens', parseInt)
  .action(async (options: any) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      // Get initial prompt
      const { initialPrompt } = await inquirer.prompt<{ initialPrompt: string }>([
        {
          type: 'input',
          name: 'initialPrompt',
          message: 'Enter initial prompt:'
        }
      ]);
      
      const results = await chainPrompts(
        initialPrompt,
        options.models,
        options.steps || [],
        {
          temperature: options.temperature,
          maxTokens: options.maxTokens
        }
      );
      
      // Display results
      results.forEach((result, index) => {
        console.log(chalk.bold(`\nStep ${index + 1}:`));
        console.log(chalk.dim(result.prompt));
        result.responses.forEach(response => {
          console.log(chalk.cyan(`\n${response.model}:`));
          console.log(response.response || chalk.red(`Error: ${response.error}`));
        });
      });
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

// Export command
program
  .command('export <format> <output>')
  .description('Export conversation history')
  .option('-c, --conversation <path>', 'Path to conversation JSON file')
  .option('--include-metadata', 'Include metadata in export')
  .option('--syntax-highlight', 'Enable syntax highlighting (HTML only)')
  .action(async (format: string, output: string, options: any) => {
    try {
      await configManager.init();
      
      if (!['json', 'markdown', 'html'].includes(format)) {
        console.log(chalk.red('Format must be one of: json, markdown, html'));
        return;
      }
      
      // For now, we'll need to load conversation from a file
      // In a real implementation, this would integrate with the chat system
      if (!options.conversation) {
        console.log(chalk.red('Please specify a conversation file with -c option'));
        return;
      }
      
      const conversationData = await fs.readFile(options.conversation, 'utf-8');
      const messages = JSON.parse(conversationData);
      
      const exporter = new ConversationExporter();
      await exporter.exportConversation(messages, output, {
        format: format as 'json' | 'markdown' | 'html',
        includeMetadata: options.includeMetadata,
        syntaxHighlight: options.syntaxHighlight
      });
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

// Import command
program
  .command('import <file>')
  .description('Import conversation from ChatGPT or Claude export')
  .option('-t, --type <type>', 'Export type (chatgpt, claude, generic)', 'generic')
  .action(async (file: string, options: any) => {
    try {
      await configManager.init();
      
      const importer = new ConversationImporter();
      let messages;
      
      switch (options.type) {
        case 'chatgpt':
          messages = await importer.importFromChatGPT(file);
          break;
        case 'claude':
          messages = await importer.importFromClaude(file);
          break;
        default:
          messages = await importer.importGeneric(file);
      }
      
      console.log(chalk.green(`✓ Imported ${messages.length} messages`));
      
      // Save to a new file
      const outputPath = `imported-conversation-${Date.now()}.json`;
      await fs.writeFile(outputPath, JSON.stringify(messages, null, 2));
      console.log(chalk.green(`✓ Saved to ${outputPath}`));
    } catch (error) {
      console.error(chalk.red('Error:', (error as Error).message));
    }
  });

// Git diff command
program
  .command('git-diff [target]')
  .description('Analyze git changes')
  .option('-m, --models <models...>', 'Models to use', ['gpt-3.5-turbo'])
  .action(async (target: string = 'HEAD', options: any) => {
    try {
      await configManager.init();
      const apiKey = configManager.getApiKey();
      
      if (!apiKey) {
        console.log(chalk.red('No API key found. Please run: orb config set-key <your-key>'));
        return;
      }
      
      const codeIntegration = new CodeIntegration();
      const gitInfo = await codeIntegration.analyzeGitDiff(target);
      
      console.log(chalk.bold('Git diff analysis:'));
      console.log(`Files changed: ${gitInfo.files.length}`);
      console.log(gitInfo.stats);
      
      // Ask for analysis prompt
      const { prompt } = await inquirer.prompt<{ prompt: string }>([
        {
          type: 'input',
          name: 'prompt',
          message: 'What would you like to know about these changes?',
          default: 'Summarize the changes and their impact'
        }
      ]);
      
      const finalPrompt = codeIntegration.formatGitDiffPrompt(gitInfo, prompt);
      
      // Use existing askQuestion functionality
      await askQuestion(apiKey, finalPrompt, { model: options.models[0] });
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
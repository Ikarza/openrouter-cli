import React from 'react';
import { render } from 'ink';
import { App } from '../components/index.js';
import configManager from './config.js';
import profileManager from './profiles.js';
import { ModelManager } from './models.js';
import inquirer from 'inquirer';
import chalk from 'chalk';

export async function startInkChat(
  apiKey: string, 
  options: { profile?: string; model?: string; models?: string[] } = {}
): Promise<void> {
  const config = configManager.getConfig();
  let models: string[] = [];
  let profileName = options.profile || config.defaultProfile;

  // Determine which models to use
  if (options.models && options.models.length > 0) {
    models = options.models;
  } else if (options.model) {
    models = [options.model];
  } else {
    const profile = profileManager.getProfile(profileName);
    
    if (profile.models.length === 0) {
      // No models in profile, prompt user to select
      const selectedModels = await selectModels(apiKey);
      if (selectedModels.length === 0) {
        throw new Error('No models selected. Cannot start chat.');
      }
      models = selectedModels;
    } else {
      // Use profile models directly for faster startup
      models = profile.models;
      console.log(chalk.green(`Using models from profile "${profileName}"`));
    }
  }

  console.log(chalk.green('\nStarting parallel chat interface...'));
  console.log(chalk.cyan('Selected models:'), models.join(', '));
  console.log(chalk.gray('Press Ctrl+C to exit\n'));

  try {
    // Ensure stdin is in the right mode for Ink
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    // Start the Ink app with explicit stdin/stdout
    const { unmount, waitUntilExit } = render(
      React.createElement(App, {
        apiKey,
        models,
        profileName
      }),
      {
        stdin: process.stdin,
        stdout: process.stdout,
        stderr: process.stderr,
        exitOnCtrlC: true
      }
    );

    // Wait for the app to exit
    await waitUntilExit();
  } catch (error) {
    console.error(chalk.red('Error starting React app:'), error);
    console.error(chalk.yellow('Falling back to legacy chat interface...'));
    
    // Import and use the legacy chat
    const { startChat } = await import('./chat.js');
    await startChat(apiKey, { profile: profileName });
  }
}

async function selectModels(apiKey: string): Promise<string[]> {
  const modelManager = new ModelManager(apiKey);
  
  try {
    // Ask if user wants multiple models for parallel chat
    const { wantMultiple } = await inquirer.prompt<{ wantMultiple: boolean }>([
      {
        type: 'confirm',
        name: 'wantMultiple',
        message: 'Do you want to select multiple models for parallel comparison?',
        default: true
      }
    ]);

    // Get selection mode
    const { selectionMode } = await inquirer.prompt<{ selectionMode: 'browse' | 'search' | 'all' }>([
      {
        type: 'list',
        name: 'selectionMode',
        message: 'How would you like to select models?',
        choices: [
          { name: 'Browse by organization', value: 'browse' },
          { name: 'Search models', value: 'search' },
          { name: 'View all models', value: 'all' }
        ]
      }
    ]);

    let models: any[] = [];
    
    if (selectionMode === 'browse') {
      const organizations = await modelManager.getOrganizations();
      const { selectedOrg } = await inquirer.prompt<{ selectedOrg: string }>([
        {
          type: 'list',
          name: 'selectedOrg',
          message: 'Select an organization:',
          choices: organizations,
          pageSize: 15
        }
      ]);
      
      const grouped = await modelManager.getModelsByOrganization();
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
      
      models = await modelManager.searchModels(searchQuery);
      
      if (models.length === 0) {
        console.log(chalk.yellow('No models found matching your search.'));
        return [];
      }
    } else {
      models = await modelManager.listModels();
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

    if (wantMultiple) {
      const { selectedModels } = await inquirer.prompt<{ selectedModels: string[] }>([
        {
          type: 'checkbox',
          name: 'selectedModels',
          message: 'Select models (use space to select, enter to confirm):',
          choices,
          pageSize: 15,
          validate: input => input.length > 0 || 'Please select at least one model'
        }
      ]);

      return selectedModels;
    } else {
      const { selectedModel } = await inquirer.prompt<{ selectedModel: string }>([
        {
          type: 'list',
          name: 'selectedModel',
          message: 'Select a model:',
          choices,
          pageSize: 15
        }
      ]);

      return [selectedModel];
    }
  } catch (error) {
    console.error(chalk.red('Error selecting models:', (error as Error).message));
    return [];
  }
}
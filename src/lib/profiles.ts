import configManager from './config.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ModelManager } from './models.js';
import type { Profile, Model } from '../types/index.js';

export class ProfileManager {
  async createProfile(name: string): Promise<void> {
    const profiles = configManager.getAllProfiles();
    
    if (profiles.includes(name)) {
      throw new Error(`Profile '${name}' already exists`);
    }

    // Ask how user wants to select models
    const { selectionMethod } = await inquirer.prompt<{ selectionMethod: string }>([
      {
        type: 'list',
        name: 'selectionMethod',
        message: 'How would you like to select models?',
        choices: [
          { name: 'Browse by organization', value: 'organization' },
          { name: 'Enter model IDs manually', value: 'manual' },
          { name: 'Search for models', value: 'search' }
        ]
      }
    ]);

    let selectedModels: string[] = [];

    if (selectionMethod === 'organization') {
      const apiKey = configManager.getApiKey();
      if (!apiKey) {
        throw new Error('No API key found. Please run: orb config set-key <your-key>');
      }

      const modelManager = new ModelManager(apiKey);
      const organizations = await modelManager.getOrganizations();

      // Let user select multiple organizations
      const { selectedOrgs } = await inquirer.prompt<{ selectedOrgs: string[] }>([
        {
          type: 'checkbox',
          name: 'selectedOrgs',
          message: 'Select organizations (space to select, enter to confirm):',
          choices: organizations.map(org => ({
            name: org,
            value: org
          })),
          validate: (input: string[]) => input.length > 0 || 'Please select at least one organization'
        }
      ]);

      // For each selected organization, let user pick models
      const grouped = await modelManager.getModelsByOrganization();
      
      for (const org of selectedOrgs) {
        const orgModels = grouped.get(org) || [];
        if (orgModels.length === 0) continue;

        console.log(chalk.bold.cyan(`\n${org} Models:`));
        
        const { orgSelectedModels } = await inquirer.prompt<{ orgSelectedModels: string[] }>([
          {
            type: 'checkbox',
            name: 'orgSelectedModels',
            message: `Select models from ${org}:`,
            choices: orgModels.map(model => ({
              name: `${model.id}${this.isFreeModel(model) ? chalk.green(' (free)') : ''} - ${model.context_length ? `${model.context_length.toLocaleString()} tokens` : 'N/A'}`,
              value: model.id,
              short: model.id
            })),
            pageSize: 10
          }
        ]);

        selectedModels.push(...orgSelectedModels);
      }
    } else if (selectionMethod === 'search') {
      const apiKey = configManager.getApiKey();
      if (!apiKey) {
        throw new Error('No API key found. Please run: orb config set-key <your-key>');
      }

      const { searchQuery } = await inquirer.prompt<{ searchQuery: string }>([
        {
          type: 'input',
          name: 'searchQuery',
          message: 'Enter search query:',
          validate: (input: string) => input.trim().length > 0 || 'Please enter a search query'
        }
      ]);

      const modelManager = new ModelManager(apiKey);
      const searchResults = await modelManager.searchModels(searchQuery);

      if (searchResults.length === 0) {
        console.log(chalk.yellow('No models found. Falling back to manual entry.'));
      } else {
        const { searchSelectedModels } = await inquirer.prompt<{ searchSelectedModels: string[] }>([
          {
            type: 'checkbox',
            name: 'searchSelectedModels',
            message: 'Select models from search results:',
            choices: searchResults.map(model => ({
              name: `${model.id}${this.isFreeModel(model) ? chalk.green(' (free)') : ''} - ${model.context_length ? `${model.context_length.toLocaleString()} tokens` : 'N/A'}`,
              value: model.id,
              short: model.id
            })),
            pageSize: 10
          }
        ]);

        selectedModels = searchSelectedModels;
      }
    }
    
    if (selectionMethod === 'manual' || selectedModels.length === 0) {
      const { manualModels } = await inquirer.prompt<{ manualModels: string }>([
        {
          type: 'input',
          name: 'manualModels',
          message: 'Enter model IDs (comma-separated):',
          default: selectedModels.length > 0 ? selectedModels.join(', ') : 'anthropic/claude-3-sonnet-20240229',
          filter: (input: string) => input.split(',').map(m => m.trim()).filter(m => m),
          transformer: (input: string) => input
        }
      ]);
      selectedModels = manualModels as unknown as string[];
    }

    const profileSettings = await inquirer.prompt<Omit<Profile, 'models'>>([
      {
        type: 'number',
        name: 'temperature',
        message: 'Temperature (0-2):',
        default: 0.7,
        validate: (input: number) => input >= 0 && input <= 2
      },
      {
        type: 'number',
        name: 'maxTokens',
        message: 'Max tokens:',
        default: 4000,
        validate: (input: number) => input > 0
      }
    ]);

    const profile: Profile = {
      models: selectedModels,
      ...profileSettings
    };

    await configManager.createProfile(name, profile);
    console.log(chalk.green(`Profile '${name}' created successfully with ${selectedModels.length} model(s)`));
  }

  private isFreeModel(model: Model): boolean {
    if (!model.pricing) return true;
    return model.pricing.prompt === 0 && model.pricing.completion === 0;
  }

  async listProfiles(): Promise<void> {
    const profiles = configManager.getAllProfiles();
    const config = configManager.getConfig();
    const defaultProfile = config.defaultProfile;
    
    console.log(chalk.bold('Available profiles:'));
    
    for (const profileName of profiles) {
      const profile = configManager.getProfile(profileName);
      if (!profile) continue;
      
      const isDefault = profileName === defaultProfile;
      
      console.log();
      console.log(chalk.cyan(profileName) + (isDefault ? chalk.green(' (default)') : ''));
      console.log(`  Models: ${profile.models.join(', ')}`);
      console.log(`  Temperature: ${profile.temperature}`);
      console.log(`  Max Tokens: ${profile.maxTokens}`);
    }
  }

  async editProfile(name: string): Promise<void> {
    const profile = configManager.getProfile(name);
    
    if (!profile) {
      throw new Error(`Profile '${name}' does not exist`);
    }

    console.log(chalk.cyan(`Current models: ${profile.models.join(', ')}`));

    // Ask if user wants to change models
    const { changeModels } = await inquirer.prompt<{ changeModels: boolean }>([
      {
        type: 'confirm',
        name: 'changeModels',
        message: 'Do you want to change the models?',
        default: false
      }
    ]);

    let selectedModels = profile.models;

    if (changeModels) {
      // Ask how user wants to select models
      const { selectionMethod } = await inquirer.prompt<{ selectionMethod: string }>([
        {
          type: 'list',
          name: 'selectionMethod',
          message: 'How would you like to select models?',
          choices: [
            { name: 'Browse by organization', value: 'organization' },
            { name: 'Enter model IDs manually', value: 'manual' },
            { name: 'Search for models', value: 'search' },
            { name: 'Keep current models', value: 'keep' }
          ]
        }
      ]);

      if (selectionMethod === 'organization') {
        const apiKey = configManager.getApiKey();
        if (!apiKey) {
          throw new Error('No API key found. Please run: orb config set-key <your-key>');
        }

        const modelManager = new ModelManager(apiKey);
        const organizations = await modelManager.getOrganizations();

        // Let user select multiple organizations
        const { selectedOrgs } = await inquirer.prompt<{ selectedOrgs: string[] }>([
          {
            type: 'checkbox',
            name: 'selectedOrgs',
            message: 'Select organizations (space to select, enter to confirm):',
            choices: organizations.map(org => ({
              name: org,
              value: org
            })),
            validate: (input: string[]) => input.length > 0 || 'Please select at least one organization'
          }
        ]);

        // For each selected organization, let user pick models
        const grouped = await modelManager.getModelsByOrganization();
        selectedModels = [];
        
        for (const org of selectedOrgs) {
          const orgModels = grouped.get(org) || [];
          if (orgModels.length === 0) continue;

          console.log(chalk.bold.cyan(`\n${org} Models:`));
          
          const { orgSelectedModels } = await inquirer.prompt<{ orgSelectedModels: string[] }>([
            {
              type: 'checkbox',
              name: 'orgSelectedModels',
              message: `Select models from ${org}:`,
              choices: orgModels.map(model => ({
                name: `${model.id}${this.isFreeModel(model) ? chalk.green(' (free)') : ''} - ${model.context_length ? `${model.context_length.toLocaleString()} tokens` : 'N/A'}`,
                value: model.id,
                short: model.id,
                checked: profile.models.includes(model.id)
              })),
              pageSize: 10
            }
          ]);

          selectedModels.push(...orgSelectedModels);
        }
      } else if (selectionMethod === 'search') {
        const apiKey = configManager.getApiKey();
        if (!apiKey) {
          throw new Error('No API key found. Please run: orb config set-key <your-key>');
        }

        const { searchQuery } = await inquirer.prompt<{ searchQuery: string }>([
          {
            type: 'input',
            name: 'searchQuery',
            message: 'Enter search query:',
            validate: (input: string) => input.trim().length > 0 || 'Please enter a search query'
          }
        ]);

        const modelManager = new ModelManager(apiKey);
        const searchResults = await modelManager.searchModels(searchQuery);

        if (searchResults.length === 0) {
          console.log(chalk.yellow('No models found. Keeping current models.'));
        } else {
          const { searchSelectedModels } = await inquirer.prompt<{ searchSelectedModels: string[] }>([
            {
              type: 'checkbox',
              name: 'searchSelectedModels',
              message: 'Select models from search results:',
              choices: searchResults.map(model => ({
                name: `${model.id}${this.isFreeModel(model) ? chalk.green(' (free)') : ''} - ${model.context_length ? `${model.context_length.toLocaleString()} tokens` : 'N/A'}`,
                value: model.id,
                short: model.id,
                checked: profile.models.includes(model.id)
              })),
              pageSize: 10
            }
          ]);

          selectedModels = searchSelectedModels;
        }
      } else if (selectionMethod === 'manual') {
        const { manualModels } = await inquirer.prompt<{ manualModels: string }>([
          {
            type: 'input',
            name: 'manualModels',
            message: 'Enter model IDs (comma-separated):',
            default: profile.models.join(', '),
            filter: (input: string) => input.split(',').map(m => m.trim()).filter(m => m),
            transformer: (input: string) => input
          }
        ]);
        selectedModels = manualModels as unknown as string[];
      }
    }

    const profileSettings = await inquirer.prompt<Omit<Profile, 'models'>>([
      {
        type: 'number',
        name: 'temperature',
        message: 'Temperature (0-2):',
        default: profile.temperature,
        validate: (input: number) => input >= 0 && input <= 2
      },
      {
        type: 'number',
        name: 'maxTokens',
        message: 'Max tokens:',
        default: profile.maxTokens,
        validate: (input: number) => input > 0
      }
    ]);

    const updatedProfile: Profile = {
      models: selectedModels,
      ...profileSettings
    };

    await configManager.updateProfile(name, updatedProfile);
    console.log(chalk.green(`Profile '${name}' updated successfully`));
  }

  async deleteProfile(name: string): Promise<void> {
    const { confirmDelete } = await inquirer.prompt<{ confirmDelete: boolean }>([
      {
        type: 'confirm',
        name: 'confirmDelete',
        message: `Are you sure you want to delete profile '${name}'?`,
        default: false
      }
    ]);

    if (confirmDelete) {
      await configManager.deleteProfile(name);
      console.log(chalk.green(`Profile '${name}' deleted successfully`));
    } else {
      console.log(chalk.yellow('Deletion cancelled'));
    }
  }

  async useProfile(name: string): Promise<void> {
    const profile = configManager.getProfile(name);
    
    if (!profile) {
      throw new Error(`Profile '${name}' does not exist`);
    }

    await configManager.setDefaultProfile(name);
    console.log(chalk.green(`Default profile set to '${name}'`));
  }

  getProfile(name?: string): Profile {
    if (name) {
      const profile = configManager.getProfile(name);
      if (!profile) {
        throw new Error(`Profile '${name}' does not exist`);
      }
      return profile;
    }
    
    return configManager.getDefaultProfile();
  }

  async selectProfile(): Promise<string> {
    const profiles = configManager.getAllProfiles();
    const config = configManager.getConfig();
    const currentDefault = config.defaultProfile;
    
    const { profile } = await inquirer.prompt<{ profile: string }>([
      {
        type: 'list',
        name: 'profile',
        message: 'Select a profile:',
        choices: profiles.map(p => ({
          name: p === currentDefault ? `${p} (current default)` : p,
          value: p
        }))
      }
    ]);
    
    return profile;
  }
}

export default new ProfileManager();
import configManager from './config.js';
import chalk from 'chalk';
import inquirer from 'inquirer';

export class ProfileManager {
  async createProfile(name) {
    const profiles = configManager.getAllProfiles();
    
    if (profiles.includes(name)) {
      throw new Error(`Profile '${name}' already exists`);
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'models',
        message: 'Enter model IDs (comma-separated):',
        default: 'anthropic/claude-3-sonnet-20240229',
        filter: (input) => input.split(',').map(m => m.trim()).filter(m => m)
      },
      {
        type: 'number',
        name: 'temperature',
        message: 'Temperature (0-2):',
        default: 0.7,
        validate: (input) => input >= 0 && input <= 2
      },
      {
        type: 'number',
        name: 'maxTokens',
        message: 'Max tokens:',
        default: 4000,
        validate: (input) => input > 0
      }
    ]);

    await configManager.createProfile(name, answers);
    console.log(chalk.green(`Profile '${name}' created successfully`));
  }

  async listProfiles() {
    const profiles = configManager.getAllProfiles();
    const defaultProfile = configManager.config.defaultProfile;
    
    console.log(chalk.bold('Available profiles:'));
    
    for (const profileName of profiles) {
      const profile = configManager.getProfile(profileName);
      const isDefault = profileName === defaultProfile;
      
      console.log();
      console.log(chalk.cyan(profileName) + (isDefault ? chalk.green(' (default)') : ''));
      console.log(`  Models: ${profile.models.join(', ')}`);
      console.log(`  Temperature: ${profile.temperature}`);
      console.log(`  Max Tokens: ${profile.maxTokens}`);
    }
  }

  async editProfile(name) {
    const profile = configManager.getProfile(name);
    
    if (!profile) {
      throw new Error(`Profile '${name}' does not exist`);
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'models',
        message: 'Enter model IDs (comma-separated):',
        default: profile.models.join(', '),
        filter: (input) => input.split(',').map(m => m.trim()).filter(m => m)
      },
      {
        type: 'number',
        name: 'temperature',
        message: 'Temperature (0-2):',
        default: profile.temperature,
        validate: (input) => input >= 0 && input <= 2
      },
      {
        type: 'number',
        name: 'maxTokens',
        message: 'Max tokens:',
        default: profile.maxTokens,
        validate: (input) => input > 0
      }
    ]);

    await configManager.updateProfile(name, answers);
    console.log(chalk.green(`Profile '${name}' updated successfully`));
  }

  async deleteProfile(name) {
    const confirm = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'delete',
        message: `Are you sure you want to delete profile '${name}'?`,
        default: false
      }
    ]);

    if (confirm.delete) {
      await configManager.deleteProfile(name);
      console.log(chalk.green(`Profile '${name}' deleted successfully`));
    } else {
      console.log(chalk.yellow('Deletion cancelled'));
    }
  }

  async useProfile(name) {
    const profile = configManager.getProfile(name);
    
    if (!profile) {
      throw new Error(`Profile '${name}' does not exist`);
    }

    await configManager.setDefaultProfile(name);
    console.log(chalk.green(`Default profile set to '${name}'`));
  }

  getProfile(name) {
    if (name) {
      const profile = configManager.getProfile(name);
      if (!profile) {
        throw new Error(`Profile '${name}' does not exist`);
      }
      return profile;
    }
    
    return configManager.getDefaultProfile();
  }

  async selectProfile() {
    const profiles = configManager.getAllProfiles();
    const currentDefault = configManager.config.defaultProfile;
    
    const { profile } = await inquirer.prompt([
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
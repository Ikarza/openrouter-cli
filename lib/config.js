import { promises as fs } from 'fs';
import { CONFIG_DIR, CONFIG_FILE, encrypt, decrypt } from './utils.js';
import chalk from 'chalk';

const DEFAULT_CONFIG = {
  apiKey: null,
  defaultProfile: 'default',
  profiles: {
    default: {
      models: ['anthropic/claude-3-sonnet-20240229'],
      temperature: 0.7,
      maxTokens: 4000
    }
  },
  lastUsed: new Date().toISOString()
};

export class ConfigManager {
  constructor() {
    this.config = null;
  }

  async init() {
    await this.ensureConfigDir();
    await this.load();
  }

  async ensureConfigDir() {
    try {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (error) {
      console.error(chalk.red('Failed to create config directory:', error.message));
    }
  }

  async load() {
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf8');
      this.config = JSON.parse(data);
      
      if (this.config.apiKey) {
        this.config.apiKey = decrypt(this.config.apiKey);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.config = { ...DEFAULT_CONFIG };
        await this.save();
      } else {
        console.error(chalk.red('Failed to load config:', error.message));
        this.config = { ...DEFAULT_CONFIG };
      }
    }
  }

  async save() {
    try {
      const configToSave = { ...this.config };
      
      if (configToSave.apiKey) {
        configToSave.apiKey = encrypt(configToSave.apiKey);
      }
      
      configToSave.lastUsed = new Date().toISOString();
      
      await fs.writeFile(CONFIG_FILE, JSON.stringify(configToSave, null, 2));
    } catch (error) {
      console.error(chalk.red('Failed to save config:', error.message));
      throw error;
    }
  }

  async setApiKey(apiKey) {
    this.config.apiKey = apiKey;
    await this.save();
  }

  getApiKey() {
    return this.config.apiKey;
  }

  async removeApiKey() {
    this.config.apiKey = null;
    await this.save();
  }

  getProfile(name) {
    return this.config.profiles[name];
  }

  async createProfile(name, profile) {
    this.config.profiles[name] = profile;
    await this.save();
  }

  async updateProfile(name, updates) {
    if (!this.config.profiles[name]) {
      throw new Error(`Profile '${name}' does not exist`);
    }
    this.config.profiles[name] = { ...this.config.profiles[name], ...updates };
    await this.save();
  }

  async deleteProfile(name) {
    if (name === 'default') {
      throw new Error('Cannot delete the default profile');
    }
    delete this.config.profiles[name];
    if (this.config.defaultProfile === name) {
      this.config.defaultProfile = 'default';
    }
    await this.save();
  }

  async setDefaultProfile(name) {
    if (!this.config.profiles[name]) {
      throw new Error(`Profile '${name}' does not exist`);
    }
    this.config.defaultProfile = name;
    await this.save();
  }

  getDefaultProfile() {
    return this.config.profiles[this.config.defaultProfile];
  }

  getAllProfiles() {
    return Object.keys(this.config.profiles);
  }

  getConfig() {
    return this.config;
  }

  async reset() {
    this.config = { ...DEFAULT_CONFIG };
    await this.save();
  }
}

export default new ConfigManager();
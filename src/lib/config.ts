import { promises as fs } from 'fs';
import { CONFIG_DIR, CONFIG_FILE, encrypt, decrypt } from './utils.js';
import chalk from 'chalk';
import type { Config, Profile } from '../types/index.js';

const DEFAULT_CONFIG: Config = {
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
  private config: Config | null = null;

  async init(): Promise<void> {
    await this.ensureConfigDir();
    await this.load();
  }

  private async ensureConfigDir(): Promise<void> {
    try {
      await fs.mkdir(CONFIG_DIR, { recursive: true });
    } catch (error) {
      console.error(chalk.red('Failed to create config directory:', (error as Error).message));
    }
  }

  private async load(): Promise<void> {
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf8');
      this.config = JSON.parse(data) as Config;
      
      if (this.config.apiKey) {
        this.config.apiKey = decrypt(this.config.apiKey);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.config = { ...DEFAULT_CONFIG };
        await this.save();
      } else {
        console.error(chalk.red('Failed to load config:', (error as Error).message));
        this.config = { ...DEFAULT_CONFIG };
      }
    }
  }

  private async save(): Promise<void> {
    if (!this.config) throw new Error('Config not initialized');
    
    try {
      const configToSave = { ...this.config };
      
      if (configToSave.apiKey) {
        configToSave.apiKey = encrypt(configToSave.apiKey);
      }
      
      configToSave.lastUsed = new Date().toISOString();
      
      await fs.writeFile(CONFIG_FILE, JSON.stringify(configToSave, null, 2));
    } catch (error) {
      console.error(chalk.red('Failed to save config:', (error as Error).message));
      throw error;
    }
  }

  async setApiKey(apiKey: string): Promise<void> {
    if (!this.config) throw new Error('Config not initialized');
    this.config.apiKey = apiKey;
    await this.save();
  }

  getApiKey(): string | null {
    if (!this.config) throw new Error('Config not initialized');
    return this.config.apiKey;
  }

  async removeApiKey(): Promise<void> {
    if (!this.config) throw new Error('Config not initialized');
    this.config.apiKey = null;
    await this.save();
  }

  getProfile(name: string): Profile | undefined {
    if (!this.config) throw new Error('Config not initialized');
    return this.config.profiles[name];
  }

  async createProfile(name: string, profile: Profile): Promise<void> {
    if (!this.config) throw new Error('Config not initialized');
    this.config.profiles[name] = profile;
    await this.save();
  }

  async updateProfile(name: string, updates: Partial<Profile>): Promise<void> {
    if (!this.config) throw new Error('Config not initialized');
    
    const profile = this.config.profiles[name];
    if (!profile) {
      throw new Error(`Profile '${name}' does not exist`);
    }
    
    this.config.profiles[name] = { ...profile, ...updates };
    await this.save();
  }

  async deleteProfile(name: string): Promise<void> {
    if (!this.config) throw new Error('Config not initialized');
    
    if (name === 'default') {
      throw new Error('Cannot delete the default profile');
    }
    
    delete this.config.profiles[name];
    
    if (this.config.defaultProfile === name) {
      this.config.defaultProfile = 'default';
    }
    
    await this.save();
  }

  async setDefaultProfile(name: string): Promise<void> {
    if (!this.config) throw new Error('Config not initialized');
    
    if (!this.config.profiles[name]) {
      throw new Error(`Profile '${name}' does not exist`);
    }
    
    this.config.defaultProfile = name;
    await this.save();
  }

  getDefaultProfile(): Profile {
    if (!this.config) throw new Error('Config not initialized');
    
    const profile = this.config.profiles[this.config.defaultProfile];
    if (!profile) {
      throw new Error(`Default profile '${this.config.defaultProfile}' not found`);
    }
    
    return profile;
  }

  getAllProfiles(): string[] {
    if (!this.config) throw new Error('Config not initialized');
    return Object.keys(this.config.profiles);
  }

  getConfig(): Config {
    if (!this.config) throw new Error('Config not initialized');
    return this.config;
  }

  async reset(): Promise<void> {
    this.config = { ...DEFAULT_CONFIG };
    await this.save();
  }
}

export default new ConfigManager();
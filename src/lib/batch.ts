import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import * as readline from 'readline';
import { OpenRouterClient } from './api';
import { ConfigManager } from './config';
import { ModelInfo } from '../types';
import chalk from 'chalk';
import ora from 'ora';

export interface BatchResult {
  prompt: string;
  responses: {
    model: string;
    response: string;
    error?: string;
  }[];
  timestamp: Date;
}

export class BatchProcessor {
  private client: OpenRouterClient;
  private config: ConfigManager;

  constructor() {
    this.config = new ConfigManager();
    this.client = new OpenRouterClient(this.config.getApiKey());
  }

  async processFile(
    filePath: string,
    models: string[],
    options: {
      temperature?: number;
      maxTokens?: number;
      output?: string;
      format?: 'json' | 'csv' | 'markdown';
    } = {}
  ): Promise<BatchResult[]> {
    const prompts = await this.readPromptsFromFile(filePath);
    const results: BatchResult[] = [];
    const spinner = ora(`Processing ${prompts.length} prompts...`).start();

    for (let i = 0; i < prompts.length; i++) {
      spinner.text = `Processing prompt ${i + 1}/${prompts.length}...`;
      
      try {
        const result = await this.processPrompt(
          prompts[i],
          models,
          options.temperature,
          options.maxTokens
        );
        results.push(result);
      } catch (error) {
        spinner.fail(`Error processing prompt ${i + 1}: ${error}`);
        results.push({
          prompt: prompts[i],
          responses: models.map(model => ({
            model,
            response: '',
            error: error instanceof Error ? error.message : 'Unknown error'
          })),
          timestamp: new Date()
        });
      }
    }

    spinner.succeed(`Processed ${prompts.length} prompts`);

    if (options.output) {
      await this.saveResults(results, options.output, options.format || 'json');
      console.log(chalk.green(`✓ Results saved to ${options.output}`));
    }

    return results;
  }

  private async readPromptsFromFile(filePath: string): Promise<string[]> {
    const prompts: string[] = [];
    const fileStream = createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        prompts.push(trimmed);
      }
    }

    return prompts;
  }

  private async processPrompt(
    prompt: string,
    models: string[],
    temperature?: number,
    maxTokens?: number
  ): Promise<BatchResult> {
    const responses = await Promise.all(
      models.map(async (model) => {
        try {
          const response = await this.client.chat(
            [{ role: 'user', content: prompt }],
            model,
            false,
            temperature,
            maxTokens
          );
          return { model, response };
        } catch (error) {
          return {
            model,
            response: '',
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );

    return {
      prompt,
      responses,
      timestamp: new Date()
    };
  }

  private async saveResults(
    results: BatchResult[],
    outputPath: string,
    format: 'json' | 'csv' | 'markdown'
  ): Promise<void> {
    switch (format) {
      case 'json':
        await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
        break;
      
      case 'csv':
        const csv = this.resultsToCSV(results);
        await fs.writeFile(outputPath, csv);
        break;
      
      case 'markdown':
        const markdown = this.resultsToMarkdown(results);
        await fs.writeFile(outputPath, markdown);
        break;
    }
  }

  private resultsToCSV(results: BatchResult[]): string {
    const headers = ['Timestamp', 'Prompt', 'Model', 'Response', 'Error'];
    const rows = [headers.join(',')];

    for (const result of results) {
      for (const response of result.responses) {
        const row = [
          result.timestamp.toISOString(),
          this.escapeCSV(result.prompt),
          response.model,
          this.escapeCSV(response.response),
          response.error || ''
        ];
        rows.push(row.join(','));
      }
    }

    return rows.join('\n');
  }

  private resultsToMarkdown(results: BatchResult[]): string {
    let markdown = '# Batch Processing Results\n\n';
    markdown += `Generated at: ${new Date().toISOString()}\n\n`;

    for (const result of results) {
      markdown += `## Prompt\n\n${result.prompt}\n\n`;
      markdown += `*Timestamp: ${result.timestamp.toISOString()}*\n\n`;
      
      for (const response of result.responses) {
        markdown += `### ${response.model}\n\n`;
        if (response.error) {
          markdown += `**Error:** ${response.error}\n\n`;
        } else {
          markdown += `${response.response}\n\n`;
        }
        markdown += '---\n\n';
      }
    }

    return markdown;
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

export async function chainPrompts(
  initialPrompt: string,
  models: string[],
  chainSteps: string[],
  options: {
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<BatchResult[]> {
  const processor = new BatchProcessor();
  const results: BatchResult[] = [];
  let currentInput = initialPrompt;

  const spinner = ora('Processing chain...').start();

  for (let i = 0; i < chainSteps.length; i++) {
    spinner.text = `Processing step ${i + 1}/${chainSteps.length}...`;
    
    const prompt = chainSteps[i].replace(/\{input\}/g, currentInput);
    const result = await processor['processPrompt'](
      prompt,
      models,
      options.temperature,
      options.maxTokens
    );
    
    results.push(result);
    
    // Use the first successful response as input for the next step
    const successfulResponse = result.responses.find(r => !r.error);
    if (successfulResponse) {
      currentInput = successfulResponse.response;
    } else {
      spinner.fail(`Chain failed at step ${i + 1}: No successful responses`);
      break;
    }
  }

  spinner.succeed('Chain processing complete');
  return results;
}
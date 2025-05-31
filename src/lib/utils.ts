import crypto from 'crypto';
import { homedir } from 'os';
import { join } from 'path';
import chalk from 'chalk';

export const CONFIG_DIR = join(homedir(), '.orb-cli');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const ENCRYPTION_KEY = 'orb-cli-simple-key-2025';

export function encrypt(text: string): string {
  // Note: createCipher is deprecated, but keeping for backward compatibility
  // In production, use createCipheriv with a proper IV
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = Buffer.alloc(16, 0); // Simple IV for backward compatibility
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decrypt(text: string): string {
  try {
    // Note: createDecipher is deprecated, but keeping for backward compatibility
    // In production, use createDecipheriv with a proper IV
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = Buffer.alloc(16, 0); // Simple IV for backward compatibility
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt API key. It may be corrupted.');
  }
}

export function wrapText(text: string, width: number = 80): string {
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  
  for (const paragraph of paragraphs) {
    if (paragraph.length <= width) {
      lines.push(paragraph);
      continue;
    }
    
    const words = paragraph.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      if (currentLine.length + word.length + 1 > width) {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? `${currentLine} ${word}` : word;
      }
    }
    
    if (currentLine) lines.push(currentLine);
  }
  
  return lines.join('\n');
}

export function formatModelResponse(model: string, response: string, width: number = 80): string {
  // Calculate dynamic width based on terminal size
  const terminalWidth = process.stdout.columns || 80;
  const effectiveWidth = Math.min(width, terminalWidth);
  const boxWidth = effectiveWidth - 2; // Account for terminal padding
  
  // Create the top border with model name
  const modelDisplay = ` ${model} `;
  const remainingWidth = boxWidth - modelDisplay.length - 2;
  const leftPadding = Math.floor(remainingWidth / 2);
  const rightPadding = remainingWidth - leftPadding;
  
  const topBorder = `┌${'─'.repeat(leftPadding)}${modelDisplay}${'─'.repeat(rightPadding)}┐`;
  const bottomBorder = `└${'─'.repeat(boxWidth - 2)}┘`;
  
  // Wrap and format the response content
  const wrappedResponse = wrapText(response, boxWidth - 4);
  const lines = wrappedResponse.split('\n').map(line => {
    const paddedLine = line.padEnd(boxWidth - 4);
    return `│ ${paddedLine} │`;
  });
  
  // Apply color based on model provider
  let coloredOutput: string;
  if (model.includes('claude')) {
    coloredOutput = chalk.cyan([topBorder, ...lines, bottomBorder].join('\n'));
  } else if (model.includes('gpt')) {
    coloredOutput = chalk.green([topBorder, ...lines, bottomBorder].join('\n'));
  } else if (model.includes('gemini')) {
    coloredOutput = chalk.blue([topBorder, ...lines, bottomBorder].join('\n'));
  } else if (model.includes('llama')) {
    coloredOutput = chalk.magenta([topBorder, ...lines, bottomBorder].join('\n'));
  } else {
    coloredOutput = chalk.yellow([topBorder, ...lines, bottomBorder].join('\n'));
  }
  
  return coloredOutput;
}

export function formatStreamingBox(model: string, width: number = 80): {
  printHeader: () => void;
  printChunk: (chunk: string) => void;
  printFooter: () => void;
} {
  const terminalWidth = process.stdout.columns || 80;
  const effectiveWidth = Math.min(width, terminalWidth);
  const boxWidth = effectiveWidth - 2;
  
  // Create the top border with model name
  const modelDisplay = ` ${model} `;
  const remainingWidth = boxWidth - modelDisplay.length - 2;
  const leftPadding = Math.floor(remainingWidth / 2);
  const rightPadding = remainingWidth - leftPadding;
  
  const topBorder = `┌${'─'.repeat(leftPadding)}${modelDisplay}${'─'.repeat(rightPadding)}┐`;
  const bottomBorder = `└${'─'.repeat(boxWidth - 2)}┘`;
  
  let currentLine = '';
  let isFirstChunk = true;
  
  const getColor = () => {
    if (model.includes('claude')) return chalk.cyan;
    if (model.includes('gpt')) return chalk.green;
    if (model.includes('gemini')) return chalk.blue;
    if (model.includes('llama')) return chalk.magenta;
    return chalk.yellow;
  };
  
  const color = getColor();
  
  return {
    printHeader: () => {
      console.log(color(topBorder));
    },
    
    printChunk: (chunk: string) => {
      const chars = chunk.split('');
      
      for (const char of chars) {
        if (char === '\n') {
          // Print current line with padding
          const paddedLine = currentLine.padEnd(boxWidth - 4);
          if (isFirstChunk) {
            process.stdout.write(color(`│ ${paddedLine} │\n`));
            isFirstChunk = false;
          } else {
            process.stdout.write(`\r${color(`│ ${paddedLine} │`)}\n`);
          }
          currentLine = '';
          isFirstChunk = true;
        } else {
          currentLine += char;
          // Check if we need to wrap
          if (currentLine.length >= boxWidth - 4) {
            const paddedLine = currentLine.padEnd(boxWidth - 4);
            if (isFirstChunk) {
              process.stdout.write(color(`│ ${paddedLine} │\n`));
              isFirstChunk = false;
            } else {
              process.stdout.write(`\r${color(`│ ${paddedLine} │`)}\n`);
            }
            currentLine = '';
            isFirstChunk = true;
          } else {
            // Update current line in place
            const paddedLine = currentLine.padEnd(boxWidth - 4);
            if (isFirstChunk) {
              process.stdout.write(color(`│ ${paddedLine} │`));
              isFirstChunk = false;
            } else {
              process.stdout.write(`\r${color(`│ ${paddedLine} │`)}`);
            }
          }
        }
      }
    },
    
    printFooter: () => {
      // Print any remaining content
      if (currentLine) {
        const paddedLine = currentLine.padEnd(boxWidth - 4);
        process.stdout.write(`\r${color(`│ ${paddedLine} │`)}\n`);
      }
      console.log(color(bottomBorder));
    }
  };
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function truncateText(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}


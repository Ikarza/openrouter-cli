import crypto from 'crypto';
import { homedir } from 'os';
import { join } from 'path';

export const CONFIG_DIR = join(homedir(), '.orb-cli');
export const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const ENCRYPTION_KEY = 'orb-cli-simple-key-2025';

export function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decrypt(text) {
  try {
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    throw new Error('Failed to decrypt API key. It may be corrupted.');
  }
}

export function wrapText(text, width = 80) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 > width) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines.join('\n');
}

export function formatModelResponse(model, response, width = 80) {
  const border = '─'.repeat(width - model.length - 4);
  const header = `┌─ ${model} ${border}┐`;
  const footer = `└${'─'.repeat(width - 2)}┘`;
  
  const wrappedResponse = wrapText(response, width - 4);
  const lines = wrappedResponse.split('\n').map(line => `│ ${line.padEnd(width - 4)} │`);
  
  return [header, ...lines, footer].join('\n');
}

export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}
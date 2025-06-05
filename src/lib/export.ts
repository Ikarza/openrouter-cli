import * as fs from 'fs/promises';
import { ChatMessage } from '../types';
import chalk from 'chalk';

export interface ExportOptions {
  format: 'json' | 'markdown' | 'html';
  includeMetadata?: boolean;
  syntaxHighlight?: boolean;
}

export class ConversationExporter {
  async exportConversation(
    messages: ChatMessage[],
    outputPath: string,
    options: ExportOptions
  ): Promise<void> {
    let content: string;

    switch (options.format) {
      case 'json':
        content = this.toJSON(messages, options.includeMetadata);
        break;
      case 'markdown':
        content = this.toMarkdown(messages, options.includeMetadata);
        break;
      case 'html':
        content = this.toHTML(messages, options);
        break;
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }

    await fs.writeFile(outputPath, content);
    console.log(chalk.green(`✓ Conversation exported to ${outputPath}`));
  }

  private toJSON(messages: ChatMessage[], includeMetadata: boolean = true): string {
    if (!includeMetadata) {
      return JSON.stringify(messages.map(m => ({
        role: m.role,
        content: m.content
      })), null, 2);
    }
    return JSON.stringify(messages, null, 2);
  }

  private toMarkdown(messages: ChatMessage[], includeMetadata: boolean = false): string {
    let markdown = '# Conversation Export\n\n';
    markdown += `*Exported at: ${new Date().toISOString()}*\n\n`;

    for (const message of messages) {
      const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
      markdown += `## ${role}\n\n`;
      
      if (includeMetadata && message.name) {
        markdown += `*Model: ${message.name}*\n\n`;
      }

      // Handle code blocks in content
      const processedContent = this.processMarkdownContent(message.content);
      markdown += `${processedContent}\n\n`;
      markdown += '---\n\n';
    }

    return markdown;
  }

  private processMarkdownContent(content: string): string {
    // Ensure code blocks are properly formatted
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    return content.replace(codeBlockRegex, (_match, lang, code) => {
      return `\`\`\`${lang || ''}\n${code.trim()}\n\`\`\``;
    });
  }

  private toHTML(messages: ChatMessage[], options: ExportOptions): string {
    const syntaxHighlightCSS = options.syntaxHighlight ? this.getSyntaxHighlightCSS() : '';
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Conversation Export</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .conversation {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
        }
        .user-message {
            background: #e3f2fd;
            border-left: 4px solid #2196f3;
        }
        .assistant-message {
            background: #f3e5f5;
            border-left: 4px solid #9c27b0;
        }
        .role {
            font-weight: bold;
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .metadata {
            font-size: 0.85em;
            color: #666;
            margin-bottom: 8px;
        }
        pre {
            background: #282c34;
            color: #abb2bf;
            padding: 16px;
            border-radius: 4px;
            overflow-x: auto;
        }
        code {
            background: #f5f5f5;
            padding: 2px 4px;
            border-radius: 3px;
            font-family: 'Consolas', 'Monaco', monospace;
        }
        pre code {
            background: none;
            padding: 0;
        }
        ${syntaxHighlightCSS}
    </style>
</head>
<body>
    <div class="conversation">
        <h1>Conversation Export</h1>
        <p class="metadata">Exported at: ${new Date().toISOString()}</p>
        
`;

    for (const message of messages) {
      const messageClass = message.role === 'user' ? 'user-message' : 'assistant-message';
      const roleIcon = message.role === 'user' ? '👤' : '🤖';
      const roleText = message.role === 'user' ? 'User' : 'Assistant';
      
      html += `
        <div class="message ${messageClass}">
            <div class="role">${roleIcon} ${roleText}</div>
`;
      
      if (options.includeMetadata && message.name) {
        html += `            <div class="metadata">Model: ${message.name}</div>\n`;
      }
      
      const processedContent = this.processHTMLContent(message.content, options.syntaxHighlight);
      html += `            <div class="content">${processedContent}</div>
        </div>
`;
    }

    html += `
    </div>
</body>
</html>`;

    return html;
  }

  private processHTMLContent(content: string, syntaxHighlight: boolean = false): string {
    // Escape HTML
    let processed = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Convert markdown code blocks to HTML
    processed = processed.replace(/```(\w+)?\n([\s\S]*?)```/g, (_match, lang, code) => {
      const trimmedCode = code.trim();
      if (syntaxHighlight && lang) {
        return `<pre><code class="language-${lang}">${this.highlightCode(trimmedCode, lang)}</code></pre>`;
      }
      return `<pre><code>${trimmedCode}</code></pre>`;
    });

    // Convert inline code
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Convert line breaks
    processed = processed.replace(/\n/g, '<br>');

    return processed;
  }

  private highlightCode(code: string, lang: string): string {
    // Basic syntax highlighting - in production, you'd use a library like Prism.js
    const keywords: { [key: string]: string[] } = {
      javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default'],
      typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'default', 'interface', 'type', 'enum'],
      python: ['def', 'return', 'if', 'else', 'elif', 'for', 'while', 'class', 'import', 'from', 'as', 'try', 'except', 'with'],
    };

    let highlighted = code;
    const langKeywords = keywords[lang.toLowerCase()] || [];

    // Highlight strings
    highlighted = highlighted.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '<span class="string">$&</span>');

    // Highlight keywords
    langKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span class="keyword">${keyword}</span>`);
    });

    // Highlight comments
    highlighted = highlighted.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
    highlighted = highlighted.replace(/(#.*$)/gm, '<span class="comment">$1</span>');

    return highlighted;
  }

  private getSyntaxHighlightCSS(): string {
    return `
        .keyword { color: #c678dd; font-weight: bold; }
        .string { color: #98c379; }
        .comment { color: #5c6370; font-style: italic; }
        .number { color: #d19a66; }
    `;
  }
}

export class ConversationImporter {
  async importFromChatGPT(filePath: string): Promise<ChatMessage[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    const messages: ChatMessage[] = [];
    
    // ChatGPT export format has conversations array
    if (data.conversations) {
      for (const conversation of data.conversations) {
        if (conversation.mapping) {
          const sortedMessages = this.extractChatGPTMessages(conversation.mapping);
          messages.push(...sortedMessages);
        }
      }
    }
    
    return messages;
  }

  private extractChatGPTMessages(mapping: any): ChatMessage[] {
    const messages: ChatMessage[] = [];
    const messageMap = new Map();

    // Build message map
    for (const [id, node] of Object.entries(mapping)) {
      if ((node as any).message) {
        messageMap.set(id, node);
      }
    }

    // Find root and traverse
    const visited = new Set<string>();
    for (const [id, _node] of messageMap.entries()) {
      if (!visited.has(id)) {
        this.traverseChatGPTMessages(id, messageMap, messages, visited);
      }
    }

    return messages;
  }

  private traverseChatGPTMessages(
    nodeId: string,
    messageMap: Map<string, any>,
    messages: ChatMessage[],
    visited: Set<string>
  ): void {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    const node = messageMap.get(nodeId);
    if (!node || !node.message) return;

    const message = node.message;
    if (message.author.role === 'user' || message.author.role === 'assistant') {
      messages.push({
        role: message.author.role,
        content: message.content.parts.join('\n')
      });
    }

    if (node.children) {
      for (const childId of node.children) {
        this.traverseChatGPTMessages(childId, messageMap, messages, visited);
      }
    }
  }

  async importFromClaude(filePath: string): Promise<ChatMessage[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    // Claude exports are typically in a simpler format
    if (Array.isArray(data)) {
      return data.filter(m => m.role === 'user' || m.role === 'assistant');
    } else if (data.messages) {
      return data.messages.filter((m: any) => m.role === 'user' || m.role === 'assistant');
    }
    
    throw new Error('Unrecognized Claude export format');
  }

  async importGeneric(filePath: string): Promise<ChatMessage[]> {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    if (Array.isArray(data)) {
      return data.filter(m => m.role && m.content);
    }
    
    throw new Error('Unrecognized conversation format');
  }
}
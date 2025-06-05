import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export class CodeIntegration {
  async readFileContent(filePath: string): Promise<string> {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  async getFileInfo(filePath: string): Promise<{
    content: string;
    language: string;
    fileName: string;
    size: number;
  }> {
    const content = await this.readFileContent(filePath);
    const stats = await fs.stat(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const language = this.detectLanguage(ext);
    
    return {
      content,
      language,
      fileName: path.basename(filePath),
      size: stats.size
    };
  }

  private detectLanguage(extension: string): string {
    const languageMap: { [key: string]: string } = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.cs': 'csharp',
      '.go': 'go',
      '.rs': 'rust',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.r': 'r',
      '.m': 'matlab',
      '.sql': 'sql',
      '.sh': 'bash',
      '.yml': 'yaml',
      '.yaml': 'yaml',
      '.json': 'json',
      '.xml': 'xml',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.md': 'markdown',
      '.rst': 'restructuredtext',
      '.tex': 'latex'
    };

    return languageMap[extension] || 'text';
  }

  formatFilePrompt(fileInfo: {
    content: string;
    language: string;
    fileName: string;
  }, userPrompt: string): string {
    return `File: ${fileInfo.fileName}
Language: ${fileInfo.language}

\`\`\`${fileInfo.language}
${fileInfo.content}
\`\`\`

${userPrompt}`;
  }

  async analyzeGitDiff(target: string = 'HEAD'): Promise<{
    diff: string;
    stats: string;
    files: string[];
  }> {
    try {
      // Check if we're in a git repository
      await execAsync('git rev-parse --git-dir');
      
      // Get the diff
      const { stdout: diff } = await execAsync(`git diff ${target}`);
      
      // Get diff stats
      const { stdout: stats } = await execAsync(`git diff --stat ${target}`);
      
      // Get list of changed files
      const { stdout: filesOutput } = await execAsync(`git diff --name-only ${target}`);
      const files = filesOutput.trim().split('\n').filter(f => f);
      
      return { diff, stats, files };
    } catch (error) {
      throw new Error(`Git operation failed: ${error}`);
    }
  }

  formatGitDiffPrompt(gitInfo: {
    diff: string;
    stats: string;
    files: string[];
  }, userPrompt: string): string {
    return `Git Diff Analysis (${gitInfo.files.length} files changed)

Files Changed:
${gitInfo.files.map(f => `- ${f}`).join('\n')}

Statistics:
${gitInfo.stats}

Diff:
\`\`\`diff
${gitInfo.diff}
\`\`\`

${userPrompt}`;
  }

  async getGitInfo(): Promise<{
    branch: string;
    lastCommit: string;
    status: string;
  }> {
    try {
      const { stdout: branch } = await execAsync('git branch --show-current');
      const { stdout: lastCommit } = await execAsync('git log -1 --oneline');
      const { stdout: status } = await execAsync('git status --short');
      
      return {
        branch: branch.trim(),
        lastCommit: lastCommit.trim(),
        status: status.trim() || 'Working tree clean'
      };
    } catch (error) {
      throw new Error(`Failed to get git info: ${error}`);
    }
  }

  async analyzeMultipleFiles(filePaths: string[]): Promise<{
    files: Array<{
      path: string;
      content: string;
      language: string;
    }>;
    summary: string;
  }> {
    const files = await Promise.all(
      filePaths.map(async (filePath) => {
        const info = await this.getFileInfo(filePath);
        return {
          path: filePath,
          content: info.content,
          language: info.language
        };
      })
    );

    const summary = `Analyzing ${files.length} files:
${files.map(f => `- ${f.path} (${f.language})`).join('\n')}`;

    return { files, summary };
  }

  formatMultipleFilesPrompt(analysis: {
    files: Array<{
      path: string;
      content: string;
      language: string;
    }>;
    summary: string;
  }, userPrompt: string): string {
    let prompt = `${analysis.summary}\n\n`;
    
    for (const file of analysis.files) {
      prompt += `File: ${file.path}\n`;
      prompt += `\`\`\`${file.language}\n${file.content}\n\`\`\`\n\n`;
    }
    
    prompt += userPrompt;
    return prompt;
  }
}
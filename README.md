# OpenRouter CLI (ORC)

A powerful command-line interface for interacting with multiple AI models through [OpenRouter](https://openrouter.ai's) unified API.

## Features

- 🤖 **Multi-Model Support**: Query multiple AI models simultaneously
- 💬 **Interactive Chat**: Engage in conversations with context retention
- 👤 **Profile Management**: Save and switch between different model configurations
- 🎨 **Beautiful Output**: Color-coded responses with model identification
- ⚡ **Streaming Responses**: Real-time streaming for immediate feedback
- 🔧 **Flexible Configuration**: Customize temperature, max tokens, and more
- 📝 **Template System**: Create reusable prompt templates for common tasks
- 🔄 **Batch Processing**: Process multiple prompts from files
- 🔗 **Prompt Chaining**: Chain outputs from one prompt as input to another
- 📤 **Export/Import**: Export conversations to multiple formats and import from other platforms
- 💻 **Code Integration**: Analyze code files and git diffs directly

## Installation

```bash
npm install -g openrouter-cli
```

After installation, the CLI will be available as `orc`.

## Quick Start

1. **Set your OpenRouter API key:**
   ```bash
   orc config set apiKey YOUR_API_KEY
   ```

2. **Ask a question:**
   ```bash
   orc ask "What is the meaning of life?"
   ```

3. **Start an interactive chat:**
   ```bash
   orc chat
   ```

## Commands

### Configuration

```bash
# Set API key
orc config set apiKey YOUR_API_KEY

# View current configuration
orc config get

# Set a specific configuration value
orc config set <key> <value>
```

### Asking Questions

```bash
# Ask a single question using default profile
orc ask "Your question here"

# Use a specific model
orc ask "Your question" --model claude-3-opus-20240229

# Use a specific profile
orc ask "Your question" --profile creative

# Use a template
orc ask "Review this code" --template code-review

# Include file content
orc ask "Explain this code" --file script.py

# Include multiple files
orc ask "Compare these implementations" --files file1.js file2.js
```

### Interactive Chat

```bash
# Start chat with default profile
orc chat

# Start chat with specific profile
orc chat --profile technical

# Start chat with specific model
orc chat --model gpt-4-turbo
```

**Chat Commands:**
- `/help` - Show available commands
- `/models` - List and select active models
- `/profile [name]` - Switch profile
- `/history` - Show conversation history
- `/clear` - Clear conversation history
- `/exit` - Exit chat

**Input Behavior:**
- Press Enter once to send single-line messages
- Press Enter on an empty line to start multiline mode
- In multiline mode, press Enter twice to send

### Model Management

```bash
# List all available models
orc models list

# Search for specific models
orc models search gpt

# Get detailed information about a model
orc models info gpt-4-turbo
```

### Profile Management

```bash
# List all profiles
orc profile list

# Create a new profile
orc profile create myprofile

# Update a profile
orc profile update myprofile

# Delete a profile
orc profile delete myprofile

# Set default profile
orc profile set-default myprofile
```

### Template Management

```bash
# Create a new template
orc template create code-review \
  --system "You are a code reviewer" \
  --prompt "Review the following code: {prompt}" \
  --models gpt-4-turbo claude-3-opus-20240229 \
  --temperature 0.7

# List all templates
orc template list

# Delete a template
orc template delete code-review
```

### Batch Processing

```bash
# Process prompts from a file (one prompt per line)
orc batch prompts.txt --models gpt-4-turbo claude-3-haiku-20240307

# Save results to a file
orc batch prompts.txt --output results.json

# Export as markdown
orc batch prompts.txt --output results.md --format markdown

# Export as CSV
orc batch prompts.txt --output results.csv --format csv
```

### Prompt Chaining

```bash
# Chain prompts together (interactive)
orc chain --steps "Summarize this: {input}" "Extract key points: {input}" "Create action items: {input}"

# The chain command will:
# 1. Ask for initial input
# 2. Process through each step
# 3. Use output from each step as input for the next
```

### Export/Import Conversations

```bash
# Export conversation to different formats
orc export markdown conversation.md --conversation chat-history.json
orc export html conversation.html --conversation chat-history.json --syntax-highlight
orc export json conversation.json --conversation chat-history.json --include-metadata

# Import from other platforms
orc import chatgpt-export.json --type chatgpt
orc import claude-export.json --type claude
orc import generic-chat.json --type generic
```

### Code Integration

```bash
# Analyze git changes
orc git-diff              # Analyze changes since last commit
orc git-diff HEAD~3       # Analyze last 3 commits
orc git-diff main         # Compare with main branch

# The git-diff command will:
# 1. Show changed files and statistics
# 2. Ask what you want to know about the changes
# 3. Provide AI analysis of the diff
```

## Profiles

Profiles allow you to save different configurations for different use cases:

- **Models**: List of models to query
- **Temperature**: Control randomness (0.0 - 2.0)
- **Max Tokens**: Maximum response length
- **System Prompt**: Optional system message

### Default Profiles

The CLI comes with several pre-configured profiles:

- **default**: Balanced general-purpose models
- **fast**: Quick responses with efficient models
- **creative**: Higher temperature for creative tasks
- **technical**: Focused on accuracy and code generation

## Examples

### Basic Usage

```bash
# Simple question
orc ask "Explain quantum computing in simple terms"

# Code generation
orc ask "Write a Python function to calculate fibonacci numbers" --profile technical

# Creative writing
orc ask "Write a haiku about programming" --profile creative
```

### Multi-Model Comparison

```bash
# Compare responses from multiple models
orc ask "What are the pros and cons of TypeScript?" --profile default
```

### Advanced Examples

#### Using Templates

```bash
# Create a code review template
orc template create code-review \
  --system "You are an expert code reviewer. Focus on best practices, security, and performance." \
  --prompt "Please review the following code:\n\n{prompt}\n\nProvide feedback on:\n1. Code quality\n2. Potential bugs\n3. Performance issues\n4. Security concerns" \
  --models gpt-4-turbo claude-3-opus-20240229 \
  --temperature 0.3

# Use the template with a file
orc ask "Review for production readiness" --template code-review --file app.js
```

#### Batch Processing

Create a file `prompts.txt`:
```
Explain the concept of recursion
Write a quicksort implementation in Python
What are the SOLID principles?
Compare REST vs GraphQL
```

Then process all prompts:
```bash
orc batch prompts.txt --models gpt-4-turbo claude-3-haiku-20240307 --output results.md --format markdown
```

#### Prompt Chaining Example

```bash
# Create a content pipeline
orc chain \
  --steps \
  "Write a 200-word article about {input}" \
  "Extract 5 key points from this article: {input}" \
  "Create a Twitter thread from these points: {input}" \
  --models claude-3-opus-20240229

# When prompted, enter: "artificial intelligence in healthcare"
# The chain will:
# 1. Write an article about AI in healthcare
# 2. Extract key points from the article
# 3. Create a Twitter thread from those points
```

#### Code Analysis

```bash
# Analyze a specific file with context
orc ask "Explain the main functionality and suggest improvements" \
  --file src/utils/auth.js \
  --models gpt-4-turbo

# Compare multiple implementations
orc ask "Compare these sorting algorithms and explain their trade-offs" \
  --files sort-bubble.py sort-quick.py sort-merge.py

# Analyze recent git changes
orc git-diff HEAD~5 --models claude-3-opus-20240229
# Then when prompted: "What are the main changes and their impact on the codebase?"
```

### Interactive Chat Session

```bash
# Start a chat session
orc chat

# In chat:
You: Can you help me understand recursion?
[Model responds...]

You: Can you show me an example in JavaScript?
[Model responds with code...]

You: /models
[Select different models]

You: /exit
```

## Configuration Files

Configuration is stored in `~/.openrouter-cli/`:

### Main Configuration (`config.json`)
```json
{
  "apiKey": "your-api-key",
  "defaultProfile": "default",
  "profiles": {
    "default": {
      "name": "default",
      "models": ["claude-3-haiku-20240307", "gpt-3.5-turbo"],
      "temperature": 0.7,
      "maxTokens": 1000
    }
  }
}
```

### Templates (`templates.json`)
```json
[
  {
    "name": "code-review",
    "system": "You are an expert code reviewer.",
    "prompt": "Review the following code: {prompt}",
    "models": ["gpt-4-turbo"],
    "temperature": 0.3,
    "maxTokens": 2000,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

## Environment Variables

You can also set configuration via environment variables:

```bash
export OPENROUTER_API_KEY=your-api-key
```

## Requirements

- Node.js >= 22.0.0
- npm or yarn

## Development

```bash
# Clone the repository
git clone https://github.com/ikarza/openrouter-cli.git
cd openrouter-cli

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run compiled version
npm start
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues, questions, or suggestions, please open an issue on [GitHub](https://github.com/ikarza/openrouter-cli/issues).

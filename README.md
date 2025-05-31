# OpenRouter CLI (orc)

A powerful command-line interface for interacting with multiple AI models through OpenRouter's unified API.

## Features

- 🤖 **Multi-Model Support**: Query multiple AI models simultaneously
- 💬 **Interactive Chat**: Engage in conversations with context retention
- 👤 **Profile Management**: Save and switch between different model configurations
- 🎨 **Beautiful Output**: Color-coded responses with model identification
- ⚡ **Streaming Responses**: Real-time streaming for immediate feedback
- 🔧 **Flexible Configuration**: Customize temperature, max tokens, and more

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

## Configuration File

Configuration is stored in `~/.openrouter-cli/config.json`:

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
git clone https://github.com/yourusername/openrouter-cli.git
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

For issues, questions, or suggestions, please open an issue on [GitHub](https://github.com/yourusername/openrouter-cli/issues).
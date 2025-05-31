# Orb CLI

A powerful command-line interface for interacting with multiple AI models through OpenRouter's unified API. Experience a Claude Code-like chat interface directly from your terminal.

## Features

- 🤖 **Multi-Model Support**: Chat with multiple AI models simultaneously
- 💬 **Interactive Chat**: Claude Code-style interface with multi-line input
- 👤 **Profile Management**: Save and switch between different model configurations
- 🔍 **Model Discovery**: Search and explore available models
- 🎨 **Beautiful Output**: Syntax highlighting and formatted responses
- 🔐 **Secure**: Encrypted API key storage
- ⚡ **Fast**: Optimized for performance with caching and parallel requests

## Installation

```bash
# Clone the repository
git clone https://github.com/ikarza/orb-cli.git
cd orb-cli

# Install dependencies
npm install

# Make it globally available
npm link
```

## Quick Start

1. **Set up your API key**:
   ```bash
   orb config set-key YOUR_OPENROUTER_API_KEY
   ```

2. **Start chatting**:
   ```bash
   orb chat
   ```

3. **Ask a quick question**:
   ```bash
   orb ask "What is the capital of France?"
   ```

## Commands

### Configuration

```bash
# Set your OpenRouter API key
orb config set-key <api-key>

# Show current configuration
orb config show

# Reset configuration to defaults
orb config reset
```

### Model Management

```bash
# List all available models
orb models list
orb models list --verbose
orb models list --filter claude

# Search for specific models
orb models search gpt

# Get detailed information about a model
orb models info anthropic/claude-3-opus-20240229
```

### Profile Management

```bash
# Create a new profile
orb profile create coding

# List all profiles
orb profile list

# Switch to a different profile
orb profile use coding

# Edit an existing profile
orb profile edit coding

# Delete a profile
orb profile delete coding
```

### Chat Interface

```bash
# Start interactive chat with default profile
orb chat

# Start chat with specific profile
orb chat --profile coding

# Start chat with specific model
orb chat --model anthropic/claude-3-opus-20240229

# One-shot question
orb ask "Explain quantum computing"
orb ask --profile coding "Write a Python hello world"
```

### Chat Commands

During an interactive chat session, you can use these commands:

- `/help` - Show available commands
- `/models` - Show active models
- `/switch <model-id>` - Switch to a different model
- `/profile <name>` - Switch to a different profile
- `/clear` - Clear conversation history
- `/save <filename>` - Save conversation to file
- `/exit` or `/quit` - Exit the chat

## Multi-Line Input

In the chat interface, you can write multi-line messages:
- Press Enter to add a new line
- Press Enter twice (empty line) to send the message
- Use Ctrl+C to cancel the current input

## Profiles

Profiles allow you to save different configurations for different use cases:

```json
{
  "coding": {
    "models": ["anthropic/claude-3-opus-20240229", "openai/gpt-4-turbo"],
    "temperature": 0.2,
    "maxTokens": 8000
  },
  "creative": {
    "models": ["anthropic/claude-3-sonnet-20240229"],
    "temperature": 0.9,
    "maxTokens": 4000
  }
}
```

## Model Comparison

Chat with multiple models simultaneously to compare their responses:

```bash
# Create a comparison profile
orb profile create compare

# Select multiple models when prompted
# Models: anthropic/claude-3-opus-20240229,openai/gpt-4-turbo,google/gemini-pro

# Start comparison chat
orb chat --profile compare
```

## Configuration

Configuration is stored in `~/.orb-cli/config.json` with encrypted API keys.

### Environment Variables

You can override configuration with environment variables:
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `OPENROUTER_DEFAULT_PROFILE` - Default profile to use

## Examples

### Quick coding help
```bash
orb ask --model anthropic/claude-3-opus-20240229 "Write a recursive fibonacci function in Python"
```

### Multi-model comparison
```bash
orb chat --model anthropic/claude-3-sonnet-20240229,openai/gpt-4
```

### Save a conversation
```bash
orb chat
> /save my-conversation.json
```

## Troubleshooting

### API Key Issues
- Ensure your API key is valid and has sufficient credits
- Check your key at https://orb.ai/keys

### Network Issues
- The CLI will automatically retry failed requests
- Check your internet connection
- Verify OpenRouter API status

### Model Availability
- Some models may have limited availability
- Use `orb models list` to see current available models

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please visit:
https://github.com/yourusername/orb-cli/issues# orb-cli

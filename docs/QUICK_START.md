# OpenRouter CLI Quick Start Guide

Get up and running with OpenRouter CLI in 5 minutes!

## Installation

```bash
npm install -g openrouter-cli
```

## Initial Setup

### 1. Get Your API Key

Visit [OpenRouter](https://openrouter.ai) to create an account and get your API key.

### 2. Configure the CLI

```bash
orc config set-key YOUR_API_KEY
```

### 3. Verify Setup

```bash
orc ask "Hello, are you working?"
```

## Essential Commands

### Basic Question

```bash
# Simple question
orc ask "What is the capital of France?"

# With specific model
orc ask "Explain quantum computing" --model gpt-4-turbo

# With multiple models
orc ask "Best programming language for beginners?" --models gpt-4 claude-3
```

### Interactive Chat

```bash
# Start chat with default settings
orc chat

# Start chat with specific profile
orc chat --profile technical
```

### Quick Profile Setup

```bash
# Create a coding assistant profile
orc profile create coding
# Select: gpt-4-turbo, deepseek-coder
# Temperature: 0.2
# Max tokens: 2000

# Use it
orc ask "Review my code" --file app.js --profile coding
```

## 5 Practical Examples

### 1. Code Review Assistant

```bash
# Create a code review template
orc template create code-review \
  --system "You are a code reviewer. Focus on bugs, security, and performance." \
  --prompt "Review this code: {prompt}" \
  --temperature 0.3

# Use it on your files
orc ask "Check for issues" --file src/auth.js --template code-review
```

### 2. Git Commit Helper

```bash
# Analyze your changes
orc git-diff
# When prompted: "Write a commit message for these changes"

# Or create a commit template
orc template create commit \
  --system "Write conventional commit messages" \
  --prompt "Changes: {prompt}" \
  --temperature 0.3
```

### 3. Documentation Generator

```bash
# Generate docs from code
orc ask "Generate API documentation" --file api/routes.js

# Batch process multiple files
echo "src/user.js\nsrc/auth.js\nsrc/database.js" > files.txt
orc batch files.txt --models gpt-4 --output docs.md --format markdown
```

### 4. Learning Assistant

```bash
# Interactive learning session
orc chat --profile educational

You: Explain recursion
Assistant: [explains concept]
You: Show me an example in Python
Assistant: [provides code example]
You: How can I optimize it?
Assistant: [suggests improvements]
```

### 5. Content Creation Pipeline

```bash
# Chain prompts for content creation
orc chain \
  --models gpt-4 \
  --steps \
    "Write a blog post outline about {input}" \
    "Expand the outline into a full post: {input}" \
    "Create a meta description: {input}" \
    "Suggest 5 SEO keywords: {input}"

# Enter: "remote work productivity tips"
```

## Useful Profiles

### Default Profiles to Create

```bash
# Fast responses for quick questions
orc profile create fast
# Model: gpt-3.5-turbo
# Temperature: 0.5
# Max tokens: 500

# Creative writing
orc profile create creative
# Models: gpt-4, claude-3-opus
# Temperature: 1.0
# Max tokens: 2000

# Technical analysis
orc profile create technical
# Models: gpt-4-turbo, deepseek-coder
# Temperature: 0.2
# Max tokens: 3000
```

## Pro Tips

### 1. Use Templates for Repeated Tasks

```bash
# Create templates for common tasks
orc template create explain \
  --system "Explain concepts clearly for beginners" \
  --prompt "Explain {prompt} in simple terms"

orc template create debug \
  --system "You are a debugging expert" \
  --prompt "Debug this error: {prompt}"
```

### 2. Batch Process for Efficiency

```bash
# Process multiple items at once
cat << EOF > tasks.txt
Review security of login.js
Optimize database queries in user.js  
Add error handling to payment.js
EOF

orc batch tasks.txt --models gpt-4 --output reviews.md
```

### 3. Export Important Conversations

```bash
# During chat
/save important-discussion.json

# Export later
orc export markdown important-discussion.md \
  --conversation important-discussion.json
```

### 4. Combine with Shell Scripts

```bash
#!/bin/bash
# review-pr.sh
files=$(git diff --name-only main)

for file in $files; do
  echo "Reviewing $file..."
  orc ask "Review for issues" --file $file --profile technical
done
```

### 5. Cost-Effective Model Selection

```bash
# Use cheaper models for simple tasks
orc ask "Format this JSON" --model gpt-3.5-turbo

# Use advanced models for complex tasks
orc ask "Architect a microservices system" --model gpt-4-turbo
```

## Common Workflows

### Morning Code Review

```bash
# Check recent changes
orc git-diff HEAD~1 --models gpt-4
# "Summarize changes and identify potential issues"

# Review specific files
orc ask "Security audit" --files src/auth/*.js --profile security
```

### Documentation Update

```bash
# Generate README from code
orc ask "Create README with installation, usage, and API docs" \
  --files index.js package.json lib/*.js \
  --model gpt-4 > README.md
```

### Learning New Technology

```bash
# Start learning session
orc chat --profile educational

# Save the conversation
/save learning-react-hooks.json

# Export as study notes
orc export markdown react-hooks-notes.md \
  --conversation learning-react-hooks.json
```

## Troubleshooting

### API Key Issues
```bash
orc config show  # Check if key is set
orc config set-key NEW_KEY  # Update key
```

### Rate Limits
```bash
# Use batch processing with delays
orc batch prompts.txt --models gpt-3.5-turbo --delay 1000
```

### Model Availability
```bash
# List available models
orc models list

# Search for specific models
orc models search "free"
```

## Next Steps

1. **Explore Templates**: Create templates for your common tasks
2. **Set Up Profiles**: Configure profiles for different use cases
3. **Try Batch Processing**: Process multiple files or prompts
4. **Experiment with Chains**: Build complex workflows
5. **Read Full Documentation**: Check out the comprehensive [User Guide](USER_GUIDE.md)

## Quick Reference

| Command | Description | Example |
|---------|-------------|---------|
| `orc ask` | Ask a single question | `orc ask "Explain CSS flexbox"` |
| `orc chat` | Start interactive chat | `orc chat --profile assistant` |
| `orc profile create` | Create new profile | `orc profile create writer` |
| `orc template create` | Create template | `orc template create review` |
| `orc batch` | Process file of prompts | `orc batch questions.txt` |
| `orc chain` | Chain prompts | `orc chain --steps "..." "..."` |
| `orc export` | Export conversation | `orc export markdown chat.md` |
| `orc git-diff` | Analyze git changes | `orc git-diff HEAD~5` |

Happy coding with OpenRouter CLI! 🚀
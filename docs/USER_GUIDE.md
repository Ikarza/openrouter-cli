# OpenRouter CLI User Guide

A comprehensive guide to using all features of the OpenRouter CLI (ORC) with practical examples.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Multi-Model Support](#multi-model-support)
3. [Interactive Chat](#interactive-chat)
4. [Profile Management](#profile-management)
5. [Template System](#template-system)
6. [Batch Processing](#batch-processing)
7. [Prompt Chaining](#prompt-chaining)
8. [Export/Import Conversations](#exportimport-conversations)
9. [Code Integration](#code-integration)
10. [Advanced Configuration](#advanced-configuration)

## Getting Started

### Initial Setup

First, set up your OpenRouter API key:

```bash
orc config set-key YOUR_API_KEY
```

### Quick Test

Test your setup with a simple question:

```bash
orc ask "What is the weather like today?"
```

## Multi-Model Support

Query multiple AI models simultaneously to compare responses or get diverse perspectives.

### Example 1: Compare Writing Styles

```bash
# Create a profile with multiple models
orc profile create writers
# Select models like GPT-4, Claude, and Gemini

# Ask all models to write in different styles
orc ask "Write a haiku about programming" --profile writers
```

**Output:**
```
┌─────────────── gpt-4-turbo ────────────────┐
│ Code flows like water,                     │
│ Logic branches endlessly—                   │
│ Bugs hide in the depths.                    │
└────────────────────────────────────────────┘

┌─────────────── claude-3-opus ──────────────┐
│ Syntax precise, clean                       │
│ Algorithms dance in loops                   │
│ Creation from code                          │
└────────────────────────────────────────────┘
```

### Example 2: Technical Analysis

```bash
# Get multiple perspectives on a technical question
orc ask "What are the pros and cons of microservices architecture?" \
  --models gpt-4-turbo claude-3-opus gemini-pro
```

### Example 3: Language Translation

```bash
# Use multiple models for translation accuracy
orc ask "Translate 'The early bird catches the worm' to Spanish, French, and Japanese" \
  --profile multilingual
```

## Interactive Chat

Engage in conversations with context retention across multiple exchanges.

### Example 1: Code Review Session

```bash
orc chat --profile technical
```

```
You: I'm working on a React component that fetches user data. Can you review it?

Assistant: I'd be happy to review your React component. Please share the code.

You: Here it is: [paste code]

Assistant: I see several areas for improvement...

You: Can you show me how to implement error handling?

Assistant: Certainly! Here's an improved version with proper error handling...
```

### Example 2: Learning Session

```bash
orc chat
```

```
You: Can you teach me about recursion?

Assistant: I'll explain recursion step by step...

You: Can you give me a simple example?

Assistant: Here's a factorial function...

You: How does the call stack work in this case?

Assistant: Let me trace through the execution...
```

### Chat Commands

- `/help` - Show available commands
- `/models` - List and change active models mid-conversation
- `/profile [name]` - Switch profiles during chat
- `/history` - View conversation history
- `/save [filename]` - Save the conversation
- `/clear` - Clear conversation history
- `/exit` - Exit chat

## Profile Management

Profiles allow you to save different model configurations for various use cases.

### Example 1: Creating Specialized Profiles

```bash
# Create a profile for creative writing
orc profile create creative
# Select: claude-3-opus, gpt-4
# Set temperature: 1.2
# Set max tokens: 2000

# Create a profile for code generation
orc profile create coding
# Select: gpt-4-turbo, deepseek-coder
# Set temperature: 0.2
# Set max tokens: 4000

# Create a profile for quick responses
orc profile create fast
# Select: gpt-3.5-turbo, claude-3-haiku
# Set temperature: 0.7
# Set max tokens: 500
```

### Example 2: Using Profiles

```bash
# Creative writing
orc ask "Write a short story about a time traveler" --profile creative

# Code generation
orc ask "Create a Python web scraper for news articles" --profile coding

# Quick factual answers
orc ask "What's the population of Tokyo?" --profile fast
```

### Example 3: Managing Profiles

```bash
# List all profiles
orc profile list

# Set default profile
orc profile use coding

# Edit existing profile
orc profile edit creative

# Delete profile
orc profile delete old-profile
```

## Template System

Templates allow you to create reusable prompts for common tasks.

### Example 1: Code Review Template

```bash
# Create a code review template
orc template create code-review \
  --system "You are a senior software engineer conducting thorough code reviews. Focus on security, performance, maintainability, and best practices." \
  --prompt "Please review the following code:\n\n{prompt}\n\nProvide feedback on:\n1. Code quality and style\n2. Potential bugs or issues\n3. Security concerns\n4. Performance optimizations\n5. Suggestions for improvement" \
  --models gpt-4-turbo claude-3-opus \
  --temperature 0.3

# Use the template
orc ask "async function fetchUserData(userId) { return await fetch('/api/users/' + userId).then(r => r.json()) }" \
  --template code-review
```

### Example 2: Writing Assistant Templates

```bash
# Email template
orc template create email-professional \
  --system "You are a professional communication expert. Write clear, concise, and polite emails." \
  --prompt "Write a professional email for the following situation: {prompt}" \
  --temperature 0.7

# Blog post template
orc template create blog-post \
  --system "You are an expert content writer specializing in engaging, SEO-friendly blog posts." \
  --prompt "Write a blog post about: {prompt}\n\nInclude:\n- Engaging introduction\n- 3-5 main points\n- Practical examples\n- Conclusion with call-to-action" \
  --temperature 0.8 \
  --max-tokens 2000

# Use templates
orc ask "declining a meeting invitation due to scheduling conflict" --template email-professional
orc ask "the benefits of test-driven development" --template blog-post
```

### Example 3: Technical Documentation Template

```bash
# API documentation template
orc template create api-docs \
  --system "You are a technical writer specializing in API documentation." \
  --prompt "Document the following API endpoint:\n\n{prompt}\n\nInclude:\n- Description\n- Parameters\n- Request/Response examples\n- Error codes\n- Usage notes" \
  --temperature 0.3

# README template
orc template create readme \
  --system "You are an expert at creating comprehensive README files for open source projects." \
  --prompt "Create a README for: {prompt}\n\nInclude: Description, Installation, Usage, API, Contributing, License" \
  --temperature 0.5
```

## Batch Processing

Process multiple prompts efficiently from a file.

### Example 1: Content Generation

Create a file `blog-topics.txt`:
```
How to get started with machine learning
Best practices for remote work
Introduction to blockchain technology
The future of renewable energy
Cybersecurity tips for small businesses
```

Process all topics:
```bash
# Generate blog post outlines
orc batch blog-topics.txt \
  --models gpt-4-turbo claude-3-opus \
  --output blog-outlines.json \
  --format json

# Generate as markdown for easy reading
orc batch blog-topics.txt \
  --models gpt-4-turbo \
  --output blog-outlines.md \
  --format markdown \
  --temperature 0.8
```

### Example 2: Code Analysis

Create `functions-to-review.txt`:
```
function calculateDiscount(price, discountPercent) { return price * (1 - discountPercent / 100); }
const validateEmail = (email) => { return email.includes('@'); }
function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }
```

Analyze all functions:
```bash
orc batch functions-to-review.txt \
  --models deepseek-coder gpt-4-turbo \
  --output code-reviews.md \
  --format markdown
```

### Example 3: Data Processing

Create `customer-feedback.txt`:
```
The product quality is excellent but shipping was slow
Great customer service, resolved my issue quickly
The app crashes frequently on Android devices
Love the new features in the latest update
```

Analyze sentiment and extract insights:
```bash
# Create analysis template first
orc template create sentiment-analysis \
  --system "You are a sentiment analysis expert. Analyze customer feedback." \
  --prompt "Analyze this feedback: {prompt}\n\nProvide: Sentiment (positive/negative/neutral), Key points, Suggested actions"

# Process feedback
orc batch customer-feedback.txt \
  --models gpt-4-turbo \
  --output feedback-analysis.json \
  --format json
```

## Prompt Chaining

Chain outputs from one prompt as inputs to another for complex workflows.

### Example 1: Content Creation Pipeline

```bash
# Generate article → Create summary → Extract keywords → Generate social media posts
orc chain \
  --models gpt-4-turbo \
  --steps \
    "Write a 500-word article about {input}" \
    "Summarize this article in 3 bullet points: {input}" \
    "Extract 5 SEO keywords from this article: {input}" \
    "Create 3 social media posts based on this article: {input}"

# When prompted, enter: "sustainable urban farming"
```

### Example 2: Code Development Pipeline

```bash
# Design → Implementation → Testing → Documentation
orc chain \
  --models gpt-4-turbo deepseek-coder \
  --steps \
    "Design a Python class for {input}" \
    "Implement the class based on this design: {input}" \
    "Write unit tests for this implementation: {input}" \
    "Generate docstrings for this code: {input}"

# When prompted, enter: "a caching system with TTL support"
```

### Example 3: Language Learning Pipeline

```bash
# Translate → Explain → Examples → Quiz
orc chain \
  --models gpt-4-turbo \
  --steps \
    "Translate to French: {input}" \
    "Explain the grammar in this French sentence: {input}" \
    "Provide 3 similar examples: {input}" \
    "Create a quiz question based on this grammar point: {input}"

# When prompted, enter: "I would like to visit Paris next summer"
```

## Export/Import Conversations

Save and share your AI conversations in various formats.

### Example 1: Documentation Workflow

```bash
# Have a technical discussion
orc chat --profile technical
# ... discuss architecture decisions ...
# Save the conversation from within chat: /save architecture-discussion.json

# Export to markdown for documentation
orc export markdown architecture-decisions.md \
  --conversation architecture-discussion.json \
  --include-metadata

# Export to HTML for sharing
orc export html architecture-decisions.html \
  --conversation architecture-discussion.json \
  --syntax-highlight
```

### Example 2: Knowledge Base Creation

```bash
# Import conversations from other platforms
orc import chatgpt-export.json --type chatgpt
orc import claude-conversation.json --type claude

# Combine and export as a knowledge base
orc export markdown knowledge-base.md \
  --conversation combined-conversations.json \
  --include-metadata
```

### Example 3: Training Data Preparation

```bash
# Export conversations for fine-tuning datasets
orc export json training-data.json \
  --conversation technical-discussions.json

# Process for specific format needs
orc export markdown qa-pairs.md \
  --conversation support-conversations.json
```

## Code Integration

Analyze and get help with code files directly.

### Example 1: Single File Analysis

```bash
# Analyze a Python script
orc ask "Review this code for performance improvements" \
  --file app.py \
  --profile coding

# Get help with a specific function
orc ask "Explain how the authentication middleware works" \
  --file middleware/auth.js

# Find potential bugs
orc ask "Find potential bugs and security issues" \
  --file utils/validation.ts \
  --models gpt-4-turbo claude-3-opus
```

### Example 2: Multiple File Analysis

```bash
# Compare implementations
orc ask "Compare these sorting algorithm implementations and suggest which is better" \
  --files sort-bubble.py sort-quick.py sort-merge.py

# Architecture review
orc ask "Review the architecture and suggest improvements" \
  --files src/models/user.js src/controllers/userController.js src/routes/userRoutes.js

# Test coverage analysis
orc ask "Analyze test coverage and suggest missing test cases" \
  --files src/calculator.js tests/calculator.test.js
```

### Example 3: Git Integration

```bash
# Analyze recent changes
orc git-diff HEAD~5 --models gpt-4-turbo
# When prompted: "Summarize the changes and their impact"

# Review before committing
orc git-diff --models claude-3-opus
# When prompted: "Review for potential issues before I commit"

# Compare branches
orc git-diff main feature/new-api --models gpt-4-turbo
# When prompted: "What are the main differences between these branches?"
```

## Advanced Configuration

### Example 1: Environment-Specific Profiles

```bash
# Development profile - verbose, detailed responses
orc profile create dev
# Models: gpt-4-turbo, claude-3-opus
# Temperature: 0.3
# Max tokens: 4000

# Production profile - concise, efficient responses  
orc profile create prod
# Models: gpt-3.5-turbo
# Temperature: 0.1
# Max tokens: 500

# Set based on environment
export ORC_PROFILE=dev  # During development
export ORC_PROFILE=prod # In production scripts
```

### Example 2: Custom Workflows

Create a file `code-review-workflow.sh`:
```bash
#!/bin/bash
# Comprehensive code review workflow

echo "Starting code review for $1"

# Step 1: General review
orc ask "Review this code for best practices" --file $1 --template code-review > review-practices.md

# Step 2: Security analysis
orc ask "Analyze for security vulnerabilities" --file $1 --models gpt-4-turbo >> review-security.md

# Step 3: Performance analysis
orc ask "Suggest performance optimizations" --file $1 --models deepseek-coder >> review-performance.md

# Step 4: Generate improved version
orc ask "Rewrite this code with all suggested improvements" --file $1 > improved-$1

echo "Review complete! Check review-*.md files"
```

### Example 3: Integration with Development Tools

```bash
# Git pre-commit hook
# .git/hooks/pre-commit
#!/bin/bash
files=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(js|py|ts)$')

for file in $files; do
  echo "Reviewing $file..."
  result=$(orc ask "Quick review for obvious issues" --file $file --models gpt-3.5-turbo)
  
  if [[ $result == *"ERROR"* ]] || [[ $result == *"BUG"* ]]; then
    echo "Potential issues found in $file:"
    echo "$result"
    read -p "Continue with commit? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      exit 1
    fi
  fi
done
```

## Tips and Best Practices

### 1. Model Selection
- Use multiple models for important decisions
- Fast models (GPT-3.5, Claude Haiku) for simple tasks
- Advanced models (GPT-4, Claude Opus) for complex analysis
- Specialized models (DeepSeek Coder) for specific domains

### 2. Temperature Settings
- 0.1-0.3: Factual, deterministic responses (code, analysis)
- 0.5-0.7: Balanced creativity and accuracy
- 0.8-1.2: Creative writing, brainstorming

### 3. Token Optimization
- Use lower token limits for quick responses
- Increase tokens for detailed explanations
- Consider cost when using premium models

### 4. Profile Strategy
- Create profiles for repeated tasks
- Use descriptive names
- Document profile purposes
- Regularly review and update profiles

### 5. Template Best Practices
- Include clear system prompts
- Use placeholders effectively
- Test templates before regular use
- Version control your templates

## Troubleshooting

### API Key Issues
```bash
# Check if API key is set
orc config show

# Reset configuration
orc config reset

# Re-enter API key
orc config set-key YOUR_NEW_KEY
```

### Rate Limiting
- Use batch processing for multiple prompts
- Implement delays in scripts
- Use different models to distribute load

### Memory Issues
- Clear chat history regularly with `/clear`
- Use smaller token limits
- Process large files in chunks

## Conclusion

The OpenRouter CLI provides a powerful interface for interacting with multiple AI models. By combining features like profiles, templates, and batch processing, you can create sophisticated AI-powered workflows tailored to your specific needs.

For more information and updates, visit the [GitHub repository](https://github.com/ikarza/openrouter-cli).
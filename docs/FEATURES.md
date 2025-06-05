# OpenRouter CLI Features Overview

## 🤖 Multi-Model Support

Query multiple AI models simultaneously to get diverse perspectives and compare responses.

### Use Cases
- **Comparative Analysis**: Compare how different models approach the same problem
- **Consensus Building**: Get agreement from multiple models for critical decisions
- **Creative Diversity**: Generate varied creative content from different models

### Visual Example

```
$ orc ask "Explain quantum computing in one sentence" --models gpt-4 claude-3 gemini-pro

┌────────────────────────── gpt-4-turbo ─────────────────────────┐
│ Quantum computing harnesses quantum mechanical phenomena like   │
│ superposition and entanglement to process information in ways  │
│ that classical computers cannot efficiently achieve.           │
└────────────────────────────────────────────────────────────────┘

┌───────────────────────── claude-3-opus ────────────────────────┐
│ Quantum computing leverages quantum mechanics principles to     │
│ perform calculations exponentially faster than classical        │
│ computers for specific problems.                               │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────── gemini-pro ──────────────────────────┐
│ Quantum computing uses quantum bits (qubits) that can exist    │
│ in multiple states simultaneously, enabling massive parallel    │
│ processing for certain computational tasks.                     │
└────────────────────────────────────────────────────────────────┘
```

## 💬 Interactive Chat

Engage in contextual conversations with AI models that remember previous exchanges.

### Features
- **Context Retention**: Models remember the entire conversation
- **Multi-turn Dialogue**: Natural back-and-forth conversations
- **In-chat Commands**: Switch models, save conversations, view history
- **Multiline Input**: Compose longer messages with ease

### Interactive Example

```
$ orc chat --profile assistant

OpenRouter Chat Interface
Type /help for available commands

You: Can you help me design a REST API for a todo app?

Assistant: I'll help you design a RESTful API for a todo app. Here's a comprehensive design:

**Base URL**: `https://api.todoapp.com/v1`

**Endpoints**:
1. `GET /todos` - List all todos
2. `POST /todos` - Create a new todo
3. `GET /todos/:id` - Get a specific todo
4. `PUT /todos/:id` - Update a todo
5. `DELETE /todos/:id` - Delete a todo

You: Can you show me example request/response for creating a todo?

Assistant: Here's an example for creating a new todo:

**Request**: `POST /todos`
```json
{
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "due_date": "2024-12-31",
  "priority": "high"
}
```

**Response**: `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Complete project documentation",
  "description": "Write comprehensive API docs",
  "due_date": "2024-12-31",
  "priority": "high",
  "status": "pending",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

You: /history

[Conversation history displayed...]
```

## 👤 Profile Management

Save and manage different model configurations for various use cases.

### Profile Components
- **Model Selection**: Choose which models to query
- **Temperature**: Control response creativity (0.0-2.0)
- **Max Tokens**: Set response length limits
- **System Prompts**: Define model behavior

### Profile Examples

```bash
# List all profiles
$ orc profile list

Available profiles:

default (current)
  Models: gpt-3.5-turbo, claude-3-haiku
  Temperature: 0.7
  Max Tokens: 1000

creative
  Models: gpt-4, claude-3-opus
  Temperature: 1.2
  Max Tokens: 2000

technical
  Models: gpt-4-turbo, deepseek-coder
  Temperature: 0.2
  Max Tokens: 4000

fast
  Models: gpt-3.5-turbo
  Temperature: 0.5
  Max Tokens: 500
```

## 🎨 Beautiful Output

Color-coded responses with model identification and real-time streaming.

### Features
- **Syntax Highlighting**: Code blocks are highlighted
- **Model Identification**: Clear labels for each model's response
- **Streaming Display**: See responses as they're generated
- **Progress Indicators**: Visual feedback during processing

### Visual Elements

```
┌─────────────────── Model Name ──────────────────┐
│ ▋ Streaming response appears here in real-time  │
│ ▋ with a cursor showing active generation...    │
└─────────────────────────────────────────────────┘

✓ Task completed successfully
✗ Error: API rate limit exceeded
⚡ Processing 10 prompts...
```

## ⚡ Streaming Responses

Real-time response streaming for immediate feedback.

### Benefits
- **Instant Feedback**: Start reading before generation completes
- **Interruptible**: Stop generation if you see what you need
- **Progress Visibility**: Know the model is working
- **Better UX**: No waiting for long responses

## 🔧 Flexible Configuration

### Global Settings
```bash
# Set API key
orc config set-key YOUR_API_KEY

# View configuration
orc config show

# Reset to defaults
orc config reset
```

### Per-Request Options
```bash
# Override temperature
orc ask "Creative story idea" --temperature 1.5

# Limit response length
orc ask "Brief summary of AI" --max-tokens 100

# Use specific model
orc ask "Explain recursion" --model gpt-4-turbo
```

## 📝 Template System

Create reusable prompt templates for common tasks.

### Template Structure
```yaml
Name: code-review
System: "You are a senior software engineer..."
Prompt: "Review the following code: {prompt}"
Models: [gpt-4-turbo, claude-3-opus]
Temperature: 0.3
MaxTokens: 2000
```

### Usage Example
```bash
# Create a commit message template
$ orc template create commit-msg \
  --system "You are a git commit message expert following conventional commits" \
  --prompt "Generate a commit message for these changes: {prompt}" \
  --temperature 0.3

✓ Template 'commit-msg' created successfully

# Use the template
$ orc ask "Added user authentication with JWT tokens" --template commit-msg

┌─────────────────── gpt-3.5-turbo ──────────────────┐
│ feat(auth): add JWT-based user authentication      │
│                                                    │
│ - Implement JWT token generation and validation    │
│ - Add authentication middleware                    │
│ - Create login and logout endpoints                │
│ - Include token refresh mechanism                  │
└────────────────────────────────────────────────────┘
```

## 🔄 Batch Processing

Process multiple prompts efficiently from files.

### Input File Example
```text
# questions.txt
What is machine learning?
Explain neural networks
How does backpropagation work?
What are transformers in AI?
```

### Processing Example
```bash
$ orc batch questions.txt --models gpt-4 claude-3 --output answers.md --format markdown

⚡ Processing 4 prompts...
✓ Prompt 1/4: What is machine learning?
✓ Prompt 2/4: Explain neural networks
✓ Prompt 3/4: How does backpropagation work?
✓ Prompt 4/4: What are transformers in AI?
✓ Results saved to answers.md
```

### Output Formats
- **JSON**: Structured data for programmatic use
- **Markdown**: Human-readable documentation
- **CSV**: Spreadsheet-compatible format

## 🔗 Prompt Chaining

Chain outputs from one prompt as input to another.

### Visual Flow
```
Initial Input: "Python web scraping"
         ↓
Step 1: "Write a tutorial about {input}"
         ↓
Step 2: "Create code examples for: {input}"
         ↓
Step 3: "Write tests for this code: {input}"
         ↓
Step 4: "Create documentation: {input}"
         ↓
Final Output: Complete tutorial with code, tests, and docs
```

### Example Usage
```bash
$ orc chain --models gpt-4 \
  --steps \
    "Create a product description for {input}" \
    "Extract key features from: {input}" \
    "Write marketing copy based on: {input}" \
    "Generate social media posts: {input}"

Enter initial prompt: Smart Home Security Camera

⚡ Processing chain...
✓ Step 1/4: Product description
✓ Step 2/4: Feature extraction
✓ Step 3/4: Marketing copy
✓ Step 4/4: Social media posts
✓ Chain complete!
```

## 📤 Export/Import

Save conversations in multiple formats and import from other platforms.

### Export Formats

#### Markdown Export
```markdown
# Conversation Export
*Exported at: 2024-01-15T10:30:00Z*

## 👤 User
How do I implement caching in Redis?

## 🤖 Assistant (gpt-4-turbo)
Here's how to implement caching with Redis...
```

#### HTML Export
```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Conversation</title>
    <style>
        /* Beautiful styling with syntax highlighting */
    </style>
</head>
<body>
    <div class="conversation">
        <!-- Formatted conversation with code highlighting -->
    </div>
</body>
</html>
```

#### JSON Export
```json
[
  {
    "role": "user",
    "content": "How do I implement caching in Redis?",
    "timestamp": "2024-01-15T10:30:00Z"
  },
  {
    "role": "assistant",
    "content": "Here's how to implement caching...",
    "model": "gpt-4-turbo",
    "timestamp": "2024-01-15T10:30:15Z"
  }
]
```

## 💻 Code Integration

Analyze code files and git diffs directly.

### File Analysis
```bash
$ orc ask "Find potential security issues" --file server.js

┌─────────────────── gpt-4-turbo ──────────────────┐
│ I've identified several security concerns:        │
│                                                   │
│ 1. SQL Injection Risk (Line 45):                 │
│    ```javascript                                  │
│    const query = `SELECT * FROM users WHERE      │
│    id = ${userId}`;  // Vulnerable!              │
│    ```                                           │
│                                                   │
│ 2. Missing Input Validation (Line 67):           │
│    The email parameter is not validated...       │
└───────────────────────────────────────────────────┘
```

### Git Diff Analysis
```bash
$ orc git-diff HEAD~3

Git diff analysis:
Files changed: 5
+150 lines, -45 lines

? What would you like to know about these changes?
> Summarize the main changes and their impact

┌─────────────────── Analysis ──────────────────┐
│ Main changes in the last 3 commits:           │
│                                               │
│ 1. Refactored authentication system           │
│    - Replaced session-based with JWT          │
│    - Added refresh token mechanism            │
│                                               │
│ 2. Performance improvements                   │
│    - Implemented caching layer                │
│    - Optimized database queries               │
│                                               │
│ Impact: Better scalability and 40% faster     │
│ response times for authenticated endpoints    │
└───────────────────────────────────────────────┘
```

## 🚀 Performance Features

### Parallel Processing
- Multiple models queried simultaneously
- Batch operations process in parallel
- Efficient streaming reduces latency

### Resource Optimization
- Token counting for cost management
- Configurable response limits
- Smart caching for repeated queries

### Scalability
- Handle large batch files
- Process multiple conversations
- Manage extensive template libraries

## 🔐 Security Features

### API Key Management
- Encrypted storage
- Environment variable support
- No plaintext exposure

### Safe Defaults
- Reasonable token limits
- Rate limiting awareness
- Secure file handling

## 🎯 Real-World Applications

### Development Workflows
- Code reviews and refactoring
- Documentation generation
- Test case creation
- Bug analysis and debugging

### Content Creation
- Blog post generation
- Social media content
- Marketing copy
- Technical writing

### Data Analysis
- Log file analysis
- Sentiment analysis
- Pattern recognition
- Report generation

### Learning & Research
- Interactive tutorials
- Concept explanation
- Code examples
- Best practices guidance
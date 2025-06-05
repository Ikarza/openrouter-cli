# OpenRouter CLI Recipes

A collection of practical recipes for common tasks using OpenRouter CLI.

## Table of Contents

- [Development Recipes](#development-recipes)
- [Content Creation Recipes](#content-creation-recipes)
- [Learning & Research Recipes](#learning--research-recipes)
- [Productivity Recipes](#productivity-recipes)
- [Data Processing Recipes](#data-processing-recipes)

## Development Recipes

### 🔍 Comprehensive Code Review

**Goal**: Perform thorough code reviews covering security, performance, and best practices.

```bash
# Create specialized review templates
orc template create security-review \
  --system "You are a security expert. Focus on vulnerabilities, authentication, and data protection." \
  --prompt "Security audit for: {prompt}" \
  --models gpt-4-turbo \
  --temperature 0.2

orc template create performance-review \
  --system "You are a performance optimization expert. Focus on bottlenecks, memory usage, and algorithmic efficiency." \
  --prompt "Performance analysis for: {prompt}" \
  --models deepseek-coder \
  --temperature 0.2

# Run comprehensive review
echo "Running comprehensive code review..."
orc ask "General code quality" --file src/main.js --template code-review > review-general.md
orc ask "Security vulnerabilities" --file src/main.js --template security-review > review-security.md  
orc ask "Performance issues" --file src/main.js --template performance-review > review-performance.md

echo "Reviews saved to review-*.md files"
```

### 🐛 Intelligent Debugging Assistant

**Goal**: Get help debugging complex issues with context-aware assistance.

```bash
# Create debug session with error context
orc chat --profile technical

You: I'm getting this error: "TypeError: Cannot read property 'map' of undefined"

You: Here's the code:
```javascript
const UserList = ({ users }) => {
  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
};
```

You: The error happens when the component first renders

# The assistant will help you debug step by step
```

### 📝 Automated Documentation Generator

**Goal**: Generate comprehensive documentation from code.

```bash
# Create documentation template
orc template create generate-docs \
  --system "You are a technical writer. Create clear, comprehensive documentation with examples." \
  --prompt "Generate documentation for: {prompt}" \
  --temperature 0.5 \
  --max-tokens 3000

# Document a single file
orc ask "Create API documentation with examples" \
  --file api/userController.js \
  --template generate-docs > docs/api/users.md

# Batch document multiple files
ls src/**/*.js > js-files.txt
orc batch js-files.txt \
  --models gpt-4-turbo \
  --output documentation.md \
  --format markdown
```

### 🧪 Test Generation Pipeline

**Goal**: Generate comprehensive test suites for your code.

```bash
# Create test generation template
orc template create generate-tests \
  --system "You are a test automation expert. Write comprehensive unit tests with edge cases." \
  --prompt "Generate tests for: {prompt}" \
  --temperature 0.3

# Generate tests for a function
orc ask "Generate Jest tests with edge cases" \
  --file utils/validation.js \
  --template generate-tests > tests/validation.test.js

# Chain: Analyze → Generate Tests → Review Tests
orc chain \
  --models gpt-4-turbo \
  --steps \
    "Analyze this code and identify test cases: {input}" \
    "Generate Jest tests for these cases: {input}" \
    "Review these tests for completeness: {input}" \
  < utils/validation.js
```

### 🔄 Refactoring Assistant

**Goal**: Refactor code with modern patterns and best practices.

```bash
# Create refactoring workflow
orc template create refactor-modern \
  --system "You are a refactoring expert. Modernize code using latest patterns and best practices." \
  --prompt "Refactor to modern JavaScript: {prompt}" \
  --temperature 0.3

# Refactor legacy code
orc ask "Modernize this jQuery code to vanilla JavaScript" \
  --file legacy/old-script.js \
  --template refactor-modern

# Batch refactor multiple files
orc chain \
  --models gpt-4-turbo deepseek-coder \
  --steps \
    "Identify refactoring opportunities: {input}" \
    "Implement the refactoring: {input}" \
    "Add TypeScript types: {input}"
```

## Content Creation Recipes

### 📚 Blog Post Production Pipeline

**Goal**: Create complete blog posts from topic to publication.

```bash
# Complete blog post workflow
orc chain \
  --models gpt-4 claude-3-opus \
  --steps \
    "Create an outline for a blog post about {input}" \
    "Write the introduction based on this outline: {input}" \
    "Develop the main content sections: {input}" \
    "Write a compelling conclusion: {input}" \
    "Generate SEO metadata (title, description, keywords): {input}" \
    "Create 5 social media posts to promote this article: {input}"

# Enter: "The rise of AI in software development"
```

### 📧 Email Campaign Creator

**Goal**: Generate professional email campaigns.

```bash
# Create email templates
orc template create email-campaign \
  --system "You are an email marketing expert. Write engaging, professional emails with clear CTAs." \
  --prompt "Create email campaign for: {prompt}" \
  --temperature 0.7

# Generate email series
cat << EOF > campaign-topics.txt
Welcome email for new SaaS customers
Feature announcement: AI-powered analytics
Customer success story showcase
Limited-time upgrade offer
Year in review and thank you
EOF

orc batch campaign-topics.txt \
  --models gpt-4 \
  --output email-campaign.md \
  --format markdown
```

### 🎯 Social Media Content Calendar

**Goal**: Create a month's worth of social media content.

```bash
# Generate content calendar
orc ask "Create a 30-day social media content calendar for a tech startup. Include post ideas, hashtags, and best posting times" \
  --models gpt-4 claude-3 \
  --temperature 0.8 \
  --max-tokens 3000 > social-calendar.md

# Generate specific posts
orc chain \
  --models gpt-4 \
  --steps \
    "Create LinkedIn post about {input}" \
    "Adapt for Twitter with hashtags: {input}" \
    "Create Instagram caption: {input}" \
    "Suggest visual content ideas: {input}"
```

## Learning & Research Recipes

### 📖 Interactive Study Sessions

**Goal**: Create personalized learning experiences.

```bash
# Start study session
orc chat --profile educational

You: I want to learn about machine learning

Assistant: I'll create a structured learning path for you...

You: Start with the basics

Assistant: Let's begin with supervised learning...

You: Can you give me a practical example?

Assistant: Here's a simple example using Python...

You: /save ml-learning-session.json
```

### 🔬 Research Assistant

**Goal**: Conduct thorough research on complex topics.

```bash
# Research workflow
orc chain \
  --models gpt-4-turbo claude-3-opus \
  --steps \
    "Research the current state of {input}" \
    "Identify key challenges and opportunities: {input}" \
    "Find recent developments and breakthroughs: {input}" \
    "Summarize implications and future directions: {input}" \
    "Create a comprehensive research report: {input}"

# Enter: "quantum computing in cryptography"
```

### 💡 Concept Explanation Generator

**Goal**: Create clear explanations for complex concepts.

```bash
# Create explanation templates for different audiences
orc template create explain-beginner \
  --system "Explain concepts using simple language, analogies, and examples. Assume no prior knowledge." \
  --prompt "Explain {prompt} for beginners"

orc template create explain-expert \
  --system "Provide technical, detailed explanations with academic rigor." \
  --prompt "Technical explanation of {prompt}"

# Generate explanations
orc ask "blockchain technology" --template explain-beginner > blockchain-simple.md
orc ask "blockchain consensus mechanisms" --template explain-expert > blockchain-technical.md
```

## Productivity Recipes

### 📅 Meeting Notes Processor

**Goal**: Transform meeting notes into actionable items.

```bash
# Create meeting processor
orc template create meeting-processor \
  --system "You process meeting notes into structured outputs with action items, decisions, and follow-ups." \
  --prompt "Process these meeting notes: {prompt}" \
  --temperature 0.3

# Process notes
orc ask "[paste raw meeting notes]" --template meeting-processor

# Chain for comprehensive processing
orc chain \
  --models gpt-4 \
  --steps \
    "Extract action items from these notes: {input}" \
    "Identify key decisions made: {input}" \
    "Create follow-up email to attendees: {input}" \
    "Generate project timeline based on discussion: {input}"
```

### 📊 Report Generation Pipeline

**Goal**: Create professional reports from raw data.

```bash
# Automated report generation
orc template create generate-report \
  --system "You create professional business reports with executive summaries, detailed analysis, and recommendations." \
  --prompt "Create report from this data: {prompt}" \
  --temperature 0.4 \
  --max-tokens 4000

# Generate weekly status report
orc ask "Generate weekly engineering status report based on: 
- Completed: user authentication, API optimization
- In progress: payment integration, mobile app
- Blocked: third-party API issues
- Team size: 5 engineers" \
  --template generate-report > weekly-status.md
```

### ✅ Task Breakdown Assistant

**Goal**: Break complex projects into manageable tasks.

```bash
# Project breakdown
orc ask "Break down this project into tasks with time estimates: Build a full-stack e-commerce platform with React, Node.js, payment integration, and admin dashboard" \
  --models gpt-4-turbo \
  --temperature 0.5

# Create JIRA-ready tasks
orc chain \
  --models gpt-4 \
  --steps \
    "Break into epics: {input}" \
    "Create user stories for each epic: {input}" \
    "Add acceptance criteria: {input}" \
    "Estimate story points: {input}" \
    "Format as JIRA import CSV: {input}"
```

## Data Processing Recipes

### 📈 Log Analysis Pipeline

**Goal**: Analyze logs to find patterns and issues.

```bash
# Create log analyzer
orc template create analyze-logs \
  --system "You are a log analysis expert. Identify patterns, errors, performance issues, and anomalies." \
  --prompt "Analyze these logs: {prompt}" \
  --temperature 0.2

# Analyze error logs
orc ask "Find error patterns and suggest fixes" \
  --file logs/error.log \
  --template analyze-logs

# Batch process multiple log files
ls logs/*.log > logfiles.txt
orc batch logfiles.txt \
  --models gpt-4-turbo \
  --output log-analysis-report.md \
  --format markdown
```

### 🔍 Data Extraction Workflow

**Goal**: Extract structured data from unstructured text.

```bash
# Extract structured data
orc template create extract-data \
  --system "Extract structured data from text. Output as JSON." \
  --prompt "Extract data from: {prompt}" \
  --temperature 0.1

# Extract customer info from emails
orc ask "Extract customer name, email, issue type, and priority" \
  --file support-emails.txt \
  --template extract-data > customer-data.json

# Chain for complex extraction
orc chain \
  --models gpt-4 \
  --steps \
    "Extract all mentioned dates and events: {input}" \
    "Extract all person names and roles: {input}" \
    "Extract all monetary amounts and purposes: {input}" \
    "Create structured JSON summary: {input}"
```

### 📝 Data Validation Assistant

**Goal**: Validate and clean data sets.

```bash
# Create data validator
orc template create validate-data \
  --system "You are a data quality expert. Check for inconsistencies, errors, and suggest corrections." \
  --prompt "Validate this data: {prompt}" \
  --temperature 0.1

# Validate CSV data
orc ask "Check for data quality issues, missing values, and inconsistencies" \
  --file data/customers.csv \
  --template validate-data

# Generate data cleaning script
orc ask "Generate Python script to clean the identified issues" \
  --file data/customers.csv \
  --models deepseek-coder > clean_data.py
```

## Advanced Recipes

### 🏗️ Architecture Design Assistant

**Goal**: Design system architectures with best practices.

```bash
# Architecture design workflow
orc chain \
  --models gpt-4-turbo claude-3-opus \
  --steps \
    "Design high-level architecture for: {input}" \
    "Detail the microservices and their responsibilities: {input}" \
    "Define API contracts between services: {input}" \
    "Suggest technology stack for each component: {input}" \
    "Identify potential bottlenecks and scaling strategies: {input}" \
    "Create deployment architecture: {input}"

# Enter: "Real-time collaborative document editor like Google Docs"
```

### 🔐 Security Audit Pipeline

**Goal**: Comprehensive security analysis of codebases.

```bash
# Security audit workflow
echo "Starting comprehensive security audit..."

# Step 1: Scan for common vulnerabilities
orc ask "Scan for OWASP Top 10 vulnerabilities" \
  --files src/**/*.js \
  --models gpt-4-turbo > audit-owasp.md

# Step 2: Check authentication/authorization
orc ask "Review authentication and authorization implementation" \
  --files auth/*.js middleware/*.js \
  --models claude-3-opus > audit-auth.md

# Step 3: Analyze data handling
orc ask "Check for data validation, sanitization, and encryption" \
  --files controllers/*.js models/*.js \
  --models gpt-4-turbo > audit-data.md

# Step 4: Generate remediation plan
orc ask "Based on these security findings, create a prioritized remediation plan" \
  --files audit-*.md \
  --models gpt-4-turbo > remediation-plan.md

echo "Security audit complete. Check audit-*.md and remediation-plan.md"
```

### 🚀 Performance Optimization Workflow

**Goal**: Identify and fix performance bottlenecks.

```bash
# Performance analysis pipeline
orc chain \
  --models gpt-4-turbo deepseek-coder \
  --steps \
    "Analyze code for performance bottlenecks: {input}" \
    "Suggest algorithmic improvements: {input}" \
    "Recommend caching strategies: {input}" \
    "Generate optimized version: {input}" \
    "Create performance testing plan: {input}"

# Analyze specific performance issues
orc ask "This function takes 5 seconds to run. Help me optimize it" \
  --file utils/dataProcessor.js \
  --models deepseek-coder gpt-4-turbo
```

## Automation Scripts

### Daily Development Workflow

```bash
#!/bin/bash
# daily-dev-workflow.sh

echo "🌅 Starting daily development workflow..."

# 1. Check recent changes
echo "\n📋 Reviewing yesterday's changes..."
orc git-diff HEAD~1 --models gpt-4-turbo

# 2. Review TODOs in code
echo "\n✅ Checking TODOs..."
grep -r "TODO" src/ | orc ask "Prioritize these TODOs and suggest implementation approach" --models gpt-4

# 3. Check for security updates
echo "\n🔐 Security check..."
npm audit | orc ask "Summarize security issues and suggest fixes" --models gpt-4-turbo

# 4. Generate daily standup notes
echo "\n📝 Generating standup notes..."
orc ask "Generate standup notes based on git commits from yesterday" \
  --models gpt-4 > standup-notes.md

echo "\n✨ Daily workflow complete!"
```

### PR Review Automation

```bash
#!/bin/bash
# pr-review.sh

PR_NUMBER=$1

echo "🔍 Reviewing PR #$PR_NUMBER..."

# Get PR diff
gh pr diff $PR_NUMBER > pr-diff.txt

# Comprehensive review
orc chain \
  --models gpt-4-turbo claude-3-opus \
  --steps \
    "Review code quality and style: {input}" \
    "Check for potential bugs: {input}" \
    "Analyze performance impact: {input}" \
    "Verify test coverage: {input}" \
    "Suggest improvements: {input}" \
    "Generate review summary: {input}" \
  < pr-diff.txt > pr-review-$PR_NUMBER.md

echo "✅ Review saved to pr-review-$PR_NUMBER.md"
```

## Tips for Creating Your Own Recipes

1. **Start with Templates**: Create reusable templates for common tasks
2. **Use Chains for Workflows**: Break complex tasks into sequential steps
3. **Leverage Multiple Models**: Use different models for their strengths
4. **Automate with Scripts**: Combine CLI commands in shell scripts
5. **Save and Share**: Export successful conversations for team knowledge

## Contributing Recipes

Have a great recipe? Share it with the community!

1. Test your recipe thoroughly
2. Document inputs and expected outputs
3. Include real-world use cases
4. Submit a PR to add it to this collection

Happy automating! 🚀
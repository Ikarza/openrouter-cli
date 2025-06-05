# OpenRouter CLI Documentation

Welcome to the comprehensive documentation for OpenRouter CLI! This guide will help you master all features and become productive quickly.

## 🚀 Getting Started

### New to OpenRouter CLI?
Start here to get up and running quickly:

- **[Quick Start Guide](QUICK_START.md)** - 5-minute setup and essential commands
- **[Features Overview](FEATURES.md)** - Visual guide to all features with examples

### Ready to dive deeper?
Once you're comfortable with the basics:

- **[Complete User Guide](USER_GUIDE.md)** - Comprehensive reference with detailed examples
- **[Recipes](RECIPES.md)** - Real-world workflows and automation examples

## 📖 Documentation Structure

### 1. [Quick Start Guide](QUICK_START.md)
**Perfect for**: First-time users, quick reference
**Contains**: 
- Installation and setup
- Essential commands
- 5 practical examples
- Common troubleshooting

### 2. [Features Overview](FEATURES.md)
**Perfect for**: Understanding capabilities, visual learners
**Contains**:
- Feature-by-feature breakdown
- Visual examples and outputs
- Use cases for each feature
- Performance and security highlights

### 3. [Complete User Guide](USER_GUIDE.md)
**Perfect for**: Power users, comprehensive reference
**Contains**:
- Detailed explanations of all features
- Advanced configuration options
- Complex workflow examples
- Best practices and tips

### 4. [Recipes](RECIPES.md)
**Perfect for**: Practical implementation, automation
**Contains**:
- Development workflows
- Content creation pipelines
- Data processing examples
- Ready-to-use automation scripts

## 🎯 Choose Your Path

### I'm a Developer
Focus on these sections:
1. [Quick Start](QUICK_START.md) → Basic setup
2. [Recipes: Development](RECIPES.md#development-recipes) → Code review, debugging, testing
3. [User Guide: Code Integration](USER_GUIDE.md#code-integration) → File analysis, git integration

### I'm a Content Creator
Focus on these sections:
1. [Quick Start](QUICK_START.md) → Basic setup
2. [Recipes: Content Creation](RECIPES.md#content-creation-recipes) → Blog posts, social media
3. [User Guide: Template System](USER_GUIDE.md#template-system) → Reusable prompts

### I'm a Data Analyst
Focus on these sections:
1. [Quick Start](QUICK_START.md) → Basic setup
2. [Recipes: Data Processing](RECIPES.md#data-processing-recipes) → Log analysis, data extraction
3. [User Guide: Batch Processing](USER_GUIDE.md#batch-processing) → Multiple file processing

### I'm a Manager/Researcher
Focus on these sections:
1. [Quick Start](QUICK_START.md) → Basic setup
2. [Recipes: Productivity](RECIPES.md#productivity-recipes) → Reports, meeting notes
3. [User Guide: Export/Import](USER_GUIDE.md#exportimport-conversations) → Save and share insights

## 🔧 Key Concepts

### Profiles
Saved configurations for different use cases (coding, writing, research).
- **Learn more**: [User Guide: Profile Management](USER_GUIDE.md#profile-management)
- **See examples**: [Quick Start: Profile Setup](QUICK_START.md#quick-profile-setup)

### Templates
Reusable prompt patterns for common tasks.
- **Learn more**: [User Guide: Template System](USER_GUIDE.md#template-system)
- **See examples**: [Recipes: Development Templates](RECIPES.md#-comprehensive-code-review)

### Multi-Model Support
Query multiple AI models simultaneously for diverse perspectives.
- **Learn more**: [Features: Multi-Model Support](FEATURES.md#-multi-model-support)
- **See examples**: [Quick Start: Essential Commands](QUICK_START.md#essential-commands)

### Batch Processing
Process multiple prompts efficiently from files.
- **Learn more**: [User Guide: Batch Processing](USER_GUIDE.md#batch-processing)
- **See examples**: [Recipes: Content Creation Pipeline](RECIPES.md#-blog-post-production-pipeline)

### Prompt Chaining
Connect outputs from one prompt as inputs to another.
- **Learn more**: [User Guide: Prompt Chaining](USER_GUIDE.md#prompt-chaining)
- **See examples**: [Quick Start: Content Creation Pipeline](QUICK_START.md#5-content-creation-pipeline)

## 🎨 Example Workflows

### Code Review Workflow
```bash
# Comprehensive code review
orc ask "Security audit" --file app.js --template security-review
orc ask "Performance analysis" --file app.js --template performance-review
orc git-diff HEAD~1 --models gpt-4 # Review recent changes
```

### Content Creation Workflow
```bash
# Blog post pipeline
orc chain --models gpt-4 \
  --steps \
    "Outline for blog post about {input}" \
    "Write introduction: {input}" \
    "Develop main content: {input}" \
    "Create conclusion and CTA: {input}"
```

### Research Workflow
```bash
# Research and documentation
orc ask "Research current state of {topic}" --models gpt-4 claude-3
orc chat --profile research # Interactive deep-dive
/save research-session.json
orc export markdown research-report.md --conversation research-session.json
```

## 🆘 Getting Help

### Quick Answers
- Check the [Quick Start Guide](QUICK_START.md) for common tasks
- Review [Troubleshooting](USER_GUIDE.md#troubleshooting) section

### In-Depth Help
- Browse [Recipes](RECIPES.md) for similar use cases
- Consult the [Complete User Guide](USER_GUIDE.md) for comprehensive information

### Command Help
```bash
orc --help                    # General help
orc ask --help               # Command-specific help
orc chat                     # Then type /help for chat commands
```

## 🤝 Contributing

Found a useful workflow? Have a great recipe? We'd love to include it!

1. Test your workflow thoroughly
2. Document it clearly with examples
3. Submit a pull request with your addition

## 📋 Quick Reference

| Document | Best For | Length |
|----------|----------|---------|
| [Quick Start](QUICK_START.md) | Getting started fast | 5 min read |
| [Features](FEATURES.md) | Understanding capabilities | 10 min read |
| [User Guide](USER_GUIDE.md) | Comprehensive reference | 30 min read |
| [Recipes](RECIPES.md) | Practical examples | Browse as needed |

## 🏷️ Document Status

- ✅ Quick Start Guide - Complete and tested
- ✅ Features Overview - Complete with visual examples  
- ✅ User Guide - Comprehensive with all features
- ✅ Recipes - Practical workflows and automations

---

**Happy coding with OpenRouter CLI!** 🚀

If you find these docs helpful, consider giving the project a ⭐ on GitHub!
# Exa AI API Setup Guide

## Environment Configuration

Add the following to your `.env.local` file:

```
EXA_API_KEY=your_exa_api_key_here
```

## Getting Your Exa API Key

1. Visit [exa.ai](https://exa.ai)
2. Sign up for an account
3. Navigate to the API section
4. Generate your API key
5. Copy the key and add it to your `.env.local` file

## Features Enabled

- **Habit Discovery Feed**: Fetches live habit ideas from web content
- **Challenge Generation**: Auto-generates weekly knowledge quests
- **Smart Autocomplete**: Provides intelligent habit suggestions

## Caching

Results are cached for optimal performance:
- Habit Ideas: 7 days
- Challenges: 7 days  
- Autocomplete: 1 day

## Fallback Behavior

If the API is unavailable, the app will:
- Show cached results
- Display default suggestions
- Gracefully handle errors

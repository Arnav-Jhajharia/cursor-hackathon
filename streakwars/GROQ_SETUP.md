# Groq API Setup

To enable AI-powered habit verification, you need to set up your Groq API key.

## Setup Steps

1. **Get a Groq API Key**
   - Visit [https://console.groq.com/](https://console.groq.com/)
   - Sign up or log in to your account
   - Navigate to the API Keys section
   - Create a new API key

2. **Set Environment Variable**
   ```bash
   npx convex env set GROQ_API_KEY your_groq_api_key_here
   ```

3. **Deploy Changes**
   ```bash
   npx convex deploy
   ```

## Features Enabled

With Groq API integration, users can:

- **Photo Verification**: Upload images to verify habit completion
- **Reading Verification**: Submit book summaries for reading habits
- **AI Confidence Scoring**: Get confidence levels (0-1) for verification results
- **Audit Challenges**: Other users can challenge completions for verification

## Verification Types

### Photo Verification
- Users upload an image URL
- AI analyzes if the image shows the specific habit being performed
- Returns verification status with confidence score

### Reading Verification
- Users provide book name, page range, and summary
- AI checks if the summary is legitimate for the page count
- Validates content relevance and authenticity

## API Usage

The system uses Groq's multimodal models for verification:
- **Photo Verification**: `meta-llama/llama-4-scout-17b-16e-instruct` (supports image + text)
- **Reading Verification**: `llama-3.1-8b-instant` (text-only, fast and cost-effective)

## Cost Considerations

- Groq offers competitive pricing for API calls
- Photo verification uses vision capabilities
- Reading verification uses text analysis
- Monitor usage in your Groq dashboard

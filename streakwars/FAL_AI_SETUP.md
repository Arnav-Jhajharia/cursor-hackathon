# Fal.AI Integration Setup Guide

## Overview
This guide explains how to set up Fal.AI for the confessional deepfake system in Habituate.

## What is Fal.AI?
Fal.AI is a generative media platform that provides access to 600+ AI models for generating images, videos, audio, and 3D content. It offers serverless GPU infrastructure and developer-friendly APIs.

## Confessional System Features

### 🎬 Confessional Videos (When Streaks Break)
When a user breaks a habit streak, they must record a confessional video that gets deepfaked into ridiculous scenarios:

- **Skydiving Confession**: Confessing while free-falling from 10,000 feet
- **Courtroom Drama**: Standing trial for your broken habit
- **Soap Opera Scene**: Dramatic confession on a daytime soap
- **Space Station**: Confessing while floating in zero gravity
- **Medieval Castle**: Confessing in a medieval throne room
- **Underwater**: Confessing while scuba diving with sharks
- **Zombie Apocalypse**: Confessing while running from zombies
- **Superhero**: Confessing while flying through the city

### 🎉 Anti-Confessional Videos (For Milestones)
When users achieve milestones (7, 30, 100 days), they get to record victory videos:

- **Victory Parade**: Celebrating in a victory parade
- **Mountain Summit**: Declaring success from a mountain peak
- **Red Carpet**: Walking the red carpet for your success
- **Press Conference**: Announcing your achievement to the world

## Setup Instructions

### 1. Get Fal.AI API Key
1. Go to [fal.ai](https://fal.ai)
2. Sign up for an account
3. Navigate to your dashboard
4. Generate an API key
5. Copy the API key

### 2. Add Environment Variables
Add the following to your `.env.local` file:

```bash
# Fal.AI Configuration
FAL_KEY=your_fal_ai_api_key_here
```

### 3. Deploy with Environment Variables
Make sure to add the `FAL_KEY` to your Convex deployment:

```bash
npx convex env set FAL_KEY your_fal_ai_api_key_here
```

## How It Works

### 1. Streak Break Detection
- The system automatically detects when a user breaks a habit streak
- A confessional is triggered with a random scenario
- User must record a video confession

### 2. Milestone Detection
- When users reach 7, 30, or 100-day milestones
- An anti-confessional (victory video) is triggered
- User records a celebration video

### 3. Deepfake Processing
- User's recorded video is processed with Fal.AI
- Face is swapped into the selected scenario background
- Processed video is sent to a close friend (for confessionals)
- Videos are stored and can be viewed in the confessional dashboard

## API Integration

### Current Implementation
The system is set up with placeholder functions that simulate the deepfake process. To enable real Fal.AI integration:

1. **Research Available Models**: Check Fal.AI's model gallery for face swap models
2. **Update Model Names**: Replace placeholder model names in `convex/falAiActions.ts`
3. **Implement Real Processing**: Uncomment and modify the `processWithFalAI` function
4. **Test Integration**: Use the test functions to verify the connection

### Available Functions
- `processConfessionalVideo`: Processes confession videos with deepfake
- `getAvailableModels`: Lists available Fal.AI models
- `testFalAIConnection`: Tests the Fal.AI connection

## Testing the System

### 1. Test Fal.AI Connection
```bash
npx convex run falAiActions:testFalAIConnection '{}'
```

### 2. Create a Test Confessional
1. Break a habit streak (miss a day)
2. Go to the dashboard
3. Look for the confessional notification
4. Record a confession video
5. Select a scenario
6. Submit for processing

### 3. View Confessionals
- Go to the dashboard
- Scroll down to "My Confessionals" section
- View all your past confessionals and their status

## Troubleshooting

### Common Issues

1. **"Fal.AI service not configured"**
   - Make sure `FAL_KEY` is set in your environment variables
   - Redeploy Convex with the environment variable

2. **"No response from Fal.AI API"**
   - Check your API key is valid
   - Verify you have credits in your Fal.AI account
   - Check the model names are correct

3. **"Failed to parse response"**
   - The AI model might not be returning valid JSON
   - Check the model documentation for correct parameters

### Debug Mode
Enable debug logging by checking the browser console and Convex logs for detailed error messages.

## Future Enhancements

### Planned Features
- **Real-time Processing**: Live deepfake generation
- **Custom Scenarios**: User-created confessional scenarios
- **Social Sharing**: Share confessionals on social media
- **Friend Notifications**: Automatic notifications when friends break streaks
- **Streak Insurance**: Pay to avoid confessionals
- **Confessional Challenges**: Compete to see who has the most dramatic confessionals

### Advanced Integration
- **Multiple AI Models**: Use different models for different scenarios
- **Voice Cloning**: Match voice to the scenario
- **Background Music**: Add dramatic music to confessionals
- **Text Overlays**: Add dramatic text overlays
- **Multi-person Confessionals**: Group confessionals for group challenges

## Cost Considerations

Fal.AI uses a pay-per-use model:
- **Face Swap**: ~$0.10-0.50 per video
- **Video Generation**: ~$0.50-2.00 per video
- **Processing Time**: 30 seconds to 5 minutes per video

Consider implementing:
- **Rate Limiting**: Limit confessionals per user per day
- **Premium Tiers**: Different confessional quality for different user tiers
- **Batch Processing**: Process multiple videos together to reduce costs

## Security & Privacy

### Data Protection
- Videos are processed securely through Fal.AI
- Original videos are deleted after processing
- Only processed deepfake videos are stored
- Users can delete their confessionals at any time

### Consent
- Users must explicitly consent to recording
- Clear explanation of how videos will be used
- Option to opt-out of confessional system
- Friend notification system requires mutual consent

## Support

For issues with:
- **Fal.AI API**: Check [Fal.AI Documentation](https://fal.ai/docs)
- **Convex Integration**: Check Convex logs and documentation
- **App Issues**: Check browser console and Convex dashboard

---

**Note**: This is a fun, gamified feature designed to add humor and accountability to habit tracking. The deepfake technology is used for entertainment purposes only, and users should be aware of the implications of sharing AI-generated content.

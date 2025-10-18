# Splitwise Integration Setup

## Overview
The Splitwise integration allows users to create money-based challenges where winners are automatically settled via Splitwise API.

## Features
- **Money Challenges**: Create challenges with real money prizes
- **Automatic Settlement**: Winners are automatically paid via Splitwise
- **Multi-currency Support**: USD, EUR, GBP, CAD
- **Group Management**: Automatic Splitwise group creation for challenges

## Setup Instructions

### 1. Get Splitwise API Key
1. Go to [Splitwise Developers](https://secure.splitwise.com/oauth_clients)
2. Create a new OAuth application
3. Get your API key

### 2. Environment Variables
Add to your `.env.local` file:
```bash
# Splitwise API Configuration
SPLITWISE_API_KEY=drgpa3QeZq2uExRroIsO7u9e6mL1FpXbH9VJB0LX

# Splitwise OAuth 1.0 Credentials
SPLITWISE_CONSUMER_KEY=8QkjJIO5F8lyYKEFwtrJuBpd057ptxiag8JLkxqK
SPLITWISE_CONSUMER_SECRET=obKh66Ex3aUQyOB62IYEgzfDzsbcVRhCmk1cY6xQ

# Splitwise OAuth URLs
SPLITWISE_REQUEST_TOKEN_URL=https://secure.splitwise.com/oauth/request_token
SPLITWISE_ACCESS_TOKEN_URL=https://secure.splitwise.com/oauth/access_token
SPLITWISE_AUTHORIZE_URL=https://secure.splitwise.com/oauth/authorize
```

### 3. User Setup
Users need to connect their Splitwise account:
- Go to Profile Settings
- Connect Splitwise Account
- Enter Splitwise User ID

## How It Works

### Creating Money Challenges
1. User selects "Real Money" prize type
2. Sets prize amount and currency
3. System creates Splitwise group for participants
4. Prize pool is tracked in database

### Challenge Settlement
1. When challenge ends, winner is determined
2. System creates Splitwise expense
3. Winner receives full prize amount
4. Other participants owe their share
5. Settlement is tracked in database

## API Endpoints

### Splitwise Functions
- `connectSplitwiseAccount`: Connect user's Splitwise account
- `createSplitwiseGroup`: Create group for money challenge
- `settleMoneyChallenge`: Settle challenge via Splitwise
- `getPrizePool`: Get prize pool information

### Rewards Functions
- `getUserRewardsBalance`: Get user's app coin balance
- `addRewards`: Add coins to user's balance
- `spendRewards`: Spend coins from user's balance
- `awardChallengeWinner`: Award challenge winners

## Prize Pool Types

### 1. No Prize 🏆
- Just for fun
- No monetary or coin rewards

### 2. App Coins 🪙
- Virtual currency system
- Earned through habits and challenges
- Can be spent on app features

### 3. Real Money 💰
- Actual money prizes
- Settled via Splitwise
- Requires Splitwise account connection

## Security Notes
- All money amounts stored in cents to avoid floating point issues
- Splitwise API calls are server-side only
- User Splitwise IDs are stored securely
- Settlement transactions are logged

## Testing
To test the integration:
1. Create a money challenge
2. Join with multiple users
3. Complete the challenge
4. Check Splitwise for automatic settlement

## Troubleshooting
- Ensure Splitwise API key is valid
- Check user has connected Splitwise account
- Verify challenge has ended before settlement
- Check Splitwise group was created successfully

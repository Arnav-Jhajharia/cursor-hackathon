# Environment Variables Setup

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

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

# Splitwise OAuth 2.0 URLs
SPLITWISE_TOKEN_URL=https://secure.splitwise.com/oauth/token
SPLITWISE_OAUTH2_AUTHORIZE_URL=https://secure.splitwise.com/oauth/authorize

# Next.js Environment Variables (if not already set)
NEXT_PUBLIC_CONVEX_URL=https://helpful-heron-123.convex.cloud
CONVEX_DEPLOYMENT=helpful-heron-123

# Clerk Authentication (if not already set)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c2VjdXJlLWRvZ2Zpc2gtMzUuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_8Q2XJ9K7L3M4N5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0

# Resend Email API (if not already set)
RESEND_API_KEY=re_1234567890abcdef
```

## Setup Instructions

1. **Create the file:**
   ```bash
   touch .env.local
   ```

2. **Add the variables:**
   Copy the content above into your `.env.local` file

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

4. **Deploy to Convex:**
   ```bash
   npx convex deploy
   ```

## Testing the Integration

Once the environment variables are set up:

1. **Create a money challenge** in the app
2. **Join the challenge** with multiple users
3. **Complete the challenge** and determine a winner
4. **Check Splitwise** for automatic settlement

## Security Notes

- Never commit `.env.local` to version control
- The file is already in `.gitignore`
- Keep your API keys secure
- Rotate keys periodically

## Troubleshooting

If you encounter issues:

1. **Check environment variables** are loaded correctly
2. **Verify API key** is valid and active
3. **Check Splitwise API** status
4. **Review console logs** for error messages

## Next Steps

After setting up the environment variables:

1. Test creating a money challenge
2. Test joining challenges
3. Test the settlement process
4. Monitor Splitwise for automatic payments

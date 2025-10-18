# Email Setup for habituate

## 1. Get Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Go to API Keys section
4. Create a new API key
5. Copy the API key

## 2. Set Environment Variable

Add your Resend API key to your Convex environment:

```bash
npx convex env set RESEND_API_KEY your_api_key_here
```

## 3. Verify Domain (Optional)

For production, you'll want to:
1. Add your domain in Resend dashboard
2. Update the email template in `convex/email.ts`:
   - Change `from: 'habituate <invites@habituate.app>'` to your domain
   - Update the signup link URL

## 4. Test

1. Try sending a friend invitation to a non-user email
2. Check the email inbox
3. Verify the email looks good

## Email Template Features

- ✅ Beautiful HTML design matching your app
- ✅ Mobile-responsive
- ✅ Social proof stats
- ✅ Clear call-to-action button
- ✅ Fallback text version
- ✅ Professional branding

The email will be sent automatically when someone invites a non-user!


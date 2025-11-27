# Instagram Token Refresh System

## Overview

Instagram long-lived access tokens expire after **60 days**. This system automatically refreshes your token before it expires, ensuring uninterrupted access to Instagram media on the Lit Zone page.

## How It Works

1. **Token Storage**: Your current token is stored in `.env.local`
2. **Metadata Tracking**: Token expiration info is saved in `scripts/instagram-token.json`
3. **Automatic Refresh**: The script checks if the token needs refreshing (< 30 days left)
4. **Token Update**: If needed, it calls Instagram's refresh API and updates `.env.local`

## Quick Start

### Manual Refresh

Run the refresh script manually anytime:

```bash
npm run refresh-instagram-token
```

The script will:
- ✅ Check if refresh is needed (< 30 days until expiration)
- ✅ Call Instagram's refresh API
- ✅ Update `.env.local` with the new token
- ✅ Save metadata for tracking

### First Time Setup

If you're setting up for the first time:

1. Get a long-lived token from Meta Developer Dashboard
2. Add it to `.env.local`:
   ```env
   IG_USER_ID=your_user_id
   IG_ACCESS_TOKEN=your_long_lived_token
   ```
3. Run the script once to initialize metadata:
   ```bash
   npm run refresh-instagram-token
   ```

## Automated Refresh (Recommended)

### Option 1: Windows Task Scheduler

1. Open **Task Scheduler**
2. Create a new task:
   - **Trigger**: Monthly (or every 30 days)
   - **Action**: Start a program
   - **Program**: `npm`
   - **Arguments**: `run refresh-instagram-token`
   - **Start in**: `D:\Avadhut\ZCode\Digial Marketing\Zecode-Website\Zecode-New\zecode-frontend`

### Option 2: Cron Job (Linux/Mac)

Add to crontab:
```bash
# Run every 30 days at 2 AM
0 2 */30 * * cd /path/to/zecode-frontend && npm run refresh-instagram-token
```

### Option 3: CI/CD Pipeline

Add to your deployment pipeline (GitHub Actions, etc.):

```yaml
name: Refresh Instagram Token
on:
  schedule:
    - cron: '0 0 */30 * *'  # Every 30 days
jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Refresh Token
        run: npm run refresh-instagram-token
      - name: Commit Updated Token
        run: |
          git config user.name "Bot"
          git config user.email "bot@example.com"
          git add .env.local scripts/instagram-token.json
          git commit -m "chore: refresh Instagram token"
          git push
```

## Token Metadata

The script saves metadata to `scripts/instagram-token.json`:

```json
{
  "access_token": "EAAT...",  // First 20 chars (for reference)
  "token_type": "bearer",
  "expires_in": 5183944,      // Seconds until expiration
  "expires_at": 1234567890,   // Unix timestamp
  "refreshed_at": "2025-11-22T14:35:31.000Z"
}
```

## Troubleshooting

### "Could not load current token from .env.local"

**Solution**: Ensure `.env.local` exists and contains `IG_ACCESS_TOKEN=...`

### "Refresh failed 400: Invalid OAuth access token"

**Possible causes**:
1. Token already expired (> 60 days old)
2. Token was revoked
3. App permissions changed

**Solution**: Generate a new long-lived token from Meta Developer Dashboard

### "Token refresh completed but app still shows error"

**Solution**: Restart your Next.js development server:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

## Important Notes

### Token Lifespan
- **Short-lived tokens**: 1 hour (not used in this system)
- **Long-lived tokens**: 60 days (what we use)
- **Refreshed tokens**: Another 60 days from refresh date

### Refresh Window
- The script refreshes when < 30 days remain
- This gives you a 30-day buffer in case of issues
- You can adjust this in the script (`shouldRefreshToken(30)`)

### Security
- ⚠️ **Never commit `.env.local` to git**
- ⚠️ Keep `scripts/instagram-token.json` private (it's in `.gitignore`)
- ⚠️ Tokens are sensitive - treat them like passwords

### Production Deployment

For production, consider:
1. Using environment variables from your hosting platform
2. Storing tokens in a secure database
3. Setting up automated refresh via serverless functions
4. Implementing monitoring/alerting for refresh failures

## Manual Token Generation

If you need to generate a new token manually:

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your app
3. Go to Instagram > Basic Display or Instagram Graph API
4. Generate a long-lived access token
5. Copy the token
6. Update `.env.local`
7. Run `npm run refresh-instagram-token` to initialize metadata

## Monitoring

Check token status anytime:

```bash
npm run refresh-instagram-token
```

Output will show:
- Days until expiration
- Whether refresh is needed
- Refresh status

## Support

If you encounter issues:
1. Check the console output for error messages
2. Verify your token in Meta Developer Dashboard
3. Ensure your app has the correct Instagram permissions
4. Check network connectivity to `graph.instagram.com`

---

**Last Updated**: 2025-11-22

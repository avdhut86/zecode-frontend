# Instagram API Setup Guide

This guide will help you set up Instagram API integration for the **Lit Zone** page.

## Overview

The Lit Zone page can import Instagram reels automatically using the Instagram Graph API. However, this feature is **optional** - the page works perfectly fine without it, allowing you to manually add reels.

## Current Status

✅ **The Lit Zone page is now working!**
- You can manually add reels using the "+ Add Reel" button
- Manual reels are stored in your browser's localStorage
- Instagram import is optional and can be set up later

## Setting Up Instagram API (Optional)

If you want to enable automatic Instagram import, follow these steps:

### Step 1: Create a Facebook/Meta Developer Account

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Log in with your Facebook account
3. Click "My Apps" and create a new app

### Step 2: Set Up Instagram API

Based on the screenshot you shared, you're already on the right track! Here's what you need to do:

1. **Choose API Type**: Select "Instagram API" when setting up your app
2. **Add Required Permissions**: 
   - `instagram_business_basic`
   - `instagram_manage_comments`
   - `instagram_business_manage_messages`
3. **Generate Access Token**: Follow the steps in the Meta dashboard to generate your access token
4. **Get Your Instagram User ID**: This will be provided in the API setup

### Step 3: Configure Environment Variables

1. Create a file named `.env.local` in the `zecode-frontend` directory
2. Add the following content:

```env
# Your Instagram User ID (from Meta Developer Dashboard)
IG_USER_ID=your_instagram_user_id_here

# Your Instagram Access Token (keep this secret!)
IG_ACCESS_TOKEN=your_access_token_here
```

3. Replace the placeholder values with your actual credentials
4. **Important**: Never commit `.env.local` to git (it's already in .gitignore)

### Step 4: Restart Development Server

After adding the credentials:
1. Stop your development server (Ctrl+C)
2. Restart it with `npm run dev`
3. The Instagram import button should now work!

## Testing

1. Visit the Lit Zone page: `http://localhost:3000/lit-zone`
2. Click "Import latest from Instagram"
3. If configured correctly, your Instagram reels should appear

## Troubleshooting

### "Instagram API credentials not configured" message
- This is normal if you haven't set up the API yet
- You can still use the page by manually adding reels

### Import button not working
- Check that `.env.local` exists and has the correct variable names
- Verify your access token hasn't expired
- Check the browser console for error messages

### Access token expired
- Instagram access tokens expire periodically
- You'll need to regenerate them in the Meta Developer Dashboard

## Need Help?

Refer to the official documentation:
- [Instagram Graph API Documentation](https://developers.facebook.com/docs/instagram-api)
- [Instagram Basic Display API](https://developers.facebook.com/docs/instagram-basic-display-api)


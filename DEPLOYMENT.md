# ZECODE Deployment Guide - Vercel + Free Database

## Overview
Deploy the ZECODE website to Vercel with a free PostgreSQL database.

---

## Step 1: Set Up Free PostgreSQL Database (Neon)

### Why Neon?
- **Free tier**: 0.5 GB storage, 3 GB data transfer/month
- **Serverless**: Perfect for Vercel edge functions
- **Built-in connection pooling**: Works great with Prisma

### Setup Instructions:

1. **Go to [neon.tech](https://neon.tech)** and sign up (free)

2. **Create a new project**:
   - Project name: `zecode-production`
   - Region: Choose closest to your users (e.g., `us-east-1` or `ap-south-1` for India)

3. **Get your connection string**:
   - Go to Dashboard → Connection Details
   - Copy the connection string (looks like):
   ```
   postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
   ```

4. **Create the database schema**:
   - In Neon console, go to SQL Editor
   - Run the migration (or use Prisma from local)

---

## Step 2: Update Project for Production

### 2.1 Update `.env` file structure

Create `.env.production` for reference (don't commit this):
```env
DATABASE_URL="postgresql://username:password@ep-xxx.neon.tech/neondb?sslmode=require"
```

### 2.2 Update Prisma for Neon (Serverless)

The current setup with `@prisma/adapter-pg` works, but for serverless you may want to use Neon's native driver.

---

## Step 3: Push to GitHub

### 3.1 Initialize Git (if not done)
```bash
cd zecode-frontend
git init
git add .
git commit -m "Initial commit - ZECODE frontend"
```

### 3.2 Create GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Create repository: `zecode-frontend`
3. Push your code:
```bash
git remote add origin https://github.com/YOUR_USERNAME/zecode-frontend.git
git branch -M main
git push -u origin main
```

### 3.3 Add `.gitignore` entries
Make sure these are in `.gitignore`:
```
.env
.env.local
.env.production
node_modules/
.next/
src/generated/
```

---

## Step 4: Deploy to Vercel

### 4.1 Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with GitHub

2. Click **"Add New Project"**

3. **Import your GitHub repository**: `zecode-frontend`

4. **Configure Project Settings**:
   - Framework Preset: `Next.js` (auto-detected)
   - Root Directory: `./` (or `zecode-frontend` if monorepo)
   - Build Command: `prisma generate && next build`
   - Install Command: `npm install`

### 4.2 Add Environment Variables

In Vercel Project Settings → Environment Variables, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `DATABASE_URL` | `postgresql://...@neon.tech/...?sslmode=require` | Production, Preview |
| `NEXT_PUBLIC_DIRECTUS_URL` | `https://your-directus.com` (or leave empty) | All |
| `NODE_TLS_REJECT_UNAUTHORIZED` | `1` | Production |

### 4.3 Deploy

Click **"Deploy"** - Vercel will:
1. Clone your repo
2. Install dependencies
3. Generate Prisma client
4. Build Next.js
5. Deploy to edge network

---

## Step 5: Run Database Migration on Neon

### Option A: From Local Machine
```bash
# Set production DATABASE_URL temporarily
$env:DATABASE_URL="postgresql://...@neon.tech/neondb?sslmode=require"

# Push schema to Neon
npx prisma db push

# Seed the database
npm run db:seed
```

### Option B: Use Neon SQL Editor
Copy and run the SQL from Prisma migrations in Neon's SQL Editor.

---

## Step 6: Deploy Directus CMS (Optional)

For the admin control panel, you have options:

### Option A: Directus Cloud (Recommended)
- Free tier available at [directus.cloud](https://directus.cloud)
- Managed hosting, easy setup

### Option B: Railway.app
- Free $5/month credit
- Deploy Directus + PostgreSQL together
- Template: [railway.app/template/directus](https://railway.app/template/directus)

### Option C: Render.com
- Free tier for web services
- Use their PostgreSQL or connect to Neon

### Setup Directus:
1. Deploy Directus to your chosen platform
2. Point it to your Neon database (or separate DB)
3. Update `NEXT_PUBLIC_DIRECTUS_URL` in Vercel

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         GITHUB                               │
│                    (Source Control)                          │
└─────────────────────────┬───────────────────────────────────┘
                          │ Auto Deploy
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                         VERCEL                               │
│              Next.js Frontend (Free Tier)                    │
│         https://zecode.vercel.app                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌──────────────────┐           ┌──────────────────┐
│      NEON        │           │    DIRECTUS      │
│   PostgreSQL     │           │   (Optional)     │
│   (Free Tier)    │           │  Control Panel   │
│                  │           │                  │
│ • Products       │           │ • Content Mgmt   │
│ • Stores         │           │ • Media Upload   │
│ • Categories     │           │ • API Access     │
└──────────────────┘           └──────────────────┘
```

---

## Free Tier Limits Summary

| Service | Free Tier Limits |
|---------|------------------|
| **Vercel** | 100GB bandwidth/month, Unlimited deployments |
| **Neon** | 0.5GB storage, 3GB transfer/month, 1 project |
| **Directus Cloud** | 1 project, limited users |
| **GitHub** | Unlimited public repos |

---

## Quick Deploy Checklist

- [ ] Create Neon account and database
- [ ] Get Neon connection string
- [ ] Push code to GitHub
- [ ] Connect GitHub to Vercel
- [ ] Add environment variables in Vercel
- [ ] Deploy and verify
- [ ] Run database migration/seed
- [ ] (Optional) Set up Directus for CMS

---

## Useful Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database
npm run db:seed

# Build locally to test
npm run build

# Check for errors
npm run lint
```

---

## Troubleshooting

### "Cannot find module '@prisma/client'"
- Add `prisma generate` to build command in Vercel

### Database connection errors
- Ensure `?sslmode=require` is in DATABASE_URL for Neon
- Check Vercel environment variables are set correctly

### Build fails
- Check Node.js version matches (use `.nvmrc` file)
- Ensure all dependencies are in `package.json`

---

## Next Steps After Deployment

1. **Custom Domain**: Add your domain in Vercel settings
2. **Analytics**: Enable Vercel Analytics (free tier available)
3. **Monitoring**: Set up error tracking (Sentry free tier)
4. **CDN**: Images are auto-optimized by Vercel

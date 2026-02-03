# 🚀 Cloudflare Workers Deployment Tutorial

## Overview

This guide documents how we successfully deployed an Astro SSR application to Cloudflare Workers, including troubleshooting steps and solutions.

---

## 🎯 Why Cloudflare Workers?

Cloudflare **recommends Workers for new projects** over Pages because:
- Better performance and control
- More consistent runtime environment
- Direct access to all Cloudflare bindings
- Simpler configuration for SSR applications

---

## 📋 Prerequisites

- Node.js 18+ installed
- Cloudflare account (free tier works)
- Wrangler CLI installed
- Astro project with `@astrojs/cloudflare` adapter

---

## 🔧 Configuration Steps

### 1. Install Required Packages

```bash
npm install wrangler@latest --save-dev
npm install @astrojs/cloudflare
```

### 2. Configure Astro for Cloudflare

**astro.config.mjs:**
```javascript
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    platformProxy: {
      enabled: true
    }
  }),
});
```

### 3. Create Wrangler Configuration

**wrangler.toml:**
```toml
name = "astrojsshop"
main = "dist/_worker.js/index.js"
compatibility_date = "2026-02-03"
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]

[assets]
binding = "ASSETS"
directory = "./dist"

[observability]
enabled = true

# D1 Database binding
[[d1_databases]]
binding = "DB"
database_name = "foto_db"
database_id = "YOUR_DATABASE_ID_HERE"

# R2 for photo storage
[[r2_buckets]]
binding = "PHOTOS"
bucket_name = "foto-bucket"

# KV for session storage
[[kv_namespaces]]
binding = "SESSION"
id = "YOUR_KV_ID_HERE"
```

### 4. Create Assets Ignore File

**public/.assetsignore:**
```
_worker.js
```

This prevents the worker script from being uploaded as a static asset.

---

## 🔑 Critical Configuration Points

### Compatibility Flags

The most important setting for Workers deployment:

```toml
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]
```

**Why this matters:**
- `nodejs_compat` - Enables Node.js API compatibility in Workers runtime
- `global_fetch_strictly_public` - Ensures fetch API works correctly
- **Without these flags, you'll get HTTP 500 errors!**

### Bindings in wrangler.toml

**Key Difference:** Unlike Cloudflare Pages, Workers use bindings defined in `wrangler.toml`:

✅ **Workers (Recommended):**
- Bindings defined in `wrangler.toml`
- Consistent across local and production
- Easier to version control

❌ **Pages (Our Initial Attempt):**
- Bindings defined in Dashboard
- `wrangler.toml` bindings were ignored/conflicted
- Led to "bindings managed through wrangler.toml" errors

---

## 🚨 Common Issues We Encountered

### Issue 1: HTTP 500 Error - Bindings Not Available

**Problem:**
```
HTTP 500 error when accessing site
Bindings (DB, PHOTOS, SESSION) not accessible in runtime
```

**Root Cause:**
Pages deployment was trying to use Dashboard bindings, but `wrangler.toml` was overriding them incorrectly.

**Solution:**
Switch to Workers deployment which properly reads bindings from `wrangler.toml`.

### Issue 2: Missing compatibility_flags

**Problem:**
```
Error: Could not resolve Node.js built-in modules
Server fails to start
```

**Root Cause:**
Workers runtime doesn't support Node.js APIs by default.

**Solution:**
Add `nodejs_compat` flag to `wrangler.toml`:
```toml
compatibility_flags = ["nodejs_compat", "global_fetch_strictly_public"]
```

### Issue 3: "_worker.js" Upload Error

**Problem:**
```
ERROR: Uploading a Pages _worker.js directory as an asset
```

**Root Cause:**
Wrangler was trying to upload the worker script as a static asset.

**Solution:**
Create `public/.assetsignore` file with `_worker.js` entry.

### Issue 4: Context.locals.runtime.env Not Available

**Problem:**
```javascript
// This failed in production:
const db = context.locals.runtime.env.DB;
```

**Root Cause:**
Runtime access patterns differ between development and production.

**Solution:**
Add error handling and fallback:
```javascript
const runtime = context.locals.runtime;
if (!runtime?.env?.DB) {
  console.error('Missing Cloudflare bindings');
  return new Response('Configuration error', { status: 500 });
}
const db = runtime.env.DB;
```

---

## 📦 Deployment Process

### Create Cloudflare Resources

```bash
# 1. Create D1 Database
npx wrangler d1 create foto_db
# Copy the database_id to wrangler.toml

# 2. Create R2 Bucket
npx wrangler r2 bucket create foto-bucket

# 3. Create KV Namespace
npx wrangler kv:namespace create "SESSION"
# Copy the id to wrangler.toml

# 4. Upload database schema
npx wrangler d1 execute foto_db --file=./schema.sql
```

### Set Environment Variables

```bash
# For local development
echo "RESEND_API_KEY=your_key_here" > .dev.vars
echo "ADMIN_EMAIL=your@email.com" >> .dev.vars

# For production (stored in Workers environment)
# These are already in wrangler.toml or set via Dashboard
```

### Build and Deploy

```bash
# Build the Astro project
npm run build

# Deploy to Cloudflare Workers
npx wrangler deploy
```

**Output should show:**
```
✨ Success! Uploaded X files
Your Worker has access to the following bindings:
  env.SESSION (xxx)      KV Namespace
  env.DB (foto_db)       D1 Database
  env.PHOTOS (foto-bucket) R2 Bucket
  env.ASSETS             Assets

Deployed astrojsshop triggers
  https://your-worker.workers.dev
```

---

## 🔍 Verification Steps

### 1. Check Deployment Status

```bash
curl -I https://your-worker.workers.dev
```

Expected: `HTTP/2 302` (redirect to login) or `HTTP/2 200` (page loads)

### 2. Test Bindings

Access your worker and check browser console for any binding errors.

### 3. Verify Database Connection

```bash
npx wrangler d1 execute foto_db --command="SELECT COUNT(*) FROM photos"
```

---

## 📊 Workers vs Pages Comparison

| Feature | Workers (✅ Used) | Pages (❌ Initial Attempt) |
|---------|------------------|---------------------------|
| Binding Config | `wrangler.toml` | Dashboard |
| Node.js Compat | Via flags | Built-in |
| Deployment | `wrangler deploy` | GitHub integration |
| Runtime | Consistent | Can differ |
| Error Messages | Clear | Confusing |
| SSR Support | Excellent | Good but complex |

---

## 🎓 Key Learnings

1. **Always use Workers for new SSR projects** - Cloudflare's recommendation is correct
2. **Compatibility flags are critical** - Don't skip `nodejs_compat`
3. **Bindings in wrangler.toml** - Keep everything in one place for Workers
4. **Error handling is important** - Check for bindings existence before use
5. **Build locally first** - Always test `npm run build` before deploying

---

## 🔄 Continuous Deployment

### Option 1: Manual Deployment

```bash
npm run build && npx wrangler deploy
```

### Option 2: GitHub Actions (Recommended)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

---

## 🛠️ Troubleshooting Commands

```bash
# View deployment logs
npx wrangler tail

# Test locally with remote bindings
npx wrangler dev --remote

# Check wrangler configuration
npx wrangler whoami

# List all deployments
npx wrangler deployments list

# Rollback to previous deployment
npx wrangler rollback [deployment-id]
```

---

## 📝 Final Checklist

Before going live:

- [ ] `wrangler.toml` has correct compatibility_flags
- [ ] All bindings (DB, R2, KV) are configured
- [ ] Environment variables are set
- [ ] Database schema is uploaded
- [ ] `.assetsignore` file exists in `public/`
- [ ] Local build succeeds (`npm run build`)
- [ ] Test deployment works
- [ ] Error handling is in place
- [ ] Monitoring/logging is configured

---

## 🎉 Success Metrics

After successful deployment, you should have:

✅ Worker accessible at `https://your-worker.workers.dev`  
✅ HTTP 302/200 responses (not 500)  
✅ All bindings accessible in runtime  
✅ Database queries working  
✅ R2 file access working  
✅ Session management working  
✅ No console errors in browser  

---

## 📚 Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/deploy/cloudflare/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [D1 Database Guide](https://developers.cloudflare.com/d1/)
- [R2 Storage Guide](https://developers.cloudflare.com/r2/)

---

## 💡 Pro Tips

1. **Always test locally first** with `npx wrangler dev --remote`
2. **Use Wrangler tail** for real-time production logs
3. **Version your wrangler.toml** in git for consistency
4. **Set up alerts** in Cloudflare Dashboard for errors
5. **Monitor usage** to stay within free tier limits
6. **Keep bindings minimal** - only add what you need

---

**Last Updated:** February 2026  
**Status:** ✅ Production Ready  
**Deployment Type:** Cloudflare Workers (Recommended)

---

_This guide was created during the actual deployment process, documenting every issue we encountered and how we solved it._
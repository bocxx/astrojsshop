# Quick Start Guide

Get your photo ordering app running in 5 minutes!

## 1. Setup Environment

```bash
# Copy example env file
cp .dev.vars.example .dev.vars

# Edit .dev.vars with your credentials:
# - Get RESEND_API_KEY from https://resend.com
# - Set ADMIN_EMAIL to your email
```

## 2. Create Cloudflare Database

```bash
# Create D1 database
npx wrangler d1 create foto_db

# Copy the database_id and update wrangler.toml
# Then run the schema
npx wrangler d1 execute foto_db --local --file=./schema.sql
```

## 3. Create R2 Buckets

```bash
npx wrangler r2 bucket create foto-bucket
npx wrangler r2 bucket create foto-bucket-preview
```

## 4. Start Dev Server

```bash
npm run dev
```

Visit http://localhost:4321

## 5. Add Your First Photo

```bash
# Upload to R2
npx wrangler r2 object put foto-bucket/test.jpg --file=path/to/your/photo.jpg --local

# Add to database (replace photo details)
npx wrangler d1 execute foto_db --local --command="
INSERT INTO photos (id, name, description, r2_key, available) 
VALUES ('$(uuidgen)', 'Test Photo', 'A test photo', 'test.jpg', 1);"
```

## 6. Test the App

1. Visit http://localhost:4321
2. Click "Register" and create an account
3. You should see your photo in the gallery
4. Click "Add to Order" and place an order
5. Check your admin email for the order notification!

## Deploy to Production

```bash
# Login to Cloudflare
npx wrangler login

# Create production resources
npx wrangler d1 create foto_db
npx wrangler d1 execute foto_db --file=./schema.sql
npx wrangler r2 bucket create foto-bucket

# Set secrets
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put ADMIN_EMAIL

# Build and deploy
npm run build
npx wrangler deploy
```

Done! 🎉

## Common Issues

**Photos not showing?**
- Check R2 upload succeeded
- Verify database entry exists
- Check wrangler.toml bindings are correct

**Emails not sending?**
- Verify RESEND_API_KEY in .dev.vars
- Make sure sender email is verified in Resend
- Check Resend dashboard for errors

**Database errors?**
- Make sure you ran the schema.sql file
- Check database_id in wrangler.toml matches your D1 database

For more details, see the full README.md

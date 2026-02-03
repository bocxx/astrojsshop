# Photo Ordering App

A simple photo gallery and ordering system built with Astro 6 and Cloudflare.

## Features

- 📸 Photo gallery with R2 storage
- 👤 User registration and authentication
- 🛒 Simple ordering system (no payment processing)
- 📧 Email notifications via Resend
- 🚀 Deployed on Cloudflare's edge network

## Tech Stack

- **Astro 6** (beta) - Web framework with server-side rendering
- **Cloudflare Workers** - Deployment platform (recommended by Cloudflare)
- **Cloudflare D1** - SQL database
- **Cloudflare R2** - Object storage for photos
- **Resend** - Email service
- **TypeScript** - Type safety

## Prerequisites

- Node.js 18+ installed
- A Cloudflare account (free tier works)
- A Resend account for email (free tier available)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Cloudflare Resources

#### Create D1 Database

```bash
# Create the database
npx wrangler d1 create foto_db

# Copy the database_id from the output and update wrangler.toml
```

Update `wrangler.toml` with your database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "foto_db"
database_id = "YOUR_DATABASE_ID_HERE"
```

#### Initialize Database Schema

```bash
# Run schema locally
npx wrangler d1 execute foto_db --local --file=./schema.sql

# Run schema in production (when ready)
npx wrangler d1 execute foto_db --file=./schema.sql
```

#### Create R2 Bucket

```bash
# Create bucket
npx wrangler r2 bucket create foto-bucket

# Create preview bucket for local development
npx wrangler r2 bucket create foto-bucket-preview
```

### 3. Set Up Environment Variables

Create a `.dev.vars` file in the project root:

```bash
RESEND_API_KEY=re_your_resend_api_key
ADMIN_EMAIL=your-email@example.com
```

**Important:** Never commit `.dev.vars` to version control!

### 4. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:4321`

## Uploading Photos

Photos are stored in Cloudflare R2. To add photos:

### Option 1: Automated Upload Script (Aanbevolen) ⚡

```bash
# 1. Plaats je foto's in de uploads map
cp ~/Downloads/*.jpg ./uploads/fotos/

# 2. Run het upload script
./scripts/upload-photos.sh

# Voor productie:
./scripts/upload-photos.sh --remote
```

Het script:
- ✅ Upload automatisch alle foto's naar R2
- ✅ Voegt ze toe aan de database
- ✅ Ondersteunt batch uploads
- ✅ Maakt automatisch mooie display namen

Zie `uploads/README.md` voor meer details.

### Option 2: Handmatig met Wrangler CLI

```bash
# 1. Upload photo to R2
npx wrangler r2 object put foto-bucket/sunset.jpg --file=./path/to/sunset.jpg --local

# 2. Add to database
npx wrangler d1 execute foto_db --local --command="
INSERT INTO photos (id, name, description, r2_key, available) 
VALUES ('$(uuidgen)', 'Beautiful Sunset', 'Sunset over mountains', 'sunset.jpg', 1);"
```

**Note:** Voor productie, gebruik `--remote` in plaats van `--local`.

## Deployment

### 1. Login to Cloudflare

```bash
npx wrangler login
```

### 2. Create Production Resources

```bash
# Create production database (if not already done)
npx wrangler d1 create foto_db

# Run schema
npx wrangler d1 execute foto_db --file=./schema.sql

# Create production R2 bucket
npx wrangler r2 bucket create foto-bucket
```

### 3. Set Production Environment Variables

```bash
# Set Resend API key
npx wrangler secret put RESEND_API_KEY
# Enter your API key when prompted

# Set admin email
npx wrangler secret put ADMIN_EMAIL
# Enter your email when prompted
```

### 4. Deploy

```bash
# Build the project
npm run build

# Deploy to Cloudflare Workers
npx wrangler deploy
```

Your app will be live at `https://foto-bestellen.YOUR_SUBDOMAIN.workers.dev` (or your custom domain).

## How It Works

### User Flow

1. **Browse Photos** - Anyone can view the photo gallery
2. **Register/Login** - Users must authenticate to place orders
3. **Select Photos** - Add photos to cart with quantity
4. **Place Order** - Submit order (no payment required)
5. **Email Notifications** - Both admin and customer receive emails

### Email Notifications

When an order is placed:

- **Admin receives:** Order details with customer info and photo list
- **Customer receives:** Order confirmation with order number

### Database Schema

- **users** - User accounts with hashed passwords
- **photos** - Photo metadata and R2 keys
- **orders** - Order records linked to users
- **order_items** - Individual photos in each order

## Configuration

### Email Settings

**Setting up Resend:**

1. Sign up at [resend.com](https://resend.com) (free tier: 100 emails/day)
2. Get your API key from the dashboard
3. For testing, use the default sender: `onboarding@resend.dev`
4. For production, verify your own domain:

```typescript
// In src/actions/index.ts, change:
from: 'onboarding@resend.dev',
// To:
from: 'orders@yourdomain.com',
```

**Domain Verification:**
- Go to Resend dashboard → Domains
- Add your domain and follow DNS setup instructions
- Once verified, update the `from` field in `src/actions/index.ts`

**Email Templates:**
The app sends two emails per order:
- **Admin notification** - Full order details with customer info
- **Customer confirmation** - Order summary and next steps

Both emails include:
- Order number and timestamp
- Complete photo list with quantities
- Professional HTML styling

### Photo URLs

For production, you'll want to configure R2 public URLs or use Cloudflare Images. Update `src/lib/db.ts`:

```typescript
async getPhotoUrl(r2Key: string): Promise<string | null> {
  // Option 1: Public R2 bucket
  return `https://your-bucket.r2.dev/${r2Key}`;
  
  // Option 2: Signed URLs
  // Generate temporary signed URLs here
}
```

## Project Structure

```
foto-bestellen/
├── src/
│   ├── actions/          # Server actions (auth, orders)
│   ├── layouts/          # Page layouts
│   ├── lib/              # Database helpers
│   ├── middleware.ts     # Auth middleware
│   ├── pages/            # Astro pages
│   └── env.d.ts          # TypeScript types
├── scripts/              # Utility scripts
├── schema.sql            # Database schema
├── wrangler.toml         # Cloudflare config
└── astro.config.mjs      # Astro config
```

## Costs

With Cloudflare's free tier:

- **Pages**: Free for unlimited sites
- **D1**: 5GB storage, 5M reads/day free
- **R2**: 10GB storage, 1M Class A ops free
- **Workers**: 100k requests/day free

Resend free tier: 100 emails/day

**Total: $0/month** for small-scale use!

## Security Notes

- Passwords are hashed with bcrypt
- Sessions use httpOnly cookies
- CSRF protection via Astro's built-in security
- Environment variables for secrets

## Troubleshooting

### Build fails with "DB is not defined"

Make sure you're running with the Cloudflare adapter and wrangler is configured correctly.

### Photos don't show up

Check that:
1. Photos are uploaded to R2
2. Database entries exist with correct `r2_key`
3. R2 bucket bindings are configured in `wrangler.toml`

### Emails not sending

Verify:
1. RESEND_API_KEY is set correctly
2. Sender email is verified in Resend
3. Check Resend dashboard for errors

## License

MIT

## Support

For issues, please check the [Astro docs](https://docs.astro.build) and [Cloudflare docs](https://developers.cloudflare.com/).

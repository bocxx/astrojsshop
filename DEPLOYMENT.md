# 🚀 Deployment Guide - GitHub & Cloudflare

## Overzicht
Deze guide helpt je om de foto bestel applicatie te deployen naar GitHub en Cloudflare Pages.

---

## 📋 Vereisten

### Accounts:
- ✅ GitHub account (https://github.com)
- ✅ Cloudflare account (https://cloudflare.com)
- ✅ Resend account (https://resend.com) - voor emails

### Lokaal Geïnstalleerd:
- ✅ Git
- ✅ Node.js 18+
- ✅ npm of pnpm

---

## 🔐 Stap 1: GitHub Setup

### 1.1 GitHub Personal Access Token Aanmaken

1. **Ga naar GitHub Settings:**
   - Klik op je profiel foto (rechts boven)
   - Klik op **Settings**

2. **Developer Settings:**
   - Scroll naar beneden in het linker menu
   - Klik op **Developer settings**

3. **Personal Access Tokens:**
   - Klik op **Personal access tokens**
   - Klik op **Tokens (classic)**
   - Klik op **Generate new token** → **Generate new token (classic)**

4. **Token Configureren:**
   - **Note**: `Foto Bestellen Deploy`
   - **Expiration**: `90 days` (of langer)
   - **Scopes** (vink aan):
     - ✅ `repo` (full control)
     - ✅ `workflow`
     - ✅ `write:packages`
   
5. **Token Genereren:**
   - Klik op **Generate token** (onderaan)
   - **⚠️ BELANGRIJK**: Kopieer de token METEEN
   - Bewaar deze veilig (bijv. in password manager)
   - Je kunt deze maar 1 keer zien!

---

### 1.2 Repository Aanmaken

**Optie A: Via GitHub Website**
1. Ga naar https://github.com/bocxx/astrojsshop
2. Als repo niet bestaat:
   - Ga naar https://github.com/new
   - Repository name: `astrojsshop`
   - Description: `Foto bestelling systeem met Astro en Cloudflare`
   - Visibility: **Private** (aanbevolen voor productiecode)
   - Klik **Create repository**

**Optie B: Via Command Line**
```bash
# Repo wordt automatisch aangemaakt bij eerste push
```

---

### 1.3 Code Naar GitHub Pushen

```bash
cd /Users/nerd/projects/foto-bestellen

# Controleer remote
git remote -v

# Als remote niet bestaat, toevoegen:
git remote add origin https://github.com/bocxx/astrojsshop.git

# Branch naam controleren/aanpassen
git branch -M main

# Pushen naar GitHub
git push -u origin main

# Wanneer om credentials gevraagd wordt:
# Username: bocxx
# Password: [PLAK JE PERSONAL ACCESS TOKEN HIER]
```

**⚠️ Let op**: Gebruik de Personal Access Token als wachtwoord, NIET je GitHub wachtwoord!

---

### 1.4 Credentials Bewaren (Optioneel)

**macOS/Linux:**
```bash
# Git credential helper instellen
git config --global credential.helper osxkeychain  # macOS
git config --global credential.helper store        # Linux

# Of specifiek voor deze repo:
git config credential.helper store
```

**Eenmalig token invoeren:**
```bash
git push
# Voer token in -> wordt opgeslagen
```

---

## ☁️ Stap 2: Cloudflare Setup

### 2.1 Cloudflare Account
1. Ga naar https://dash.cloudflare.com
2. Login of maak account aan (gratis)
3. Ga naar **Workers & Pages**

---

### 2.2 D1 Database Aanmaken

```bash
# In project directory
cd /Users/nerd/projects/foto-bestellen

# D1 database aanmaken (productie)
npx wrangler d1 create foto_db

# Output ziet er zo uit:
# [[d1_databases]]
# binding = "DB"
# database_name = "foto_db"
# database_id = "xxxxx-xxxx-xxxx-xxxx-xxxxxxxxxx"
```

**⚠️ BELANGRIJK**: Kopieer de `database_id`!

---

### 2.3 R2 Bucket Aanmaken

```bash
# R2 bucket aanmaken voor foto opslag
npx wrangler r2 bucket create foto-bucket

# Controleer
npx wrangler r2 bucket list
```

---

### 2.4 Wrangler.toml Updaten

Bewerk `wrangler.toml` en update de productie bindings:

```toml
name = "foto-bestellen"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

# D1 Database - PRODUCTIE
[[d1_databases]]
binding = "DB"
database_name = "foto_db"
database_id = "PLAK_HIER_JE_DATABASE_ID"  # Van stap 2.2

# R2 Bucket - PRODUCTIE
[[r2_buckets]]
binding = "PHOTOS"
bucket_name = "foto-bucket"

# KV Namespace voor sessies
[[kv_namespaces]]
binding = "SESSION"
id = "WORDT_AUTOMATISCH_AANGEMAAKT"
```

---

### 2.5 Database Schema Uploaden

```bash
# Schema naar productie database
npx wrangler d1 execute foto_db --file=./schema.sql

# Controleer
npx wrangler d1 execute foto_db --command="SELECT name FROM sqlite_master WHERE type='table'"
```

---

### 2.6 Admin User Aanmaken (Productie)

```bash
# Eerst registreren via de app (na deployment)
# Dan admin maken:
npx wrangler d1 execute foto_db --command="UPDATE users SET is_admin = 1 WHERE email = 'cirsten@wijvancees.nl'"

# Controleer
npx wrangler d1 execute foto_db --command="SELECT email, name, is_admin FROM users WHERE is_admin = 1"
```

---

## 🔗 Stap 3: Cloudflare Pages Deployment

### 3.1 Pages Project Aanmaken

**Via Cloudflare Dashboard:**

1. Ga naar https://dash.cloudflare.com
2. Klik op **Workers & Pages**
3. Klik op **Create application**
4. Klik op **Pages** tab
5. Klik op **Connect to Git**

---

### 3.2 GitHub Verbinden

1. **Authorize Cloudflare:**
   - Selecteer je GitHub account
   - Geef Cloudflare toegang tot repositories
   - Selecteer: **Only select repositories**
   - Kies: `bocxx/astrojsshop`
   - Klik **Install & Authorize**

2. **Repository Selecteren:**
   - Selecteer `bocxx/astrojsshop`
   - Klik **Begin setup**

---

### 3.3 Build Settings Configureren

```
Project name: foto-bestellen
Production branch: main

Build settings:
Framework preset: Astro
Build command: npm run build
Build output directory: dist

Root directory: (leave empty)
```

---

### 3.4 Environment Variables Instellen

Klik op **Environment variables** en voeg toe:

| Variable Name | Value | Type |
|---------------|-------|------|
| `RESEND_API_KEY` | `re_xxxxx...` | Secret |
| `ADMIN_EMAIL` | `cirsten@wijvancees.nl` | Text |
| `NODE_VERSION` | `20` | Text |

**RESEND_API_KEY ophalen:**
1. Ga naar https://resend.com/api-keys
2. Klik **Create API Key**
3. Name: `Foto Bestellen Production`
4. Permission: **Sending access**
5. Kopieer de key

---

### 3.5 Deploy!

1. Klik **Save and Deploy**
2. Wacht tot build compleet is (3-5 minuten)
3. Je krijgt een URL: `https://foto-bestellen-xxx.pages.dev`

---

## 🔧 Stap 4: Bindings Configureren

### 4.1 D1 Binding Toevoegen

1. Ga naar je Pages project
2. Klik op **Settings**
3. Klik op **Functions**
4. Scroll naar **D1 database bindings**
5. Klik **Add binding**:
   - Variable name: `DB`
   - D1 database: `foto_db`
6. Klik **Save**

---

### 4.2 R2 Binding Toevoegen

1. Nog steeds in **Settings** → **Functions**
2. Scroll naar **R2 bucket bindings**
3. Klik **Add binding**:
   - Variable name: `PHOTOS`
   - R2 bucket: `foto-bucket`
4. Klik **Save**

---

### 4.3 KV Binding Toevoegen (Sessies)

1. In **Settings** → **Functions**
2. Scroll naar **KV namespace bindings**
3. Klik **Add binding**:
   - Variable name: `SESSION`
   - KV namespace: **Create new namespace**
   - Name: `foto_sessions`
4. Klik **Save**

---

### 4.4 Redeploy

Na het toevoegen van bindings:
1. Ga naar **Deployments** tab
2. Klik op de laatst deployment
3. Klik **Manage deployment** → **Retry deployment**

Of push een nieuwe commit:
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

---

## 📸 Stap 5: Foto's Uploaden

### 5.1 Foto's naar R2 Uploaden

```bash
# Enkele foto uploaden
npx wrangler r2 object put foto-bucket/photo-name.jpg \
  --file=/pad/naar/lokale/foto.jpg

# Thumbnail uploaden
npx wrangler r2 object put foto-bucket/thumb_photo-name.jpg \
  --file=/pad/naar/thumbnail.jpg

# Meerdere foto's (bulk)
for file in /pad/naar/fotos/*.jpg; do
  filename=$(basename "$file")
  npx wrangler r2 object put foto-bucket/$filename --file="$file"
  echo "✅ Uploaded: $filename"
done
```

---

### 5.2 Foto's aan Database Toevoegen

```bash
# Enkele foto toevoegen
npx wrangler d1 execute foto_db --command="
INSERT INTO photos (id, name, description, r2_key, thumbnail_key, available) 
VALUES (
  '$(uuidgen)', 
  'Foto Naam', 
  'Beschrijving', 
  'photo-name.jpg',
  'thumb_photo-name.jpg',
  1
)"

# Controleren
npx wrangler d1 execute foto_db --command="SELECT COUNT(*) as total FROM photos"
```

---

## 🌐 Stap 6: Custom Domain (Optioneel)

### 6.1 Domain Toevoegen

1. In je Pages project
2. Klik op **Custom domains**
3. Klik **Set up a custom domain**
4. Voer domain in: `fotos.jouwdomein.nl`
5. Volg instructies voor DNS records

### 6.2 DNS Configureren

Voeg CNAME record toe bij je domain provider:
```
Type: CNAME
Name: fotos
Target: foto-bestellen-xxx.pages.dev
TTL: Auto
```

---

## 🔍 Stap 7: Testen

### 7.1 Functionaliteit Checklist

```bash
# Open je productie site
open https://foto-bestellen-xxx.pages.dev
```

Test het volgende:
- [ ] Site laadt correct
- [ ] Registreren werkt
- [ ] Inloggen werkt
- [ ] Foto's worden getoond
- [ ] Foto thumbnails laden
- [ ] Lightbox werkt (grote foto's)
- [ ] Infinite scroll werkt
- [ ] Toevoegen aan winkelwagen
- [ ] Bestelling plaatsen
- [ ] Email notificaties ontvangen
- [ ] Admin kan inloggen
- [ ] Admin ziet bestellingen
- [ ] Admin kan emails opnieuw sturen

---

## 🔄 Stap 8: Updates Deployen

### 8.1 Code Wijzigingen Deployen

```bash
# Maak wijzigingen in je code
# ...

# Stage changes
git add .

# Commit
git commit -m "Fix: verbeter foto grid layout"

# Push naar GitHub
git push origin main

# Cloudflare Pages deploy automatisch!
```

### 8.2 Deployment Volgen

1. Ga naar Cloudflare Dashboard
2. Klik op je Pages project
3. Klik op **Deployments**
4. Bekijk real-time logs

---

## 🐛 Troubleshooting

### Deployment Faalt

**Probleem**: Build errors
```bash
# Lokaal testen
npm run build

# Controleer logs in Cloudflare Dashboard
```

**Probleem**: Missing bindings
- Controleer Settings → Functions
- Alle bindings aanwezig? (DB, PHOTOS, SESSION)
- Redeploy na toevoegen bindings

---

### Database Issues

**Probleem**: "Database not found"
```bash
# Controleer database bestaat
npx wrangler d1 list

# Controleer binding in wrangler.toml
# Vergelijk database_id
```

**Probleem**: "Table does not exist"
```bash
# Upload schema opnieuw
npx wrangler d1 execute foto_db --file=./schema.sql
```

---

### R2 Issues

**Probleem**: "Bucket not found"
```bash
# Controleer bucket bestaat
npx wrangler r2 bucket list

# Maak bucket aan
npx wrangler r2 bucket create foto-bucket
```

**Probleem**: Foto's laden niet
```bash
# Controleer foto's in bucket
npx wrangler r2 object list foto-bucket

# Test foto ophalen
npx wrangler r2 object get foto-bucket/foto-naam.jpg
```

---

### Email Issues

**Probleem**: Emails komen niet aan
- Controleer RESEND_API_KEY in Environment Variables
- Controleer ADMIN_EMAIL is correct
- Bekijk Resend dashboard voor logs: https://resend.com/emails
- Check spam folder

---

### Authentication Issues

**Probleem**: Kan niet inloggen
```bash
# Controleer SESSION KV binding
# In Cloudflare: Settings → Functions → KV namespace bindings

# Test user bestaat
npx wrangler d1 execute foto_db --command="SELECT * FROM users WHERE email = 'jouw@email.nl'"
```

---

## 📊 Monitoring

### Cloudflare Analytics

1. Ga naar je Pages project
2. Klik op **Analytics**
3. Bekijk:
   - Requests per dag
   - Bandwidth gebruik
   - Error rate
   - Top paths

### Logs Bekijken

```bash
# Real-time logs (tijdens development)
npx wrangler pages dev

# Productie logs
# Via Cloudflare Dashboard → Workers & Pages → Logs
```

---

## 💰 Kosten

### Cloudflare Pages (Gratis Tier)
- ✅ 500 builds per maand
- ✅ Onbeperkte requests
- ✅ Onbeperkte bandwidth

### Cloudflare D1 (Gratis Tier)
- ✅ 5GB opslag
- ✅ 5 miljoen rows gelezen per dag
- ✅ 100,000 rows geschreven per dag

### Cloudflare R2 (Gratis Tier)
- ✅ 10GB opslag
- ✅ 1 miljoen Class A operaties per maand
- ✅ 10 miljoen Class B operaties per maand

### Resend (Gratis Tier)
- ✅ 100 emails per dag
- ✅ 3,000 emails per maand
- ⚠️ Daarna: $20/maand voor 50,000 emails

---

## 🔒 Security Checklist

### Productie Checklist:
- [ ] `.dev.vars` NIET gecommit naar Git
- [ ] Alle secrets in Cloudflare Environment Variables
- [ ] RESEND_API_KEY is secret (niet plain text)
- [ ] Admin users correct ingesteld
- [ ] CORS settings geconfigureerd
- [ ] Rate limiting overwegen voor API endpoints
- [ ] Custom domain met HTTPS
- [ ] Regular backups van D1 database

---

## 📚 Handige Commands

```bash
# Database queries
npx wrangler d1 execute foto_db --command="SELECT * FROM orders LIMIT 10"

# R2 operations
npx wrangler r2 object list foto-bucket
npx wrangler r2 object get foto-bucket/photo.jpg --file=./download.jpg
npx wrangler r2 object delete foto-bucket/photo.jpg

# Deployment info
npx wrangler pages deployment list
npx wrangler pages deployment tail

# Local development met remote bindings
npx wrangler pages dev --remote
```

---

## 📞 Support

### Resources:
- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Astro Docs**: https://docs.astro.build/
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Resend Docs**: https://resend.com/docs

### Community:
- Cloudflare Discord: https://discord.cloudflare.com
- Astro Discord: https://astro.build/chat

---

## 🎉 Success!

Als alles goed is gegaan:
1. ✅ Code staat op GitHub
2. ✅ App draait op Cloudflare Pages
3. ✅ Database is live
4. ✅ Foto's zijn toegankelijk
5. ✅ Emails werken
6. ✅ Admin heeft toegang

**Je app is LIVE! 🚀**

URL: `https://foto-bestellen-xxx.pages.dev`

---

## 📝 Next Steps

### Productie Gereed Maken:
1. Voeg meer foto's toe
2. Test alle functionaliteit grondig
3. Configureer custom domain
4. Backup strategie opzetten
5. Monitor error logs
6. Gebruikers uitnodigen!

---

**Laatste Update**: 2024  
**Versie**: 1.0  
**Status**: Ready for Production 🎊
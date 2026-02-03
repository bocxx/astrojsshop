# ⚡ Quick Deploy Guide

## 🚀 In 5 Stappen Live

### 1️⃣ GitHub Personal Access Token
1. Ga naar: https://github.com/settings/tokens
2. Klik: **Generate new token (classic)**
3. Selecteer: `repo` + `workflow` scopes
4. Kopieer token (**eenmalig zichtbaar!**)

### 2️⃣ Push naar GitHub
```bash
cd /Users/nerd/projects/foto-bestellen

# Git remote is al toegevoegd!
# Push met je token als wachtwoord:
git push -u origin main

# Username: bocxx
# Password: [PLAK JE TOKEN HIER]
```

### 3️⃣ Cloudflare Setup
```bash
# D1 Database aanmaken
npx wrangler d1 create foto_db
# ➜ Kopieer database_id!

# R2 Bucket aanmaken
npx wrangler r2 bucket create foto-bucket

# Schema uploaden
npx wrangler d1 execute foto_db --file=./schema.sql
```

### 4️⃣ Cloudflare Pages
1. Ga naar: https://dash.cloudflare.com
2. **Workers & Pages** → **Create application**
3. **Connect to Git** → Selecteer `bocxx/astrojsshop`
4. Build settings:
   - Framework: **Astro**
   - Build command: `npm run build`
   - Output: `dist`
5. Environment variables:
   - `RESEND_API_KEY`: [van resend.com]
   - `ADMIN_EMAIL`: cirsten@wijvancees.nl
   - `NODE_VERSION`: 20
6. **Save and Deploy!**

### 5️⃣ Bindings Toevoegen
In Cloudflare Pages → Settings → Functions:

1. **D1 binding**: `DB` → `foto_db`
2. **R2 binding**: `PHOTOS` → `foto-bucket`
3. **KV binding**: `SESSION` → Create new `foto_sessions`
4. **Redeploy!**

---

## ✅ Test Je App

1. Open: `https://foto-bestellen-xxx.pages.dev`
2. Registreer een account
3. Maak admin:
```bash
npx wrangler d1 execute foto_db --command="UPDATE users SET is_admin = 1 WHERE email = 'cirsten@wijvancees.nl'"
```

---

## 📸 Foto's Uploaden

```bash
# Upload foto
npx wrangler r2 object put foto-bucket/foto.jpg --file=/pad/naar/foto.jpg

# Voeg toe aan database
npx wrangler d1 execute foto_db --command="
INSERT INTO photos (id, name, r2_key, available) 
VALUES ('$(uuidgen)', 'Foto Naam', 'foto.jpg', 1)"
```

---

## 🔄 Updates Deployen

```bash
# Gewoon pushen naar GitHub!
git add .
git commit -m "Update"
git push

# Cloudflare deploy automatisch ✨
```

---

**Klaar! 🎉**

Voor meer details: zie `DEPLOYMENT.md`

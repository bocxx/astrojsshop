# 📸 Foto Upload Map

Deze map is bedoeld voor het uploaden van foto's naar de applicatie.

## 📁 Structuur

```
uploads/
├── fotos/          # Plaats hier je foto's om te uploaden
└── README.md       # Deze instructies
```

## 🚀 Hoe foto's uploaden?

### Methode 1: Automatisch Upload Script (Aanbevolen)

1. **Plaats foto's in de map:**
   ```bash
   # Kopieer je foto's naar de fotos map
   cp ~/Downloads/mijn-foto.jpg ./uploads/fotos/
   ```

2. **Run het upload script:**
   ```bash
   # Voor development (lokaal)
   ./scripts/upload-photos.sh
   
   # Voor productie
   ./scripts/upload-photos.sh --remote
   ```

3. **Klaar!** De foto's zijn geüpload naar R2 en toegevoegd aan de database.

### Methode 2: Handmatig Uploaden

Als je meer controle wilt over de upload:

```bash
# Upload naar R2
npx wrangler r2 object put foto-bucket/mijn-foto.jpg --file=./uploads/fotos/mijn-foto.jpg --local

# Voeg toe aan database
npx wrangler d1 execute foto_db --local --command="INSERT INTO photos (id, name, description, r2_key, available) VALUES ('$(uuidgen)', 'Mijn Foto', 'Beschrijving hier', 'mijn-foto.jpg', 1);"
```

## 📋 Ondersteunde Bestandstypen

- **JPEG/JPG** - `.jpg`, `.jpeg`
- **PNG** - `.png`
- **GIF** - `.gif`
- **WebP** - `.webp`
- **HEIC/HEIF** - `.heic`, `.heif` (Apple formaten)

## 💡 Tips

- **Bestandsnamen:** Gebruik duidelijke namen (bijv. `vakantie-2024.jpg`)
- **Underscores/hyphens** worden automatisch vervangen door spaties in de display naam
- **Grote bestanden:** R2 heeft geen file size limiet
- **Batch upload:** Plaats meerdere foto's in de map en run het script één keer

## 🗂️ Na Uploaden

De foto's zijn nu:
- ✅ Opgeslagen in Cloudflare R2
- ✅ Toegevoegd aan de database
- ✅ Zichtbaar in de gallerij op http://localhost:4321 (development)

## 🔄 Productie vs Development

### Development (Local)
- Gebruik: `./scripts/upload-photos.sh` (zonder flag)
- Data wordt opgeslagen in `.wrangler/state/`
- Voor testen en development

### Productie (Remote)
- Gebruik: `./scripts/upload-photos.sh --remote`
- Data wordt opgeslagen in Cloudflare R2 (cloud)
- Voor live/productie omgeving

## 🛠️ Troubleshooting

### "Directory not found"
```bash
mkdir -p uploads/fotos
```

### "Permission denied"
```bash
chmod +x scripts/upload-photos.sh
```

### "R2 bucket not found"
Controleer je `wrangler.toml` configuratie:
```toml
[[r2_buckets]]
binding = "PHOTOS"
bucket_name = "foto-bucket"
```

# Beveiligingsmaatregelen tegen Foto Downloads

Dit document beschrijft de maatregelen die zijn geïmplementeerd om ongeautoriseerde downloads van foto's te voorkomen.

## 🛡️ Geïmplementeerde Beveiligingen

### 1. **Watermerken op Thumbnails**
- Alle thumbnail afbeeldingen hebben een watermerk: "© Samen voor Krimpen"
- Het watermerk is wit, semi-transparant en onderaan de afbeelding geplaatst
- Thumbnails worden getoond in de gallerij (800px breed)
- Originele foto's (zonder watermerk) zijn alleen zichtbaar in de lightbox

### 2. **HTML Attributen**
- `draggable="false"` - Voorkomt slepen van afbeeldingen
- `oncontextmenu="return false;"` - Blokkeert rechtermuisklik menu
- `select-none` - Voorkomt selectie van afbeeldingen
- `pointer-events-none` (op thumbnails) - Maakt directe interactie onmogelijk

### 3. **CSS Beveiligingen**
```css
img {
  user-select: none;           /* Voorkomt selectie */
  -webkit-user-drag: none;     /* Voorkomt slepen in Chrome/Safari */
  pointer-events: auto;        /* Behoudt klikfunctionaliteit */
}

@media print {
  img { display: none; }       /* Verbergt afbeeldingen bij printen */
}
```

### 4. **JavaScript Protectie**
- Rechtermuisklik geblokkeerd op alle afbeeldingen
- Slepen van afbeeldingen geblokkeerd
- Screenshot shortcuts deels geblokkeerd (Cmd+Shift+3/4/5 op Mac)
- Print Screen toets geblokkeerd

### 5. **Onzichtbare Overlay**
- Een transparante overlay over foto previews in de gallerij
- Maakt "Inspect Element" moeilijker
- Voorkomt directe interactie met de `<img>` tag

## ⚠️ Beperkingen

**Belangrijke opmerking:** Deze maatregelen maken het **moeilijker** maar niet **onmogelijk** om foto's te downloaden.

### Wat wel werkt:
- ✅ Voorkomt rechtsklik → "Afbeelding opslaan als..."
- ✅ Voorkomt slepen naar desktop
- ✅ Voorkomt eenvoudige browser tools
- ✅ Watermerken op alle thumbnails
- ✅ Maakt screenshots minder aantrekkelijk

### Wat NIET kan worden voorkomen:
- ❌ Browser Developer Tools (F12) - gevorderde gebruikers kunnen nog steeds de network tab gebruiken
- ❌ Screenshots van het scherm (OS-niveau)
- ❌ Scherm opname software
- ❌ Browser extensies die specifiek bedoeld zijn om beveiligingen te omzeilen

## 🎯 Doel

Het doel is om **casual gebruikers** te ontmoedigen om foto's te downloaden zonder toestemming. 
Voor professionele bescherming zou je moeten overwegen:

1. **Sterkere watermerken** - Diagonaal over het hele beeld
2. **Lagere resoluties** - Alleen lage-res previews tonen
3. **DRM-bescherming** - Maar zeer complex en niet 100% waterdicht
4. **Geen online preview** - Alleen na betaling/toestemming foto's tonen

## 📊 Aanbeveling

De huidige oplossing is een **goede balans** tussen:
- Gebruikerservaring (mensen kunnen foto's bekijken)
- Bescherming (casual downloads worden voorkomen)
- Kosten/complexiteit (eenvoudig te implementeren)

Voor een fotograaf die foto's verkoopt is dit een redelijke bescherming, vooral in combinatie met:
- Watermerken op previews
- Lage resolutie thumbnails in gallerij
- Volledige resolutie alleen na aankoop

## 🚀 Gebruik

### Watermarked Thumbnails Genereren

```bash
# Voor productie
./scripts/generate-thumbnails.sh --remote

# Voor development
./scripts/generate-thumbnails.sh
```

### Watermark Aanpassen

Bewerk `scripts/generate-thumbnails.ts`:

```typescript
const WATERMARK_TEXT = '© Samen voor Krimpen'; // Pas tekst aan
const THUMB_WIDTH = 800;                        // Pas breedte aan
const THUMB_QUALITY = 80;                       // Pas kwaliteit aan
```

De watermark styling kan worden aangepast in de SVG definitie:
```typescript
const watermarkSVG = Buffer.from(`
  <svg width="800" height="100">
    <style>
      .watermark { 
        fill: white;           /* Kleur */
        font-size: 24px;       /* Grootte */
        opacity: 0.7;          /* Transparantie */
      }
    </style>
    <text x="50%" y="50%" text-anchor="middle" class="watermark">
      ${WATERMARK_TEXT}
    </text>
  </svg>
`);
```

## 🔒 Extra Tips

1. **Gebruik lage resolutie previews** - Houd thumbnails op max 800px
2. **Monitor je R2 bucket** - Check voor onverwachte downloads
3. **Educeer klanten** - Laat weten dat foto's beschermd zijn
4. **Juridische bescherming** - Voeg copyright notice toe aan website
5. **EXIF data** - Overweeg copyright info in EXIF metadata toe te voegen

## 📝 Licentie & Copyright

Alle foto's zijn eigendom van Samen voor Krimpen en mogen niet zonder toestemming worden gedownload, gekopieerd of verspreid.

© 2026 Samen voor Krimpen - Alle rechten voorbehouden

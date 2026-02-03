# 📸 Foto's Logo

Dit is het logo voor de foto-bestel applicatie.

## 🎨 Logo Bestanden

- **logo.svg** - Volledig logo (200x200px) voor gebruik in de app
- **favicon.svg** - Browser tab icon (32x32px)

## 🎯 Waar Wordt Het Logo Gebruikt?

- **Navigatie** - In de header van elke pagina
- **Login pagina** - Als welkomst icoon
- **Register pagina** - Als welkomst icoon
- **Lege winkelwagen** - Als placeholder
- **Browser tab** - Als favicon

## 🎨 Kleuren

Het logo gebruikt de brand kleuren:
- **Blauw** `#37469b` - Camera body
- **Paars** `#bd90c4` - Lens en accenten
- **Beige** `#f2e8df` - Lens center
- **Koraal** `#ff7e6d` - Flash/highlight
- **Gradient achtergrond** - Mix van alle kleuren

## ✨ Design Elementen

- **Camera** - Centraal element, symboliseert fotografie
- **Lens** - Met realistische lagen en reflectie
- **Flash** - Koraal accent voor energie
- **Foto stapel** - Gestapelde foto's voor context
- **Gradient cirkel** - Zachte, moderne uitstraling

## 🔄 Aanpassen

Als je het logo wilt aanpassen:

1. Open `logo.svg` in een text editor of vector editor
2. Pas de kleuren aan (zoek naar hex codes zoals `#37469b`)
3. Pas de vormen aan indien gewenst
4. Update ook `favicon.svg` voor consistentie

## 💡 Tips

- **Hover effect** - Logo heeft `hover:scale-110 hover:rotate-6` animatie
- **Shadow** - Gebruikt `drop-shadow-2xl` voor diepte
- **Grootte** - Gebruik `w-24 h-24` voor grote versies, `w-10 h-10` voor kleine
- **Responsive** - Logo schaalt automatisch mee

## 🎭 Gebruik in Code

```astro
<!-- Groot logo (login/register) -->
<div class="w-24 h-24 mx-auto mb-5 transform hover:scale-110 hover:rotate-6 transition-all duration-300">
  <img src="/logo.svg" alt="Foto's Logo" class="w-full h-full drop-shadow-2xl" />
</div>

<!-- Klein logo (navigatie) -->
<div class="w-10 h-10 rounded-xl bg-gradient-to-br from-[--color-brand-purple] to-[--color-brand-coral] p-1.5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md">
  <img src="/logo.svg" alt="Foto's Logo" class="w-full h-full" />
</div>
```

## 🚀 Productie

Voor productie kun je overwegen:
- Logo te optimaliseren met SVGO
- Een PNG/WebP versie te maken voor backwards compatibility
- Verschillende groottes te genereren voor verschillende use cases

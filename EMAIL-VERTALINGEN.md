# 📧 Email Vertalingen - Overzicht

## Samenvatting
Dit document beschrijft alle email templates die zijn vertaald naar het Nederlands voor het foto bestel systeem.

---

## ✉️ Email Types

### 1. **Nieuwe Bestelling - Admin Notificatie**

**Van:** `onboarding@resend.dev`  
**Aan:** Admin email (configureerbaar via `ADMIN_EMAIL`)  
**Onderwerp:** `📸 Nieuwe Foto Bestelling: [BESTELNUMMER]`

#### Inhoud:
```
🎉 Nieuwe Foto Bestelling!

Bestellingsinformatie:
- Bestelnummer: ORD-1234567890-ABCDEF
- Datum: [Nederlandse datum/tijd]
- Totaal Aantal: [aantal foto's]

Klantgegevens:
- Naam: [Klantnaam]
- Email: [Klant email]

Bestelde Foto's:
- [Foto naam] - Aantal: [aantal]
- [Foto naam] - Aantal: [aantal]

Actie Vereist: Bereid deze foto's voor en stuur ze naar [klant email]

Foto Bestel Systeem - Geautomatiseerde Notificatie
```

---

### 2. **Nieuwe Bestelling - Klant Bevestiging**

**Van:** `onboarding@resend.dev`  
**Aan:** Klant email  
**Onderwerp:** `✅ Bestellingsbevestiging: [BESTELNUMMER]`

#### Inhoud:
```
✅ Bestelling Bevestigd!

Hoi [Klantnaam],

Bedankt voor je bestelling! We hebben je aanvraag ontvangen en zullen deze 
binnenkort verwerken.

Jouw Bestellingsoverzicht:
- Bestelnummer: ORD-1234567890-ABCDEF
- Datum: [Nederlandse datum/tijd]
- Totaal Aantal: [aantal foto's]

Bestelde Foto's:
- [Foto naam] - Aantal: [aantal]
- [Foto naam] - Aantal: [aantal]

Wat Nu?
We bereiden je foto's voor en sturen ze naar [jouw email] zodra ze klaar zijn.

Als je vragen hebt, aarzel dan niet om te antwoorden op deze email.

Met vriendelijke groet,
Het Foto Team

Dit is een geautomatiseerde bevestigingsmail
```

---

### 3. **Opnieuw Verzonden - Admin Notificatie**

**Van:** `onboarding@resend.dev`  
**Aan:** Admin email  
**Onderwerp:** `📸 [OPNIEUW VERZONDEN] Foto Bestelling: [BESTELNUMMER]`

#### Inhoud:
```
🎉 Foto Bestelling [OPNIEUW VERZONDEN]

Bestellingsinformatie:
- Bestelnummer: ORD-1234567890-ABCDEF
- Originele Datum: [Nederlandse datum/tijd origineel]
- Opnieuw Verzonden: [Nederlandse datum/tijd nu]
- Totaal Aantal: [aantal foto's]

Klantgegevens:
- Naam: [Klantnaam]
- Email: [Klant email]

Bestelde Foto's:
- [Foto naam] - Aantal: [aantal]
- [Foto naam] - Aantal: [aantal]

Actie Vereist: Bereid deze foto's voor en stuur ze naar [klant email]

Foto Bestel Systeem - Opnieuw Verzonden Notificatie
```

---

### 4. **Opnieuw Verzonden - Klant Herinnering**

**Van:** `onboarding@resend.dev`  
**Aan:** Klant email  
**Onderwerp:** `✅ [HERINNERING] Bestellingsbevestiging: [BESTELNUMMER]`

#### Inhoud:
```
✅ Bestelling Herinnering [OPNIEUW VERZONDEN]

Hoi [Klantnaam],

Dit is een herinnering voor je foto bestelling. We zijn je aanvraag nog aan 
het verwerken!

Jouw Bestellingsoverzicht:
- Bestelnummer: ORD-1234567890-ABCDEF
- Originele Datum: [Nederlandse datum/tijd origineel]
- Totaal Aantal: [aantal foto's]

Bestelde Foto's:
- [Foto naam] - Aantal: [aantal]
- [Foto naam] - Aantal: [aantal]

Als je vragen hebt, aarzel dan niet om te antwoorden op deze email.

Met vriendelijke groet,
Het Foto Team

Dit is een opnieuw verzonden bevestigingsmail
```

---

## 🎨 Email Styling

### Kleuren:
- **Admin emails**: Blauw thema (#0066cc)
- **Klant bevestiging**: Groen thema (#28a745)
- **Herinnering badge**: Oranje (#ffa500)

### Layout:
- **Max breedte**: 600px
- **Font**: Arial, sans-serif
- **Achtergrond**: Lichtgrijs (#f9f9f9)
- **Content blokken**: Wit met gekleurde linker border

### Responsive:
- Werkt goed op desktop en mobiel
- Email-safe HTML & CSS
- Geen JavaScript of complexe styling

---

## 🔧 Technische Details

### Datum Formatting:
Alle datums gebruiken Nederlandse locale:
```typescript
new Date().toLocaleString('nl-NL')
// Output: "3/2/2024, 14:30:00"
```

### Email Provider:
**Resend** (https://resend.com)
- API key vereist: `RESEND_API_KEY`
- Admin email configureerbaar: `ADMIN_EMAIL`

### Triggering:
1. **Nieuwe Bestelling**: Automatisch bij `placeOrder` action
2. **Opnieuw Verzenden**: Handmatig via admin dashboard

---

## 📋 Email Template Variables

### Beschikbare Variabelen:

| Variabele | Type | Beschrijving |
|-----------|------|-------------|
| `orderNumber` | string | Uniek bestelnummer |
| `order.order_number` | string | Bestelnummer uit database |
| `order.created_at` | number | Unix timestamp |
| `order.user_name` | string | Naam van klant |
| `order.email` | string | Email van klant |
| `totalItems` | number | Totaal aantal foto's |
| `itemsListHtml` | string | HTML lijst van foto's |

### Items Format:
```typescript
const itemsListHtml = items
  .map((i) => `<li><strong>${i.photoName}</strong> - Aantal: ${i.quantity}</li>`)
  .join('');
```

---

## 🧪 Testing

### Test Scenario's:

1. **Nieuwe Bestelling**
   - [ ] Admin ontvangt email
   - [ ] Klant ontvangt bevestiging
   - [ ] Correcte datum formatting
   - [ ] Alle foto's worden getoond

2. **Opnieuw Verzenden**
   - [ ] Admin ontvangt hernieuwde email
   - [ ] Klant ontvangt herinnering
   - [ ] Beide datums worden getoond
   - [ ] Badge "OPNIEUW VERZONDEN" zichtbaar

3. **Email Inhoud**
   - [ ] Nederlandse teksten correct
   - [ ] Geen Engelse resten
   - [ ] Juiste kleurenschema
   - [ ] Responsive op mobiel

---

## 🔒 Security & Privacy

### Best Practices:
- ✅ Geen wachtwoorden in emails
- ✅ Alleen bestelnummer, geen gevoelige data
- ✅ Admin email configureerbaar via ENV
- ✅ Klant email alleen naar klant gestuurd
- ✅ Geen CC/BCC gebruikt

### GDPR Compliance:
- Email adressen alleen gebruikt voor bestelling
- Geen tracking pixels
- Geen externe afbeeldingen
- Opt-out mogelijk via reply

---

## 📊 Email Status Tracking

### Logging:
Alle email acties worden gelogd:
```
✅ Admin email verzonden: [result]
✅ Klant email verzonden: [result]
❌ Email fout: [error message]
```

### Error Handling:
- Email fout = bestelling wordt nog steeds aangemaakt
- Foutmelding wordt getoond aan admin
- Retry mogelijk via "Opnieuw Verzenden" knop

---

## 🌍 Locale Settings

### Nederlands (nl-NL):
- **Datum**: dd/mm/yyyy
- **Tijd**: 24-uurs format
- **Decimaal**: comma (,)
- **Duizendtallen**: punt (.)

### Voorbeeld Output:
```
3/2/2024, 14:30:00
€ 1.234,56
```

---

## 📝 Terminologie Consistentie

### Standaard Termen:

| Nederlands | Context |
|-----------|---------|
| Bestelling | Order |
| Bestelnummer | Order number |
| Klantgegevens | Customer information |
| Bestellingsinformatie | Order details |
| Totaal Aantal | Total items |
| Bestelde Foto's | Ordered photos |
| Actie Vereist | Action required |
| Opnieuw Verzonden | Resent |
| Herinnering | Reminder |
| Bevestigingsmail | Confirmation email |

---

## 🔄 Update Process

### Bij Wijzigingen:
1. Update template in `src/actions/index.ts`
2. Test beide admin en klant emails
3. Verifieer Nederlandse teksten
4. Check datum formatting
5. Test op desktop en mobiel
6. Update dit document

---

## 📚 Email Template Locaties

### In Code:
- **Nieuw**: `src/actions/index.ts` - `placeOrder` action (regel ~146-262)
- **Resend**: `src/actions/index.ts` - `resendOrderEmail` action (regel ~337-457)

### Styling:
Inline CSS in HTML templates voor maximale compatibiliteit.

---

## 🎯 Toekomstige Verbeteringen

### Mogelijk Toevoegen:
1. **Email Templates Externaliseren**
   - Aparte template bestanden
   - Makkelijker te onderhouden
   - Herbruikbare componenten

2. **Meer Email Types**
   - Bestelling voltooid notificatie
   - Bestelling geannuleerd
   - Wachtwoord reset
   - Welkom email

3. **Template Engine**
   - Handlebars of EJS
   - Variables makkelijker beheren
   - Conditionals in templates

4. **Email Previews**
   - Test mode voor email previews
   - Screenshot generator
   - A/B testing

5. **Unsubscribe Functie**
   - Opt-out link
   - Voorkeuren beheer
   - GDPR compliance verbetering

---

## 🛠️ Troubleshooting

### Veelvoorkomende Problemen:

**Email komt niet aan:**
- Check RESEND_API_KEY in `.dev.vars`
- Verifieer ADMIN_EMAIL is ingesteld
- Check spam folder
- Bekijk Resend dashboard voor logs

**Nederlandse teksten niet correct:**
- Verifieer UTF-8 encoding
- Check `charset="utf-8"` in HTML
- Test met verschillende email clients

**Datum formatting verkeerd:**
- Verifieer 'nl-NL' locale wordt gebruikt
- Check browser/server locale settings

**Styling werkt niet:**
- Gebruik inline CSS (vereist voor emails)
- Test met email preview tools
- Vermijd complexe CSS

---

## 📧 Contact & Support

Voor vragen over email templates:
- Check dit document eerst
- Bekijk `src/actions/index.ts` voor code
- Test met Resend dashboard
- Verifieer environment variables

---

**Laatst bijgewerkt:** 2024  
**Status:** ✅ Volledig Nederlands  
**Versie:** 1.0  
**Email Provider:** Resend
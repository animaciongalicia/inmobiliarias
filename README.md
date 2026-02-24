# Radar Propietario – A Coruña

A 9-step homeowner lead-capture wizard for A Coruña, built with **Next.js 14 App Router**, **TypeScript**, and **Tailwind CSS**. Sends leads to Make (Integromat) via webhook.

---

## Local Development

### 1. Clone & install

```bash
git clone <your-repo-url>
cd radar-propietario
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Make webhook URLs:

```env
MAKE_WEBHOOK_DEFAULT=https://hook.eu1.make.com/xxxxxxxxxxxxx
MAKE_WEBHOOK_CORUNA01=https://hook.eu1.make.com/yyyyyyyyyyyyy
```

> Leaving `MAKE_WEBHOOK_CORUNA01` blank will fall back to `MAKE_WEBHOOK_DEFAULT`.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The wizard is at [http://localhost:3000/wizard](http://localhost:3000/wizard).

With agency branding: [http://localhost:3000/wizard?agency=coruna01](http://localhost:3000/wizard?agency=coruna01)

---

## Testing the API locally with curl

```bash
curl -s -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "profile": "Estoy pensando en cambiar de casa",
    "zone": "Riazor",
    "propertyType": "Piso",
    "purchaseRange": "10–20 años",
    "satisfaction": 2,
    "intent": "6–12 meses",
    "analysisCommitment": "Sí, análisis personalizado",
    "name": "María García",
    "email": "maria@example.com",
    "phone": "+34 600 123 456",
    "consent": true
  }' | jq .
```

Expected response shape:

```json
{
  "ok": true,
  "score": 7,
  "category": "A",
  "resultCopy": "Tu perfil encaja con propietarios que habitualmente...",
  "delivered": false
}
```

> `delivered: false` is expected when no webhook URL is configured. It becomes `true` once Make receives the request.

### Test with agency param

```bash
curl -s -X POST "http://localhost:3000/api/submit?agency=coruna01" \
  -H "Content-Type: application/json" \
  -d '{ ... same body ... }' | jq .
```

### Test validation errors

```bash
curl -s -X POST http://localhost:3000/api/submit \
  -H "Content-Type: application/json" \
  -d '{"name": "Test"}' | jq .
# → { "ok": false, "error": "El campo \"profile\" es obligatorio." }
```

---

## Deploy to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. Import in Vercel

Go to [vercel.com/new](https://vercel.com/new), import your repo, and deploy.

### 3. Set environment variables in Vercel

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `MAKE_WEBHOOK_DEFAULT` | Your default Make webhook URL |
| `MAKE_WEBHOOK_CORUNA01` | Your coruna01 Make webhook URL (optional) |

> Variables are only accessible server-side. They are never sent to the browser.

### 4. Verify the build

```bash
npm run build
```

This must succeed with zero TypeScript errors before deploying.

---

## Multi-Agency Usage

Load agency branding by passing `?agency=<id>` in the URL:

| URL | Agency |
|---|---|
| `/wizard` | Default agency |
| `/wizard?agency=coruna01` | Inmobiliaria Coruña 01 |

To add a new agency:

1. Add an entry in `/lib/agencies.ts` with `agency_id`, `agency_name`, `brand_color`, and `webhook_env_key`.
2. Add the corresponding env variable to `.env.local` and Vercel.

---

## Project Structure

```
/app
  layout.tsx          # Root layout with metadata
  page.tsx            # Home/landing page
  globals.css         # Tailwind + custom animations
  /wizard
    page.tsx          # Wizard page (server component, passes agency to WizardShell)
  /api/submit
    route.ts          # POST handler: validate → score → webhook → respond

/components
  WizardShell.tsx     # Main wizard state machine (client component)
  ProgressBar.tsx     # Animated step progress bar
  StepHeader.tsx      # Question title + subtitle
  QuestionCard.tsx    # Clickable option cards
  Button.tsx          # Reusable button (primary/secondary/ghost)
  Input.tsx           # Labeled text input with error state
  Select.tsx          # Labeled select with error state

/lib
  types.ts            # Shared TypeScript types
  agencies.ts         # Agency configs + webhook URL resolver
  zones.ts            # Per-zone copy (tendencia/oportunidad/alerta)
  scoring.ts          # Score (0–10) + category (A/B/C) computation
  validators.ts       # Server-side body validation
```

---

## Scoring Reference

| Factor | Options | Points |
|---|---|---|
| **Intent** | 0–6 meses | +3 |
| | 6–12 meses | +2 |
| | 12–24 meses / No lo sé | +1 |
| | Más adelante | +0 |
| **Satisfaction** | 1–2 | +2 |
| | 3 | +1 |
| | 4–5 | +0 |
| **Profile** | Herencia / Está vacía | +2 |
| | Pensando en cambiar / Alquilada | +1 |
| | Vivo en ella / No lo había pensado | +0 |
| **Purchase range** | 10–20 años / Más de 20 / Herencia | +1 |
| **Analysis commitment** | Sí, análisis personalizado | +2 |

**Categories:** 0–3 → C · 4–6 → B · 7–10 → A

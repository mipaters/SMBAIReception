# SMB AI Receptionist (demo)

An illustrative, synthetic demo of an AI voice receptionist that telecom operators could offer their small-and
medium-business (SMB) customers: it answers calls the business misses, greets callers with the owner's chosen
script, answers common questions using information pulled from the business's own website, and books
appointments — texting the owner to confirm before finalizing.

**This is a concept demonstration.** No real phone calls are placed, no real SMS is sent, and (by default) no
real website is fetched. Every business, caller, and transcript in this app is synthetic. See the in-app
**Architecture** and **Privacy** pages for the full demo-vs-production breakdown.

## 1. What's included

- A frontend-only Vite + React + TypeScript single-page app (`src/`) covering:
  - **Home** — overview and entry points
  - **Executive Demo** — a guided walkthrough (market need → scope → canned demos → try it live → architecture)
  - **Live Demo** — five fully-scripted canned call scenarios
  - **Setup wizard** — business profile + website scrape, greeting, scheduling, review/activate
  - **Business Profile**, **Appointments**, **Call History** / **Call Detail**
  - **How It Works**, **Privacy**, **Architecture**, **About**
- An **optional** Azure Functions API (`api/`) that, when configured with Azure OpenAI, makes the Setup
  wizard's "scrape website" step real: it fetches the given URL server-side and asks Azure OpenAI to extract a
  structured business profile (hours, services, FAQs, phone, address).

The app works completely standalone with `npm run dev` — the optional API only upgrades one feature
(website scraping) from a deterministic simulation to a real fetch + AI extraction.

## 2. Running locally

### Frontend only (Simulation Mode — no Azure account needed)

```powershell
npm install
npm run dev
```

Open the printed local URL. Website scraping in the Setup wizard uses a deterministic, keyword-based template
(`src/engine/scrapeEngine.ts`) — the UI still works end-to-end, and the Architecture page reports
**Simulation Mode**.

### Frontend + real website scraping (optional)

Requires an Azure OpenAI resource with a chat-completion model deployed, plus
[Azure Functions Core Tools v4](https://learn.microsoft.com/azure/azure-functions/functions-run-local).

```powershell
# Terminal 1 — API
cd api
npm install
copy local.settings.json.example local.settings.json   # fill in your Azure OpenAI values
npm run build
func start

# Terminal 2 — Frontend
npm install
npm run dev
```

Or, with the [SWA CLI](https://azure.github.io/static-web-apps-cli/) proxying both under one origin so
`/api/*` resolves correctly:

```powershell
npm install -g @azure/static-web-apps-cli
swa start http://localhost:5173 --api-location api --run "npm run dev"
```

Once running, open the Setup wizard, enter a real business name + website, and click
**"Scrape website for business info"**. A green **"✨ Extracted from the live website via Azure OpenAI"** badge
confirms Connected Mode; if the API isn't reachable or configured, it automatically falls back to the local
simulation with no error shown to the user.

### Type-check / build

```powershell
npx tsc -b --noEmit     # frontend type-check
npm run build            # frontend production build -> dist/
cd api; npm run build    # API build -> api/dist/ (only needed if using the API)
```

## 3. Connected Mode vs. Simulation Mode

| | Simulation Mode (default) | Connected Mode (API configured) |
|---|---|---|
| Website scraping | Keyword classifier fills in a category template | Real server-side fetch + Azure OpenAI extraction |
| Everything else (calls, SMS, scheduling, telephony) | Always scripted/simulated in this demo | Same — see Architecture page for what a full production build would add |

The app never requires Azure credentials to run. The `/api/demo-status` route reports which mode is active, and
the Setup wizard / Architecture pages surface it with a badge.

## 4. Project structure

```
src/            Frontend SPA (pages, components, context, data, engine)
api/            Optional Azure Functions API (website scraping only)
  src/functions/  HTTP-triggered functions (demo-status, scrape-business-site)
  src/shared/     Env config, validation, HTML fetch/parse, Azure OpenAI client
```

## 5. Disclaimer

This is a fictional product concept built for demonstration purposes. It is not affiliated with any specific
telecom operator. No production telephony, SMS, or scheduling infrastructure is connected to this repository.

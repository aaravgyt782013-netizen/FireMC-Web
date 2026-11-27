# FireMC-Web

A reverse-engineered rebuild of the **FireMC official store** (https://store.firemc.fun/),
produced with the **REA** toolchain (`rea-agents` — https://github.com/morluto/rea),
using plain HTML / CSS / JavaScript — no frameworks, no build step.

## REA workflow (how this repo was built)

```
capture → reconstruct → REA verify → ship
```

1. **Capture** — the 6 live store pages were captured and stored verbatim in
   `rea/capture/` (home, 4 categories, terms). The sandbox shell cannot reach
   `store.firemc.fun` directly (blocked egress), so capture ran platform-side.
2. **Reconstruct** — the captured content/behavior became the runnable site in
   `index.html` + `assets/`: catalog (27 packages, real Tebex ids/prices/images),
   username gate with Bedrock handling, basket, giftcard widget, checkout
   hand-off to the live Tebex store.
3. **REA verify** — `rea analyze-javascript-application assets/js --json`
   produced a sealed Evidence bundle over the shipped code (modules, `fm.*`
   localStorage keys with source locations, integrity contradictions: none).
   Distilled artifacts live in `rea/evidence/`; see `rea/evidence/README.md`.

Tool status on this machine: `rea@6.7.0` installed globally (`npm install -g
rea-agents`), Java 21 (Temurin via jdk4py) present for native tooling; Ghidra's
distribution cannot be downloaded from this sandbox (blocked hosts) and is not
needed for web targets.

## Site features

- Home page — hero, Featured Packages, Support & Refund-policy cards, terms links
- Sidebar categories — 🔥 Fire, Coins [LifeSteal], Lifesteal Ranks, Coins [Classic], Classic Ranks
- Username gate — same modal as the live store, Bedrock `.`-prefix support, live avatar preview
- Basket — quantities, totals, persisted in `localStorage`, slide-out drawer
- Giftcard widget, copy-IP pill, hash routing (`#/category/lifesteal`, …), responsive dark theme

## Run

```bash
npm install
npm start          # serve -l $PORT . (default 3000)
```

## Deploy to Render — Web Service

| Setting | Value |
|---|---|
| Type | **Web Service** |
| Runtime | Node |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/` |

A `render.yaml` Blueprint is included (New → Blueprint → pick this repo).

## Repo layout

```
index.html                 # the rebuilt storefront
assets/css/site.css        # dark fire theme
assets/js/catalog.js       # catalog reconstructed from rea/capture/
assets/js/app.js           # routing, basket, modals, UI
assets/img/                # generated logo emblem + hero banner
rea/capture/               # verbatim captured live-store pages (input corpus)
rea/evidence/              # distilled REA Evidence bundles + notes
render.yaml, package.json  # Render Web Service deploy config
```

## Notes

- Package images are hot-linked from the store's Tebex CDN
  (`dunb17ur4ymx4.cloudfront.net`); avatars come from `minotar.net`.
- "Add to cart" builds a local basket; **Checkout** hands off to the real
  store — payments stay with Tebex on store.firemc.fun (never replicated).
- Update the catalog in `assets/js/catalog.js` to change packages/prices.

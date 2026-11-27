# FireMC-Web

A static clone of the **FireMC official store** (https://store.firemc.fun/), rebuilt from scratch with plain **HTML / CSS / JavaScript** — no frameworks, no build step.

## Features

- **Home page** — hero banner, Featured Packages grid, Support & Refund-policy cards, terms links (matching the live store's content).
- **Sidebar categories** — 🔥 Fire, Coins [LifeSteal], Lifesteal Ranks, Coins [Classic], Classic Ranks — with the full package catalog (names, prices, images, Tebex package IDs).
- **Username gate** — the same "Please enter your username to continue" modal, with **Bedrock support** (auto `.` prefix) and live Minecraft avatar preview via minotar.net.
- **Basket** — add/remove, quantity steppers, totals, persisted in `localStorage`, slide-out drawer.
- **Giftcard balance widget**, copy-IP pill, toasts, hash-based routing (`#/category/lifesteal`, …), fully responsive.

## Run

```bash
npm install
npm start          # serves on $PORT (default 3000) via `serve`
# or, with no Node: python3 -m http.server 8000
```

## Deploy to Render — Web Service

| Setting | Value |
|---|---|
| Type | **Web Service** |
| Runtime | Node |
| Build command | `npm install` |
| Start command | `npm start` |
| Health check path | `/` |

A `render.yaml` Blueprint is included — in Render choose **New → Blueprint**, pick this repo, and it configures everything automatically (Node runtime, `npm install` build, `npm start` launch, caching headers).

`npm start` runs `serve -l $PORT .`, which binds to the port Render injects. Routing is hash-based (`#/category/lifesteal`), so no rewrite rules are required.

If you'd rather use Python on a Web Service instead of Node: build command blank, start command `python3 -m http.server $PORT --bind 0.0.0.0`.

## Notes

- Package images are hot-linked from the store's Tebex CDN (`dunb17ur4ymx4.cloudfront.net`).
- "Add to cart" builds a local basket; the **Checkout** button hands off to the real store (checkout/payments stay with Tebex on store.firemc.fun).
- Catalog data lives in `assets/js/catalog.js` — edit there to update packages/prices.

```
index.html              # shell + modal/drawer/footer markup
assets/css/style.css    # dark fire theme
assets/js/catalog.js    # mirrored store data
assets/js/app.js        # routing, basket, modals, UI
assets/img/             # generated logo emblem + hero banner
```

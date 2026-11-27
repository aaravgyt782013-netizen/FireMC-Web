# REA Evidence — FireMC store reverse-engineering

This directory holds the outputs of the REA (`rea-agents`) workflow used to
reverse-engineer https://store.firemc.fun/ into this repo.

## Pipeline

1. **Capture** — the live store pages were captured with the platform-side
   fetch tool and stored verbatim in `rea/capture/*.md` (the sandbox shell has
   no direct network route to `store.firemc.fun`, its CDNs, or the Wayback
   Machine — verified with curl: TLS blocked).
2. **Reconstruct** — the captured behavior/content was turned into the
   runnable site in `index.html` + `assets/` (catalog data, username gate,
   basket, giftcard widget, checkout hand-off to Tebex).
3. **Verify (REA)** — REA analyzed the reconstructed code:
   `rea analyze-javascript-application assets/js --json`

## Artifacts

| File | What it is |
|---|---|
| `javascript-application.evidence.json` | Distilled Evidence bundle from the JavaScript application analysis (evidence id, subject digest, graph nodes: modules, assets, `fm.*` localStorage keys with source locations, limitations). |
| `provider-availability.json` | Which REA analysis providers were available on this machine at analysis time (native macOS provider unavailable on Linux, etc.). |
| `../capture/*.md` | Verbatim captured content of the 6 live store pages (home, 4 categories, terms chunk 1/3). |

The **full** Evidence bundle is 2.6 MB and intentionally not committed. It can
be regenerated at any time with:

```bash
rea analyze-javascript-application assets/js --json > /tmp/full-evidence.json
```

Full Evidence id at capture time:
`ev_fed76e33c2bcb7503a47cdc1fe42e22c7277dc91194d9fc9b9a714e910fd679d`

## Notes on scope

- REA's **live** web-capture path (`analyze-web-bundle`, which drives a
  Chromium/CDP browser) cannot reach the target from this sandbox: no browser
  is installed and its download hosts are blocked, so capture ran
  platform-side instead and REA analyzed the local reconstruction.
- Native-binary analysis (Ghidra) is prepared (JDK 21 installed) but the
  Ghidra distribution itself cannot be downloaded from this sandbox; it is
  irrelevant for a website target anyway — the JavaScript analyzer is the
  correct REA provider for web stores.

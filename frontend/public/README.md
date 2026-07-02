# Static assets

Files placed in this folder are served as-is from the site root by Vite.

- **logo.png** — the restaurant logo. Referenced throughout the app (sidebar, navbar, login page, printed receipts, browser tab icon) via `src/components/Logo.jsx`, which falls back to a plain monogram badge until this file exists. Add a roughly square PNG here named exactly `logo.png` and every one of those spots picks it up automatically — no code changes needed.

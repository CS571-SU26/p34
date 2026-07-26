# Tidal Wave

A React/Vite app for album-oriented discovery using either mock data or a user's followed TIDAL artists.

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `VITE_TIDAL_CLIENT_ID` in `.env.local`. The local redirect URI must exactly match a callback registered for the TIDAL app. The default local callback is `http://localhost:5173/`; the production build uses the `/p34/` GitHub Pages base automatically.

## Production deployment

The repository includes `.github/workflows/deploy.yml`. It builds and deploys after every push to `main` and can also be run manually.

1. In GitHub, open **Settings → Pages** and select **GitHub Actions** as the source.
2. Open **Settings → Secrets and variables → Actions → Variables**.
3. Add a repository variable named `VITE_TIDAL_CLIENT_ID` containing the public TIDAL client ID.
4. Push to `main`, then monitor the run in the **Actions** tab.

The production callback is `https://cs571-su26.github.io/p34/`.

## Current TIDAL flow

- OAuth Authorization Code with PKCE.
- Tokens are stored in `localStorage`, not cookies; access tokens are refreshed when possible.
- Followed artists are fetched page-by-page with `include=items` and flattened into one searchable array.
- Artist albums and artwork are fetched only after the relevant artist or album is selected.
- The live filter uses a whole-word `/\blive\b/i` title heuristic, so titles containing `alive` are retained.
- TIDAL-only controls are hidden while the app is using mock data.

## Reliability notes

- The followed-artist load is deduplicated with one shared promise, so React Strict Mode does not start two pagination chains.
- Cursor requests are paced and `429 Too Many Requests` responses honor TIDAL's `Retry-After` header with bounded retries.
- The deployment workflow pins npm 10.9.2 and uses current Node-24-based GitHub actions while running the project on Node 22.
- The UI states that the app requests only read-only library access and playback-related TIDAL permissions.


## Package manager

The GitHub Pages workflow uses pnpm to avoid an npm CLI crash observed on GitHub-hosted runners.

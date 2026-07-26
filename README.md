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

## npm deployment diagnostics

The workflow stays on npm and temporarily pins Node `22.4.1` while diagnosing the npm CLI error `Exit handler never called!`. npm dependency caching is disabled so a stale or malformed cache cannot affect the install.

If deployment fails again:

1. Open the repository on GitHub and select **Actions**.
2. Open the failed **Deploy Tidal Wave to GitHub Pages** run.
3. Select the **deploy** job.
4. Expand **Install dependencies** and note the first error above `Exit handler never called!`.
5. Expand **Print npm debug log on install failure**. Copy the section between `BEGIN` and `END`, especially the final 50–100 lines.
6. Also copy the output from **Show tool versions**.

The debug-log step runs automatically after an install failure, so the underlying npm stack trace should be visible in the same workflow run rather than only in an inaccessible runner file.

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
- The deployment workflow uses npm, pins an exact Node version, disables package-manager caching, and prints npm's debug log after an install failure.
- The UI states that the app requests only read-only library access and playback-related TIDAL permissions.

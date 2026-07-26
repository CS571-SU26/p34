# Tidal Wave

A usability-first React prototype for album-oriented music discovery.

## Run locally

```bash
npm install
npm run dev
```

## Current behavior

- Search for a mock artist and show their newest eligible release.
- Cycle through artists in a shuffled round-robin queue.
- Cycle through each artist's eligible albums the same way.
- Queues are cached in `sessionStorage`; after every option is used, the queue is reshuffled.
- Filter EPs and live albums.
- Switch between light and dark mode; dark mode is the default.
- Select Mock data or the placeholder Real TIDAL data source.
- Hand off to TIDAL for playback.

Settings are saved in `localStorage`. Selection queues are deliberately temporary and last only for the browser tab's session.

## Mock catalog

These names can be entered in the artist search:

- **Aurora Static** — *Glass Horizon*, *Night Transit*, *Northbound: Live*
- **Paper Moons** — *The Small Hours*, *Postcards* (EP)
- **Cedar Lines** — *Field Notes*
- **Velvet Circuit** — *Soft Machines*, *Signal Bloom*
- **Harbor Lights** — *Low Tide*, *Dockside Sessions* (live)
- **Mosaic Year** — *Borrowed Colors*, *Fragments* (EP)

All names, releases, tracks, and artwork in the mock catalog are fictional.

## Architecture and enhancement anchors

- `src/services/musicService.js` owns selection, caching, and the provider seam.
- The `dataSource` setting already distinguishes `mock` from `tidal`.
- Choosing `tidal` currently produces a clear placeholder error instead of silently falling back to mock data.
- `src/components/AlbumView.jsx` contains an anchor for a future Cover Flow-style selector.
- Login remains disabled until OAuth is implemented. The app should never collect a user's TIDAL password.

## Suggested milestones

1. Add a TIDAL provider for public artist search and album lookup.
2. Add OAuth and followed-artist retrieval.
3. Normalize TIDAL responses into the current artist/album shapes.
4. Add official TIDAL embeds.
5. Add optional album-selection animation.

# Tidal Wave

A usability-first React prototype for album-oriented music discovery. The first version uses mock data and mirrors the low-fidelity prototype flow:

- Find an artist's newest eligible album
- Pick a random artist
- Confirm or retry the random artist
- Pick and display a random eligible album
- Filter EPs and live albums in settings
- Hand off to TIDAL for playback

## Run locally

```bash
npm install
npm run dev
```

## Current architecture

- `src/services/musicService.js` is the integration seam. Replace the mock implementation with TIDAL API calls while preserving the function return shapes.
- `src/components/AlbumView.jsx` contains an explicit enhancement anchor for a future Cover Flow-style selector.
- Login is intentionally disabled until OAuth is implemented. The app should never collect a user's TIDAL password.

## Suggested milestones

1. Validate the frontend flow with mock data.
2. Add real artist search and album lookup.
3. Add OAuth and followed-artist retrieval.
4. Add loading, empty, and API error states.
5. Add optional animation and embedded playback.

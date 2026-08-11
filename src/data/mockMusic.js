//This is just an AI-generated list of fake artists and their fake albums.
// There's a mix of things that will hit the filters in the settings to give a variety of ways to test out the functionality without subscribing to Tidal
const COVERS = `${import.meta.env.BASE_URL}covers/`;

export const mockArtists = [
  {
    id: 'aurora-static',
    name: 'Aurora Static',
    imageUrl: `${COVERS}artist-aurora.svg`,
    albums: [
      { id: 'glass-horizon', title: 'Glass Horizon', releaseDate: '2025-10-03', type: 'album', artworkUrl: `${COVERS}glass-horizon.svg`, tidalUrl: 'https://tidal.com', tracks: ['First Light', 'Parallel Lines', 'Blue Signal', 'Afterimage'] },
      { id: 'night-transit', title: 'Night Transit', releaseDate: '2023-06-16', type: 'album', artworkUrl: `${COVERS}night-transit.svg`, tidalUrl: 'https://tidal.com', tracks: ['Departure', 'Signal Lost', 'Moving Lights', 'Terminal'] },
      { id: 'northbound-live', title: 'Northbound: Live', releaseDate: '2024-02-09', type: 'live', artworkUrl: `${COVERS}northbound-live.svg`, tidalUrl: 'https://tidal.com', tracks: ['First Light (Live)', 'Terminal (Live)', 'Encore'] },
    ],
  },
  {
    id: 'paper-moons',
    name: 'Paper Moons',
    imageUrl: `${COVERS}artist-paper.svg`,
    albums: [
      { id: 'small-hours', title: 'The Small Hours', releaseDate: '2024-08-23', type: 'album', artworkUrl: `${COVERS}small-hours.svg`, tidalUrl: 'https://tidal.com', tracks: ['Kitchen Radio', 'Half Awake', 'Window Seat', 'Morning Again'] },
      { id: 'postcards-ep', title: 'Postcards', releaseDate: '2025-01-31', type: 'ep', artworkUrl: `${COVERS}postcards.svg`, tidalUrl: 'https://tidal.com', tracks: ['Front', 'Back', 'No Address'] },
    ],
  },
  {
    id: 'cedar-lines',
    name: 'Cedar Lines',
    imageUrl: `${COVERS}artist-cedar.svg`,
    albums: [
      { id: 'field-notes', title: 'Field Notes', releaseDate: '2025-04-11', type: 'album', artworkUrl: `${COVERS}field-notes.svg`, tidalUrl: 'https://tidal.com', tracks: ['Trailhead', 'Rain Gauge', 'Old Map', 'Home by Dusk'] },
    ],
  },
  {
    id: 'velvet-circuit',
    name: 'Velvet Circuit',
    imageUrl: `${COVERS}artist-velvet.svg`,
    albums: [
      { id: 'soft-machines', title: 'Soft Machines', releaseDate: '2025-07-18', type: 'album', artworkUrl: `${COVERS}soft-machines.svg`, tidalUrl: 'https://tidal.com', tracks: ['Warm Start', 'Human Error', 'Quiet Current', 'Power Down'] },
      { id: 'signal-bloom', title: 'Signal Bloom', releaseDate: '2022-11-04', type: 'album', artworkUrl: `${COVERS}signal-bloom.svg`, tidalUrl: 'https://tidal.com', tracks: ['Open Channel', 'Signal Bloom', 'Static Garden', 'Receiver'] },
    ],
  },
  {
    id: 'harbor-lights',
    name: 'Harbor Lights',
    imageUrl: `${COVERS}artist-harbor.svg`,
    albums: [
      { id: 'low-tide', title: 'Low Tide', releaseDate: '2024-05-10', type: 'album', artworkUrl: `${COVERS}low-tide.svg`, tidalUrl: 'https://tidal.com', tracks: ['Breakwater', 'Low Tide', 'Salt Air', 'Lantern Room'] },
      { id: 'dockside-sessions', title: 'Dockside Sessions', releaseDate: '2025-02-14', type: 'live', artworkUrl: `${COVERS}dockside-sessions.svg`, tidalUrl: 'https://tidal.com', tracks: ['Breakwater (Live)', 'Salt Air (Live)', 'Last Ferry'] },
    ],
  },
  {
    id: 'mosaic-year',
    name: 'Mosaic Year',
    imageUrl: `${COVERS}artist-mosaic.svg`,
    albums: [
      { id: 'borrowed-colors', title: 'Borrowed Colors', releaseDate: '2023-09-29', type: 'album', artworkUrl: `${COVERS}borrowed-colors.svg`, tidalUrl: 'https://tidal.com', tracks: ['Ochre', 'Indigo Room', 'Green Glass', 'Borrowed Colors'] },
      { id: 'fragments-ep', title: 'Fragments', releaseDate: '2025-06-06', type: 'ep', artworkUrl: `${COVERS}fragments.svg`, tidalUrl: 'https://tidal.com', tracks: ['Piece One', 'Piece Two', 'Grout Lines'] },
    ],
  },

  {
    id: 'edge-case-ensemble',
    name: 'Edge Case Ensemble ⟡',
    imageUrl: `${COVERS}artist-mosaic.svg`,
    albums: [
      { id: 'look-alive', title: 'Look Alive', releaseDate: '2026-04-03', type: 'album', artworkUrl: `${COVERS}borrowed-colors.svg`, tidalUrl: 'https://tidal.com', tracks: ['Still Here', 'Whole Word'] },
      { id: 'edge-live', title: 'Signals (Live)', releaseDate: '2025-11-14', type: 'album', artworkUrl: `${COVERS}northbound-live.svg`, tidalUrl: 'https://tidal.com', tracks: ['Signals (Live)', 'Return'] },
      { id: 'unicode-title', title: 'ʅ() ꐑ(ƟӨ)ʃ', releaseDate: '2025-08-08', type: 'ep', artworkUrl: `${COVERS}fragments.svg`, tidalUrl: 'https://tidal.com', tracks: ['Glyph I', 'Glyph II'] },
      { id: 'same-title-lossless', title: 'Parallel Editions', releaseDate: '2025-05-02', type: 'album', artworkUrl: `${COVERS}signal-bloom.svg`, tidalUrl: 'https://tidal.com', tracks: ['A', 'B'] },
      { id: 'same-title-atmos', title: 'Parallel Editions', releaseDate: '2025-05-02', type: 'album', artworkUrl: `${COVERS}signal-bloom.svg`, tidalUrl: 'https://tidal.com', tracks: ['A', 'B'] },
    ],
  },
];

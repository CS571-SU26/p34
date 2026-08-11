const AUTHORIZATION_URL = 'https://login.tidal.com/authorize';
const TOKEN_URL = 'https://auth.tidal.com/v1/oauth2/token';
const TOKEN_KEY = 'tidal-wave-auth-v1';
const PKCE_KEY = 'tidal-wave-pkce-v1';
const EARLY_REFRESH_MS = 60_000;

function getClientId() {
  return import.meta.env.VITE_TIDAL_CLIENT_ID?.trim() ?? '';
}

export function getRedirectUri() {
  const configured = import.meta.env.VITE_TIDAL_REDIRECT_URI?.trim();
  if (configured) return configured;
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

function encodeBase64Url(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

function randomString(length = 64) {
  return encodeBase64Url(crypto.getRandomValues(new Uint8Array(length)));
}

async function createCodeChallenge(verifier) {
  const bytes = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return encodeBase64Url(new Uint8Array(digest));
}

function readTokens() {
  try {
    return JSON.parse(window.localStorage.getItem(TOKEN_KEY));
  } catch {
    return null;
  }
}

function storeTokens(payload) {
  const current = readTokens() ?? {};
  const expiresIn = Number(payload.expires_in ?? 0);
  const tokens = {
    ...current,
    ...payload,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  window.localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  return tokens;
}

async function requestTokens(parameters) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(parameters),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`TIDAL login failed (${response.status}): ${body}`);
  }

  return storeTokens(await response.json());
}

export function isTidalConfigured() {
  return Boolean(getClientId());
}

export function isAuthenticated() {
  return Boolean(readTokens()?.access_token);
}

export async function beginTidalLogin() {
  const clientId = getClientId();
  if (!clientId) {
    throw new Error('VITE_TIDAL_CLIENT_ID is not configured.');
  }

  //Why are these here and not higher up with the rest of the const declarations in the function?
  const state = randomString(32);
  const verifier = randomString(64);
  const challenge = await createCodeChallenge(verifier);
  const redirectUri = getRedirectUri();

  window.sessionStorage.setItem(
    PKCE_KEY,
    JSON.stringify({ state, verifier, redirectUri }),
  );

  const url = new URL(AUTHORIZATION_URL);
  url.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'user.read collection.read',
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  });

  window.location.assign(url);
}

export async function completeTidalLoginFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const oauthError = params.get('error');

  if (!code && !oauthError) return false;

  if (oauthError) {
    throw new Error(
      params.get('error_description') || `TIDAL authorization failed: ${oauthError}`,
    );
  }

  const pending = JSON.parse(window.sessionStorage.getItem(PKCE_KEY) ?? 'null');
  if (!pending || pending.state !== params.get('state')) {
    throw new Error('The TIDAL login state could not be verified. Please try again.');
  }

  await requestTokens({
    grant_type: 'authorization_code',
    client_id: getClientId(),
    code,
    redirect_uri: pending.redirectUri,
    code_verifier: pending.verifier,
  });

  window.sessionStorage.removeItem(PKCE_KEY);
  window.history.replaceState({}, document.title, getRedirectUri());
  return true;
}

async function refreshTokens(refreshToken) {
  return requestTokens({
    grant_type: 'refresh_token',
    client_id: getClientId(),
    refresh_token: refreshToken,
  });
}

export async function getAccessToken() {
  let tokens = readTokens();
  if (!tokens?.access_token) {
    throw new Error('Log in with TIDAL before using real TIDAL data.');
  }

  if (tokens.expiresAt - EARLY_REFRESH_MS <= Date.now()) {
    if (!tokens.refresh_token) {
      logoutFromTidal();
      throw new Error('Your TIDAL session expired. Please log in again.');
    }
    tokens = await refreshTokens(tokens.refresh_token);
  }

  return tokens.access_token;
}

export function logoutFromTidal() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(PKCE_KEY);
}

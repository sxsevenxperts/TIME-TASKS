// Google Calendar Integration Handlers

const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || '';

export function buildGoogleAuthUrl(state) {
  if (!googleClientId) return null;
  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: googleRedirectUri,
    response_type: 'code',
    scope: 'openid profile email https://www.googleapis.com/auth/calendar',
    access_type: 'offline',
    prompt: 'consent',
    state
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code) {
  if (!googleClientSecret) throw new Error('GOOGLE_CLIENT_SECRET_MISSING');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: googleRedirectUri
    }),
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GOOGLE_TOKEN_EXCHANGE_FAILED: ${detail}`);
  }

  return await response.json();
}

export async function refreshGoogleToken(refreshToken) {
  if (!googleClientSecret) throw new Error('GOOGLE_CLIENT_SECRET_MISSING');
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    }),
    signal: AbortSignal.timeout(10_000)
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GOOGLE_TOKEN_REFRESH_FAILED: ${detail}`);
  }

  return await response.json();
}

export async function fetchGoogleCalendars(accessToken) {
  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(10_000)
    }
  );

  if (!response.ok) throw new Error('GOOGLE_CALENDARS_FETCH_FAILED');
  const data = await response.json();
  return data.items || [];
}

export async function fetchGoogleEvents(accessToken, calendarId, timeMin, timeMax) {
  const params = new URLSearchParams({
    timeMin: new Date(timeMin).toISOString(),
    timeMax: new Date(timeMax).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '100'
  });

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json'
      },
      signal: AbortSignal.timeout(15_000)
    }
  );

  if (!response.ok) throw new Error('GOOGLE_EVENTS_FETCH_FAILED');
  const data = await response.json();
  return data.items || [];
}

export async function createGoogleEvent(accessToken, calendarId, event) {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(10_000)
    }
  );

  if (!response.ok) throw new Error('GOOGLE_EVENT_CREATE_FAILED');
  return await response.json();
}

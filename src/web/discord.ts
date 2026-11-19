// "Log in with Discord" (OAuth2 authorization code flow, scope `identify` only).
// The access token is used once to read who the user is, then thrown away.

const DISCORD = 'https://discord.com';

export type Fetch = typeof fetch;

export interface OAuthApp {
  clientId: string;
  clientSecret: string;
  /** Where Discord sends the user back: <panel url>/callback, registered in the Developer Portal. */
  redirectUri: string;
}

export interface DiscordUser {
  id: string;
  name: string;
}

/** The Discord page that asks the user to log in. */
export function authorizeUrl(app: OAuthApp, state: string): string {
  const params = new URLSearchParams({
    client_id: app.clientId,
    redirect_uri: app.redirectUri,
    response_type: 'code',
    scope: 'identify',
    state,
    prompt: 'none',
  });
  return `${DISCORD}/oauth2/authorize?${params}`;
}

/** Trades the code from the callback for the user's id and name. Throws on any failure. */
export async function identify(app: OAuthApp, code: string, fetchFn: Fetch): Promise<DiscordUser> {
  const tokenResponse = await fetchFn(`${DISCORD}/api/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: app.clientId,
      client_secret: app.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: app.redirectUri,
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!tokenResponse.ok) throw new Error(`Discord token exchange failed: ${tokenResponse.status}`);
  const token = (await tokenResponse.json()) as { access_token?: unknown; token_type?: unknown };
  if (typeof token.access_token !== 'string') throw new Error('Discord sent no access token');

  const meResponse = await fetchFn(`${DISCORD}/api/users/@me`, {
    headers: { Authorization: `Bearer ${token.access_token}` },
    signal: AbortSignal.timeout(10_000),
  });
  if (!meResponse.ok) throw new Error(`Discord user lookup failed: ${meResponse.status}`);
  const me = (await meResponse.json()) as {
    id?: unknown;
    username?: unknown;
    global_name?: unknown;
  };
  if (typeof me.id !== 'string' || !/^\d{1,20}$/.test(me.id)) {
    throw new Error('Discord sent no user id');
  }
  const name =
    typeof me.global_name === 'string' && me.global_name
      ? me.global_name
      : typeof me.username === 'string'
        ? me.username
        : me.id;
  return { id: me.id, name: name.slice(0, 64) };
}

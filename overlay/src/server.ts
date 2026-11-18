// Elder Overlay: a small web server that runs on the streamer's own PC next to OBS.
// It listens on 127.0.0.1 only, keeps the trackers in a JSON file, pushes every change
// to the OBS Browser Sources with Server-Sent Events, and takes changes from the OBS
// dock and the Stream Deck over HTTP POST. No dependencies beyond Node itself.

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { join, resolve } from 'node:path';
import {
  adjust,
  addCharacter,
  CLANS,
  emptyState,
  getValue,
  removeCharacter,
  restore,
  SECTS,
  setSect,
  setValue,
  StateError,
  updateCharacter,
  type OverlayState,
} from './state.ts';

const HOST = '127.0.0.1';
const MAX_BODY = 4096;
const MAX_STREAMS = 32;
const OVERLAY_DIR = join(import.meta.dirname, '..');
const STATIC_DIR = join(OVERLAY_DIR, 'static');

const STATIC_FILES: Record<string, string> = {
  'overlay.css': 'text/css; charset=utf-8',
  'dock.css': 'text/css; charset=utf-8',
  'common.js': 'text/javascript; charset=utf-8',
  'frame.js': 'text/javascript; charset=utf-8',
  'dock.js': 'text/javascript; charset=utf-8',
};
const SYMBOLS = new Set<string>([...CLANS, ...SECTS.filter((s) => s !== 'none')]);

const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  "img-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

export interface OverlayOptions {
  port: number;
  dataDir: string;
  symbolsDir?: string;
  /** Fixed token, for tests. Otherwise read from or written to `<dataDir>/token.txt`. */
  token?: string;
  /** Delay before writing state.json, in ms. */
  saveDelay?: number;
}

export interface Overlay {
  url: string;
  token: string;
  state: OverlayState;
  close(): Promise<void>;
}

function loadToken(dataDir: string): string {
  const file = join(dataDir, 'token.txt');
  if (existsSync(file)) {
    const t = readFileSync(file, 'utf8').trim();
    if (t.length >= 32) return t;
  }
  const t = randomBytes(32).toString('base64url');
  writeFileSync(file, t + '\n', { mode: 0o600 });
  return t;
}

function loadState(file: string): OverlayState {
  if (!existsSync(file)) return emptyState();
  try {
    return restore(JSON.parse(readFileSync(file, 'utf8')));
  } catch {
    // A broken file must not stop the show: keep a copy and start empty.
    renameSync(file, `${file}.broken-${Date.now()}`);
    return emptyState();
  }
}

function sameSecret(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function send(res: ServerResponse, status: number, body: unknown, type = 'application/json') {
  const text = type === 'application/json' ? JSON.stringify(body) : String(body);
  res.writeHead(status, {
    'Content-Type': type === 'application/json' ? 'application/json; charset=utf-8' : type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': CSP,
  });
  res.end(text);
}

function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      // Keep reading so the client gets an answer, but stop storing.
      if (size <= MAX_BODY) chunks.push(chunk);
    });
    req.on('end', () => {
      if (size > MAX_BODY) return reject(new StateError('request body is too large'));
      const text = Buffer.concat(chunks).toString('utf8').trim();
      if (!text) return resolve({});
      const type = req.headers['content-type'] ?? '';
      try {
        if (type.includes('application/x-www-form-urlencoded')) {
          return resolve(Object.fromEntries(new URLSearchParams(text)));
        }
        const parsed: unknown = JSON.parse(text);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return reject(new StateError('body must be a JSON object'));
        }
        resolve(parsed as Record<string, unknown>);
      } catch {
        reject(new StateError('body is not valid JSON'));
      }
    });
    req.on('error', reject);
  });
}

export function startOverlay(options: OverlayOptions): Promise<Overlay> {
  const { dataDir } = options;
  mkdirSync(dataDir, { recursive: true });
  const symbolsDir = options.symbolsDir ?? join(OVERLAY_DIR, 'symbols');
  const stateFile = join(dataDir, 'state.json');
  const token = options.token ?? loadToken(dataDir);
  const state = loadState(stateFile);
  const streams = new Set<ServerResponse>();
  let saveTimer: NodeJS.Timeout | undefined;
  let port = options.port;

  const save = () => {
    const tmp = `${stateFile}.tmp`;
    writeFileSync(tmp, JSON.stringify(state, null, 2));
    renameSync(tmp, stateFile);
  };
  const changed = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, options.saveDelay ?? 300);
    const msg = `data: ${JSON.stringify(state)}\n\n`;
    for (const s of streams) s.write(msg);
  };

  const allowedHosts = () => new Set([`${HOST}:${port}`, `localhost:${port}`]);
  const allowedOrigins = () => new Set([`http://${HOST}:${port}`, `http://localhost:${port}`]);

  const page = (name: string, extra: Record<string, string> = {}) => {
    let html = readFileSync(join(STATIC_DIR, name), 'utf8');
    for (const [k, v] of Object.entries(extra)) html = html.replaceAll(`{{${k}}}`, v);
    return html;
  };

  async function handlePost(
    path: string,
    params: Record<string, unknown>,
    res: ServerResponse,
  ): Promise<void> {
    let didChange: boolean;
    let value: number | undefined;
    switch (path) {
      case '/api/adjust':
        didChange = adjust(state, params.pg, params.track, params.field, params.delta ?? 1);
        value = getValue(state, params.pg, params.track, params.field);
        break;
      case '/api/set':
        didChange = setValue(state, params.pg, params.track, params.field, params.value);
        value = getValue(state, params.pg, params.track, params.field);
        break;
      case '/api/characters/add':
        addCharacter(state, { ...params, name: params.name, clan: params.clan });
        didChange = true;
        break;
      case '/api/characters/update':
        updateCharacter(state, params.pg, params);
        didChange = true;
        break;
      case '/api/characters/remove':
        removeCharacter(state, params.pg);
        didChange = true;
        break;
      case '/api/chronicle/sect':
        setSect(state, params.sect);
        didChange = true;
        break;
      default:
        return send(res, 404, { error: 'not found' });
    }
    if (didChange) changed();
    send(res, 200, value === undefined ? { ok: true } : { ok: true, value });
  }

  const server = createServer(async (req, res) => {
    try {
      // DNS rebinding: only answer requests addressed to this machine by name or IP.
      if (!allowedHosts().has(req.headers.host ?? '')) return send(res, 403, { error: 'bad host' });
      const url = new URL(req.url ?? '/', `http://${HOST}:${port}`);
      const path = url.pathname;

      if (req.method === 'GET') {
        if (path === '/') {
          res.writeHead(302, { Location: '/dock' });
          return res.end();
        }
        if (path === '/dock')
          return send(res, 200, page('dock.html', { TOKEN: token }), 'text/html; charset=utf-8');
        if (path === '/frame' || path === '/scena')
          return send(res, 200, page('frame.html'), 'text/html; charset=utf-8');
        if (path === '/api/state') return send(res, 200, state);
        if (path.startsWith('/static/')) {
          const name = path.slice('/static/'.length);
          const type = Object.hasOwn(STATIC_FILES, name) ? STATIC_FILES[name] : undefined;
          if (!type) return send(res, 404, { error: 'not found' });
          return send(res, 200, readFileSync(join(STATIC_DIR, name), 'utf8'), type);
        }
        const sym = /^\/symbols\/([a-z0-9-]+)\.png$/.exec(path);
        if (sym) {
          const key = sym[1] ?? '';
          const file = join(symbolsDir, `${key}.png`);
          if (!SYMBOLS.has(key) || !existsSync(file)) return send(res, 404, { error: 'no symbol' });
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Cache-Control': 'max-age=300',
            'X-Content-Type-Options': 'nosniff',
          });
          return res.end(readFileSync(file));
        }
        if (path === '/events') {
          if (streams.size >= MAX_STREAMS) return send(res, 503, { error: 'too many listeners' });
          res.writeHead(200, {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            Connection: 'keep-alive',
          });
          res.write(`retry: 1000\ndata: ${JSON.stringify(state)}\n\n`);
          streams.add(res);
          const ping = setInterval(() => res.write(': ping\n\n'), 20000);
          req.on('close', () => {
            clearInterval(ping);
            streams.delete(res);
          });
          return;
        }
        return send(res, 404, { error: 'not found' });
      }

      if (req.method === 'POST') {
        // A web page open in any browser can send requests to 127.0.0.1; it must not change anything.
        const origin = req.headers.origin;
        if (origin !== undefined && !allowedOrigins().has(origin)) {
          return send(res, 403, { error: 'bad origin' });
        }
        const auth = req.headers.authorization;
        const given =
          (typeof req.headers['x-elder-token'] === 'string' ? req.headers['x-elder-token'] : '') ||
          (auth?.startsWith('Bearer ') ? auth.slice(7) : '') ||
          url.searchParams.get('token') ||
          '';
        if (!sameSecret(given, token)) return send(res, 401, { error: 'missing or wrong token' });
        const body = await readBody(req);
        const params: Record<string, unknown> = { ...body };
        for (const [k, v] of url.searchParams) if (k !== 'token' && !(k in params)) params[k] = v;
        return await handlePost(path, params, res);
      }

      res.writeHead(405, { Allow: 'GET, POST' });
      res.end();
    } catch (err) {
      if (err instanceof StateError) return send(res, 400, { error: err.message });
      console.error(err);
      if (!res.headersSent) send(res, 500, { error: 'internal error' });
    }
  });
  server.headersTimeout = 10000;
  server.requestTimeout = 10000;

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, HOST, () => {
      const address = server.address();
      if (address && typeof address === 'object') port = address.port;
      resolve({
        url: `http://${HOST}:${port}`,
        token,
        state,
        close: () =>
          new Promise<void>((done) => {
            clearTimeout(saveTimer);
            save();
            for (const s of streams) s.end();
            server.close(() => done());
          }),
      });
    });
  });
}

async function main() {
  const port = Number(process.env.ELDER_OVERLAY_PORT ?? 7777);
  if (!Number.isInteger(port) || port < 1024 || port > 65535) {
    throw new Error('ELDER_OVERLAY_PORT must be a number between 1024 and 65535');
  }
  const overlay = await startOverlay({ port, dataDir: join(OVERLAY_DIR, 'data') });
  console.log(`Elder Overlay is running on ${overlay.url} (only this PC can reach it).`);
  console.log(`  OBS dock:          ${overlay.url}/dock`);
  console.log(`  Whole scene:       ${overlay.url}/scena (one 1920x1080 Browser Source)`);
  console.log(`  Character frame:   ${overlay.url}/frame?pg=<character id>`);
  console.log(`  Storyteller frame: ${overlay.url}/frame?pg=storyteller`);
  console.log(
    `  Stream Deck token: in overlay/data/token.txt (send it as the X-Elder-Token header)`,
  );
  const stop = () => overlay.close().then(() => process.exit(0));
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}

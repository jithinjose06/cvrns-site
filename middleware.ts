const COOKIE_NAME = 'cvrns_site_access';
const AUTH_PATH = '/__site-auth';
const TOKEN_MESSAGE = 'cvrns-site-access-v1';

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function accessToken(secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(TOKEN_MESSAGE));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return rest.join('=');
  }
  return null;
}

function hasValidAccess(request: Request, token: string): boolean {
  const cookie = readCookie(request, COOKIE_NAME);
  return cookie !== null && timingSafeEqual(cookie, token);
}

function gateResponse(request: Request, error = false): Response {
  const next = new URL(request.url);
  const action = `${next.origin}${AUTH_PATH}?next=${encodeURIComponent(next.pathname + next.search)}`;
  const html = gateHtml(action, error);
  return new Response(html, {
    status: error ? 401 : 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function gateHtml(action: string, error: boolean): string {
  const errorMarkup = error
    ? '<p class="gate__error" role="alert">Wrong password. Try again.</p>'
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow" />
  <title>CVRNS � Private preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500&family=Space+Mono&display=swap" rel="stylesheet" />
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      background: #0a0b0d;
      color: #cdcac2;
      font-family: Archivo, system-ui, sans-serif;
      overflow: hidden;
    }
    .gate {
      position: relative;
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .gate__blur {
      position: absolute;
      inset: -10%;
      display: grid;
      place-items: center;
      pointer-events: none;
      user-select: none;
      filter: blur(14px);
      opacity: 0.38;
      transform: scale(1.04);
    }
    .gate__blur-inner {
      text-align: center;
      padding: 40px;
    }
    .gate__eyebrow {
      font-family: "Space Mono", ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: 0.22em;
      text-transform: uppercase;
      color: #84857f;
      margin-bottom: 18px;
    }
    .gate__title {
      font-family: Anton, "Arial Narrow", sans-serif;
      font-size: clamp(3.5rem, 14vw, 8rem);
      line-height: 0.92;
      letter-spacing: 0.02em;
      color: #e9e4d8;
      margin-bottom: 20px;
    }
    .gate__copy {
      max-width: 34ch;
      margin-inline: auto;
      font-size: clamp(1rem, 2.2vw, 1.2rem);
      color: #84857f;
    }
    .gate__veil {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(120% 100% at 50% 0%, transparent 45%, rgba(0,0,0,.72) 100%),
        rgba(10,11,13,.55);
      pointer-events: none;
    }
    .gate__panel {
      position: relative;
      z-index: 2;
      width: min(100%, 420px);
      padding: 28px 28px 24px;
      border: 1px solid rgba(233,228,216,.13);
      background: rgba(16,18,22,.82);
      backdrop-filter: blur(10px);
    }
    .gate__label {
      font-family: "Space Mono", ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #84857f;
      margin-bottom: 10px;
    }
    .gate__heading {
      font-family: Anton, "Arial Narrow", sans-serif;
      font-size: 2rem;
      letter-spacing: 0.03em;
      color: #e9e4d8;
      margin-bottom: 8px;
    }
    .gate__hint {
      font-size: 0.95rem;
      color: #84857f;
      margin-bottom: 22px;
    }
    .gate__error {
      color: #e9e4d8;
      background: rgba(233,228,216,.08);
      border: 1px solid rgba(233,228,216,.18);
      padding: 10px 12px;
      margin-bottom: 16px;
      font-size: 0.92rem;
    }
    .gate__field {
      display: grid;
      gap: 8px;
      margin-bottom: 18px;
    }
    .gate__field span {
      font-family: "Space Mono", ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #84857f;
    }
    .gate__field input {
      width: 100%;
      border: 1px solid rgba(233,228,216,.18);
      background: #0a0b0d;
      color: #e9e4d8;
      padding: 12px 14px;
      font: inherit;
    }
    .gate__field input:focus {
      outline: 2px solid rgba(233,228,216,.35);
      outline-offset: 2px;
    }
    .gate__submit {
      width: 100%;
      border: 0;
      background: #e9e4d8;
      color: #0a0b0d;
      padding: 13px 16px;
      font-family: "Space Mono", ui-monospace, monospace;
      font-size: 11px;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      cursor: pointer;
    }
    .gate__submit:hover { background: #cdcac2; }
  </style>
</head>
<body>
  <main class="gate">
    <div class="gate__blur" aria-hidden="true">
      <div class="gate__blur-inner">
        <p class="gate__eyebrow">EP � 2025</p>
        <h1 class="gate__title">HERE.AFTER</h1>
        <p class="gate__copy">Four shadows, one room. CVRNS is a melodic metalcore band that makes bangers.</p>
      </div>
    </div>
    <div class="gate__veil" aria-hidden="true"></div>
    <section class="gate__panel" aria-labelledby="gate-title">
      <p class="gate__label">Private preview</p>
      <h1 class="gate__heading" id="gate-title">CVRNS</h1>
      <p class="gate__hint">This site is password-protected while we finish the launch.</p>
      ${errorMarkup}
      <form method="post" action="${action}">
        <div class="gate__field">
          <label>
            <span>Password</span>
            <input type="password" name="password" autocomplete="current-password" required />
          </label>
        </div>
        <button class="gate__submit" type="submit">Enter</button>
      </form>
    </section>
  </main>
</body>
</html>`;
}

function redirectWithCookie(request: Request, token: string): Response {
  const url = new URL(request.url);
  const next = url.searchParams.get('next') || '/';
  const destination = new URL(next, url.origin);
  const headers = new Headers();
  headers.set(
    'set-cookie',
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`
  );
  headers.set('location', destination.pathname + destination.search);
  return new Response(null, { status: 303, headers });
}

export default async function middleware(request: Request) {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    return;
  }

  const token = await accessToken(password);
  const { pathname } = new URL(request.url);

  if (pathname === AUTH_PATH) {
    if (request.method !== 'POST') {
      return gateResponse(request);
    }

    const contentType = request.headers.get('content-type') ?? '';
    const submitted = contentType.includes('application/x-www-form-urlencoded')
      ? (new URLSearchParams(await request.text()).get('password') ?? '')
      : String((await request.formData()).get('password') ?? '');

    if (!timingSafeEqual(submitted, password)) {
      return gateResponse(request, true);
    }

    return redirectWithCookie(request, token);
  }

  if (hasValidAccess(request, token)) {
    return;
  }

  return gateResponse(request);
}

export const config = {
  matcher: ['/((?!_vercel).*)'],
};

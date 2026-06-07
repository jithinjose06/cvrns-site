const REALM = 'CVRNS';

function unauthorized(): Response {
  return new Response('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}"`,
    },
  });
}

/** Constant-time string compare (same length only). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function parseBasicAuth(header: string | null): { user: string; pass: string } | null {
  if (!header?.startsWith('Basic ')) return null;
  try {
    const decoded = atob(header.slice(6));
    const colon = decoded.indexOf(':');
    if (colon === -1) return null;
    return { user: decoded.slice(0, colon), pass: decoded.slice(colon + 1) };
  } catch {
    return null;
  }
}

export default function middleware(request: Request) {
  const password = process.env.SITE_PASSWORD;
  if (!password) {
    return;
  }

  const expectedUser = process.env.SITE_AUTH_USER ?? 'cvrns';
  const credentials = parseBasicAuth(request.headers.get('authorization'));
  if (
    !credentials ||
    !timingSafeEqual(credentials.user, expectedUser) ||
    !timingSafeEqual(credentials.pass, password)
  ) {
    return unauthorized();
  }
}

export const config = {
  matcher: ['/((?!_vercel).*)'],
};

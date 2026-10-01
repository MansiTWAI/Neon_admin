import { createSessionMiddleware } from '@neon-adda/shared/web/server';
import { API_URL } from './lib/env';

export const middleware = createSessionMiddleware({
  audience: 'admin',
  apiUrl: API_URL,
  publicPaths: ['/login'],
});

export const config = {
  // Everything except the API proxy, Next.js assets, the push service worker and notification icons.
  matcher: ['/((?!v1/|_next|firebase-messaging-sw|icon-192|badge-72|favicon).*)'],
};

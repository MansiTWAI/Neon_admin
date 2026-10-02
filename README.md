# Neon Adda admin panel

Back office for Neon Adda staff: orders, quotations, catalogue, pricing, franchises, commission and staff. Next.js 15 and React 19. Talks to the API in [Neon_backend](https://github.com/MansiTWAI/Neon_backend).

## Run locally

Node.js 22 and pnpm 10, with the API running on http://localhost:4000.

```bash
pnpm install
cp .env.example .env.local
pnpm dev                  # http://localhost:3001
```

Sign in with **admin@gmail.com** / **admin123**.

The browser never calls the API directly: `next.config.ts` forwards `/v1/*` to `API_URL`, so
sign-in cookies belong to this site wherever the API is hosted.

## Deploy on Vercel (free)

1. **Add New > Project** and import this repository. `vercel.json` sets the build.
2. Environment variables:
   - `API_URL`: the API's address, e.g. `https://neon-adda-api.onrender.com` (no trailing slash)
   - `NEXT_PUBLIC_STORE_URL`: the storefront's address, for shop links and the standee QR code
   - `NEXT_PUBLIC_FIREBASE_*`: optional, for push notifications
3. **Deploy**. Redeploy after changing a variable: they are read at build time.

## `shared/`

The pricing and commission engines and the session helpers. The storefront, the admin panel and the
API each carry the same copy, so the price a customer sees in the studio is the price the API charges.
Change it in one place and copy it to the other repositories.

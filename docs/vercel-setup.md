# Vercel deploy (one-time)

Production hosting is **Vercel** (first-class Astro support, root URLs, PR preview deployments).

## Connect the GitHub repo

1. Open **https://vercel.com/new**
2. Sign in with **GitHub** (same account as `jithinjose06`)
3. Import **`jithinjose06/cvrns-site`**
4. Confirm settings (Vercel should detect Astro from `vercel.json`):
   - **Framework:** Astro
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
   - **Install command:** `npm ci`
   - **Node.js:** 22.x (from `.nvmrc`)
5. Click **Deploy**

No environment variables are required for the static site today.

## After first deploy

| Item            | Behavior                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| **Production**  | Every merge to `master` deploys automatically                            |
| **Preview**     | Each pull request gets a unique `*.vercel.app` URL                       |
| **Default URL** | `https://cvrns-site-*.vercel.app` or similar (shown in Vercel dashboard) |

Update the live URL in `README.md` once you know the production domain.

## Custom domain

Vercel project ? **Settings** ? **Domains** ? add your band domain. Set `SITE` in Vercel env to `https://your.domain` if you use absolute canonical URLs later.

## Disable old GitHub Pages (optional)

If Pages was enabled earlier, turn it off so the old `github.io/cvrns-site` URL does not serve stale content:

- Repo ? **Settings** ? **Pages** ? set source to **None**

Or:

```bash
gh api --method DELETE repos/jithinjose06/cvrns-site/pages
```

## Local CLI (optional)

```bash
npx vercel login
npx vercel link
npx vercel --prod
```

`.vercel/` is gitignored.

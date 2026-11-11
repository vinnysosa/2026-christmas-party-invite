# 2026 Christmas with the Sosa's — Invite & RSVP App

Custom Google Apps Script + Google Sheets RSVP backend with a fast, mobile-friendly frontend hosted on GitHub Pages at **`https://2026christmas.sosa-life.com/invite/`**.

## Architecture & Privacy Controls

- **Subpath Hosting (`/invite/`) + No Sitemap / No-Index**:
  - The invite page lives at `https://2026christmas.sosa-life.com/invite/` (not at the root `/`).
  - [`robots.txt`](./robots.txt) disallows all crawlers (`Disallow: /`), there is no `sitemap.xml`, and every page includes `<meta name="robots" content="noindex, nofollow, noarchive">`.
- **Optional Invite Key Security (`INVITE_KEY`)**:
  - Because GitHub Pages is a static site, any value baked into JavaScript is visible in browser DevTools, and any folder path in a public GitHub repo is visible in the repo's file list.
  - Instead of storing a secret in GitHub, `gas/Code.gs` supports a private **Script Property** named `INVITE_KEY` stored inside Google Apps Script (**Project Settings > Script Properties**).
  - If you set `INVITE_KEY` (e.g., `SOSA2026`) in Google Apps Script, only guests who visit your invite URL with `?key=SOSA2026` (`https://2026christmas.sosa-life.com/invite/?key=SOSA2026`) can submit RSVPs or view the guest contribution list—and that secret key never touches GitHub!

---

## Automatic Personal Account Isolation (No Manual Switching Needed)

This repository is configured so you **never** have to manually switch between your ServiceTitan account and your personal account when working inside this folder:
1. **Git Commits**: `.git/config` sets `user.name = "Vinny Sosa"` and `user.email = "vinny.sosa@gmail.com"` locally for this repository.
2. **Git Push / Pull**: `.git/config` uses a repo-local credential username pinned to your `vinnysosa` GitHub account, independent of your global ServiceTitan work repos.
3. **Clasp (`clasp -u personal`)**: All npm scripts in `package.json` pass `-u personal`, which uses the `"personal"` profile in `~/.clasprc.json` (`vinny.sosa@gmail.com`) without touching your default `vsosa@servicetitan.com` profile.

---

## Step 1: Connect Clasp to Your Personal Google Account (`vinny.sosa@gmail.com`)

Run these commands once in `/Users/vinnysosa/Documents/Personal/2026-christmas-party-invite`:

```bash
export PATH="/opt/homebrew/bin:/Users/vinnysosa/.nvm/versions/node/v22.20.0/bin:$PATH"

# 1. Log into Clasp's "personal" profile with vinny.sosa@gmail.com (one-time setup)
npm run clasp:login

# 2. Create the 2026 Google Sheet + bound Apps Script project inside ./gas
npm run clasp:create

# 3. Push gas/Code.gs and gas/appsscript.json to Google Apps Script
npm run clasp:push

# 4. Open the script in your browser to authorize MailApp & SpreadsheetApp once
npm run clasp:open
```

Inside the Apps Script editor that opens:
1. Select `setupSheet` in the toolbar dropdown and click **Run** (this prompts you once to authorize Google Sheets + Gmail access for confirmation emails, and creates the `Form Responses 1` and `Guest Contributions` tabs).
2. *(Optional)* Go to **Project Settings (⚙️) > Script Properties** and add `INVITE_KEY` if you want URL-key protection (`?key=...`).
3. Click **Deploy > New deployment > Select type: Web app**:
   - **Execute as**: `Me (vinny.sosa@gmail.com)`
   - **Who has access**: `Anyone`
4. Copy the **Web App URL** (`https://script.google.com/macros/s/.../exec`) and paste it into `GAS_WEB_APP_URL` in [`config.js`](./config.js).

---

## Step 2: Custom Domain Setup (`2026christmas.sosa-life.com`)

The repo already includes the [`CNAME`](./CNAME) file set to `2026christmas.sosa-life.com`.

1. **In your DNS provider for `sosa-life.com`**, add a `CNAME` record:
   - **Type**: `CNAME`
   - **Host / Name**: `2026christmas`
   - **Target / Value**: `vinnysosa.github.io.` *(points to your GitHub username `.github.io`, NOT the repository name)*
   - **TTL**: `Auto` or `3600` (if using Cloudflare, set Proxy status to **DNS Only / Grey Cloud** initially so GitHub can issue the Let's Encrypt TLS certificate).
2. **In GitHub Repository Settings > Pages**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)`
   - **Custom domain**: `2026christmas.sosa-life.com`
   - Check **Enforce HTTPS** once DNS verification completes.

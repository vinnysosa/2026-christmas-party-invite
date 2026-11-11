# Flash Model Build Plan — 2026 Christmas with the Sosa's

> **Target Model**: Gemini Flash
> **Workspace**: `/Users/vinnysosa/Documents/Personal/2026-christmas-party-invite`
> **Goal**: Build a festive, responsive (mobile + desktop) Christmas Party Invite & RSVP Web App hosted on GitHub Pages at **`https://2026christmas.sosa-life.com/invite/`** with a looping animated snow/snowflake holiday background, backed by the already-bootstrapped Google Apps Script (`gas/Code.gs`) and `config.js`.

---

## 0. Mandatory Pre-Step & Terminology Rules for Flash Model

Before writing any HTML, CSS, or JS:
1. Ensure `/opt/homebrew/bin` is on `PATH` when running CLI tools.
2. Consult the `modern-web-guidance` skill (if enabled) or follow the explicit Modern Web Rules in Section 3 below.
3. **Do NOT modify `CNAME`, `robots.txt`, or `.claspignore`**, and keep `config.js` as the single source of truth for copy, options, and the `GAS_WEB_APP_URL`.
4. **STRICT TERMINOLOGY RULE**: **NEVER** use the words `"pot luck"` or `"potluck"` anywhere on the page or in the UI! This is **not** a pot luck—Vinny & Jonnin provide plenty of food and dessert for everyone, plus Bogle Merlot and a Chardonnay. Always refer to optional items guests choose to bring as **"Drinks, Dishes, or Treats"** (e.g., *"Drinks, Dishes, or Treats Guests Are Bringing"*).
5. **WHITE ELEPHANT RULE**: Explicitly display the announcement that **we will be doing the White Elephant gift exchange again this year just like last year**, that we need to know who is participating on the RSVP, that the **average gift value should be no more than $40**, and link to the White Elephant rules page (`https://www.whiteelephantrules.com/`) for the uninitiated.
6. **SUBPATH & NO-INDEX RULE**:
   - The real party invite and RSVP page **must live at `invite/index.html`** (served at `/invite/`), NOT at the root `/index.html`.
   - Include `<meta name="robots" content="noindex, nofollow, noarchive">` in `<head>` of both `/index.html` and `/invite/index.html`. Do **not** generate a `sitemap.xml`.
   - Create a minimal root `/index.html` that simply shows the holiday snow background and a polite message (*"🎄 Happy Holidays! Please use the personal invitation link sent to you to view party details and RSVP."*) with no address or RSVP form exposed at `/`.

---

## 1. What Is Already Bootstrapped in This Repo

- [`config.js`](./config.js): Exposes `window.PARTY_CONFIG` containing:
  - `GAS_WEB_APP_URL`: Web App endpoint (defaults to `'REPLACE_WITH_DEPLOYED_GAS_WEB_APP_URL'`, which triggers automatic `localStorage` mock mode for local testing).
  - `EVENT`: Title, subtitle, date (`Saturday, December 5, 2026 @ 6:00 PM`), UTC ISO timestamps (`20261205T230000Z` / `20261206T040000Z`), address (`8700 Green Apple Court, Wake Forest, NC`), Google Maps URL, White Elephant announcement, `$40` max average gift value, White Elephant rules webpage (`https://www.whiteelephantrules.com/`), video URL, and hosts' note about Bogle Merlot, Chardonnay, and minimizing food waste.
  - `BRINGING_OPTIONS` (including Drinks, Appetizers, Dishes, Desserts/Treats, or Nothing) & `WHITE_ELEPHANT_OPTIONS`.
  - `FAQS`: The 3 FAQ cards from the 2025 Google Site updated for 2026.
- [`robots.txt`](./robots.txt): Blocks all search engine crawlers (`Disallow: /`) with no sitemap.
- [`gas/Code.gs`](./gas/Code.gs) & [`gas/appsscript.json`](./gas/appsscript.json):
  - Complete Google Apps Script backend with `setupSheet()`, `doGet(e)`, `doPost(e)`, `isAuthorizedRequest()`, and `sendConfirmationEmail(rsvp)`.
  - Manages two tabs in the bound Google Sheet:
    1. `Form Responses 1` (Timestamp, Email Address, Your Name, Will you be attending?, How many in your party?, Bringing Category (Drink / Dish / Treat), Specific Drink, Dish, or Treat Details, Participating in White Elephant? ($40 max avg), Notes / Dietary Needs)
    2. `Guest Contributions` (Guest / Family, Category, Drink, Dish, or Treat Description)

---

## 2. Files for the Flash Model to Create

You need to create **4 files**:

1. `index.html` (Root decoy page at `/`) — Minimal holiday greeting card with `<meta name="robots" content="noindex, nofollow, noarchive">` and the falling snow background, reminding visitors to use their direct invitation link.
2. `invite/index.html` — The main Christmas Party Invite, White Elephant announcement callout, progressive 2-step RSVP form (emulating the 2025 Google Form flow), FAQ section, and live **Drinks, Dishes, or Treats Guests Are Bringing** list. Loads `../config.js`, `./styles.css`, and `./app.js`.
3. `invite/styles.css` — Mobile-first festive holiday stylesheet with a rich winter night/crimson-evergreen background and smooth frosted-glass/warm-cream cards over the animated snow backdrop.
4. `invite/app.js` — Client-side logic:
   - Renders the **60fps mobile-friendly looping snowfall & drifting large snowflakes animation** (`<canvas id="snow-canvas">`).
   - Reads `window.PARTY_CONFIG` and optional `?key=` URL query parameter (`new URLSearchParams(window.location.search).get('key')`) to pass `inviteKey` if configured in GAS Script Properties.
   - Implements the conditional RSVP form behavior (when "Will you be attending?" is `"Yes"`, reveal the "RSVP Details" section; when `"No"`, hide "RSVP Details" and allow immediate submission, matching the 2025 Google Form).
   - Submits RSVP via `fetch(GAS_WEB_APP_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })` (or saves to `localStorage` if `GAS_WEB_APP_URL` starts with `'REPLACE_'`).
   - Renders the confirmation state with:
     - **"Add to Google Calendar"** button
     - **"Download Apple / Outlook Calendar (.ics)"** button (generated client-side via `Blob`)
   - Fetches and renders the live **Drinks, Dishes, or Treats Guests Are Bringing** list from `GET ${GAS_WEB_APP_URL}` (with `localStorage` fallback in mock mode).

---

## 3. Exact Specification for Each File

### File 1: `invite/index.html`

Include `<meta name="robots" content="noindex, nofollow, noarchive">`, Google Fonts (`Plus Jakarta Sans` or `PT Sans` + `Satisfy` or `Playfair Display`), and load `../config.js` before `./app.js`.

Required Sections & DOM IDs:
0. **Animated Holiday Snow Background (`<canvas id="snow-canvas" aria-hidden="true"></canvas>`)**:
   - Fixed full-viewport background layer (`position: fixed; inset: 0; pointer-events: none; z-index: 0`) rendering a continuous, gentle loop of both small falling snow particles and larger detailed 6-point snowflakes drifting and slowly rotating in the background on mobile and desktop.

1. **Hero Banner (`<header class="hero">`)**:
   - Eyebrow badge: `Saturday, December 5, 2026 • 6:00 PM`
   - Heading (`#event-title`): `2026 Christmas with the Sosa's`
   - Subtitle (`#event-subtitle`): *"We celebrate Christmas so that's our anchor holiday, but if you're invited, you're welcome no matter how you ring in the season."*
   - Location link (`#event-location`): `📍 8700 Green Apple Court, Wake Forest, NC` (links to Google Maps)
   - **White Elephant Highlight Banner (`#white-elephant-banner`)**:
     - Clearly announces: *"🎁 We will be doing our White Elephant gift exchange again this year just like last year! Please let us know in your RSVP below if you'll be participating. Average gift value should be no more than $40."*
     - Includes a link to the instructions page for the uninitiated: `<a href="https://www.whiteelephantrules.com/" target="_blank" rel="noopener">New to White Elephant? Read how it works →</a>`
   - Quick jump buttons: `RSVP Below` (`#jump-rsvp`) and `See Drinks, Dishes & Treats` (`#jump-contributions`).

2. **RSVP Card (`<section id="rsvp-section" class="card">`)**:
   - Form `<form id="rsvp-form" novalidate>`:
     - Hidden honeypot input (`<input type="text" name="website" tabindex="-1" autocomplete="off" hidden>`) for bot protection.
     - **Step 1 (Always visible)**:
       - `name` (`<input type="text" id="rsvp-name" name="name" required autocomplete="name">`): Label `"Your Name *"`
       - `email` (`<input type="email" id="rsvp-email" name="email" required autocomplete="email">`): Label `"Email Address *"` (helper text: *"We'll send you a calendar invite & confirmation"*)
       - `attending` (Radio group `name="attending"` required): Label `"Will you be attending? *"`
         - Option `"Yes"` (`#attending-yes`)
         - Option `"No"` (`#attending-no`)
     - **Step 2 (`<fieldset id="rsvp-details-section" hidden>`)** — Shown dynamically when `attending === "Yes"`:
       - Section header: `"RSVP Details"`
       - `partySize` (`<select id="rsvp-party-size" name="partySize">`): Label `"How many in your party? *"`, options `1`, `2`, `3`, `4`, `5`, `6+`.
       - `whiteElephant` (Radio group `name="whiteElephant"`): Label `"Participating in the White Elephant Gift Exchange? We're doing it again this year! Average gift value of no more than $40. (See FAQ & rules link for details)"`
         - `"Yes - Holiday fun is my middle name! 🎉"`
         - `"No - I'll miss out on the fun 😭"`
       - **Food & Drink Callout Banner**: Display `window.PARTY_CONFIG.EVENT.hostsNote` highlighting that **Bogle Merlot** and **Chardonnay** plus plenty of food will be served, that **no one needs to bring anything**, and that letting us know if you'd like to bring your favorite wine, punch, beer, dish, or treat helps us plan accordingly and minimize food waste.
       - `bringingCategories` (Checkbox group `name="bringingCategories"`):
         - `"Favorite Wine, Punch, or Beer (We will have Bogle Merlot & Chardonnay!)"`
         - `"Appetizer / Hors d'oeuvres"`
         - `"Dish (Side or Main)"`
         - `"Dessert / Sweet Treat"`
         - `"Nothing — just bringing ourselves! (Plenty of food provided)"`
       - `bringingDetails` (`<input type="text" id="rsvp-bringing-details" name="bringingDetails" placeholder="e.g., Cabernet, Craft Beer, Mac & Cheese, Holiday Cookies...">`): Label `"If you'd like to bring a drink, dish, or treat, what are you thinking of bringing? (Optional)"`
       - `notes` (`<textarea id="rsvp-notes" name="notes" rows="2" placeholder="Any allergies, dietary restrictions, or notes for Jonnin & Vinny?">`): Label `"Dietary Needs or Notes (Optional)"`
     - **Submit Button (`<button type="submit" id="rsvp-submit-btn">`)**:
       - Shows loading spinner while submitting; disabled during in-flight request to prevent double submits.
   - **Confirmation Panel (`<div id="rsvp-confirmation" hidden>`)**:
     - Displays the confirmation message (`"Thanks for letting us know! We'll see you there otherwise we wish you the happiest seasons greetings and a Merry Christmas!"`).
     - If `attending === "Yes"`, shows two calendar buttons:
       - `<a id="btn-google-cal" target="_blank" rel="noopener">📅 Add to Google Calendar</a>`
       - `<button type="button" id="btn-ics-cal">🍎 Add to Apple / Outlook Calendar (.ics)</button>`
     - Button to submit another response (`#btn-reset-form`).

3. **Frequently Asked Questions (`<section id="faq-section" class="card">`)**:
   - Render the 3 FAQs from `window.PARTY_CONFIG.FAQS` using semantic `<details>` / `<summary>` accordions (open by default on desktop, collapsible on mobile), including both the **Official White Elephant Rules webpage** (`https://www.whiteelephantrules.com/`) and the overview video (`https://youtube.com/shorts/f4T9XBq3QkI`) under *"What's a White Elephant?"*.

4. **Live Drinks, Dishes, or Treats Guests Are Bringing (`<section id="contributions-section" class="card">`)**:
   - Heading: `"Drinks, Dishes, or Treats Guests Are Bringing"`
   - Subtitle explaining: *"You don't need to bring a thing—we'll have plenty of food, Bogle Merlot, and Chardonnay! If you wish to bring a favorite drink, dish, or treat, here's what others have mentioned so far so we can minimize food waste:"*
   - Filter pills or category badges (`All`, `Wine / Drinks`, `Appetizer`, `Dish`, `Dessert / Treat`).
   - Responsive table/card list (`#contributions-list`) showing **Guest / Family**, **Category**, and **Drink, Dish, or Treat Description** (never expose email addresses).
   - Refresh button (`#btn-refresh-contributions`).

---

### File 2: `invite/styles.css`

Follow these CSS best practices:
- **Holiday Backdrop & Looping Snow**:
  - Set `body` background to a rich festive radial/linear gradient (deep midnight evergreen `#0b2919` blending into warm holiday crimson `#4a0e13` and gold bokeh highlights) fixed to the viewport so mobile scrolling glides smoothly over the falling snow canvas.
  - Cards (`.card`) should use warm cream (`rgba(253, 251, 247, 0.94)`) with subtle gold/crimson borders and soft elevation so text contrast is crisp and legible over the snow animation.
- **Mobile-first**: Touch targets at least `44px × 44px` (`min-height: 2.75rem`) for radio buttons, checkboxes, inputs, and buttons so mobile guests never mis-tap.
- **Prevent iOS Zoom on Focus**: Set `font-size: 1rem` (`16px`) on all `<input>`, `<select>`, and `<textarea>` elements.
- **Smooth Progressive Disclosure**: Style radio/checkbox option cards with `:has(input:checked)` so selected options highlight with a warm festive border and background.
- **Responsive Layout**: Max container width `720px` centered with `padding: clamp(1rem, 4vw, 2rem)`.

---

### File 3: `invite/app.js`

Critical implementation rules for `invite/app.js`:
1. **Mobile-Optimized Looping Snowfall & Large Drifting Snowflakes (`initSnowBackground()`)**:
   - Render a `<canvas id="snow-canvas">` animation loop via `requestAnimationFrame` combining:
     - ~45 soft falling snow dots (varying opacity `0.3`–`0.8` and gentle horizontal sine-wave sway)
     - ~12 larger drawn or glyph snowflakes (`❄`, `❅`, `❆`, sizes `16px`–`32px`, translucent white/gold) slowly rotating and drifting across the background on an infinite loop.
   - Handle `window.resize` with `devicePixelRatio` scaling so snowflakes look crisp on Retina iPhones.
2. **No CORS Preflight on Google Apps Script**:
   When `POST`ing to `GAS_WEB_APP_URL`, **always** use:
   ```js
   const urlParams = new URLSearchParams(window.location.search);
   payload.inviteKey = urlParams.get('key') || '';

   const response = await fetch(window.PARTY_CONFIG.GAS_WEB_APP_URL, {
     method: 'POST',
     headers: { 'Content-Type': 'text/plain;charset=utf-8' },
     body: JSON.stringify(payload)
   });
   const result = await response.json();
   ```
   *(Using `application/json` triggers an `OPTIONS` preflight request which Google Apps Script Web Apps do not support.)*
3. **Client-Side `.ics` Generator**:
   Generate a valid `text/calendar;charset=utf-8` blob for `20261205T230000Z` to `20261206T040000Z` with `SUMMARY:2026 Christmas with the Sosa's` and `LOCATION:8700 Green Apple Court\, Wake Forest\, NC` so iPhone/Apple Calendar users can add the event in one tap.
4. **Automatic Mock Mode**:
   When `window.PARTY_CONFIG.GAS_WEB_APP_URL.startsWith('REPLACE_')`, store submitted RSVPs in `localStorage.getItem('sosa_2026_rsvps')` and display a small dev banner (`"Local Preview Mode — Connect GAS_WEB_APP_URL in config.js for live Google Sheet sync"`) only on `localhost` / `127.0.0.1`.

---

## 4. Verification Checklist for the Flash Model

1. Start local server: `python3 -m http.server 8080` and open `http://localhost:8080/invite/`
2. Confirm that the words `"pot luck"` or `"potluck"` do not appear anywhere on the page, and that `"Drinks, Dishes, or Treats"` is used.
3. Confirm that the holiday background renders smooth, looping falling snow and drifting large snowflakes on mobile viewport (`390×844`).
4. Confirm that the White Elephant section states an average gift value of **no more than $40** and links to `https://www.whiteelephantrules.com/`.
5. Verify that selecting **"Yes"** under *"Will you be attending?"* reveals the **RSVP Details** fieldset, and selecting **"No"** hides it.
6. Submit a test RSVP with `"Yes"`, party size `2`, White Elephant `"Yes"`, and bringing `"Cabernet Sauvignon"`, and verify:
   - Confirmation view appears with working Google Calendar and `.ics` download buttons.
   - The new item immediately appears in the **Drinks, Dishes, or Treats Guests Are Bringing** list at the bottom of the page.
7. Commit and push to GitHub (`origin main`).

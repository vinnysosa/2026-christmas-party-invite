/**
 * 2026 Christmas with the Sosa's — Google Apps Script Backend
 * Bound to the 2026 Christmas Party RSVP Google Sheet.
 *
 * Tabs managed by this script:
 * 1. "Form Responses 1" — Full RSVP records (private to hosts)
 * 2. "Guest Contributions" — Public-safe list of drinks, dishes, or treats guests are bringing
 *
 * Optional Security (Script Properties):
 * If you set a Script Property named `INVITE_KEY` in the Apps Script settings
 * (Project Settings > Script Properties), `doPost` and `doGet` will require
 * `?key=<INVITE_KEY>` (or `inviteKey` in the JSON body) to match.
 * Because Script Properties live on Google's servers, the secret is NEVER in GitHub.
 */

const SHEET_RESPONSES = 'Form Responses 1';
const SHEET_CONTRIBUTIONS = 'Guest Contributions';

const EVENT_CONFIG = {
  title: "2026 Christmas with the Sosa's",
  dateText: 'Saturday, December 5, 2026 @ 6:00 PM EST',
  startIso: '20261205T230000Z', // 6:00 PM EST (UTC-5)
  endIso: '20261206T040000Z',   // 11:00 PM EST (UTC-5)
  location: '8700 Green Apple Court, Wake Forest, NC',
  siteUrl: 'https://2026christmas.sosa-life.com/invite/'
};

/**
 * Verifies optional INVITE_KEY if configured in Script Properties.
 * If INVITE_KEY is not set in Script Properties, requests are allowed through.
 */
function isAuthorizedRequest(providedKey) {
  const expectedKey = PropertiesService.getScriptProperties().getProperty('INVITE_KEY');
  if (!expectedKey) {
    return true;
  }
  return String(providedKey || '').trim() === String(expectedKey).trim();
}

/**
 * Run once from the Apps Script editor (or automatically on first request)
 * to ensure both tabs and headers exist and match the 2026 schema.
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  let responsesSheet = ss.getSheetByName(SHEET_RESPONSES);
  if (!responsesSheet) {
    responsesSheet = ss.insertSheet(SHEET_RESPONSES);
  }
  if (responsesSheet.getLastRow() === 0) {
    responsesSheet.appendRow([
      'Timestamp',
      'Email Address',
      'Your Name',
      'Will you be attending?',
      'How many in your party?',
      'Bringing Category (Drink / Dish / Treat)',
      'Specific Drink, Dish, or Treat Details',
      'Participating in White Elephant? ($40 max avg)',
      'Notes / Dietary Needs'
    ]);
    responsesSheet.getRange(1, 1, 1, 9).setFontWeight('bold');
    responsesSheet.setFrozenRows(1);
  }

  let contributionsSheet = ss.getSheetByName(SHEET_CONTRIBUTIONS);
  if (!contributionsSheet) {
    contributionsSheet = ss.insertSheet(SHEET_CONTRIBUTIONS);
  }
  if (contributionsSheet.getLastRow() === 0) {
    contributionsSheet.appendRow([
      'Guest / Family',
      'Category',
      'Drink, Dish, or Treat Description'
    ]);
    contributionsSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    contributionsSheet.setFrozenRows(1);
  }
}

/**
 * GET endpoint: returns public guest contribution list so guests can see
 * what drinks, dishes, or treats others are bringing (without exposing guest email addresses).
 */
function doGet(e) {
  try {
    const providedKey = e && e.parameter ? e.parameter.key : '';
    if (!isAuthorizedRequest(providedKey)) {
      return jsonResponse({ ok: false, error: 'Invalid or missing invite key.' });
    }

    setupSheet();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const contributionsSheet = ss.getSheetByName(SHEET_CONTRIBUTIONS);
    const lastRow = contributionsSheet.getLastRow();

    const contributions = [];
    if (lastRow > 1) {
      const values = contributionsSheet.getRange(2, 1, lastRow - 1, 3).getValues();
      for (let i = 0; i < values.length; i++) {
        const [guestName, category, itemDescription] = values[i];
        if (category || itemDescription) {
          contributions.push({
            guestName: String(guestName || '').trim(),
            category: String(category || '').trim(),
            itemDescription: String(itemDescription || '').trim()
          });
        }
      }
    }

    return jsonResponse({
      ok: true,
      contributions: contributions
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

/**
 * POST endpoint: records an RSVP in "Form Responses 1", appends any optional
 * drink, dish, or treat item to "Guest Contributions", and sends an HTML confirmation
 * email with calendar links if an email address was provided.
 *
 * Note: Client sends Content-Type: text/plain;charset=utf-8 to avoid CORS preflight
 * blocks on script.google.com.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    setupSheet();
    const rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    const data = JSON.parse(rawBody);

    // Honeypot check against automated bots
    if (data.website) {
      return jsonResponse({ ok: true, message: 'Thanks!' });
    }

    if (!isAuthorizedRequest(data.inviteKey)) {
      return jsonResponse({ ok: false, error: 'Invalid or missing party invite key.' });
    }

    const name = String(data.name || '').trim();
    const email = String(data.email || '').trim();
    const attending = String(data.attending || '').trim();
    const partySize = attending === 'Yes' ? Number(data.partySize || 1) : 0;
    const bringingCategories = Array.isArray(data.bringingCategories)
      ? data.bringingCategories.join(', ')
      : String(data.bringingCategories || '').trim();
    const bringingDetails = String(data.bringingDetails || '').trim();
    const whiteElephant = attending === 'Yes' ? String(data.whiteElephant || '').trim() : '';
    const notes = String(data.notes || '').trim();

    if (!name || !attending) {
      return jsonResponse({ ok: false, error: 'Name and attendance selection are required.' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const responsesSheet = ss.getSheetByName(SHEET_RESPONSES);
    const timestamp = new Date();

    responsesSheet.appendRow([
      timestamp,
      email,
      name,
      attending,
      partySize || '',
      bringingCategories,
      bringingDetails,
      whiteElephant,
      notes
    ]);

    const isBringingSomething =
      attending === 'Yes' &&
      ((bringingCategories && !bringingCategories.startsWith('Nothing')) || bringingDetails);

    if (isBringingSomething) {
      const contributionsSheet = ss.getSheetByName(SHEET_CONTRIBUTIONS);
      contributionsSheet.appendRow([
        name,
        bringingCategories || 'Drink, Dish, or Treat',
        bringingDetails || bringingCategories
      ]);
    }

    let emailSent = false;
    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      try {
        sendConfirmationEmail({
          name: name,
          email: email,
          attending: attending,
          partySize: partySize,
          bringingCategories: bringingCategories,
          bringingDetails: bringingDetails,
          whiteElephant: whiteElephant
        });
        emailSent = true;
      } catch (mailErr) {
        console.error('Failed to send confirmation email:', mailErr);
      }
    }

    return jsonResponse({
      ok: true,
      emailSent: emailSent,
      message:
        "Thanks for letting us know! We'll see you there otherwise we wish you the happiest seasons greetings and a Merry Christmas!"
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Sends an HTML confirmation email to the guest with an Add to Google Calendar link.
 */
function sendConfirmationEmail(rsvp) {
  const gcalUrl =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(EVENT_CONFIG.title) +
    '&dates=' + encodeURIComponent(EVENT_CONFIG.startIso + '/' + EVENT_CONFIG.endIso) +
    '&location=' + encodeURIComponent(EVENT_CONFIG.location) +
    '&details=' + encodeURIComponent('RSVP & Event Details: ' + EVENT_CONFIG.siteUrl);

  const subject =
    rsvp.attending === 'Yes'
      ? "🎄 You're RSVP'd: 2026 Christmas with the Sosa's (Sat, Dec 5 @ 6pm)"
      : "🎄 Thanks for letting us know — 2026 Christmas with the Sosa's";

  const htmlBody =
    rsvp.attending === 'Yes'
      ? `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#8b1e24;margin-top:0;">🎄 We can't wait to celebrate with you, ${escapeHtml(rsvp.name)}!</h2>
          <p>Thanks for RSVPing <strong>Yes</strong> to <strong>${escapeHtml(EVENT_CONFIG.title)}</strong>.</p>
          <ul style="line-height:1.7;">
            <li><strong>When:</strong> ${escapeHtml(EVENT_CONFIG.dateText)}</li>
            <li><strong>Where:</strong> ${escapeHtml(EVENT_CONFIG.location)}</li>
            <li><strong>Party Size:</strong> ${escapeHtml(String(rsvp.partySize))}</li>
            <li><strong>White Elephant ($40 max avg value):</strong> ${escapeHtml(rsvp.whiteElephant || 'Not specified')}</li>
            <li><strong>Bringing (Optional):</strong> ${escapeHtml(
              [rsvp.bringingCategories, rsvp.bringingDetails].filter(Boolean).join(' — ') ||
                'Nothing needed — we have plenty of food, Bogle Merlot, and Chardonnay!'
            )}</li>
          </ul>
          <p style="margin:24px 0;">
            <a href="${gcalUrl}" style="background:#166534;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
              📅 Add to Google Calendar
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">
            View the FAQ or Drinks, Dishes, or Treats list anytime at <a href="${EVENT_CONFIG.siteUrl}">${EVENT_CONFIG.siteUrl}</a>.
          </p>
        </div>`
      : `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#8b1e24;margin-top:0;">🎄 Happy Holidays, ${escapeHtml(rsvp.name)}!</h2>
          <p>Thanks for letting us know you won't be able to make it this year. We'll miss you and wish you the happiest season's greetings and a Merry Christmas!</p>
        </div>`;

  MailApp.sendEmail({
    to: rsvp.email,
    subject: subject,
    htmlBody: htmlBody
  });
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON
  );
}

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
  dateText: 'Saturday, December 5, 2026 @ 5:00 PM EST',
  startIso: '20261205T220000Z', // 5:00 PM EST (UTC-5)
  endIso: '20261206T030000Z',   // 10:00 PM EST (UTC-5)
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
 * Builds the invite URL with optional ?key= and ?edit= query parameters.
 */
function buildInviteUrl(editToken) {
  const expectedKey = PropertiesService.getScriptProperties().getProperty('INVITE_KEY');
  const params = [];
  if (expectedKey) {
    params.push('key=' + encodeURIComponent(String(expectedKey).trim()));
  }
  if (editToken) {
    params.push('edit=' + encodeURIComponent(String(editToken).trim()));
  }
  return params.length ? EVENT_CONFIG.siteUrl + '?' + params.join('&') : EVENT_CONFIG.siteUrl;
}

/**
 * Run once from the Apps Script editor (or automatically on first request)
 * to ensure both tabs and headers exist and match the 2026 schema (including Edit Token).
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
      'Notes / Dietary Needs',
      'Edit Token'
    ]);
    responsesSheet.getRange(1, 1, 1, 10).setFontWeight('bold');
    responsesSheet.setFrozenRows(1);
  } else if (responsesSheet.getLastColumn() < 10) {
    responsesSheet.getRange(1, 10).setValue('Edit Token').setFontWeight('bold');
  }

  let contributionsSheet = ss.getSheetByName(SHEET_CONTRIBUTIONS);
  if (!contributionsSheet) {
    contributionsSheet = ss.insertSheet(SHEET_CONTRIBUTIONS);
  }
  if (contributionsSheet.getLastRow() === 0) {
    contributionsSheet.appendRow([
      'Guest / Family',
      'Category',
      'Drink, Dish, or Treat Description',
      'Edit Token'
    ]);
    contributionsSheet.getRange(1, 1, 1, 4).setFontWeight('bold');
    contributionsSheet.setFrozenRows(1);
  } else if (contributionsSheet.getLastColumn() < 4) {
    contributionsSheet.getRange(1, 4).setValue('Edit Token').setFontWeight('bold');
  }
}

/**
 * Finds an existing RSVP row (1-based sheet row index) by editToken or email.
 */
function findResponseRow(responsesSheet, editToken, email) {
  const lastRow = responsesSheet.getLastRow();
  if (lastRow <= 1) return -1;

  const numCols = Math.max(responsesSheet.getLastColumn(), 10);
  const rows = responsesSheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  const normToken = String(editToken || '').trim();
  const normEmail = String(email || '').trim().toLowerCase();

  if (normToken) {
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][9] || '').trim() === normToken) {
        return i + 2;
      }
    }
  }

  if (normEmail) {
    for (let i = rows.length - 1; i >= 0; i--) {
      if (String(rows[i][1] || '').trim().toLowerCase() === normEmail) {
        return i + 2;
      }
    }
  }

  return -1;
}

/**
 * Finds an existing row in Guest Contributions by editToken (or fallback by guestName).
 */
function findContributionRow(contributionsSheet, editToken, guestName) {
  const lastRow = contributionsSheet.getLastRow();
  if (lastRow <= 1) return -1;

  const numCols = Math.max(contributionsSheet.getLastColumn(), 4);
  const rows = contributionsSheet.getRange(2, 1, lastRow - 1, numCols).getValues();
  const normToken = String(editToken || '').trim();
  const normName = String(guestName || '').trim().toLowerCase();

  if (normToken) {
    for (let i = 0; i < rows.length; i++) {
      if (String(rows[i][3] || '').trim() === normToken) {
        return i + 2;
      }
    }
  }

  if (normName) {
    for (let i = rows.length - 1; i >= 0; i--) {
      const rowToken = String(rows[i][3] || '').trim();
      if (!rowToken && String(rows[i][0] || '').trim().toLowerCase() === normName) {
        return i + 2;
      }
    }
  }

  return -1;
}

/**
 * GET endpoint:
 * - Always returns the public list of drinks, dishes, or treats guests are bringing (no emails).
 * - If `?edit=<EDIT_TOKEN>` is supplied, also returns that single guest's RSVP for editing.
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

    let rsvp = null;
    const editToken = e && e.parameter ? String(e.parameter.edit || '').trim() : '';
    if (editToken) {
      const responsesSheet = ss.getSheetByName(SHEET_RESPONSES);
      const rowIndex = findResponseRow(responsesSheet, editToken, '');
      if (rowIndex > 1) {
        const row = responsesSheet.getRange(rowIndex, 1, 1, 10).getValues()[0];
        const rawCategories = String(row[5] || '').trim();
        rsvp = {
          editToken: String(row[9] || editToken).trim(),
          email: String(row[1] || '').trim(),
          name: String(row[2] || '').trim(),
          attending: String(row[3] || '').trim(),
          partySize: row[4] ? String(row[4]).trim() : '',
          bringingCategories: rawCategories
            ? rawCategories.split(',').map((s) => s.trim()).filter(Boolean)
            : [],
          bringingDetails: String(row[6] || '').trim(),
          whiteElephant: String(row[7] || '').trim(),
          notes: String(row[8] || '').trim()
        };
      }
    }

    return jsonResponse({
      ok: true,
      contributions: contributions,
      rsvp: rsvp
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: err && err.message ? err.message : String(err)
    });
  }
}

/**
 * POST endpoint: records or updates an RSVP in "Form Responses 1", syncs any optional
 * drink, dish, or treat item in "Guest Contributions" (removing it if canceled or cleared),
 * and sends an HTML confirmation email with calendar & edit links.
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
    const requestedToken = String(data.editToken || '').trim();

    if (!name || !attending) {
      return jsonResponse({ ok: false, error: 'Name and attendance selection are required.' });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const responsesSheet = ss.getSheetByName(SHEET_RESPONSES);
    const contributionsSheet = ss.getSheetByName(SHEET_CONTRIBUTIONS);
    const timestamp = new Date();

    const existingRowIndex = findResponseRow(responsesSheet, requestedToken, email);
    let editToken = requestedToken;
    let isUpdate = false;
    let previousName = name;

    if (existingRowIndex > 1) {
      isUpdate = true;
      const existingRow = responsesSheet.getRange(existingRowIndex, 1, 1, 10).getValues()[0];
      previousName = String(existingRow[2] || name).trim();
      editToken = String(existingRow[9] || editToken || Utilities.getUuid()).trim();

      responsesSheet.getRange(existingRowIndex, 1, 1, 10).setValues([
        [
          timestamp,
          email,
          name,
          attending,
          partySize || '',
          attending === 'Yes' ? bringingCategories : '',
          attending === 'Yes' ? bringingDetails : '',
          whiteElephant,
          attending === 'Yes' ? notes : '',
          editToken
        ]
      ]);
    } else {
      editToken = Utilities.getUuid();
      responsesSheet.appendRow([
        timestamp,
        email,
        name,
        attending,
        partySize || '',
        attending === 'Yes' ? bringingCategories : '',
        attending === 'Yes' ? bringingDetails : '',
        whiteElephant,
        attending === 'Yes' ? notes : '',
        editToken
      ]);
    }

    const isBringingSomething =
      attending === 'Yes' &&
      ((bringingCategories && !bringingCategories.startsWith('Nothing')) || bringingDetails);

    const contribRowIndex = findContributionRow(contributionsSheet, editToken, previousName);
    if (isBringingSomething) {
      const contribValues = [
        name,
        bringingCategories || 'Drink, Dish, or Treat',
        bringingDetails || bringingCategories,
        editToken
      ];
      if (contribRowIndex > 1) {
        contributionsSheet.getRange(contribRowIndex, 1, 1, 4).setValues([contribValues]);
      } else {
        contributionsSheet.appendRow(contribValues);
      }
    } else if (contribRowIndex > 1) {
      contributionsSheet.deleteRow(contribRowIndex);
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
          whiteElephant: whiteElephant,
          editToken: editToken,
          isUpdate: isUpdate
        });
        emailSent = true;
      } catch (mailErr) {
        console.error('Failed to send confirmation email:', mailErr);
      }
    }

    const message =
      attending === 'No'
        ? isUpdate
          ? "Your RSVP has been updated to No. We'll miss you and wish you the happiest seasons greetings and a Merry Christmas!"
          : "Thanks for letting us know! We'll miss you this year and wish you the happiest seasons greetings and a Merry Christmas!"
        : isUpdate
          ? "Your RSVP changes have been saved! Can't wait to celebrate with you on December 5th!"
          : "Thanks for letting us know! We'll see you there otherwise we wish you the happiest seasons greetings and a Merry Christmas!";

    return jsonResponse({
      ok: true,
      updated: isUpdate,
      editToken: editToken,
      emailSent: emailSent,
      message: message
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
 * Sends an HTML confirmation email to the guest with Add to Google Calendar
 * and Edit / Cancel RSVP links.
 */
function sendConfirmationEmail(rsvp) {
  const inviteLink = buildInviteUrl('');
  const editLink = buildInviteUrl(rsvp.editToken);

  const gcalUrl =
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    '&text=' + encodeURIComponent(EVENT_CONFIG.title) +
    '&dates=' + encodeURIComponent(EVENT_CONFIG.startIso + '/' + EVENT_CONFIG.endIso) +
    '&location=' + encodeURIComponent(EVENT_CONFIG.location) +
    '&details=' + encodeURIComponent('RSVP & Event Details: ' + inviteLink);

  const subject =
    rsvp.attending === 'Yes'
      ? rsvp.isUpdate
        ? "🎄 RSVP Updated: 2026 Christmas with the Sosa's (Sat, Dec 5 @ 5pm)"
        : "🎄 You're RSVP'd: 2026 Christmas with the Sosa's (Sat, Dec 5 @ 5pm)"
      : "🎄 RSVP Received — 2026 Christmas with the Sosa's";

  const htmlBody =
    rsvp.attending === 'Yes'
      ? `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#8b1e24;margin-top:0;">🎄 ${rsvp.isUpdate ? 'Your RSVP is updated' : "We can't wait to celebrate with you"}, ${escapeHtml(rsvp.name)}!</h2>
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
            <a href="${gcalUrl}" style="background:#166534;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-right:8px;margin-bottom:8px;">
              📅 Add to Google Calendar
            </a>
            <a href="${editLink}" style="background:#ffffff;color:#8b1e24;border:1.5px solid #8b1e24;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;margin-bottom:8px;">
              ✏️ Update or Cancel RSVP
            </a>
          </p>
          <p style="color:#6b7280;font-size:13px;">
            Need to change your party size, dish, or cancel later? Use the <em>Update or Cancel RSVP</em> button above or visit <a href="${inviteLink}">${inviteLink}</a>.
          </p>
        </div>`
      : `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#8b1e24;margin-top:0;">🎄 Happy Holidays, ${escapeHtml(rsvp.name)}!</h2>
          <p>Thanks for letting us know you won't be able to make it this year. We'll miss you and wish you the happiest season's greetings and a Merry Christmas!</p>
          <p style="margin:20px 0;">
            <a href="${editLink}" style="background:#ffffff;color:#8b1e24;border:1.5px solid #8b1e24;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
              ✏️ Plans changed? Update Your RSVP
            </a>
          </p>
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

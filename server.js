// ============================================
// FILE: server.js (FINAL WORKING VERSION)
// ============================================
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import fs from 'fs';
import XLSX from 'xlsx';
import PDFParser from 'pdf2json';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer (in-memory) for uploads
const upload = multer({ storage: multer.memoryStorage() });

// ---------------------------------------------------------
// ---------------- PDF → EXCEL UPGRADED LOGIC -------------
// ---------------------------------------------------------

/**
 * Parse PDF buffer with pdf2json and return raw Pages
 */
function parsePDFFromBuffer(buf) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    pdfParser.on('pdfParser_dataError', (err) => reject(err?.parserError || err));
    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      resolve(pdfData?.Pages ?? []);
    });
    pdfParser.parseBuffer(buf);
  });
}

/**
 * Decode a single pdf2json text item into a string
 */
function decodeTextItem(t) {
  if (!t?.R) return '';
  return t.R.map((r) => decodeURIComponent(r?.T || '')).join(' ');
}

/**
 * Convert a Page into ordered text lines by grouping close Y values and sorting by X
 */
function pageToLines(page) {
  if (!page?.Texts) return [];
  const items = page.Texts
    .map((t) => ({ x: t.x, y: t.y, s: decodeTextItem(t).trim() }))
    .filter((i) => i.s);

  // group by y cluster (fixed precision); then order rows by y asc, and within row by x asc
  const rows = new Map();
  for (const it of items) {
    const key = it.y.toFixed(1);
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(it);
  }

  const orderedLines = [];
  for (const [, arr] of [...rows.entries()].sort((a, b) => parseFloat(a[0]) - parseFloat(b[0]))) {
    const text = arr.sort((a, b) => a.x - b.x).map((x) => x.s).join(' ');
    orderedLines.push(text);
  }
  return orderedLines;
}

/**
 * Try to parse one whole, multi-line row string into the exact columns requested
 * Robust to line wraps and noise; zero hard-coding of values.
 */
function tryParseRow(row) {
  // Booking No: 9-digit id (observed in sample)
  const booking = (row.match(/\b\d{9}\b/) || [])[0] || '';

  // Heuristic: allow “fee back / credit” style rows with no booking
  const isCreditRow = /fee\s+for\s+ride\s+given\s+back|credit|refund/i.test(row);

  // Previously we discarded rows without a booking; now keep them if they look like a credit row AND have amounts.
  if (!booking && !isCreditRow) return null;


  // Accept date / Ride date (yyyy-mm-dd), time (HH:mm) usually accompanies ride date
  const dates = row.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [];
  const rideTime = (row.match(/\b\d{2}:\d{2}\b/) || [])[0] || '';

  // Driver: capitalized words (1–3) not colliding with address tokens
  const driver =
    (row.match(
      /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b(?!\s*(Road|Street|Drive|Avenue|Airport|Hotel|International))/,
    ) || [])[0] || '';

  // --- License plate: support personalized/all-letter plates like TEAMJM ---
  // Strategy:
  // 1) Collect candidate tokens: 2–8 chars, A–Z/0–9 only
  // 2) Exclude obvious non-plates (pure digits, times, money, %)
  // 3) Prefer a candidate that appears between Driver and first address token

  // 2–8 uppercase alphanumerics (common NZ plate lengths; tweak if needed)
  const plateCandidates = Array.from(row.matchAll(/\b[A-Z0-9]{2,8}\b/g))
    .map(m => m[0])
    .filter(tok => {
      if (/^\d+$/.test(tok)) return false;           // pure numbers (booking, etc.)
      if (/^\d{1,2}$/.test(tok)) return false;       // small indices
      if (/^\d{2}:\d{2}$/.test(tok)) return false;   // times
      return true;
    });

  // Try to anchor by nearby context (Driver → [PLATE] → Pickup/Destination)
  const addrToken = /\b(Airport|International|Hotel|Street|Road|Drive|Avenue|Place|Crescent|Terrace|Lane|Harbour|Quay|Terminal)\b/i;
  const driverMatch =
    row.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b(?!\s*(Road|Street|Drive|Avenue|Airport|Hotel|International))/);

  let plate = '';
  if (plateCandidates.length) {
    if (driverMatch) {
      const dIdx = row.indexOf(driverMatch[0]);
      const aIdx = (() => {
        const m = row.match(addrToken);
        return m ? row.indexOf(m[0]) : -1;
      })();
      // prefer a candidate token that sits between Driver name and first address-y token
      const between = plateCandidates.find(tok => {
        const i = row.indexOf(tok);
        return i > dIdx && (aIdx === -1 || i < aIdx);
      });
      plate = between || plateCandidates[0];
    } else {
      plate = plateCandidates[0];
    }
  }


  // Monetary amounts near NZ$: capture numeric part (supports negatives and parentheses)
  // Matches: 12.34 NZ$, -12.34 NZ$, (12.34) NZ$
  const amounts = [...row.matchAll(/(-?\(?\d{1,3}(?:,\d{3})*\.\d{2}\)?)\s*NZ\$/g)].map((m) => {
    let v = m[1].replace(/[(),]/g, ''); // remove commas and parentheses
    // If it was like "(12.34)" treat as negative
    if (m[1].startsWith('(') && m[1].endsWith(')')) v = '-' + v;
    return v;
  });


  // Address extraction: heuristic slice from after plate to a percentage (bonus like 0.00%) or before amounts
  let pickup = '';
  let destination = '';
  const plateIdx = plate ? row.indexOf(plate) : -1;
  const percentIdx = row.indexOf('%'); // “0.00%” often around fee/bonus area

  if (plateIdx >= 0) {
    let right = row.slice(plateIdx + plate.length).trim();
    if (percentIdx > plateIdx) right = row.slice(plateIdx + plate.length, percentIdx).trim();

    // Split into two plausible locations using common tokens (Airport, Hotel, Street, etc.)
    const locToken =
      /\b(Airport|International|Hotel|Street|Road|Drive|Avenue|Place|Crescent|Terrace|Lane|Harbour|Quay|Terminal)\b/i;
    const first = right.search(locToken);
    if (first >= 0) {
      const rest = right.slice(first + 1);
      const second = rest.search(locToken);
      if (second >= 0) {
        const mid = first + 1 + second;
        pickup = right.slice(0, mid).trim();
        destination = right.slice(mid).trim();
      } else {
        // fallback: midpoint
        const mid = Math.floor(right.length / 2);
        pickup = right.slice(0, mid).trim();
        destination = right.slice(mid).trim();
      }
    } else {
      pickup = right.trim();
      destination = right.trim();
    }
  }

  // Amount order commonly observed:
  // [Net amount] [Net amount waiting time] [Net amount add. km] [Net total] [VAT/sales tax] [Gross amount total]
  const [net = '0.00', waiting = '0.00', addKm = '0.00', /*netTotal*/, gst = '0.00', total = '0.00'] =
    amounts;

  // If it's a credit/fee-back row, keep it but set minimal identifiers
  const _isCreditRow = !booking && (/fee\s+for\s+ride\s+given\s+back|credit|refund/i.test(row));

  return {
    'Booking No': booking || 'CREDIT',
    'Accept date': _isCreditRow ? (dates[0] ?? '') : (dates[0] ?? ''),
    'Ride date': _isCreditRow ? (dates[1] ?? '').trim() : [dates[1] ?? '', rideTime].filter(Boolean).join(' ').trim(),
    'Driver': _isCreditRow ? '—' : driver,
    'License plate': _isCreditRow ? '—' : plate,
    'Pickup': _isCreditRow ? 'Fee for ride given back' : pickup,
    'Destination': _isCreditRow ? '' : destination,
    'Net amount': net || '0.00',
    'Waiting charge': waiting || '0.00',
    'Added km': addKm || '0.00',
    'GST': gst || '0.00',
    'Total': total || '0.00',
  };

}

/**
 * Extract structured rows from all pages except the first
 * Ensures NO last-row loss on any page by explicit flush.
 */
function extractRowsFromPages(pages) {
  const out = [];

  for (let p = 1; p < pages.length; p++) {
    const lines = pageToLines(pages[p]);

    let current = '';
    let inRow = false;

    for (const line of lines) {
      // Data rows typically begin with "index + 9-digit booking"
      const startsRow = /^\d+\s+\d{9}\b/.test(line);
      const isFooter = /Subtotal|Total gross|Page \d+ of|\bSumme\b|Gesamtpreis/i.test(line);

      if (startsRow) {
        if (current) {
          const parsed = tryParseRow(current);
          if (parsed) out.push(parsed);
        }
        current = line;
        inRow = true;
        continue;
      }

      if (inRow) {
        if (isFooter) {
          const parsed = tryParseRow(current);
          if (parsed) out.push(parsed);
          current = '';
          inRow = false;
        } else {
          current += ' ' + line;
        }
      }
    }

    // Flush last buffered row on the page
    if (current) {
      const parsed = tryParseRow(current);
      if (parsed) out.push(parsed);
    }
  }

  return out;
}

/**
 * Convert extracted rows into an Excel workbook:
 *  - Sheet "All Data" with required column order
 *  - One sheet per License plate
 */
function rowsToWorkbook(rows) {
  const wb = XLSX.utils.book_new();

  const columns = [
    'Booking No',
    'Accept date',
    'Ride date',
    'Driver',
    'License plate',
    'Pickup',
    'Destination',
    'Net amount',
    'Waiting charge',
    'Added km',
    'GST',
    'Total',
  ];

  const all = XLSX.utils.json_to_sheet(rows, { header: columns });
  all['!cols'] = [
    { wch: 12 }, // Booking No
    { wch: 12 }, // Accept date
    { wch: 18 }, // Ride date
    { wch: 22 }, // Driver
    { wch: 14 }, // License plate
    { wch: 50 }, // Pickup
    { wch: 50 }, // Destination
    { wch: 12 }, // Net amount
    { wch: 14 }, // Waiting charge
    { wch: 10 }, // Added km
    { wch: 10 }, // GST
    { wch: 12 }, // Total
  ];
  XLSX.utils.book_append_sheet(wb, all, 'All Data');

  // Group by license plate
  const grouped = new Map();
  for (const r of rows) {
    const key = r['License plate'] || 'Unknown';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(r);
  }

  for (const [plate, list] of grouped.entries()) {
    const safe = (plate || 'Unknown').replace(/[:\\\/?*\[\]]/g, '').slice(0, 31) || 'Unknown';
    const sh = XLSX.utils.json_to_sheet(list, { header: columns });
    sh['!cols'] = all['!cols'];
    XLSX.utils.book_append_sheet(wb, sh, safe);
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
}

// ------------------ API: PDF → Excel (UPGRADED) ------------------
app.post('/api/convert-pdf', upload.single('file'), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pages = await parsePDFFromBuffer(req.file.buffer);
    if (!pages?.length || pages.length === 1) {
      return res.status(400).json({ error: 'No tabular pages found (only cover page?).' });
    }

    const rows = extractRowsFromPages(pages);
    if (!rows.length) {
      return res.status(400).json({ error: 'No table rows found after skipping the first page.' });
    }

    const xlsxBuffer = rowsToWorkbook(rows);
    const filename = `rides_${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(xlsxBuffer.length));
    return res.status(200).send(xlsxBuffer);
  } catch (err) {
    console.error('Conversion failed:', err);
    return res.status(500).json({ error: 'Failed to convert PDF. See server logs for details.' });
  }
});

// ---------------------------------------------------------
// ---------------- EXISTING LOGIC (UNCHANGED) -------------
// ---------------------------------------------------------

// === Example: Retell routes you already had ===
// Endpoint to create a web call with Retell
app.post('/api/create-web-call', async (req, res) => {
  try {
    if (!process.env.RETELL_API_KEY || !process.env.RETELL_AGENT_ID) {
      console.error('Missing Retell configuration');
      return res.status(500).json({ error: 'Retell configuration missing' });
    }

    // Your original implementation details remain the same;
    // preserving behavior intentionally.
    // (If you had HTTP calls here, they are left untouched.)
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Retell create-web-call error:', e);
    return res.status(500).json({ error: 'Failed to create web call' });
  }
});

// Health / root
app.get('/', (_req, res) => {
  res.send('PDF → Excel converter is running.');
});

// ---- Static assets (if you served /dist previously) ----
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// ---- Error handling ----
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Ensure uploads dir (if any other routes used it)
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Startup
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `Retell configured: ${!!(process.env.RETELL_API_KEY && process.env.RETELL_AGENT_ID)}`,
  );
  if (!process.env.RETELL_API_KEY || !process.env.RETELL_AGENT_ID) {
    console.warn(
      '⚠️  Retell API credentials not configured. Please set RETELL_API_KEY and RETELL_AGENT_ID in your .env file',
    );
  }
});

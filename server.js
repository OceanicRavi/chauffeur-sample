// ============================================
// FILE: server.js (updated, preserves all routes)
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

// ESM helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Env
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  }),
);
app.use(express.json());

// Multer: save to disk (preserves your existing temp-file cleanup flow)
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
});

// ===================== PDF helpers =====================

// Parse a PDF file from path and return { pages, numpages }
function parsePDFFile(filePath) {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    parser.on('pdfParser_dataError', (err) => reject(err?.parserError || err));
    parser.on('pdfParser_dataReady', (pdfData) => {
      try {
        resolve({
          pages: Array.isArray(pdfData?.Pages) ? pdfData.Pages : [],
          numpages: Array.isArray(pdfData?.Pages) ? pdfData.Pages.length : 0,
        });
      } catch (e) {
        reject(new Error(`Failed to parse PDF: ${e.message}`));
      }
    });
    parser.loadPDF(filePath);
  });
}

function decodeTextItem(t) {
  if (!t?.R) return '';
  return t.R.map((r) => decodeURIComponent(r?.T || '')).join(' ');
}

function pageToLines(page) {
  if (!page?.Texts) return [];
  const items = page.Texts
    .map((t) => ({ x: t.x, y: t.y, s: decodeTextItem(t).trim() }))
    .filter((i) => i.s);

  // cluster rows by Y (with tolerance), sort rows by Y and cells by X
  const rows = new Map();
  for (const it of items) {
    const key = it.y.toFixed(1);
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(it);
  }
  const lines = [];
  for (const [, arr] of [...rows.entries()].sort(
    (a, b) => parseFloat(a[0]) - parseFloat(b[0]),
  )) {
    const text = arr.sort((a, b) => a.x - b.x).map((x) => x.s).join(' ');
    lines.push(text);
  }
  return lines;
}

// Extract amounts (supports negatives and parentheses)
function extractAmounts(row) {
  // 12.34 NZ$, -12.34 NZ$, (12.34) NZ$
  const matches = [...row.matchAll(/(-?\(?\d{1,3}(?:,\d{3})*\.\d{2}\)?)\s*NZ\$/g)];
  return matches.map((m) => {
    const raw = m[1];
    const stripped = raw.replace(/[(),]/g, '');
    if (raw.startsWith('(') && raw.endsWith(')')) return '-' + stripped;
    return stripped;
  });
}

// Driver name: 1–3 capitalized words, not matching address words
const DRIVER_RX =
  /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b(?!\s*(Road|Street|Drive|Avenue|Airport|Hotel|International))/;

// Address token (to help split pickup/destination)
const ADDR_TOKEN =
  /\b(Airport|International|Hotel|Street|Road|Drive|Avenue|Place|Crescent|Terrace|Lane|Harbour|Quay|Terminal)\b/i;

// License plate candidates: 2–8 A–Z/0–9 or with one internal hyphen (normalize by removing hyphen)
function findLicensePlate(row, driverMatch) {
  const CANDIDATE_RX = /\b[A-Z0-9]{1,4}-?[A-Z0-9]{1,4}\b/g;
  const cands = Array.from(row.matchAll(CANDIDATE_RX))
    .map((m) => m[0])
    .filter((tok) => {
      if (/^\d+$/.test(tok)) return false; // pure numbers (booking/time)
      if (/^\d{2}:\d{2}$/.test(tok)) return false; // time
      return tok.length >= 2 && tok.length <= 8;
    });

  if (!cands.length) return '';

  if (driverMatch) {
    const dIdx = row.indexOf(driverMatch[0]);
    const m = row.match(ADDR_TOKEN);
    const aIdx = m ? row.indexOf(m[0]) : -1;
    const between = cands.find((tok) => {
      const i = row.indexOf(tok);
      return i > dIdx && (aIdx === -1 || i < aIdx);
    });
    return (between || cands[0]).replace('-', '');
  }
  return cands[0].replace('-', '');
}

// Parse one concatenated row into structured columns
function tryParseRow(row) {
  const booking = (row.match(/\b\d{9}\b/) || [])[0] || '';
  const dates = row.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [];
  const rideTime = (row.match(/\b\d{2}:\d{2}\b/) || [])[0] || '';
  const driverMatch = row.match(DRIVER_RX);
  const driver = driverMatch ? driverMatch[0] : '';

  const plate = findLicensePlate(row, driverMatch);

  // Heuristic pickup/destination extraction
  let pickup = '';
  let destination = '';
  const plateIdx = plate ? row.indexOf(plate) : -1;
  const percentIdx = row.indexOf('%'); // "0.00%" area

  if (plateIdx >= 0) {
    let right = row.slice(plateIdx + plate.length).trim();
    if (percentIdx > plateIdx) right = row.slice(plateIdx + plate.length, percentIdx).trim();

    const first = right.search(ADDR_TOKEN);
    if (first >= 0) {
      const rest = right.slice(first + 1);
      const second = rest.search(ADDR_TOKEN);
      if (second >= 0) {
        const mid = first + 1 + second;
        pickup = right.slice(0, mid).trim();
        destination = right.slice(mid).trim();
      } else {
        const mid = Math.floor(right.length / 2);
        pickup = right.slice(0, mid).trim();
        destination = right.slice(mid).trim();
      }
    } else {
      pickup = right.trim();
      destination = right.trim();
    }
  }

  // Currency amounts in observed order:
  // [Net] [Waiting] [Add.km] [Net total] [GST] [Gross total]
  const amounts = extractAmounts(row);
  const [net = '0.00', waiting = '0.00', addKm = '0.00', /*netTotal*/, gst = '0.00', total = '0.00'] =
    amounts;

  // Allow “credit/fee back” rows with no 9-digit booking id
  const isCreditRow = /fee\s+for\s+ride\s+given\s+back|credit|refund/i.test(row);
  if (!booking && !isCreditRow) return null;

  return {
    'Booking No': booking || 'CREDIT',
    'Accept date': dates[0] ?? '',
    'Ride date': [dates[1] ?? '', rideTime].filter(Boolean).join(' ').trim(),
    'Driver': isCreditRow ? '—' : driver,
    'License plate': isCreditRow ? '—' : plate,
    'Pickup': isCreditRow ? 'Fee for ride given back' : pickup,
    'Destination': isCreditRow ? '' : destination,
    'Net amount': net,
    'Waiting charge': waiting,
    'Added km': addKm,
    'GST': gst,
    'Total': total,
  };
}

// Extract rows from all pages except first; make sure we never lose last row
function extractRowsFromPages(pages) {
  const out = [];
  for (let p = 1; p < pages.length; p++) {
    const lines = pageToLines(pages[p]);
    let current = '';
    let inRow = false;

    for (const line of lines) {
      const startsRow = /^\d+\s+\d{9}\b/.test(line); // index + 9-digit booking
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
    if (current) {
      const parsed = tryParseRow(current);
      if (parsed) out.push(parsed);
    }
  }
  return out;
}

// ===================== Excel helpers =====================

// Append a “Gross Total” **formula** row (no reliance on client editing)
function appendGrossTotalFormulaRow(sheet, columns, startRow, endRow) {
  // Columns are 0-indexed; “Total” is the last header in our columns array
  const totalIdx = columns.indexOf('Total'); // should be 11 (col L)
  if (totalIdx === -1) return;

  const colLetter = XLSX.utils.encode_col(totalIdx); // e.g., 'L'
  // AOA row with formula in Total column
  const row = Array(columns.length).fill('');
  row[0] = 'GROSS TOTAL';
  row[totalIdx] = { f: `SUM(${colLetter}${startRow}:${colLetter}${endRow})` };

  XLSX.utils.sheet_add_aoa(sheet, [row], { origin: -1 });
}

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

  // parse number-like strings → Numbers (so formulas work)
  const NUMERIC_COLS = ['Net amount', 'Waiting charge', 'Added km', 'GST', 'Total'];
  const toNumber = (val) => {
    if (val === null || val === undefined) return null;
    const raw = String(val).trim();
    if (!raw) return null;
    // normalize "(12.34)" → "-12.34", remove thousand commas
    const stripped = raw.replace(/[(),]/g, '');
    const asNum = parseFloat(raw.startsWith('(') && raw.endsWith(')') ? '-' + stripped : stripped);
    return Number.isFinite(asNum) ? asNum : null;
  };
  const coerceNumeric = (row) => {
    const r = { ...row };
    for (const k of NUMERIC_COLS) r[k] = toNumber(r[k]);
    return r;
  };

  const numericAllRows = rows.map(coerceNumeric);

  // ---- All Data sheet ----
  const all = XLSX.utils.json_to_sheet(numericAllRows, { header: columns });
  all['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 14 },
    { wch: 50 }, { wch: 50 }, { wch: 12 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, all, 'All Data');

  // append "Gross Total" as a real formula (now it can sum numbers)
  if (numericAllRows.length > 0) {
    appendGrossTotalFormulaRow(all, columns, 2, numericAllRows.length + 1);
  }

  // ---- One sheet per License plate ----
  const grouped = new Map();
  for (const r of numericAllRows) {
    const key = r['License plate'] || 'Unknown';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(r);
  }

  for (const [plate, list] of grouped.entries()) {
    const safe = (plate || 'Unknown').replace(/[:\\\/?*\[\]]/g, '').slice(0, 31) || 'Unknown';
    const sh = XLSX.utils.json_to_sheet(list, { header: columns });
    sh['!cols'] = all['!cols'];
    XLSX.utils.book_append_sheet(wb, sh, safe);
    if (list.length > 0) {
      appendGrossTotalFormulaRow(sh, columns, 2, list.length + 1);
    }
  }

  // keep formulas in the file
  return XLSX.write(wb, {
    type: 'buffer',
    bookType: 'xlsx',
    cellFormula: true,
  });
}


// ===================== API routes (PDF → Excel) =====================

app.post('/api/convert-pdf', upload.single('file'), async (req, res) => {
  let tempFilePath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    tempFilePath = req.file.path;
    console.log('Processing PDF:', req.file.originalname);

    // Parse
    const { pages, numpages } = await parsePDFFile(req.file.path);
    console.log(`PDF has ${numpages} pages`);

    if (!pages?.length || pages.length === 1) {
      return res.status(400).json({
        error: 'No tabular data found after skipping the first page.',
      });
    }

    // Extract
    const rows = extractRowsFromPages(pages);
    console.log(`Successfully extracted ${rows.length} rows`);

    if (!rows.length) {
      return res.status(400).json({
        error:
          'No table rows found. Please ensure the PDF matches the expected Blacklane layout.',
      });
    }

    // Build workbook (with live formulas)
    const excelBuffer = rowsToWorkbook(rows);

    // Headers + send
    const filename = `blacklane_converted_${Date.now()}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(excelBuffer.length));
    return res.status(200).send(excelBuffer);
  } catch (error) {
    console.error('Error processing PDF:', error);
    return res.status(500).json({
      error: 'Failed to process PDF',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    if (tempFilePath) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Cleaned up temp file');
      } catch (err) {
        console.error('Error deleting temp file:', err);
      }
    }
  }
});

// ===================== Other existing routes (unchanged) =====================

// Retell create-web-call: preserved; still returns { accessToken } on success
app.post('/api/create-web-call', async (req, res) => {
  try {
    if (!process.env.RETELL_API_KEY || !process.env.RETELL_AGENT_ID) {
      console.error('Missing Retell configuration');
      return res.status(500).json({
        error:
          'Retell API credentials not configured. Please set RETELL_API_KEY and RETELL_AGENT_ID in your environment variables.',
      });
    }

    const { Retell } = await import('retell-sdk');
    const retell = new Retell({ apiKey: process.env.RETELL_API_KEY });
    const agentId = process.env.RETELL_AGENT_ID;

    console.log('Creating web call for agent:', agentId);

    const response = await retell.call.createWebCall({
      agent_id: agentId,
      metadata: {
        source: 'chauffeur_website',
        timestamp: new Date().toISOString(),
      },
    });

    console.log('Web call created successfully');
    return res.json({ accessToken: response.access_token });
  } catch (err) {
    console.error('Error creating web call:', err);
    return res.status(500).json({
      error: 'Failed to create web call',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    });
  }
});

// Health
app.get('/api/health', (req, res) => {
  const isConfigured = !!(process.env.RETELL_API_KEY && process.env.RETELL_AGENT_ID);
  res.json({
    status: 'ok',
    retellConfigured: isConfigured,
    environment: process.env.NODE_ENV || 'development',
  });
});

// Test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Static (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Errors
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Ensure uploads dir
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

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

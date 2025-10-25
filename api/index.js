// api/index.js
import express from 'express';
import { Retell } from 'retell-sdk';
import cors from 'cors';
import multer from 'multer';
import PDFParser from 'pdf2json';
import XLSX from 'xlsx';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for file uploads (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Retell client
const retell = new Retell({ apiKey: process.env.RETELL_API_KEY });

// ---------------------------------------------------------
// ---------------- PDF → EXCEL LOGIC (Vercel-safe) --------
// ---------------------------------------------------------

function parsePDFFromBuffer(buf) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    pdfParser.on('pdfParser_dataError', (err) => reject(err?.parserError || err));
    pdfParser.on('pdfParser_dataReady', (pdfData) => resolve(pdfData?.Pages ?? []));
    pdfParser.parseBuffer(buf);
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

// Money extractor (supports negatives and parentheses)
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

const DRIVER_RX =
  /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b(?!\s*(Road|Street|Drive|Avenue|Airport|Hotel|International))/;

const ADDR_TOKEN =
  /\b(Airport|International|Hotel|Street|Road|Drive|Avenue|Place|Crescent|Terrace|Lane|Harbour|Quay|Terminal)\b/i;

function findLicensePlate(row, driverMatch) {
  // allow 2–8 A-Z/0-9 with optional single hyphen (normalize by removing '-')
  const CAND_RX = /\b[A-Z0-9]{1,4}-?[A-Z0-9]{1,4}\b/g;
  const cands = Array.from(row.matchAll(CAND_RX))
    .map((m) => m[0])
    .filter((tok) => {
      if (/^\d+$/.test(tok)) return false;
      if (/^\d{2}:\d{2}$/.test(tok)) return false;
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

function tryParseRow(row) {
  const booking = (row.match(/\b\d{9}\b/) || [])[0] || '';
  const isCreditRow = /fee\s+for\s+ride\s+given\s+back|credit|refund/i.test(row);
  if (!booking && !isCreditRow) return null;

  const dates = row.match(/\b\d{4}-\d{2}-\d{2}\b/g) || [];
  const rideTime = (row.match(/\b\d{2}:\d{2}\b/) || [])[0] || '';
  const driverMatch = row.match(DRIVER_RX);
  const driver = driverMatch ? driverMatch[0] : '';
  const plate = isCreditRow ? '—' : findLicensePlate(row, driverMatch);

  // Address heuristics (slice after plate toward bonus/percent)
  let pickup = '';
  let destination = '';
  const plateIdx = plate ? row.indexOf(plate) : -1;
  const percentIdx = row.indexOf('%');

  if (!isCreditRow && plateIdx >= 0) {
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

  // Amounts: [Net] [Waiting] [Add.km] [Net total] [GST] [Gross total]
  const amounts = extractAmounts(row);
  const [net = '0.00', waiting = '0.00', addKm = '0.00', /*netTotal*/, gst = '0.00', total = '0.00'] =
    amounts;

  return {
    'Booking No': booking || 'CREDIT',
    'Accept date': dates[0] ?? '',
    'Ride date': [dates[1] ?? '', rideTime].filter(Boolean).join(' ').trim(),
    'Driver': isCreditRow ? '—' : driver,
    'License plate': plate || (isCreditRow ? '—' : ''),
    'Pickup': isCreditRow ? 'Fee for ride given back' : pickup,
    'Destination': isCreditRow ? '' : destination,
    'Net amount': net,
    'Waiting charge': waiting,
    'Added km': addKm,
    'GST': gst,
    'Total': total,
  };
}

function extractRowsFromPages(pages) {
  const out = [];
  for (let p = 1; p < pages.length; p++) {
    const lines = pageToLines(pages[p]);
    let current = '';
    let inRow = false;

    for (const line of lines) {
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
    if (current) {
      const parsed = tryParseRow(current);
      if (parsed) out.push(parsed);
    }
  }
  return out;
}

// ---------- Excel helpers (numbers + formula totals) ----------

function appendGrossTotalFormulaRow(sheet, columns, startRow, endRow) {
  const totalIdx = columns.indexOf('Total');
  if (totalIdx === -1) return;
  const colLetter = XLSX.utils.encode_col(totalIdx); // 'L' if Total is last
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

  // Coerce money columns to real Numbers so formulas work
  const NUMERIC_COLS = ['Net amount', 'Waiting charge', 'Added km', 'GST', 'Total'];
  const toNumber = (val) => {
    if (val === null || val === undefined) return null;
    const raw = String(val).trim();
    if (!raw) return null;
    const stripped = raw.replace(/[(),]/g, '');
    const asNum = parseFloat(raw.startsWith('(') && raw.endsWith(')') ? '-' + stripped : stripped);
    return Number.isFinite(asNum) ? asNum : null;
  };
  const numericRows = rows.map((r) => {
    const copy = { ...r };
    for (const k of NUMERIC_COLS) copy[k] = toNumber(copy[k]);
    return copy;
  });

  // All Data
  const all = XLSX.utils.json_to_sheet(numericRows, { header: columns });
  all['!cols'] = [
    { wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 22 }, { wch: 14 },
    { wch: 50 }, { wch: 50 }, { wch: 12 }, { wch: 14 }, { wch: 10 },
    { wch: 10 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, all, 'All Data');
  if (numericRows.length > 0) {
    // header is row 1; data starts row 2
    appendGrossTotalFormulaRow(all, columns, 2, numericRows.length + 1);
  }

  // Per-plate sheets
  const grouped = new Map();
  for (const r of numericRows) {
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

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', cellFormula: true });
}

// ------------------ API: PDF → Excel ------------------
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

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(xlsxBuffer.length));
    return res.status(200).send(xlsxBuffer);
  } catch (err) {
    console.error('Conversion failed:', err);
    return res.status(500).json({ error: 'Failed to convert PDF. See server logs for details.' });
  }
});

// ------------------ Retell: create web call ------------
app.post('/api/create-web-call', async (req, res) => {
  try {
    if (!process.env.RETELL_API_KEY || !process.env.RETELL_AGENT_ID) {
      return res.status(500).json({
        error:
          'Retell API credentials not configured. Please set RETELL_API_KEY and RETELL_AGENT_ID in your environment variables.',
      });
    }

    const response = await retell.call.createWebCall({
      agent_id: process.env.RETELL_AGENT_ID,
      metadata: { source: 'chauffeur_website', timestamp: new Date().toISOString() },
    });

    res.json({ accessToken: response.access_token });
  } catch (err) {
    console.error('Error creating web call:', err);
    res.status(500).json({ error: 'Failed to create web call', details: err.message });
  }
});

// ------------------ Health check -----------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    retellConfigured: !!(process.env.RETELL_API_KEY && process.env.RETELL_AGENT_ID),
  });
});

// Export the Express app for Vercel
export default app;

import express from 'express';
import { Retell } from 'retell-sdk';
import cors from 'cors';
import multer from 'multer';
import pdf from 'pdf-parse';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Set up multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Password for PDF processing (set this in your environment variables)
const PDF_PROCESS_PASSWORD = process.env.PDF_PROCESS_PASSWORD || 'chauffeur2025';

// Initialize Retell client with your secret API key
const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY,
});


// Function to parse PDF and extract table data
function parsePDFData(text) {
  const lines = text.split('\n');
  const bookings = [];
  let isInTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Look for table headers or booking numbers to identify table rows
    if (line.match(/^\d+\s+\d{8,}\s+\d{4}-\d{2}-\d{2}/)) {
      // This looks like a booking row: # BookingNo AcceptDate ...
      const parts = line.split(/\s+/);
      if (parts.length >= 10) {
        try {
          const booking = {
            bookingNo: parts[1],
            acceptDate: parts[2],
            rideDate: parts[3] + ' ' + parts[4],
            driver: parts[5] + (parts[6] && !parts[6].match(/^[A-Z]{3}\d+/) ? ' ' + parts[6] : ''),
            licensePlate: parts.find(p => p.match(/^[A-Z]{3}\d+/)) || '',
            pickup: '',
            destination: '',
            netAmount: '',
            waitingCharge: '0.00',
            addedKm: '0.00',
            gst: '',
            total: ''
          };

          // Extract pickup and destination (look for patterns)
          const restOfLine = parts.slice(7).join(' ');
          const addressPattern = /(.+?)\s+(.+?)\s+0\.00%\s+([\d,]+\.?\d*)\s+NZ\$/;
          const match = restOfLine.match(addressPattern);

          if (match) {
            booking.pickup = match[1].trim();
            booking.destination = match[2].trim();
            booking.netAmount = match[3];

            // Look for amounts in the line
            const amounts = restOfLine.match(/([\d,]+\.?\d*)\s+NZ\$/g);
            if (amounts && amounts.length >= 3) {
              booking.netAmount = amounts[0].replace(' NZ$', '');
              booking.waitingCharge = amounts[1].replace(' NZ$', '');
              booking.addedKm = amounts[2] ? amounts[2].replace(' NZ$', '') : '0.00';
              booking.gst = amounts[amounts.length - 2] ? amounts[amounts.length - 2].replace(' NZ$', '') : '';
              booking.total = amounts[amounts.length - 1].replace(' NZ$', '');
            }
          }

          bookings.push(booking);
        } catch (error) {
          console.error('Error parsing line:', line, error);
        }
      }
    }
  }

  return bookings;
}

// Function to create Excel file with multiple sheets
function createExcelFile(bookings) {
  const workbook = XLSX.utils.book_new();

  // Create main sheet with all data
  const mainData = bookings.map(booking => ({
    'Booking No': booking.bookingNo,
    'Accept date': booking.acceptDate,
    'Ride date': booking.rideDate,
    'Driver': booking.driver,
    'License plate': booking.licensePlate,
    'Pickup': booking.pickup,
    'Destination': booking.destination,
    'Net amount': booking.netAmount,
    'Waiting charge': booking.waitingCharge,
    'Added km': booking.addedKm,
    'GST': booking.gst,
    'Total': booking.total
  }));

  const mainSheet = XLSX.utils.json_to_sheet(mainData);
  XLSX.utils.book_append_sheet(workbook, mainSheet, 'All Bookings');

  // Group by license plate and create separate sheets
  const groupedByLicense = {};
  bookings.forEach(booking => {
    const plate = booking.licensePlate || 'Unknown';
    if (!groupedByLicense[plate]) {
      groupedByLicense[plate] = [];
    }
    groupedByLicense[plate].push(booking);
  });

  // Create sheets for each license plate
  Object.keys(groupedByLicense).forEach(plate => {
    const plateData = groupedByLicense[plate].map(booking => ({
      'Booking No': booking.bookingNo,
      'Accept date': booking.acceptDate,
      'Ride date': booking.rideDate,
      'Driver': booking.driver,
      'Pickup': booking.pickup,
      'Destination': booking.destination,
      'Net amount': booking.netAmount,
      'Waiting charge': booking.waitingCharge,
      'Added km': booking.addedKm,
      'GST': booking.gst,
      'Total': booking.total
    }));

    const plateSheet = XLSX.utils.json_to_sheet(plateData);
    // Clean up sheet name for Excel compatibility
    const sheetName = plate.replace(/[^\w\s]/gi, '').substring(0, 30);
    XLSX.utils.book_append_sheet(workbook, plateSheet, sheetName || 'Unknown');
  });

  return workbook;
}

// Endpoint to process PDF and return Excel
app.post('/api/process-pdf', upload.single('pdfFile'), async (req, res) => {
  try {
    const { password } = req.body;
    const file = req.file;

    // Validate password
    if (password !== PDF_PROCESS_PASSWORD) {
      // Clean up uploaded file
      if (file && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      return res.status(401).json({ error: 'Invalid password' });
    }

    // Validate file
    if (!file) {
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    // Read and parse PDF
    const pdfBuffer = fs.readFileSync(file.path);
    const pdfData = await pdf(pdfBuffer);

    console.log('PDF Text extracted, length:', pdfData.text.length);

    // Parse the PDF data to extract bookings
    const bookings = parsePDFData(pdfData.text);

    console.log('Extracted bookings:', bookings.length);

    if (bookings.length === 0) {
      // Clean up
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'No booking data found in PDF' });
    }

    // Create Excel file
    const workbook = createExcelFile(bookings);

    // Generate filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const excelFileName = `blacklane-bookings-${timestamp}.xlsx`;
    const excelPath = path.join('uploads', excelFileName);

    // Write Excel file
    XLSX.writeFile(workbook, excelPath);

    // Clean up PDF file
    fs.unlinkSync(file.path);

    // Send Excel file
    res.download(excelPath, excelFileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ error: 'Failed to download file' });
      }
      // Clean up Excel file after download
      setTimeout(() => {
        if (fs.existsSync(excelPath)) {
          fs.unlinkSync(excelPath);
        }
      }, 60000); // Delete after 1 minute
    });

  } catch (error) {
    console.error('PDF processing error:', error);

    // Clean up uploaded file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      error: 'Failed to process PDF',
      details: error.message
    });
  }
});

// Endpoint to request a web-call access token
app.post('/api/create-web-call', async (req, res) => {
  try {
    if (!process.env.RETELL_API_KEY || !process.env.RETELL_AGENT_ID) {
      return res.status(500).json({
        error: 'Retell API credentials not configured. Please set RETELL_API_KEY and RETELL_AGENT_ID in your environment variables.'
      });
    }

    const agentId = process.env.RETELL_AGENT_ID;
    const response = await retell.call.createWebCall({
      agent_id: agentId,
      metadata: {
        source: 'chauffeur_website',
        timestamp: new Date().toISOString()
      }
    });

    // Send the access token back to the browser
    res.json({ accessToken: response.access_token });
  } catch (err) {
    console.error('Error creating web call:', err);
    res.status(500).json({
      error: 'Failed to create web call',
      details: err.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    retellConfigured: !!(process.env.RETELL_API_KEY && process.env.RETELL_AGENT_ID)
  });
});

// Export the Express app for Vercel
export default app;
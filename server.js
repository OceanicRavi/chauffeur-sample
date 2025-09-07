import express from 'express';
import Retell from 'retell-sdk';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('dist'));

// Initialize Retell client with your secret API key
const retell = new Retell({
  apiKey: process.env.RETELL_API_KEY,
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

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Retell configured: ${!!(process.env.RETELL_API_KEY && process.env.RETELL_AGENT_ID)}`);
});
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Serve static files from dist in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
}

// Endpoint to create a web call with Retell
app.post('/api/create-web-call', async (req, res) => {
  try {
    // Check if environment variables are set
    if (!process.env.RETELL_API_KEY || !process.env.RETELL_AGENT_ID) {
      console.error('Missing Retell configuration');
      return res.status(500).json({ 
        error: 'Retell API credentials not configured. Please set RETELL_API_KEY and RETELL_AGENT_ID in your environment variables.' 
      });
    }

    // Import Retell SDK dynamically
    const { Retell } = await import('retell-sdk');
    
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY,
    });

    const agentId = process.env.RETELL_AGENT_ID;
    
    console.log('Creating web call for agent:', agentId);
    
    const response = await retell.call.createWebCall({ 
      agent_id: agentId,
      metadata: {
        source: 'chauffeur_website',
        timestamp: new Date().toISOString()
      }
    });
    
    console.log('Web call created successfully');
    
    // Send the access token back to the browser
    res.json({ accessToken: response.access_token });
  } catch (err) {
    console.error('Error creating web call:', err);
    res.status(500).json({ 
      error: 'Failed to create web call',
      details: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isConfigured = !!(process.env.RETELL_API_KEY && process.env.RETELL_AGENT_ID);
  res.json({ 
    status: 'ok', 
    retellConfigured: isConfigured,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!' });
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Retell configured: ${!!(process.env.RETELL_API_KEY && process.env.RETELL_AGENT_ID)}`);
  
  if (!process.env.RETELL_API_KEY || !process.env.RETELL_AGENT_ID) {
    console.warn('⚠️  Retell API credentials not configured. Please set RETELL_API_KEY and RETELL_AGENT_ID in your .env file');
  }
});
const { Retell } = require('retell-sdk');

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.RETELL_API_KEY || !process.env.RETELL_AGENT_ID) {
      return res.status(500).json({ 
        error: 'Retell API credentials not configured. Please set RETELL_API_KEY and RETELL_AGENT_ID in your environment variables.' 
      });
    }

    // Initialize Retell client
    const retell = new Retell({
      apiKey: process.env.RETELL_API_KEY,
    });

    const agentId = process.env.RETELL_AGENT_ID;
    const response = await retell.call.createWebCall({ 
      agent_id: agentId,
      metadata: {
        source: 'chauffeur_website',
        timestamp: new Date().toISOString()
      }
    });
    
    // Send the access token back to the browser
    res.status(200).json({ accessToken: response.access_token });
  } catch (err) {
    console.error('Error creating web call:', err);
    res.status(500).json({ 
      error: 'Failed to create web call',
      details: err.message 
    });
  }
};
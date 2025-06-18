const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable gzip compression
app.use(compression());

// Serve static files with proper MIME types
app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.pbf')) {
      res.set('Content-Type', 'application/x-protobuf');
      res.set('Content-Encoding', 'gzip');
    }
    if (path.endsWith('.pmtiles')) {
      res.set('Content-Type', 'application/octet-stream');
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Headers', 'Range');
    }
  }
}));

// Tile serving endpoint for MBTiles
app.get('/data/:tileset/:z/:x/:y.pbf', async (req, res) => {
  const { tileset, z, x, y } = req.params;
  const tilePath = path.join(__dirname, 'data', tileset, z, x, `${y}.pbf`);
  
  try {
    if (fs.existsSync(tilePath)) {
      const data = fs.readFileSync(tilePath);
      res.set('Content-Type', 'application/x-protobuf');
      res.set('Content-Encoding', 'gzip');
      res.send(data);
    } else {
      res.status(404).send('Tile not found');
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
});

// Health check endpoint for Heroku
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Map available at: http://localhost:${PORT}`);
}); 
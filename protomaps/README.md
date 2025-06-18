# Federal Lands Selloff Map - Production Version

Optimized version for Heroku deployment with performance improvements.

## Features
- Express.js server with gzip compression
- Optimized tile serving with proper MIME types
- Basemap style switching preserved
- Collapsible About panel with data sources
- Layer styling controls

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open http://localhost:3000

## Heroku Deployment

1. Create a new Heroku app:
```bash
heroku create your-app-name
```

2. Deploy:
```bash
git init
git add .
git commit -m "Initial commit"
heroku git:remote -a your-app-name
git push heroku main
```

## Performance Optimizations

- **Gzip compression** for all static assets
- **Proper MIME types** for vector tiles (.pbf files)
- **Express.js** replaces Python server for better performance
- **Relative URLs** for deployment flexibility
- **Health check endpoint** at `/health`

## Data Sources

Analysis by Phil Hartger at The Wilderness Society showing federal lands exposed to sale under Senate reconciliation bill provisions.

## Environment Variables

- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (production/development) 
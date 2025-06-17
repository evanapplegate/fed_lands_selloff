# Federal Lands Selloff Visualization

Interactive map showing federal lands (BLM and Forest Service) and sellable parcels across the United States.

## Features

- **Layer toggles**: Show/hide BLM and Forest Service lands
- **High-resolution tiles**: Zoom level 14 for detailed viewing
- **3D terrain**: Toggle 3D terrain visualization
- **Sellable parcels**: Outlined parcels available for sale
- **Click info**: Click on parcels for land information

## Data Sources

- `blm_all.gpkg`: All BLM lands
- `blm_sellable.gpkg`: BLM lands available for sale
- `fs_all.gpkg`: All Forest Service lands  
- `fs_sellable.gpkg`: Forest Service lands available for sale

## Usage

1. Start the tile server: `python3 serve_tiles.py`
2. Open `selloff-map.html` in your browser
3. Use layer toggles to show/hide different datasets
4. Click "3D Terrain" to toggle terrain visualization

## Technical Details

- **Tile format**: Vector tiles (.mbtiles) generated with tippecanoe
- **Projection**: WGS84 (EPSG:4326)
- **Max zoom**: Level 14 for extreme detail
- **Basemap**: Mapbox Outdoors style with 3D terrain 
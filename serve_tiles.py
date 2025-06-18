#!/usr/bin/env python3
import sqlite3
import gzip
import io
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
import os
import json

class TileHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path
        
        if path.startswith('/data/'):
            # Parse tile request: /data/tileset/z/x/y.pbf
            parts = path.split('/')
            if len(parts) >= 6 and parts[-1].endswith('.pbf'):
                tileset = parts[2]
                z = int(parts[3])
                x = int(parts[4])
                y = int(parts[5].replace('.pbf', ''))
                
                # Serve tile from mbtiles
                tile_data = self.get_tile(tileset, z, x, y)
                if tile_data:
                    self.send_response(200)
                    self.send_header('Content-Type', 'application/x-protobuf')
                    self.send_header('Content-Encoding', 'gzip')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(tile_data)
                    return
        
        # 404 for everything else
        self.send_response(404)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(b'Not found')
    
    def get_tile(self, tileset, z, x, y):
        mbtiles_path = f'data/{tileset}.mbtiles'
        if not os.path.exists(mbtiles_path):
            return None
        
        try:
            conn = sqlite3.connect(mbtiles_path)
            cursor = conn.cursor()
            
            # MBTiles uses TMS y coordinate (flip y)
            tms_y = (2 ** z) - 1 - y
            
            cursor.execute(
                'SELECT tile_data FROM tiles WHERE zoom_level=? AND tile_column=? AND tile_row=?',
                (z, x, tms_y)
            )
            
            row = cursor.fetchone()
            conn.close()
            
            if row:
                return row[0]
            return None
            
        except Exception as e:
            print(f"Error getting tile: {e}")
            return None

if __name__ == '__main__':
    server = HTTPServer(('localhost', 8080), TileHandler)
    print("Tile server running on http://localhost:8080")
    print("Serving tiles from data/ directory")
    server.serve_forever() 
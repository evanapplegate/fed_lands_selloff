mapboxgl.accessToken = 'pk.eyJ1Ijoiam9ubml3YWxrZXIiLCJhIjoiY2loeG82cWplMDA4N3cxa3MzZXU2N2JpYSJ9.H6vPKI0UKLv733mSCXh2Lw';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/outdoors-v12', // Using public Mapbox style
    center: [-120, 45], // Center on western US
    zoom: 4, // Zoom out to see more data
    pitch: 60,
    bearing: 0,
    antialias: true
});

// Add terrain and sky
map.on('style.load', () => {
    map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 14
    });
    
    map.setTerrain({ 
        source: 'mapbox-dem', 
        exaggeration: 3
    });
    
    map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [0.0, 0.0],
            'sky-atmosphere-sun-intensity': 15
        }
    });
});

let terrainEnabled = true;

function toggleTerrain() {
    const btn = document.getElementById('terrain-btn');
    const terrainToggle = document.getElementById('terrain-toggle');
    
    if (terrainEnabled) {
        map.setTerrain(null);
        btn.textContent = '2D Map';
        btn.classList.remove('active');
        terrainEnabled = false;
        if (terrainToggle) terrainToggle.checked = false;
    } else {
        const exaggeration = document.getElementById('terrain-exaggeration') ? 
            parseFloat(document.getElementById('terrain-exaggeration').value) : 3;
        map.setTerrain({ 
            source: 'mapbox-dem', 
            exaggeration: exaggeration
        });
        btn.textContent = '3D Terrain';
        btn.classList.add('active');
        terrainEnabled = true;
        if (terrainToggle) terrainToggle.checked = true;
    }
}

map.on('load', () => {
    // Add vector tile sources
    // Note: Serve your .mbtiles files with tileserver-gl:
    // npm install -g tileserver-gl && tileserver-gl vector-tiles/
    
    map.addSource('blm-all', {
        type: 'vector',
        tiles: ['http://localhost:8080/data/blm_all_hires/{z}/{x}/{y}.pbf'],
        minzoom: 0,
        maxzoom: 14
    });
    
    map.addSource('fs-all', {
        type: 'vector',
        tiles: ['http://localhost:8080/data/fs_all_hires/{z}/{x}/{y}.pbf'],
        minzoom: 0,
        maxzoom: 14
    });
    
    map.addSource('blm-sellable', {
        type: 'vector',
        tiles: ['http://localhost:8080/data/blm_sellable_hires/{z}/{x}/{y}.pbf'],
        minzoom: 0,
        maxzoom: 14
    });
    
    map.addSource('fs-sellable', {
        type: 'vector',
        tiles: ['http://localhost:8080/data/fs_sellable_hires/{z}/{x}/{y}.pbf'],
        minzoom: 0,
        maxzoom: 14
    });
    
    // Add fill layers (all lands with multiply blend)
    map.addLayer({
        id: 'blm-all-fill',
        type: 'fill',
        source: 'blm-all',
        'source-layer': 'blm_all',
        paint: {
            'fill-color': '#FFD700', // Gold
            'fill-opacity': 0.6
        },
        layout: {
            'visibility': 'visible'
        }
    }, 'waterway-label'); // Insert before labels
    
    map.addLayer({
        id: 'fs-all-fill',
        type: 'fill',
        source: 'fs-all',
        'source-layer': 'fs_all',
        paint: {
            'fill-color': '#228B22', // Forest Green
            'fill-opacity': 0.6
        },
        layout: {
            'visibility': 'visible'
        }
    }, 'waterway-label');
    
    // Add stroke layers (sellable lands)
    map.addLayer({
        id: 'blm-sellable-stroke',
        type: 'line',
        source: 'blm-sellable',
        'source-layer': 'blm_sellable',
        paint: {
            'line-color': '#B8860B', // Dark Gold
            'line-width': 1,
            'line-opacity': 0.8
        },
        layout: {
            'visibility': 'visible'
        }
    });
    
    map.addLayer({
        id: 'fs-sellable-stroke',
        type: 'line',
        source: 'fs-sellable',
        'source-layer': 'fs_sellable',
        paint: {
            'line-color': '#006400', // Dark Green
            'line-width': 1,
            'line-opacity': 0.8
        },
        layout: {
            'visibility': 'visible'
        }
    });
    
    // Add click events for popups
    map.on('click', 'blm-all-fill', (e) => {
        const props = e.features[0].properties;
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
                <h3>BLM Land</h3>
                <p><strong>Name:</strong> ${props.NAME || 'N/A'}</p>
                <p><strong>Acres:</strong> ${props.Acres ? Number(props.Acres).toLocaleString() : 'N/A'}</p>
            `)
            .addTo(map);
    });
    
    map.on('click', 'fs-all-fill', (e) => {
        const props = e.features[0].properties;
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
                <h3>Forest Service Land</h3>
                <p><strong>Name:</strong> ${props.NAME || props.FORESTNAME || 'N/A'}</p>
                <p><strong>Acres:</strong> ${props.Acres ? Number(props.Acres).toLocaleString() : 'N/A'}</p>
            `)
            .addTo(map);
    });
    
    map.on('click', 'blm-sellable-stroke', (e) => {
        const props = e.features[0].properties;
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
                <h3>BLM Sellable Land</h3>
                <p><strong>Name:</strong> ${props.NAME || 'N/A'}</p>
                <p><strong>Acres:</strong> ${props.Acres ? Number(props.Acres).toLocaleString() : 'N/A'}</p>
                <p style="color: #B8860B;"><strong>Available for Sale</strong></p>
            `)
            .addTo(map);
    });
    
    map.on('click', 'fs-sellable-stroke', (e) => {
        const props = e.features[0].properties;
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(`
                <h3>Forest Service Sellable Land</h3>
                <p><strong>Name:</strong> ${props.NAME || props.FORESTNAME || 'N/A'}</p>
                <p><strong>Acres:</strong> ${props.Acres ? Number(props.Acres).toLocaleString() : 'N/A'}</p>
                <p style="color: #006400;"><strong>Available for Sale</strong></p>
            `)
            .addTo(map);
    });

    // Add forest name labels layer
    map.addLayer({
        id: 'fs-labels',
        type: 'symbol',
        source: 'fs-all',
        'source-layer': 'fs_all',
        layout: {
            'text-field': ['get', 'FORESTNAME'],
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, 0],
            'text-anchor': 'center',
            'visibility': 'none'
        },
        paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#000000',
            'text-halo-width': 1
        },
        minzoom: 8
    });
    
    // Change cursor on hover
    ['blm-all-fill', 'fs-all-fill', 'blm-sellable-stroke', 'fs-sellable-stroke'].forEach(layer => {
        map.on('mouseenter', layer, () => { 
            map.getCanvas().style.cursor = 'pointer'; 
        });
        map.on('mouseleave', layer, () => { 
            map.getCanvas().style.cursor = ''; 
        });
    });
    
    // Layer toggles
    document.getElementById('toggle-blm-all').addEventListener('change', function(e) {
        const visibility = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty('blm-all-fill', 'visibility', visibility);
    });
    
    document.getElementById('toggle-fs-all').addEventListener('change', function(e) {
        const visibility = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty('fs-all-fill', 'visibility', visibility);
    });
    
    document.getElementById('toggle-blm-sellable').addEventListener('change', function(e) {
        const visibility = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty('blm-sellable-stroke', 'visibility', visibility);
    });
    
    document.getElementById('toggle-fs-sellable').addEventListener('change', function(e) {
        const visibility = e.target.checked ? 'visible' : 'none';
        map.setLayoutProperty('fs-sellable-stroke', 'visibility', visibility);
    });
});

// Navigation controls
map.addControl(new mapboxgl.NavigationControl());
map.addControl(new mapboxgl.FullscreenControl());

// Geolocate control
map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true,
    showUserHeading: true
}));

// Terrain Editor Functions
function toggleTerrainControls() {
    const controls = document.getElementById('terrain-controls');
    const icon = document.getElementById('collapse-icon');
    
    if (controls.classList.contains('collapsed')) {
        controls.classList.remove('collapsed');
        icon.textContent = '−';
    } else {
        controls.classList.add('collapsed');
        icon.textContent = '+';
    }
}

// Initialize range input displays
document.addEventListener('DOMContentLoaded', function() {
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
        const valueDisplay = document.getElementById(input.id + '-value');
        if (valueDisplay) {
            valueDisplay.textContent = input.value;
            input.addEventListener('input', function() {
                valueDisplay.textContent = this.value;
            });
        }
    });
    
    // Color input synchronization
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        const textInput = document.getElementById(input.id + '-text');
        if (textInput) {
            input.addEventListener('input', () => {
                textInput.value = input.value;
            });
            textInput.addEventListener('input', () => {
                if (/^#[0-9A-F]{6}$/i.test(textInput.value)) {
                    input.value = textInput.value;
                }
            });
        }
    });
});

// Terrain Controls
document.getElementById('terrain-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        const exaggeration = parseFloat(document.getElementById('terrain-exaggeration').value);
        map.setTerrain({ source: 'mapbox-dem', exaggeration: exaggeration });
    } else {
        map.setTerrain(null);
    }
});

document.getElementById('terrain-exaggeration').addEventListener('input', function(e) {
    if (document.getElementById('terrain-toggle').checked) {
        map.setTerrain({ source: 'mapbox-dem', exaggeration: parseFloat(e.target.value) });
    }
});

// Hillshade Controls
document.getElementById('hillshade-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        applyHillshadeSettings();
    } else {
        removeLayerIfExists('hillshade-layer');
    }
});

function applyHillshadeSettings() {
    const shadowColor = document.getElementById('hillshade-shadow-color').value;
    const highlightColor = document.getElementById('hillshade-highlight-color').value;
    const illumination = parseFloat(document.getElementById('hillshade-illumination').value);
    const exaggeration = parseFloat(document.getElementById('hillshade-exaggeration').value);
    
    removeLayerIfExists('hillshade-layer');
    
    map.addLayer({
        id: 'hillshade-layer',
        type: 'hillshade',
        source: 'mapbox-dem',
        paint: {
            'hillshade-shadow-color': shadowColor,
            'hillshade-highlight-color': highlightColor,
            'hillshade-illumination-direction': illumination,
            'hillshade-exaggeration': exaggeration
        }
    }, 'blm-all-fill');
}

['hillshade-shadow-color', 'hillshade-highlight-color', 'hillshade-illumination', 'hillshade-exaggeration'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (document.getElementById('hillshade-toggle').checked) {
            applyHillshadeSettings();
        }
    });
});

// Sky Controls
document.getElementById('sky-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        applySkySettings();
    } else {
        removeLayerIfExists('sky');
    }
});

function applySkySettings() {
    const sunIntensity = parseFloat(document.getElementById('sky-sun-intensity').value);
    const sunX = parseFloat(document.getElementById('sky-sun-x').value);
    const sunY = parseFloat(document.getElementById('sky-sun-y').value);
    
    removeLayerIfExists('sky');
    
    map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
            'sky-type': 'atmosphere',
            'sky-atmosphere-sun': [sunX, sunY],
            'sky-atmosphere-sun-intensity': sunIntensity
        }
    });
}

['sky-sun-intensity', 'sky-sun-x', 'sky-sun-y'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (document.getElementById('sky-toggle').checked) {
            applySkySettings();
        }
    });
});

// Fog Controls
document.getElementById('fog-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        applyFogSettings();
    } else {
        map.setFog(null);
    }
});

function applyFogSettings() {
    const color = document.getElementById('fog-color').value;
    const horizonBlend = parseFloat(document.getElementById('fog-horizon-blend').value);
    const distance = parseFloat(document.getElementById('fog-distance').value);
    
    const rangeMin = 0.5;
    const rangeMax = 0.5 + (distance / 10);
    
    map.setFog({
        'color': color,
        'horizon-blend': horizonBlend,
        'range': [rangeMin, rangeMax]
    });
}

['fog-color', 'fog-horizon-blend', 'fog-distance'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (document.getElementById('fog-toggle').checked) {
            applyFogSettings();
        }
    });
});

// Helper function
function removeLayerIfExists(layerId) {
    if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
    }
}

// Map Style Controls
document.getElementById('map-style-select').addEventListener('change', function(e) {
    const newStyle = e.target.value;
    const currentLayers = getCurrentLayerStates();
    
    map.setStyle(newStyle);
    
    // Re-add layers after style loads
    map.once('styledata', function() {
        // Re-add DEM source
        if (!map.getSource('mapbox-dem')) {
            map.addSource('mapbox-dem', {
                type: 'raster-dem',
                url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
                tileSize: 512,
                maxzoom: 14
            });
        }
        
        // Re-apply terrain if enabled
        if (document.getElementById('terrain-toggle').checked) {
            const exaggeration = parseFloat(document.getElementById('terrain-exaggeration').value);
            map.setTerrain({ source: 'mapbox-dem', exaggeration: exaggeration });
        }
        
        // Re-add vector sources and layers
        addVectorLayers();
        
        // Restore layer states
        restoreLayerStates(currentLayers);
        
        // Re-apply custom effects
        if (document.getElementById('hillshade-toggle').checked) {
            applyHillshadeSettings();
        }
        if (document.getElementById('sky-toggle').checked) {
            applySkySettings();
        }
        if (document.getElementById('fog-toggle').checked) {
            applyFogSettings();
        }
    });
});

function getCurrentLayerStates() {
    return {
        blmAll: document.getElementById('toggle-blm-all').checked,
        fsAll: document.getElementById('toggle-fs-all').checked,
        blmSellable: document.getElementById('toggle-blm-sellable').checked,
        fsSellable: document.getElementById('toggle-fs-sellable').checked
    };
}

function restoreLayerStates(states) {
    if (map.getLayer('blm-all-fill')) {
        map.setLayoutProperty('blm-all-fill', 'visibility', states.blmAll ? 'visible' : 'none');
    }
    if (map.getLayer('fs-all-fill')) {
        map.setLayoutProperty('fs-all-fill', 'visibility', states.fsAll ? 'visible' : 'none');
    }
    if (map.getLayer('blm-sellable-stroke')) {
        map.setLayoutProperty('blm-sellable-stroke', 'visibility', states.blmSellable ? 'visible' : 'none');
    }
    if (map.getLayer('fs-sellable-stroke')) {
        map.setLayoutProperty('fs-sellable-stroke', 'visibility', states.fsSellable ? 'visible' : 'none');
    }
}

function addVectorLayers() {
    // Add vector tile sources
    if (!map.getSource('blm-all')) {
        map.addSource('blm-all', {
            type: 'vector',
            tiles: ['http://localhost:8080/data/blm_all_hires/{z}/{x}/{y}.pbf'],
            minzoom: 0,
            maxzoom: 14
        });
    }
    
    if (!map.getSource('fs-all')) {
        map.addSource('fs-all', {
            type: 'vector',
            tiles: ['http://localhost:8080/data/fs_all_hires/{z}/{x}/{y}.pbf'],
            minzoom: 0,
            maxzoom: 14
        });
    }
    
    if (!map.getSource('blm-sellable')) {
        map.addSource('blm-sellable', {
            type: 'vector',
            tiles: ['http://localhost:8080/data/blm_sellable_hires/{z}/{x}/{y}.pbf'],
            minzoom: 0,
            maxzoom: 14
        });
    }
    
    if (!map.getSource('fs-sellable')) {
        map.addSource('fs-sellable', {
            type: 'vector',
            tiles: ['http://localhost:8080/data/fs_sellable_hires/{z}/{x}/{y}.pbf'],
            minzoom: 0,
            maxzoom: 14
        });
    }

    // Add layers with current styling
    if (!map.getLayer('blm-all-fill')) {
        map.addLayer({
            id: 'blm-all-fill',
            type: 'fill',
            source: 'blm-all',
            'source-layer': 'blm_all',
            paint: {
                'fill-color': document.getElementById('blm-all-color').value,
                'fill-opacity': parseFloat(document.getElementById('blm-all-opacity').value)
            },
            layout: {
                'visibility': 'visible'
            }
        });
    }
    
    if (!map.getLayer('fs-all-fill')) {
        map.addLayer({
            id: 'fs-all-fill',
            type: 'fill',
            source: 'fs-all',
            'source-layer': 'fs_all',
            paint: {
                'fill-color': document.getElementById('fs-all-color').value,
                'fill-opacity': parseFloat(document.getElementById('fs-all-opacity').value)
            },
            layout: {
                'visibility': 'visible'
            }
        });
    }
    
    if (!map.getLayer('blm-sellable-stroke')) {
        map.addLayer({
            id: 'blm-sellable-stroke',
            type: 'line',
            source: 'blm-sellable',
            'source-layer': 'blm_sellable',
            paint: {
                'line-color': document.getElementById('blm-sellable-color').value,
                'line-width': parseFloat(document.getElementById('blm-sellable-width').value),
                'line-opacity': 0.8
            },
            layout: {
                'visibility': 'visible'
            }
        });
    }
    
    if (!map.getLayer('fs-sellable-stroke')) {
        map.addLayer({
            id: 'fs-sellable-stroke',
            type: 'line',
            source: 'fs-sellable',
            'source-layer': 'fs_sellable',
            paint: {
                'line-color': document.getElementById('fs-sellable-color').value,
                'line-width': parseFloat(document.getElementById('fs-sellable-width').value),
                'line-opacity': 0.8
            },
            layout: {
                'visibility': 'visible'
            }
        });
    }

    // Add forest labels layer
    if (!map.getLayer('fs-labels')) {
        map.addLayer({
            id: 'fs-labels',
            type: 'symbol',
            source: 'fs-all',
            'source-layer': 'fs_all',
            layout: {
                'text-field': ['get', 'FORESTNAME'],
                'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                'text-size': parseInt(document.getElementById('fs-label-size').value),
                'text-offset': [0, 0],
                'text-anchor': 'center',
                'visibility': document.getElementById('fs-labels-toggle').checked ? 'visible' : 'none'
            },
            paint: {
                'text-color': document.getElementById('fs-label-color').value,
                'text-halo-color': '#000000',
                'text-halo-width': 1
            },
            minzoom: parseInt(document.getElementById('fs-label-min-zoom').value)
        });
    }
}

// Layer Styling Controls
['blm-all-color', 'blm-all-opacity'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (map.getLayer('blm-all-fill')) {
            if (id.includes('color')) {
                map.setPaintProperty('blm-all-fill', 'fill-color', this.value);
                // Update color pip in layer controls
                const pip = document.querySelector('#toggle-blm-all + label .color-pip');
                if (pip) pip.style.backgroundColor = this.value;
                // Update text input
                const textInput = document.getElementById(id + '-text');
                if (textInput) textInput.value = this.value;
            } else {
                map.setPaintProperty('blm-all-fill', 'fill-opacity', parseFloat(this.value));
            }
        }
    });
});

// Add text input listeners for colors
document.getElementById('blm-all-color-text').addEventListener('input', function() {
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        document.getElementById('blm-all-color').value = this.value;
        if (map.getLayer('blm-all-fill')) {
            map.setPaintProperty('blm-all-fill', 'fill-color', this.value);
            const pip = document.querySelector('#toggle-blm-all + label .color-pip');
            if (pip) pip.style.backgroundColor = this.value;
        }
    }
});

['fs-all-color', 'fs-all-opacity'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (map.getLayer('fs-all-fill')) {
            if (id.includes('color')) {
                map.setPaintProperty('fs-all-fill', 'fill-color', this.value);
                // Update color pip in layer controls
                const pip = document.querySelector('#toggle-fs-all + label .color-pip');
                if (pip) pip.style.backgroundColor = this.value;
                // Update text input
                const textInput = document.getElementById(id + '-text');
                if (textInput) textInput.value = this.value;
            } else {
                map.setPaintProperty('fs-all-fill', 'fill-opacity', parseFloat(this.value));
            }
        }
    });
});

document.getElementById('fs-all-color-text').addEventListener('input', function() {
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        document.getElementById('fs-all-color').value = this.value;
        if (map.getLayer('fs-all-fill')) {
            map.setPaintProperty('fs-all-fill', 'fill-color', this.value);
            const pip = document.querySelector('#toggle-fs-all + label .color-pip');
            if (pip) pip.style.backgroundColor = this.value;
        }
    }
});

['blm-sellable-color', 'blm-sellable-width'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (map.getLayer('blm-sellable-stroke')) {
            if (id.includes('color')) {
                map.setPaintProperty('blm-sellable-stroke', 'line-color', this.value);
                // Update color pip in layer controls
                const pip = document.querySelector('#toggle-blm-sellable + label .color-pip');
                if (pip) pip.style.borderColor = this.value;
                // Update text input
                const textInput = document.getElementById(id + '-text');
                if (textInput) textInput.value = this.value;
            } else {
                map.setPaintProperty('blm-sellable-stroke', 'line-width', parseFloat(this.value));
            }
        }
    });
});

document.getElementById('blm-sellable-color-text').addEventListener('input', function() {
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        document.getElementById('blm-sellable-color').value = this.value;
        if (map.getLayer('blm-sellable-stroke')) {
            map.setPaintProperty('blm-sellable-stroke', 'line-color', this.value);
            const pip = document.querySelector('#toggle-blm-sellable + label .color-pip');
            if (pip) pip.style.borderColor = this.value;
        }
    }
});

['fs-sellable-color', 'fs-sellable-width'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (map.getLayer('fs-sellable-stroke')) {
            if (id.includes('color')) {
                map.setPaintProperty('fs-sellable-stroke', 'line-color', this.value);
                // Update color pip in layer controls
                const pip = document.querySelector('#toggle-fs-sellable + label .color-pip');
                if (pip) pip.style.borderColor = this.value;
                // Update text input
                const textInput = document.getElementById(id + '-text');
                if (textInput) textInput.value = this.value;
            } else {
                map.setPaintProperty('fs-sellable-stroke', 'line-width', parseFloat(this.value));
            }
        }
    });
});

document.getElementById('fs-sellable-color-text').addEventListener('input', function() {
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        document.getElementById('fs-sellable-color').value = this.value;
        if (map.getLayer('fs-sellable-stroke')) {
            map.setPaintProperty('fs-sellable-stroke', 'line-color', this.value);
            const pip = document.querySelector('#toggle-fs-sellable + label .color-pip');
            if (pip) pip.style.borderColor = this.value;
        }
    }
});

// Label Controls
document.getElementById('fs-labels-toggle').addEventListener('change', function() {
    if (map.getLayer('fs-labels')) {
        map.setLayoutProperty('fs-labels', 'visibility', this.checked ? 'visible' : 'none');
    }
});

document.getElementById('fs-label-size').addEventListener('input', function() {
    if (map.getLayer('fs-labels')) {
        map.setLayoutProperty('fs-labels', 'text-size', parseInt(this.value));
    }
    document.getElementById('fs-label-size-value').textContent = this.value;
});

document.getElementById('fs-label-color').addEventListener('input', function() {
    if (map.getLayer('fs-labels')) {
        map.setPaintProperty('fs-labels', 'text-color', this.value);
    }
    document.getElementById('fs-label-color-text').value = this.value;
});

document.getElementById('fs-label-color-text').addEventListener('input', function() {
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        document.getElementById('fs-label-color').value = this.value;
        if (map.getLayer('fs-labels')) {
            map.setPaintProperty('fs-labels', 'text-color', this.value);
        }
    }
});

document.getElementById('fs-label-min-zoom').addEventListener('input', function() {
    if (map.getLayer('fs-labels')) {
        map.setMinZoom('fs-labels', parseInt(this.value));
    }
    document.getElementById('fs-label-min-zoom-value').textContent = this.value;
}); 
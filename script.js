mapboxgl.accessToken = 'pk.eyJ1Ijoiam9ubml3YWxrZXIiLCJhIjoiY2loeG82cWplMDA4N3cxa3MzZXU2N2JpYSJ9.H6vPKI0UKLv733mSCXh2Lw';

const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/cjerxnqt3cgvp2rmyuxbeqme7', // Cali Terrain style
    center: [-114.28373454043344, 41.22408051430463], // Centered on specified coordinates
    zoom: 3, // Initial zoom level
    pitch: 0, // No tilt
    bearing: 0,
    antialias: true,
    projection: 'globe' // Force globe projection
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



map.on('load', () => {
    // Use the consolidated layer creation function
    addVectorLayers();
    
    // Change cursor on hover
    ['blm-all-fill', 'fs-all-fill', 'blm-sellable-fill', 'fs-sellable-fill'].forEach(layer => {
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
        if (map.getLayer('blm-all-fill')) {
            map.setLayoutProperty('blm-all-fill', 'visibility', visibility);
        }
    });
    
    document.getElementById('toggle-fs-all').addEventListener('change', function(e) {
        const visibility = e.target.checked ? 'visible' : 'none';
        if (map.getLayer('fs-all-fill')) {
            map.setLayoutProperty('fs-all-fill', 'visibility', visibility);
        }
    });
    
    document.getElementById('toggle-blm-sellable').addEventListener('change', function(e) {
        const visibility = e.target.checked ? 'visible' : 'none';
            if (map.getLayer('blm-sellable-fill')) {
        map.setLayoutProperty('blm-sellable-fill', 'visibility', visibility);
    }
    });
    
    document.getElementById('toggle-fs-sellable').addEventListener('change', function(e) {
        const visibility = e.target.checked ? 'visible' : 'none';
            if (map.getLayer('fs-sellable-fill')) {
        map.setLayoutProperty('fs-sellable-fill', 'visibility', visibility);
    }
    });
    
    document.getElementById('toggle-fs-labels').addEventListener('change', function(e) {
        const visibility = e.target.checked ? 'visible' : 'none';
        if (map.getLayer('fs-labels')) {
            map.setLayoutProperty('fs-labels', 'visibility', visibility);
        }
    });
});

// Navigation controls (zoom and compass)
map.addControl(new mapboxgl.NavigationControl({
    showCompass: true,
    showZoom: true
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

function toggleAboutPanel() {
    const panel = document.getElementById('about-panel');
    const icon = document.getElementById('about-collapse-icon');
    
    if (panel.classList.contains('collapsed')) {
        panel.classList.remove('collapsed');
        icon.textContent = '−';
    } else {
        panel.classList.add('collapsed');
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

// Stroke Controls
document.getElementById('blm-sellable-stroke-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        addBLMSellableStroke();
    } else {
        removeLayerIfExists('blm-sellable-stroke');
    }
});

document.getElementById('fs-sellable-stroke-toggle').addEventListener('change', function(e) {
    if (e.target.checked) {
        addFSSellableStroke();
    } else {
        removeLayerIfExists('fs-sellable-stroke');
    }
});

function addBLMSellableStroke() {
    const colorEl = document.getElementById('blm-sellable-stroke-color');
    const widthEl = document.getElementById('blm-sellable-stroke-width');
    
    removeLayerIfExists('blm-sellable-stroke');
    
    map.addLayer({
        id: 'blm-sellable-stroke',
        type: 'line',
        source: 'blm-sellable',
        'source-layer': 'blm_sellable',
        paint: {
            'line-color': colorEl ? colorEl.value : '#CC8800',
            'line-width': widthEl ? parseFloat(widthEl.value) : 0.1,
            'line-opacity': 0.8
        },
        layout: {
            'visibility': 'visible'
        }
    });
}

function addFSSellableStroke() {
    const colorEl = document.getElementById('fs-sellable-stroke-color');
    const widthEl = document.getElementById('fs-sellable-stroke-width');
    
    removeLayerIfExists('fs-sellable-stroke');
    
    map.addLayer({
        id: 'fs-sellable-stroke',
        type: 'line',
        source: 'fs-sellable',
        'source-layer': 'fs_sellable',
        paint: {
            'line-color': colorEl ? colorEl.value : '#0D4D0D',
            'line-width': widthEl ? parseFloat(widthEl.value) : 0.1,
            'line-opacity': 0.8
        },
        layout: {
            'visibility': 'visible'
        }
    });
}

// BLM Sellable Stroke Controls
['blm-sellable-stroke-color', 'blm-sellable-stroke-width'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (document.getElementById('blm-sellable-stroke-toggle').checked) {
            if (id.includes('color')) {
                map.setPaintProperty('blm-sellable-stroke', 'line-color', this.value);
                const textInput = document.getElementById(id + '-text');
                if (textInput) textInput.value = this.value;
            } else {
                map.setPaintProperty('blm-sellable-stroke', 'line-width', parseFloat(this.value));
                document.getElementById(id + '-value').textContent = this.value;
            }
        }
    });
});

// FS Sellable Stroke Controls
['fs-sellable-stroke-color', 'fs-sellable-stroke-width'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (document.getElementById('fs-sellable-stroke-toggle').checked) {
            if (id.includes('color')) {
                map.setPaintProperty('fs-sellable-stroke', 'line-color', this.value);
                const textInput = document.getElementById(id + '-text');
                if (textInput) textInput.value = this.value;
            } else {
                map.setPaintProperty('fs-sellable-stroke', 'line-width', parseFloat(this.value));
                document.getElementById(id + '-value').textContent = this.value;
            }
        }
    });
});

// Text input handlers for stroke colors
document.getElementById('blm-sellable-stroke-color-text').addEventListener('input', function() {
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        document.getElementById('blm-sellable-stroke-color').value = this.value;
        if (document.getElementById('blm-sellable-stroke-toggle').checked) {
            map.setPaintProperty('blm-sellable-stroke', 'line-color', this.value);
        }
    }
});

document.getElementById('fs-sellable-stroke-color-text').addEventListener('input', function() {
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        document.getElementById('fs-sellable-stroke-color').value = this.value;
        if (document.getElementById('fs-sellable-stroke-toggle').checked) {
            map.setPaintProperty('fs-sellable-stroke', 'line-color', this.value);
        }
    }
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
    
    // Preserve current view state
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const currentBearing = map.getBearing();
    const currentPitch = map.getPitch();
    
    map.setStyle(newStyle);
    
    // Re-add layers after style loads
    map.once('style.load', function() {
        // Force globe projection for all styles
        map.setProjection('globe');
        
        // Restore view state
        map.setCenter(currentCenter);
        map.setZoom(currentZoom);
        map.setBearing(currentBearing);
        map.setPitch(currentPitch);
        
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
        
        // Restore layer states after a brief delay to ensure layers are created
        setTimeout(() => {
            restoreLayerStates(currentLayers);
        }, 100);
        
        // Re-apply stroke effects
        if (document.getElementById('blm-sellable-stroke-toggle').checked) {
            addBLMSellableStroke();
        }
        if (document.getElementById('fs-sellable-stroke-toggle').checked) {
            addFSSellableStroke();
        }
    });
});

function getCurrentLayerStates() {
    return {
        blmAll: document.getElementById('toggle-blm-all').checked,
        fsAll: document.getElementById('toggle-fs-all').checked,
        blmSellable: document.getElementById('toggle-blm-sellable').checked,
        fsSellable: document.getElementById('toggle-fs-sellable').checked,
        fsLabels: document.getElementById('toggle-fs-labels').checked
    };
}

function restoreLayerStates(states) {
    try {
        if (map.getLayer('blm-all-fill')) {
            map.setLayoutProperty('blm-all-fill', 'visibility', states.blmAll ? 'visible' : 'none');
        }
        if (map.getLayer('fs-all-fill')) {
            map.setLayoutProperty('fs-all-fill', 'visibility', states.fsAll ? 'visible' : 'none');
        }
            if (map.getLayer('blm-sellable-fill')) {
        map.setLayoutProperty('blm-sellable-fill', 'visibility', states.blmSellable ? 'visible' : 'none');
    }
            if (map.getLayer('fs-sellable-fill')) {
        map.setLayoutProperty('fs-sellable-fill', 'visibility', states.fsSellable ? 'visible' : 'none');
    }
        if (map.getLayer('fs-labels')) {
            map.setLayoutProperty('fs-labels', 'visibility', states.fsLabels ? 'visible' : 'none');
        }
    } catch (error) {
        console.warn('Error restoring layer states:', error);
        // Retry after another delay if layers aren't ready
        setTimeout(() => restoreLayerStates(states), 200);
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

    // Add layers with current styling (fallback to defaults if controls not available)
    if (!map.getLayer('blm-all-fill')) {
        const blmColorEl = document.getElementById('blm-all-color');
        const blmOpacityEl = document.getElementById('blm-all-opacity');
        map.addLayer({
            id: 'blm-all-fill',
            type: 'fill',
            source: 'blm-all',
            'source-layer': 'blm_all',
            paint: {
                'fill-color': blmColorEl ? blmColorEl.value : '#FFD700',
                'fill-opacity': blmOpacityEl ? parseFloat(blmOpacityEl.value) : 0.6
            },
            layout: {
                'visibility': 'visible'
            }
        });
    }
    
    if (!map.getLayer('fs-all-fill')) {
        const fsColorEl = document.getElementById('fs-all-color');
        const fsOpacityEl = document.getElementById('fs-all-opacity');
        map.addLayer({
            id: 'fs-all-fill',
            type: 'fill',
            source: 'fs-all',
            'source-layer': 'fs_all',
            paint: {
                'fill-color': fsColorEl ? fsColorEl.value : '#228B22',
                'fill-opacity': fsOpacityEl ? parseFloat(fsOpacityEl.value) : 0.6
            },
            layout: {
                'visibility': 'visible'
            }
        });
    }
    
    if (!map.getLayer('blm-sellable-fill')) {
        const blmSellColorEl = document.getElementById('blm-sellable-color');
        const blmSellOpacityEl = document.getElementById('blm-sellable-opacity');
        map.addLayer({
            id: 'blm-sellable-fill',
            type: 'fill',
            source: 'blm-sellable',
            'source-layer': 'blm_sellable',
            paint: {
                'fill-color': blmSellColorEl ? blmSellColorEl.value : '#FFB400',
                'fill-opacity': blmSellOpacityEl ? parseFloat(blmSellOpacityEl.value) : 0.6
            },
            layout: {
                'visibility': 'visible'
            }
        });
    }
    
    if (!map.getLayer('fs-sellable-fill')) {
        const fsSellColorEl = document.getElementById('fs-sellable-color');
        const fsSellOpacityEl = document.getElementById('fs-sellable-opacity');
        map.addLayer({
            id: 'fs-sellable-fill',
            type: 'fill',
            source: 'fs-sellable',
            'source-layer': 'fs_sellable',
            paint: {
                'fill-color': fsSellColorEl ? fsSellColorEl.value : '#126612',
                'fill-opacity': fsSellOpacityEl ? parseFloat(fsSellOpacityEl.value) : 0.6
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
                'text-size': 10,
                'text-offset': [0, 0],
                'text-anchor': 'center',
                'visibility': 'none'
            },
            paint: {
                'text-color': '#ffffff',
                'text-halo-color': '#989d6c',
                'text-halo-width': .5
            },
            minzoom: 4
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

['blm-sellable-color', 'blm-sellable-opacity'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (map.getLayer('blm-sellable-fill')) {
            if (id.includes('color')) {
                map.setPaintProperty('blm-sellable-fill', 'fill-color', this.value);
                // Update color pip in layer controls
                const pip = document.querySelector('#toggle-blm-sellable + label .color-pip');
                if (pip) pip.style.backgroundColor = this.value;
                // Update text input
                const textInput = document.getElementById(id + '-text');
                if (textInput) textInput.value = this.value;
            } else {
                map.setPaintProperty('blm-sellable-fill', 'fill-opacity', parseFloat(this.value));
            }
        }
    });
});

document.getElementById('blm-sellable-color-text').addEventListener('input', function() {
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        document.getElementById('blm-sellable-color').value = this.value;
        if (map.getLayer('blm-sellable-fill')) {
            map.setPaintProperty('blm-sellable-fill', 'fill-color', this.value);
            const pip = document.querySelector('#toggle-blm-sellable + label .color-pip');
            if (pip) pip.style.backgroundColor = this.value;
        }
    }
});

['fs-sellable-color', 'fs-sellable-opacity'].forEach(id => {
    document.getElementById(id).addEventListener('input', function() {
        if (map.getLayer('fs-sellable-fill')) {
            if (id.includes('color')) {
                map.setPaintProperty('fs-sellable-fill', 'fill-color', this.value);
                // Update color pip in layer controls
                const pip = document.querySelector('#toggle-fs-sellable + label .color-pip');
                if (pip) pip.style.backgroundColor = this.value;
                // Update text input
                const textInput = document.getElementById(id + '-text');
                if (textInput) textInput.value = this.value;
            } else {
                map.setPaintProperty('fs-sellable-fill', 'fill-opacity', parseFloat(this.value));
            }
        }
    });
});

document.getElementById('fs-sellable-color-text').addEventListener('input', function() {
    if (/^#[0-9A-F]{6}$/i.test(this.value)) {
        document.getElementById('fs-sellable-color').value = this.value;
        if (map.getLayer('fs-sellable-fill')) {
            map.setPaintProperty('fs-sellable-fill', 'fill-color', this.value);
            const pip = document.querySelector('#toggle-fs-sellable + label .color-pip');
            if (pip) pip.style.backgroundColor = this.value;
        }
    }
});


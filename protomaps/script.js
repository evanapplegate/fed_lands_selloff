// Register PMTiles protocol for MapLibre GL JS
let protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

// UPDATE THIS WITH YOUR PAID MAPBOX TOKEN
const MAPBOX_ACCESS_TOKEN = 'pk.eyJ1IjoiZXZhbmRhcHBsZWdhdGUiLCJhIjoiY2tmbzA1cWM1MWozeTM4cXV4eHUwMzFhdiJ9.Z5f9p8jJD_N1MQwycF2NEw'; // REPLACE WITH YOUR TOKEN

const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {},
        glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf",
        layers: [
            {
                id: 'background',
                type: 'background',
                paint: {
                    'background-color': '#f8f8f8'
                }
            }
        ]
    },
    center: [-114.28373454043344, 41.22408051430463],
    zoom: 3,
    pitch: 0,
    bearing: 0,
    antialias: true,
    projection: 'globe'
});

// Terrain functionality  
map.on('style.load', () => {
    // Add terrain source - using AWS Terrain tiles (free)
    if (!map.getSource('aws-terrain')) {
        map.addSource('aws-terrain', {
            type: 'raster-dem',
            tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 15,
            encoding: 'terrarium'
        });
    }
});

// No Mapbox protocol - using simple style first

// Use a variable to track if initial layers are added
let initialLayersAdded = false;

map.on('load', () => {
    addVectorLayers();
    initialLayersAdded = true;
    
    // Load the default selected basemap
    const defaultStyle = document.getElementById('map-style-select').value;
    if (defaultStyle && defaultStyle !== 'blank') {
        loadBasemap(defaultStyle);
    }
    
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
map.addControl(new maplibregl.NavigationControl({
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
        // Enable terrain
        try {
            const exaggeration = parseFloat(document.getElementById('terrain-exaggeration').value) || 1;
            map.setTerrain({ source: 'aws-terrain', exaggeration: exaggeration });
        } catch (error) {
            console.error('Error enabling terrain:', error);
            e.target.checked = false;
            alert('Could not enable terrain: ' + error.message);
        }
    } else {
        // Disable terrain
        map.setTerrain(null);
    }
});

document.getElementById('terrain-exaggeration').addEventListener('input', function(e) {
    const exaggeration = parseFloat(e.target.value);
    document.getElementById('terrain-exaggeration-value').textContent = exaggeration;
    
    // Update terrain if enabled
    if (document.getElementById('terrain-toggle').checked && map.getTerrain()) {
        map.setTerrain({ source: 'aws-terrain', exaggeration: exaggeration });
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

function transformStyleUrls(style, accessToken) {
    const transformUrl = (url) => {
        if (typeof url !== 'string' || !url.startsWith('mapbox://')) {
            return url;
        }

        let newUrl = url.replace(/^mapbox:\/\//, '');

        if (url.startsWith('mapbox://sprites')) {
            newUrl = `https://api.mapbox.com/styles/v1/${newUrl.replace('sprites/', '')}/sprite?access_token=${accessToken}`;
        } else if (url.startsWith('mapbox://fonts')) {
            newUrl = `https://api.mapbox.com/fonts/v1/${newUrl.replace('fonts/', '')}?access_token=${accessToken}`;
        } else {
            // It's a source
            newUrl = `https://api.mapbox.com/v4/${newUrl}.json?access_token=${accessToken}`;
        }
        return newUrl;
    };

    if (style.sources) {
        for (const sourceId in style.sources) {
            const source = style.sources[sourceId];
            if (source.url) {
                source.url = transformUrl(source.url);
            }
        }
    }

    if (style.sprite) {
        style.sprite = transformUrl(style.sprite);
    }

    if (style.glyphs) {
        style.glyphs = transformUrl(style.glyphs);
    }

    return style;
}

// Basemap loading function
async function loadBasemap(styleUrl, preserveView = true) {
    const layerStates = preserveView ? getCurrentLayerStates() : null;
    
    // Preserve view state if requested
    let viewState = null;
    if (preserveView) {
        const { lng, lat } = map.getCenter();
        viewState = {
            center: { lng, lat },
            zoom: map.getZoom(),
            bearing: map.getBearing(),
            pitch: map.getPitch()
        };
    }

    let baseStyle;
    const accessToken = MAPBOX_ACCESS_TOKEN;

    try {
        if (styleUrl === 'blank') {
            baseStyle = {
                version: 8,
                sources: {},
                layers: [{
                    id: 'background',
                    type: 'background',
                    paint: { 'background-color': '#f8f8f8' }
                }],
                glyphs: "https://fonts.openmaptiles.org/{fontstack}/{range}.pbf"
            };
        } else {
            const response = await fetch(styleUrl);
            baseStyle = await response.json();
            baseStyle = transformStyleUrls(baseStyle, MAPBOX_ACCESS_TOKEN);
        }
    } catch (error) {
        console.error("Failed to load or transform style:", error);
        if (preserveView) alert("Could not load the selected map style.");
        return;
    }

    baseStyle.projection = { name: 'globe' };
    baseStyle.sources = { ...baseStyle.sources, ...getCustomSources() };
    baseStyle.layers = [...baseStyle.layers, ...getCustomLayers()];
    
    map.setStyle(baseStyle, { diff: false });

    map.once('idle', () => {
        if (preserveView && layerStates) {
            restoreLayerStates(layerStates);
        }
        if (preserveView && viewState) {
            map.setCenter(viewState.center);
            map.setZoom(viewState.zoom);
            map.setBearing(viewState.bearing);
            map.setPitch(viewState.pitch);
        }

        if (document.getElementById('blm-sellable-stroke-toggle').checked) addBLMSellableStroke();
        if (document.getElementById('fs-sellable-stroke-toggle').checked) addFSSellableStroke();
    });
}

// Map Style Controls
document.getElementById('map-style-select').addEventListener('change', async function(e) {
    const newStyleValue = e.target.value;
    await loadBasemap(newStyleValue, true);
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

function getCustomSources() {
    return {
        'blm-all': {
            type: 'vector',
            url: 'pmtiles:///data/blm_all_hires.pmtiles',
            attribution: 'BLM Data'
        },
        'fs-all': {
            type: 'vector',
            url: 'pmtiles:///data/fs_all_hires.pmtiles',
            attribution: 'USFS Data'
        },
        'blm-sellable': {
            type: 'vector',
            url: 'pmtiles:///data/blm_sellable_hires.pmtiles',
            attribution: 'BLM Sellable Data'
        },
        'fs-sellable': {
            type: 'vector',
            url: 'pmtiles:///data/fs_sellable_hires.pmtiles',
            attribution: 'USFS Sellable Data'
        }
    };
}

function getCustomLayers() {
    // Helper to get style values or defaults
    const getColor = (id, defaultColor) => document.getElementById(id) ? document.getElementById(id).value : defaultColor;
    const getOpacity = (id, defaultOpacity) => document.getElementById(id) ? parseFloat(document.getElementById(id).value) : defaultOpacity;

    return [
        {
            id: 'blm-all-fill',
            type: 'fill',
            source: 'blm-all',
            'source-layer': 'blm_all',
            paint: {
                'fill-color': getColor('blm-all-color', '#FFD700'),
                'fill-opacity': getOpacity('blm-all-opacity', 0.6)
            },
            layout: { 'visibility': 'visible' }
        },
        {
            id: 'fs-all-fill',
            type: 'fill',
            source: 'fs-all',
            'source-layer': 'fs_all',
            paint: {
                'fill-color': getColor('fs-all-color', '#228B22'),
                'fill-opacity': getOpacity('fs-all-opacity', 0.6)
            },
            layout: { 'visibility': 'visible' }
        },
        {
            id: 'blm-sellable-fill',
            type: 'fill',
            source: 'blm-sellable',
            'source-layer': 'blm_sellable',
            paint: {
                'fill-color': getColor('blm-sellable-color', '#FFB400'),
                'fill-opacity': getOpacity('blm-sellable-opacity', 0.6)
            },
            layout: { 'visibility': 'visible' }
        },
        {
            id: 'fs-sellable-fill',
            type: 'fill',
            source: 'fs-sellable',
            'source-layer': 'fs_sellable',
            paint: {
                'fill-color': getColor('fs-sellable-color', '#126612'),
                'fill-opacity': getOpacity('fs-sellable-opacity', 0.6)
            },
            layout: { 'visibility': 'visible' }
        },
        {
            id: 'fs-labels',
            type: 'symbol',
            source: 'fs-all',   
            'source-layer': 'fs_all',
            layout: {
                'text-field': ['get', 'FORESTNAME'],
                'text-font': ['Open Sans Regular'],
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
        }
    ];
}

function addVectorLayers() {
    const sources = getCustomSources();
    for (const sourceId in sources) {
        if (!map.getSource(sourceId)) {
            map.addSource(sourceId, sources[sourceId]);
        }
    }
    const layers = getCustomLayers();
    layers.forEach(layer => {
        if (!map.getLayer(layer.id)) {
            map.addLayer(layer);
        }
    });
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


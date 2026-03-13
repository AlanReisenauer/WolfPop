/**
 * map.js
 * Manages the Leaflet map, territory GeoJSON rendering, and year-based filtering.
 */

export class TerritoryMap {
  constructor(containerId) {
    this.containerId = containerId;
    this.map         = null;
    this.geoLayer    = null;
    this.allFeatures = null;
    this.currentYear = 1995;

    // Color palette for up to 20 distinct packs
    this.packColors = [
      '#e06c3a','#5ba85c','#4a9fd4','#c96bb5','#d4b84a',
      '#7ec8c8','#e08080','#82b882','#8080e0','#c8a070',
      '#60b0d0','#d07060','#70c070','#9070c0','#c0c060',
      '#d08040','#4080c0','#c04080','#40c080','#808040'
    ];
    this.packColorMap = {};
  }

  init() {
    this.map = L.map(this.containerId, {
      center: [44.6, -110.5],
      zoom: 9,
      zoomControl: true,
      attributionControl: true
    });

    // Satellite/terrain tiles (USGS National Map)
    L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'USGS National Map | NPS Wolf Project',
      maxZoom: 14,
      minZoom: 7
    }).addTo(this.map);

    // Fallback to OpenStreetMap if USGS unavailable
    this.map.on('tileerror', () => {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 14,
      }).addTo(this.map);
    });

    this._addYellowstoneBoundary();
  }

  _addYellowstoneBoundary() {
    // Rough bounding box of Yellowstone NP as a reference polygon
    const ynpBounds = [
      [44.132, -111.154], [44.132, -109.831],
      [45.103, -109.831], [45.103, -111.154]
    ];
    L.polygon(ynpBounds, {
      color: '#ffffff',
      weight: 1.5,
      dashArray: '6 4',
      fillOpacity: 0,
      interactive: false
    }).addTo(this.map).bindTooltip('Yellowstone National Park', {
      permanent: false, direction: 'top'
    });
  }

  loadTerritories(geojsonData) {
    this.allFeatures = geojsonData;
    this._renderYear(this.currentYear);
  }

  setYear(year) {
    this.currentYear = year;
    if (this.allFeatures) this._renderYear(year);
  }

  _renderYear(year) {
    if (this.geoLayer) {
      this.map.removeLayer(this.geoLayer);
      this.geoLayer = null;
    }

    if (!this.allFeatures) return;

    // Filter features to the selected year
    const filtered = {
      type: 'FeatureCollection',
      features: this.allFeatures.features.filter(f => {
        const fy = f.properties?.year ?? this._inferYear(f);
        return fy === year;
      })
    };

    if (filtered.features.length === 0) {
      document.getElementById('map-no-data').style.display = 'block';
      return;
    }
    document.getElementById('map-no-data').style.display = 'none';

    this.geoLayer = L.geoJSON(filtered, {
      style: (feature) => this._styleFeature(feature),
      onEachFeature: (feature, layer) => this._bindPopup(feature, layer)
    }).addTo(this.map);

    // Auto-fit the map to show all territories for the year
    try {
      this.map.fitBounds(this.geoLayer.getBounds(), { padding: [30, 30] });
    } catch(e) { /* bounds may fail if geometry is empty */ }
  }

  _inferYear(feature) {
    // Try to parse year from filename or name property
    const src = feature.properties?.filename
             ?? feature.properties?.name
             ?? feature.properties?.Name
             ?? '';
    const m = src.match(/((?:19|20)\d{2})/);
    return m ? parseInt(m[1]) : null;
  }

  _styleFeature(feature) {
    const packName = this._getPackName(feature);
    if (!this.packColorMap[packName]) {
      const idx = Object.keys(this.packColorMap).length % this.packColors.length;
      this.packColorMap[packName] = this.packColors[idx];
    }
    const color = this.packColorMap[packName];
    return {
      color,
      weight: 2,
      fillColor: color,
      fillOpacity: 0.25,
    };
  }

  _getPackName(feature) {
    return feature.properties?.Pack
        ?? feature.properties?.pack
        ?? feature.properties?.name
        ?? feature.properties?.Name
        ?? feature.properties?.filename?.replace(/^\d{4}_/, '').replace(/_mcp.*$/i,'')
        ?? 'Unknown Pack';
  }

  _bindPopup(feature, layer) {
    const name = this._getPackName(feature);
    const area = feature.properties?.ACRES
              ?? feature.properties?.area
              ?? feature.properties?.Area;
    const areaStr = area ? `<br><span class="pop-label">Area:</span> ${Math.round(area).toLocaleString()} acres` : '';
    layer.bindPopup(`
      <div class="map-popup">
        <strong>${name}</strong>
        ${areaStr}
      </div>
    `);
    layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.5, weight: 3 }));
    layer.on('mouseout',  () => this.geoLayer?.resetStyle(layer));
  }
}

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

    // OpenStreetMap — reliable, no API key needed
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors | NPS Wolf Project',
      maxZoom: 18,
      minZoom: 6
    }).addTo(this.map);

    this._addYellowstoneBoundary();
  }

  loadTerritories(geojsonData) {
    this.allFeatures = geojsonData;
    const sample = geojsonData.features
      .filter(f => f.properties.year)
      .slice(0, 6)
      .map(f => `${f.properties.year} — ${this._getPackName(f)}`);
    console.log('[TerritoryMap] Sample features:', sample);
    this._renderYear(this.currentYear);
  }

  setYear(year) {
    this.currentYear = year;
    if (this.allFeatures) this._renderYear(year);
  }

  _addYellowstoneBoundary() {
    // Approximate Yellowstone NP boundary polygon
    const ynpBounds = [
      [44.132, -111.154], [44.132, -109.831],
      [45.103, -109.831], [45.103, -111.154]
    ];
    L.polygon(ynpBounds, {
      color: '#f0c040',
      weight: 1.5,
      dashArray: '6 4',
      fillOpacity: 0,
      interactive: false
    }).addTo(this.map).bindTooltip('Yellowstone National Park', {
      permanent: false, direction: 'top'
    });
  }

  _renderYear(year) {
    if (this.geoLayer) {
      this.map.removeLayer(this.geoLayer);
      this.geoLayer = null;
    }
    if (!this.allFeatures) return;

    const filtered = {
      type: 'FeatureCollection',
      features: this.allFeatures.features.filter(f => f.properties.year === year)
    };

    const noDataEl = document.getElementById('map-no-data');
    if (filtered.features.length === 0) {
      noDataEl.style.display = 'flex';
      return;
    }
    noDataEl.style.display = 'none';

    this.geoLayer = L.geoJSON(filtered, {
      style:         f          => this._styleFeature(f),
      onEachFeature: (f, layer) => this._bindPopup(f, layer)
    }).addTo(this.map);

    try {
      this.map.fitBounds(this.geoLayer.getBounds(), { padding: [30, 30] });
    } catch (e) {}
  }

  _styleFeature(feature) {
    const packName = this._getPackName(feature);
    if (!this.packColorMap[packName]) {
      const idx = Object.keys(this.packColorMap).length % this.packColors.length;
      this.packColorMap[packName] = this.packColors[idx];
    }
    const color = this.packColorMap[packName];
    return { color, weight: 2, fillColor: color, fillOpacity: 0.3 };
  }

  _getPackName(feature) {
    const p = feature.properties ?? {};
    for (const c of [p.PACK, p.Pack, p.pack, p.id, p.Id, p.ID, p.name, p.Name]) {
      if (c && typeof c === 'string' && c.trim()) {
        return c.replace(/^(?:19|20)\d{2}[_\-]/, '')
                .replace(/_mcp.*$/i, '')
                .trim();
      }
    }
    return 'Unknown Pack';
  }

  _bindPopup(feature, layer) {
    const name = this._getPackName(feature);
    const p    = feature.properties ?? {};
    const year = p.year ?? '—';
    const area = p.ACRES ?? p.area ?? p.Area ?? p.AREA;
    const areaStr = area
      ? `<br><span class="pop-label">Area:</span> ${Math.round(area).toLocaleString()} acres`
      : '';

    layer.bindPopup(`
      <div class="map-popup">
        <strong>${name}</strong>
        <br><span class="pop-label">Year:</span> ${year}
        ${areaStr}
      </div>
    `);
    layer.on('mouseover', () => layer.setStyle({ fillOpacity: 0.55, weight: 3 }));
    layer.on('mouseout',  () => this.geoLayer?.resetStyle(layer));
  }
}
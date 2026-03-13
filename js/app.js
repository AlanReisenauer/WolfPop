/**
 * app.js
 * Main entry point. Bootstraps all modules, wires up the UI.
 */

import { Simulation }    from './simulation.js';
import { PopulationGraph } from './graph.js';
import { TerritoryMap }  from './map.js';

// ─── State ────────────────────────────────────────────────────────────────────
const state = {
  currentYear:   1995,
  activeView:    'graph',   // 'graph' | 'map'
  realWolfData:  [],
  realElkData:   [],
  simData:       [],
  territoriesLoaded: false,
  playing:       false,
  playInterval:  null,
};

const sim   = new Simulation();
const graph = new PopulationGraph('graph-canvas');
const map   = new TerritoryMap('map-container');

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const slider      = document.getElementById('time-slider');
const yearDisplay = document.getElementById('year-display');
const btnGraph    = document.getElementById('btn-graph');
const btnMap      = document.getElementById('btn-map');
const btnPlay     = document.getElementById('btn-play');
const statsWolves = document.getElementById('stat-wolves');
const statsElk    = document.getElementById('stat-elk');
const statsSim    = document.getElementById('stat-sim-wolves');
const statsPackCount = document.getElementById('stat-packs');

// Param sliders
const paramSliders = {
  alpha: document.getElementById('param-alpha'),
  beta:  document.getElementById('param-beta'),
  delta: document.getElementById('param-delta'),
  gamma: document.getElementById('param-gamma'),
  mu:    document.getElementById('param-mu'),
};
const paramDisplays = {
  alpha: document.getElementById('val-alpha'),
  beta:  document.getElementById('val-beta'),
  delta: document.getElementById('val-delta'),
  gamma: document.getElementById('val-gamma'),
  mu:    document.getElementById('val-mu'),
};

// ─── Boot sequence ────────────────────────────────────────────────────────────
async function init() {
  try {
    const [wolfRes, elkRes] = await Promise.all([
      fetch('data/wolf_population.json'),
      fetch('data/elk_population.json'),
    ]);
    state.realWolfData = await wolfRes.json();
    state.realElkData  = await elkRes.json();
  } catch (e) {
    console.error('Failed to load population data:', e);
    showError('Could not load population data. Make sure the /data folder is deployed.');
    return;
  }

  // Run simulation with defaults
  state.simData = sim.run();

  // Init graph
  graph.init(state.realWolfData, state.realElkData, state.simData);

  // Init map
  map.init();

  // Try loading territory GeoJSON (optional — site works without it)
  tryLoadTerritories();

  // Wire UI
  setupUI();
  updateStats(state.currentYear);
  setView('graph');
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
}

async function tryLoadTerritories() {
  try {
    const res  = await fetch('data/wolf_territories.geojson');
    if (!res.ok) throw new Error('not found');
    const data = await res.json();
    map.loadTerritories(data);
    state.territoriesLoaded = true;
    document.getElementById('map-no-data').style.display = 'none';
  } catch {
    // Territory data is optional
    document.getElementById('map-no-data').textContent =
      'Territory GeoJSON not yet uploaded. See README for instructions.';
  }
}

// ─── UI wiring ────────────────────────────────────────────────────────────────
function setupUI() {
  // Time slider
  slider.addEventListener('input', () => {
    state.currentYear = parseInt(slider.value);
    updateYear(state.currentYear);
  });

  // View toggle
  btnGraph.addEventListener('click', () => setView('graph'));
  btnMap.addEventListener('click',   () => setView('map'));

  // Play/pause
  btnPlay.addEventListener('click', togglePlay);

  // Parameter sliders
  Object.keys(paramSliders).forEach(key => {
    const el = paramSliders[key];
    const display = paramDisplays[key];
    display.textContent = parseFloat(el.value).toFixed(4);

    el.addEventListener('input', () => {
      display.textContent = parseFloat(el.value).toFixed(4);
      rerunSimulation();
    });
  });

  // Reset params button
  document.getElementById('btn-reset-params').addEventListener('click', resetParams);
}

function setView(view) {
  state.activeView = view;
  const graphPanel = document.getElementById('graph-panel');
  const mapPanel   = document.getElementById('map-panel');

  if (view === 'graph') {
    graphPanel.classList.add('active');
    mapPanel.classList.remove('active');
    btnGraph.classList.add('active');
    btnMap.classList.remove('active');
    graph.setYear(state.currentYear);
  } else {
    mapPanel.classList.add('active');
    graphPanel.classList.remove('active');
    btnMap.classList.add('active');
    btnGraph.classList.remove('active');
    map.setYear(state.currentYear);
    // Leaflet needs an invalidate after becoming visible
    setTimeout(() => map.map?.invalidateSize(), 50);
  }
}

function updateYear(year) {
  yearDisplay.textContent = year;
  slider.value = year;
  updateStats(year);
  if (state.activeView === 'graph') graph.setYear(year);
  if (state.activeView === 'map')   map.setYear(year);
}

function updateStats(year) {
  const real = state.realWolfData.find(d => d.year === year);
  const elk  = state.realElkData.find(d => d.year === year);
  const sim  = state.simData.find(d => d.year === year);

  statsWolves.textContent    = real ? real.wolves : '—';
  statsPackCount.textContent = real ? real.packs   : '—';
  statsElk.textContent       = elk  ? elk.elk.toLocaleString() : '—';
  statsSim.textContent       = sim  ? sim.wolves   : '—';
}

function togglePlay() {
  state.playing = !state.playing;
  btnPlay.textContent = state.playing ? '⏸ Pause' : '▶ Play';

  if (state.playing) {
    state.playInterval = setInterval(() => {
      let next = state.currentYear + 1;
      if (next > 2022) { next = 1995; }
      updateYear(next);
    }, 600);
  } else {
    clearInterval(state.playInterval);
  }
}

function rerunSimulation() {
  const params = {};
  Object.keys(paramSliders).forEach(k => {
    params[k] = parseFloat(paramSliders[k].value);
  });
  Object.assign(sim.params, params);
  state.simData = sim.run();
  graph.updateSimData(state.simData);
  updateStats(state.currentYear);
}

function resetParams() {
  const defaults = { alpha: 0.06, beta: 0.0008, delta: 0.00012, gamma: 0.08, mu: 0.02 };
  Object.keys(defaults).forEach(k => {
    paramSliders[k].value = defaults[k];
    paramDisplays[k].textContent = defaults[k].toFixed(4);
  });
  rerunSimulation();
}

function showError(msg) {
  const el = document.getElementById('loading-screen');
  el.innerHTML = `<div class="load-error">⚠ ${msg}</div>`;
}

// ─── Start ────────────────────────────────────────────────────────────────────
init();

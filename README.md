# Yellowstone Wolf Population — NPS Data & Simulation

A scientific dashboard visualizing Yellowstone wolf and elk population dynamics from 1995–2022, combining real NPS field data with a Lotka-Volterra predator-prey simulation.

**Live site:** `https://[your-username].github.io/[your-repo-name]/`

---

## Features

- **Population graph** — real NPS wolf + elk counts overlaid with live simulation output
- **Interactive map** — Leaflet.js map with pack territory polygons (requires GeoJSON, see below)
- **Time slider** — scrub or auto-play through 1995–2022
- **Parameter sliders** — adjust α, β, δ, γ, μ in real time and watch the simulation update
- **Play mode** — animate the full timeline automatically

---

## Project Structure

```
yellowstone-wolf-sim/
├── index.html              # Main page
├── style.css               # All styles
├── js/
│   ├── app.js              # Main entry point (ES module)
│   ├── simulation.js       # Lotka-Volterra math engine
│   ├── graph.js            # Chart.js population graph
│   └── map.js              # Leaflet territory map
└── data/
    ├── wolf_population.json   # NPS wolf counts 1995–2022
    ├── elk_population.json    # N. Yellowstone elk herd counts
    └── wolf_territories.geojson  ← YOU ADD THIS (see below)
```

---

## Setup (GitHub Pages)

### 1. Create a public repository
- Go to GitHub → New repository → set to **Public**
- Check "Add a README file"
- Click Create repository

### 2. Open the web editor
- On your repo page, press the `.` key
- The GitHub web editor (VS Code in the browser) opens

### 3. Upload these project files
- Drag all files/folders from this project into the editor's Explorer panel
- Maintain the same folder structure

### 4. Commit
- Click the Source Control icon (branch icon on left sidebar)
- Type a commit message: `"Initial commit"`
- Click **Commit & Push**

### 5. Enable GitHub Pages
- Go to your repo on GitHub → **Settings** → **Pages**
- Under "Build and deployment" → Source → **Deploy from a branch**
- Branch: **main** · Folder: **/ (root)**
- Click **Save**
- Wait ~2 minutes, then visit the URL shown

---

## Adding Territory Map Data

The map view works once you add `data/wolf_territories.geojson`.

### Step 1 — Get the shapefiles
Download the GIS territory data from the [NPS Wolf Reports page](https://www.nps.gov/yell/learn/nature/wolf-reports.htm).

### Step 2 — Prepare the files
You should have a flat folder of shapefiles already named `YEAR_packname.shp` (e.g. `2017_junction_butte.shp`).

If each shapefile doesn't already have a `year` attribute in its `.dbf`, you need to add one. In Mapshaper's console, run:

```
-each 'year=parseInt(this.properties.filename.substring(0,4))'
```

### Step 3 — Convert in Mapshaper
1. Go to [mapshaper.org](https://mapshaper.org)
2. Drag **all** your `.shp`, `.dbf`, and `.prj` files in at once
3. Click Import
4. Open the Console and run: `-merge-layers`
5. Then run: `-each 'year=parseInt(this.properties.filename.substring(0,4))'`
6. Click **Export** → choose **GeoJSON** → Export
7. Rename the file to `wolf_territories.geojson`

### Step 4 — Upload to GitHub
- In the GitHub web editor, drag `wolf_territories.geojson` into the `data/` folder
- Commit & Push

The map view will automatically detect and use it.

---

## Simulation Model

The simulation uses the Lotka-Volterra predator-prey equations, extended with an external mortality term (μ) to account for real-world factors like disease, harvest, and management removals:

```
dElk/dt    = αE − βEW
dWolves/dt = δEW − γW − μW
```

| Parameter | Meaning |
|-----------|---------|
| α (alpha) | Elk intrinsic growth rate |
| β (beta)  | Wolf predation rate |
| δ (delta) | Wolf reproduction efficiency per elk killed |
| γ (gamma) | Wolf natural mortality rate |
| μ (mu)    | External wolf mortality (disease, harvest, management) |

Integration uses the Euler method with 200 sub-steps per year for stability.

---

## Data Sources

- **Wolf population:** NPS Yellowstone Wolf Project Annual Reports 1995–2022
- **Elk population:** Northern Yellowstone elk herd counts from NPS/Montana FWP surveys
- **Territory GIS:** NPS Yellowstone Wolf Project MCP shapefiles

---

## Local Development

Because `app.js` uses ES modules and fetches JSON files, you need a local server (browsers block `fetch()` from `file://`):

**VS Code:** Install the "Live Server" extension → click "Go Live" in the bottom status bar.

**Python:** `python -m http.server 8000` then open `http://localhost:8000`

**Node:** `npx serve .`

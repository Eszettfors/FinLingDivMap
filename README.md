# FinLingDiv Atlas

A static React + Leaflet port of the [FinLingDiv](https://zenodo.org/records/18257720)
Shiny dashboard: an interactive atlas of linguistic diversity across Finland's
municipalities, 1990–2025.

Built with Vite, React, react-leaflet, and D3 (scales/shapes/hierarchy only —
no dashboard framework or backend). All data is pre-processed into static
JSON/GeoJSON files served straight from GitHub Pages.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # outputs to dist/
npm run preview # serve the production build locally
```

## Deploying to GitHub Pages

1. Push this folder to a repository named **FinLingDivMap** (the Vite `base`
   path in `vite.config.js` is set to `/FinLingDivMap/` to match). If you use
   a different repo name, update `base` in `vite.config.js` accordingly.
2. In the repo settings, under **Pages**, set the source to **GitHub Actions**.
3. Push to `main` — the included workflow at
   `.github/workflows/deploy.yml` builds the site and deploys it
   automatically. You can also trigger it manually from the Actions tab.
4. The site will be published at `https://<your-username>.github.io/FinLingDivMap/`.

## Data

The `public/data/*.json` and `public/geo/municipalities.geojson` files are
pre-built from the original FinLingDiv CSVs and shapefile using
`data_prep/build_data.py`, which combines `diversity_time_series.csv`,
`full_time_series_speakers.csv`, `diversity_finland_time_series.csv`, and the
municipality shapefile into compact per-municipality/per-year arrays. See the
comment at the bottom of that script for the `mapshaper` command used to
convert the shapefile to a simplified WGS84 GeoJSON first. To regenerate the
data from a newer FinLingDiv export, point `SRC` in the script at the new
`data/processed` folder and rerun it with `python3 data_prep/build_data.py`.

## Project structure

```
src/
  App.jsx               top-level state + layout
  hooks/useAtlasData.js  loads all static JSON/GeoJSON once
  components/
    MapPanel.jsx          Leaflet choropleth (diversity measure / language share)
    Sidebar.jsx            controls + language table
    Treemap.jsx             language treemap for the clicked municipality (colored by family)
    TimeSeriesChart.jsx      single-measure trend for the clicked municipality
    TopLanguagesArea.jsx      100%-stacked top-10-languages-over-time chart
    AboutView.jsx              dataset provenance & citation
  utils/                 color scales, formatting, language-row helpers
public/
  data/                 pre-built JSON datasets
  geo/                  simplified municipality GeoJSON (WGS84)
```

## Attribution

Dataset by Hannes Essfors — see the in-app "About" tab for the full citation
and license (CC BY 4.0). Map tiles: © OpenStreetMap contributors, © CARTO.

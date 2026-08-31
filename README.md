# FinLingDiv Map

A static React + Leaflet port of the [FinLingDiv-Dashboard](https://f39e09-hannes-essfors.shinyapps.io/FinLingDiv/) using Claude Sonnet 5.
The underlying data is based on [FinLingDiv](https://zenodo.org/records/18257720), which in term is based on Statistics Finland. The data is 
CC BY 4.0

This software, i.e., the code underlying the webpage is GPLv3.


## Data

The `public/data/*.json` files are
pre-built from the original FinLingDiv CSVs using
`data_prep/build_data.py`, which combines `diversity_time_series.csv`,
`full_time_series_speakers.csv`, `diversity_finland_time_series.csv`.

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


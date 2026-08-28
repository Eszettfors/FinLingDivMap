import csv, json, os, sys

# Usage: python3 data_prep/build_data.py [path/to/FinLingDiv/data/processed]
# Defaults to a sibling ../FinLingDiv/data/processed if not given, and
# writes straight into public/data/ (relative to this script's project root).
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "..", "FinLingDiv", "data", "processed")
OUT = os.path.join(HERE, "..", "public", "data")
os.makedirs(OUT, exist_ok=True)

# ---------- 1. Languages master list (name -> family) ----------
lang_family = {}
with open(f"{SRC}/full_time_series_speakers.csv") as f:
    r = csv.DictReader(f)
    for row in r:
        lang_family[row['language']] = row['family_name']

lang_names = sorted(lang_family.keys())
lang_index = {name: i for i, name in enumerate(lang_names)}
languages_json = [{"name": n, "family": lang_family[n]} for n in lang_names]

with open(f"{OUT}/languages.json", "w") as f:
    json.dump(languages_json, f, separators=(",", ":"))

# ---------- 2. Per-municipality per-year language speakers ----------
# structure: { municipality: { year: [[langIdx, speakers], ...] } }
muni_lang = defaultdict(lambda: defaultdict(list))
with open(f"{SRC}/full_time_series_speakers.csv") as f:
    r = csv.DictReader(f)
    for row in r:
        m = row['municipality']
        y = row['year']
        li = lang_index[row['language']]
        sp = int(float(row['speakers']))
        muni_lang[m][y].append([li, sp])

with open(f"{OUT}/languages_by_municipality.json", "w") as f:
    json.dump(muni_lang, f, separators=(",", ":"))

# ---------- 3. National (Finland) per-year language speakers ----------
national_lang = defaultdict(lambda: defaultdict(int))
for m, years in muni_lang.items():
    for y, entries in years.items():
        for li, sp in entries:
            national_lang[y][li] += sp

national_lang_out = {y: sorted(d.items(), key=lambda x: -x[1]) for y, d in national_lang.items()}
with open(f"{OUT}/national_languages.json", "w") as f:
    json.dump(national_lang_out, f, separators=(",", ":"))

# ---------- 4. Diversity per municipality per year (+ dominant language) ----------
# first compute dominant language & percent per municipality/year from muni_lang
dominant = {}
for m, years in muni_lang.items():
    dominant[m] = {}
    for y, entries in years.items():
        total = sum(sp for _, sp in entries)
        if total == 0:
            continue
        li_max, sp_max = max(entries, key=lambda x: x[1])
        dominant[m][y] = {
            "lang": lang_names[li_max],
            "pct": round(sp_max / total * 100, 2)
        }

diversity = defaultdict(dict)
with open(f"{SRC}/diversity_time_series.csv") as f:
    r = csv.DictReader(f)
    for row in r:
        m = row['municipality']
        y = row['year']
        dom = dominant.get(m, {}).get(y, {})
        dom_idx = lang_index.get(dom.get("lang"))
        # compact array: [richness, expShannon, invSimpson, lexDivQ0, lexDivQ1, lexDivQ2, domLangIdx, domPct]
        diversity[m][y] = [
            int(float(row['richness'])),
            round(float(row['exp_shannon']), 3),
            round(float(row['inv_simpson']), 3),
            round(float(row['lex_div_q_0']), 3),
            round(float(row['lex_div_q_1']), 3),
            round(float(row['lex_div_q_2']), 3),
            dom_idx,
            dom.get("pct"),
        ]

with open(f"{OUT}/diversity_by_municipality.json", "w") as f:
    json.dump(diversity, f, separators=(",", ":"))

# ---------- 5. National diversity time series ----------
national_div = {}
with open(f"{SRC}/diversity_finland_time_series.csv") as f:
    r = csv.DictReader(f)
    for row in r:
        y = row['year']
        national_div[y] = {
            "richness": int(float(row['richness'])),
            "expShannon": round(float(row['exp_shannon']), 4),
            "invSimpson": round(float(row['inv_simpson']), 4),
            "lexDivQ0": round(float(row['lex_div_q_0']), 4),
            "lexDivQ1": round(float(row['lex_div_q_1']), 4),
            "lexDivQ2": round(float(row['lex_div_q_2']), 4),
        }

with open(f"{OUT}/national_diversity.json", "w") as f:
    json.dump(national_div, f, separators=(",", ":"))

# ---------- 6. Meta (years, municipalities, palette scaffolding) ----------
years = sorted(national_div.keys())
municipalities = sorted(muni_lang.keys())

# Languages that are ever the dominant language somewhere, in some year —
# mirrors mst_spkn_langs in the R app, used to size the map's categorical palette.
ever_dominant = sorted({
    lang_names[row[6]]
    for years_map in diversity.values()
    for row in years_map.values()
    if row[6] is not None
})

families = sorted(set(lang_family.values()))

with open(f"{OUT}/meta.json", "w") as f:
    json.dump(
        {
            "years": years,
            "municipalities": municipalities,
            "everDominantLanguages": ever_dominant,
            "families": families,
        },
        f,
        separators=(",", ":"),
    )

print("Done.")
print("languages:", len(languages_json))
print("municipalities:", len(municipalities))
print("years:", years[0], "-", years[-1])
print("ever-dominant languages:", len(ever_dominant), ever_dominant)
print("families:", len(families))

# NOTE: run this after generating a WGS84-simplified GeoJSON from the
# municipality shapefile, e.g. with mapshaper:
#   mapshaper data/geodata/kunta4500k_2022Polygon.shp \
#     -proj wgs84 -simplify dp 8% keep-shapes -clean \
#     -o public/geo/municipalities.geojson format=geojson precision=0.0001

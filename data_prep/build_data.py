import csv, json, os, sys
from collections import defaultdict

# Usage: python3 data_prep/build_data.py [path/to/FinLingDiv/data/processed]
# If no path is given, looks for FinLingDiv/data/processed inside the project
# and then next to it. Writes straight into public/data/.
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")


def find_src():
    if len(sys.argv) > 1:
        return sys.argv[1]
    for candidate in (
        os.path.join(ROOT, "FinLingDiv", "data", "processed"),
        os.path.join(ROOT, "..", "FinLingDiv", "data", "processed"),
    ):
        if os.path.isdir(candidate):
            return candidate
    sys.exit("Could not find FinLingDiv/data/processed - pass its path as an argument.")


SRC = find_src()
OUT = os.path.join(ROOT, "public", "data")
GEO = os.path.join(ROOT, "public", "geo")
os.makedirs(OUT, exist_ok=True)


def write_json(name, obj):
    with open(os.path.join(OUT, name), "w") as f:
        json.dump(obj, f, separators=(",", ":"))


# ---------- 1. Languages master list (name -> family) ----------
# Shared by every geographic level, so a langIdx means the same language
# in the municipal, regional and national files.
lang_family = {}
with open(f"{SRC}/full_time_series_speakers.csv") as f:
    for row in csv.DictReader(f):
        lang_family[row['language']] = row['family_name']

lang_names = sorted(lang_family.keys())
lang_index = {name: i for i, name in enumerate(lang_names)}
languages_json = [{"name": n, "family": lang_family[n]} for n in lang_names]
write_json("languages.json", languages_json)


# ---------- helpers shared by the municipal and regional levels ----------
def read_speakers(path, area_col):
    """-> { area: { year: [[langIdx, speakers], ...] } }"""
    out = defaultdict(lambda: defaultdict(list))
    with open(path) as f:
        for row in csv.DictReader(f):
            if row['language'] not in lang_index:
                sys.exit(f"Language '{row['language']}' in {path} is not in the master language list.")
            sp = int(float(row['speakers']))
            out[row[area_col]][row['year']].append([lang_index[row['language']], sp])
    return out


def compute_dominant(area_lang):
    """-> { area: { year: {lang, pct, second, secondPct} } }

    The most and second most spoken language per area/year. `second` is None
    when only one language is recorded. A tie for second place is broken by
    language index (i.e. alphabetically) so the result never depends on the
    row order of the CSV.
    """
    dominant = {}
    for area, years in area_lang.items():
        dominant[area] = {}
        for y, entries in years.items():
            total = sum(sp for _, sp in entries)
            if total == 0:
                continue
            li_max, sp_max = max(entries, key=lambda x: x[1])
            rest = [e for e in entries if e[0] != li_max and e[1] > 0]
            second, second_pct = None, None
            if rest:
                li_2nd, sp_2nd = max(rest, key=lambda x: (x[1], -x[0]))
                second, second_pct = lang_names[li_2nd], round(sp_2nd / total * 100, 2)
            dominant[area][y] = {
                "lang": lang_names[li_max],
                "pct": round(sp_max / total * 100, 2),
                "second": second,
                "secondPct": second_pct,
            }
    return dominant


def read_diversity(path, area_col, dominant):
    """-> { area: { year: [richness, expShannon, invSimpson, lexDivQ0, lexDivQ1, lexDivQ2,
                           domLangIdx, domPct, secondLangIdx, secondPct] } }"""
    out = defaultdict(dict)
    with open(path) as f:
        for row in csv.DictReader(f):
            area, y = row[area_col], row['year']
            dom = dominant.get(area, {}).get(y, {})
            out[area][y] = [
                int(float(row['richness'])),
                round(float(row['exp_shannon']), 3),
                round(float(row['inv_simpson']), 3),
                round(float(row['lex_div_q_0']), 3),
                round(float(row['lex_div_q_1']), 3),
                round(float(row['lex_div_q_2']), 3),
                lang_index.get(dom.get("lang")),
                dom.get("pct"),
                lang_index.get(dom.get("second")),  # None when there is no second language
                dom.get("secondPct"),
            ]
    return out


# ---------- 2. Municipal level ----------
muni_lang = read_speakers(f"{SRC}/full_time_series_speakers.csv", "municipality")
write_json("languages_by_municipality.json", muni_lang)

diversity = read_diversity(f"{SRC}/diversity_time_series.csv", "municipality", compute_dominant(muni_lang))
write_json("diversity_by_municipality.json", diversity)

# ---------- 3. National (Finland) per-year language speakers ----------
national_lang = defaultdict(lambda: defaultdict(int))
for m, years in muni_lang.items():
    for y, entries in years.items():
        for li, sp in entries:
            national_lang[y][li] += sp

write_json("national_languages.json",
           {y: sorted(d.items(), key=lambda x: -x[1]) for y, d in national_lang.items()})

# ---------- 4. National diversity time series ----------
national_div = {}
with open(f"{SRC}/diversity_finland_time_series.csv") as f:
    for row in csv.DictReader(f):
        national_div[row['year']] = {
            "richness": int(float(row['richness'])),
            "expShannon": round(float(row['exp_shannon']), 4),
            "invSimpson": round(float(row['inv_simpson']), 4),
            "lexDivQ0": round(float(row['lex_div_q_0']), 4),
            "lexDivQ1": round(float(row['lex_div_q_1']), 4),
            "lexDivQ2": round(float(row['lex_div_q_2']), 4),
        }
write_json("national_diversity.json", national_div)

# ---------- 5. Regional level (one level above municipalities) ----------
# Same structure as the municipal files, keyed by region name.
region_lang = read_speakers(f"{SRC}/regional_time_series_speakers.csv", "region")
write_json("languages_by_region.json", region_lang)

region_diversity = read_diversity(f"{SRC}/diversity_region_time_series.csv", "region", compute_dominant(region_lang))
write_json("diversity_by_region.json", region_diversity)

# ---------- 6. Meta ----------
years = sorted(national_div.keys())
municipalities = sorted(muni_lang.keys())
regions = sorted(region_lang.keys())

# Fail loudly on inconsistencies that would otherwise show up as grey polygons
# or empty charts in the app.
if set(region_diversity.keys()) != set(regions):
    sys.exit("Region names differ between the regional speakers and diversity CSVs.")
for y in years:
    missing = [r for r in regions if y not in region_lang[r] or y not in region_diversity[r]]
    if missing:
        sys.exit(f"Year {y} is missing for regions: {missing}")

region_geo = os.path.join(GEO, "region_geometries.geojson")
if os.path.exists(region_geo):
    with open(region_geo) as f:
        geo_names = {ft["properties"]["region"] for ft in json.load(f)["features"]}
    if geo_names != set(regions):
        sys.exit(f"Region names in region_geometries.geojson don't match the data.\n"
                 f"  only in geojson: {sorted(geo_names - set(regions))}\n"
                 f"  only in data:    {sorted(set(regions) - geo_names)}")
else:
    print("WARNING: public/geo/region_geometries.geojson not found - skipped name check.")

# Languages that are ever the dominant language somewhere, in some year —
# mirrors mst_spkn_langs in the R app.
ever_dominant = sorted({
    lang_names[row[6]]
    for years_map in diversity.values()
    for row in years_map.values()
    if row[6] is not None
})
families = sorted(set(lang_family.values()))

write_json("meta.json", {
    "years": years,
    "municipalities": municipalities,
    "regions": regions,
    "everDominantLanguages": ever_dominant,
    "families": families,
})

print("Done.")
print("languages:", len(languages_json))
print("municipalities:", len(municipalities))
print("regions:", len(regions))
print("years:", years[0], "-", years[-1])
print("ever-dominant languages:", len(ever_dominant), ever_dominant)
print("families:", len(families))
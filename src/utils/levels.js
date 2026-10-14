// The geographic levels the atlas can show. Everything that used to be
// hard-wired to "municipality" reads from one of these instead.
//
//   nameProp     – the GeoJSON property that holds an area's name (it must
//                  match the area names used in the data files)
//   borderWeight – outline thickness of unselected areas on the map; regions
//                  are far larger than municipalities, so they can take a
//                  heavier line
export const LEVELS = {
  municipality: {
    key: "municipality",
    label: "Municipality",
    nameProp: "mncplty",
    borderWeight: 0.6,
  },
  region: {
    key: "region",
    label: "Region",
    nameProp: "region",
    borderWeight: 1.2,
  },
};

export const LEVEL_OPTIONS = Object.values(LEVELS).map((l) => ({
  value: l.key,
  label: l.label,
}));

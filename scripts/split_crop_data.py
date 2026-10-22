"""Split the large combined source snapshots into one browser-loadable file per crop.

Run after build_procurement_data.py / build_field_crops.py. The combined files stay the
authoritative build outputs; the app loads only src/lib/gramshakti/crops/<crop>.json on demand.
"""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent / "src/lib/gramshakti"
snapshot = json.loads((root / "procurement-records.json").read_text())
official = json.loads((root / "official-records.json").read_text())
sources = json.loads((root / "source-records.json").read_text())
out = root / "crops"
out.mkdir(exist_ok=True)
for crop, records in snapshot["crops"].items():
    payload = {
        "records": records,
        "district": snapshot["district"].get(crop, []),
        "production": official.get(crop, {}).get("production", []),
        "sources": sources.get(crop, {"protection": []}),
    }
    (out / f"{crop}.json").write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
meta = {k: v for k, v in snapshot.items() if k not in ("crops", "district")}
(root / "procurement-meta.json").write_text(json.dumps(meta, indent=2))
print("wrote", len(snapshot["crops"]), "crop files")

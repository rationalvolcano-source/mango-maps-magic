"""Apply reviewed corrections to existing application copies, without original files.

Usage: python scripts/apply_evidence_corrections.py --apply
       python scripts/apply_evidence_corrections.py --check

The current application SHA must agree with artwork-audit.json before any write.
Source records and original SVG pointers/hashes remain immutable. --check is read-only.
"""
import argparse
import hashlib
import json
from pathlib import Path
from xml.etree import ElementTree as E

from evidence_artwork import correct_belt_panel, correct_processing_pins, source_system_column

ROOT = Path(__file__).resolve().parents[1]
LIB = ROOT / "src/lib/gramshakti"
N = {"s": "http://www.w3.org/2000/svg"}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    if args.apply == args.check:
        parser.error("Choose exactly one of --apply or --check")
    assets = json.loads((LIB / "asset-manifest.json").read_text())
    snapshot = json.loads((LIB / "procurement-records.json").read_text())
    records = snapshot["crops"]
    audit = json.loads((LIB / "artwork-audit.json").read_text())
    original_audit = {(row["crop"], row["screen"]): row for row in audit["assets"]}
    result = {"assetsChanged": [], "calendarFieldsCorrected": [], "pinsMoved": [], "geometryChecks": 0}
    writes = []
    for crop, asset in assets.items():
        for screen in ("002", "003", "006"):
            path = ROOT / "public/gramshakti/crops" / crop / (screen + ".svg")
            data = path.read_bytes()
            row = original_audit[(crop, screen)]
            if digest(data) != row["application_sha256"]:
                raise ValueError("Application SHA changed since audit: " + str(path))
            root = E.fromstring(data)
            geometry = [p.get("d") for p in root.findall(".//s:path", N)]
            if screen == "002":
                correct_belt_panel(root, crop, records)
            elif screen == "006":
                result["pinsMoved"].extend(correct_processing_pins(root, crop, records, asset))
            if geometry != [p.get("d") for p in root.findall(".//s:path", N)]:
                raise ValueError("Original path geometry changed: " + crop + "/" + screen)
            result["geometryChecks"] += 1
            corrected = E.tostring(root, encoding="utf-8")
            if corrected != data:
                writes.append((path, corrected))
                row["application_sha256"] = digest(corrected)
                result["assetsChanged"].append({"crop": crop, "screen": screen,
                                                "before": digest(data), "after": digest(corrected)})
    changed_crops = set()
    for crop, crop_records in records.items():
        for row in crop_records["calendar"]:
            index = source_system_column(row["headers"])
            if index is not None and row["system"] != row["cells"][index]:
                result["calendarFieldsCorrected"].append({"crop": crop, "id": row["id"],
                    "before": row["system"], "after": row["cells"][index], "sourceLocator": row["locator"]})
                row["system"] = row["cells"][index]
                changed_crops.add(crop)
    if args.check:
        print(json.dumps({"clean": not writes and not changed_crops, **result}, ensure_ascii=False, indent=2))
        return 1 if writes or changed_crops else 0
    # All hashes/geometry/source mappings have passed before the first write.
    for path, data in writes:
        path.write_bytes(data)
    (LIB / "artwork-audit.json").write_text(json.dumps(audit, ensure_ascii=False, indent=2) + "\n")
    if changed_crops:
        (LIB / "procurement-records.json").write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    for crop in changed_crops:
        path = LIB / "crops" / (crop + ".json")
        payload = json.loads(path.read_text())
        payload["records"] = records[crop]
        path.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    report = ROOT / "docs/evidence-correction-application.json"
    if writes or changed_crops:
        report.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({"assetsChanged": len(writes), "calendarFieldsCorrected": len(result["calendarFieldsCorrected"]),
                      "pinGroupsMoved": len(result["pinsMoved"]), "geometryChecks": result["geometryChecks"]}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

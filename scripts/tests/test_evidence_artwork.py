"""Regressions for source columns, immutable geometry and real marker containment."""
import hashlib
import json
import math
from pathlib import Path
import sys
import unittest
from xml.etree import ElementTree as E

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "scripts"))
from evidence_artwork import (CORRECTIONS, N, correct_belt_panel,
                              correct_processing_pins, inside_state, source_system_column)

LIB = ROOT / "src/lib/gramshakti"


class EvidenceArtworkTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.assets = json.loads((LIB / "asset-manifest.json").read_text())
        cls.records = json.loads((LIB / "procurement-records.json").read_text())["crops"]

    def test_no_cultivar_header_can_replace_a_season_or_system_header(self):
        headers = ["State", "Botanical Class & Cultivar", "Season / System", "Peak Market Arrival Window"]
        self.assertEqual(source_system_column(headers), 2)
        self.assertIsNone(source_system_column(["State", "Botanical Class & Cultivar"]))
        for crop in json.loads((LIB / "field-crops.json").read_text()):
            for row in self.records[crop]["calendar"]:
                column = source_system_column(row["headers"])
                self.assertIsNotNone(column, (crop, row["id"]))
                self.assertEqual(row["system"], row["cells"][column], row["id"])

    def test_runtime_crop_files_contain_the_same_corrected_system_values(self):
        for crop, records in self.records.items():
            runtime = json.loads((LIB / "crops" / (crop + ".json")).read_text())["records"]
            self.assertEqual(runtime["calendar"], records["calendar"], crop)

    def test_all_120_path_geometries_are_unchanged_and_asset_hashes_match(self):
        frozen = json.loads((ROOT / "docs/evidence-artwork-integrity.json").read_text())
        self.assertEqual(len(frozen["assets"]), 120)
        audit = json.loads((LIB / "artwork-audit.json").read_text())
        hashes = {(r["crop"], r["screen"]): r["application_sha256"] for r in audit["assets"]}
        for row in frozen["assets"]:
            path = ROOT / row["path"]
            data = path.read_bytes()
            svg = E.fromstring(data)
            geometry = [p.get("d") for p in svg.findall(".//s:path", N)]
            sha = hashlib.sha256(json.dumps(geometry, separators=(",", ":")).encode()).hexdigest()
            self.assertEqual(sha, row["pathGeometrySha256"], row["path"])
            self.assertEqual(hashlib.sha256(data).hexdigest(), hashes[(path.parent.name, path.stem)], row["path"])

    def test_all_processing_markers_are_inside_their_source_node_jurisdiction(self):
        count = 0
        for crop, records in self.records.items():
            svg = E.parse(ROOT / "public/gramshakti/crops" / crop / "006.svg").getroot()
            paths = {p.get("data-action")[6:]: p for p in svg.findall(".//s:path", N)
                     if p.get("data-action", "").startswith("state:") and p.find("s:title", N) is not None}
            pins = [p for p in svg.findall(".//s:circle", N) if p.get("data-pin") is not None]
            self.assertEqual({int(p.get("data-pin")) for p in pins}, set(range(len(records["processing"]))), crop)
            for pin in pins:
                row = records["processing"][int(pin.get("data-pin"))]
                x, y = float(pin.get("cx")), float(pin.get("cy"))
                self.assertTrue(any(inside_state(x, y, paths[c]) for c in row["stateCodes"] if c in paths), row["id"])
                self.assertIn(pin.get("data-pin-state"), row["stateCodes"])
                count += 1
            for i, first in enumerate(pins):
                for second in pins[i + 1:]:
                    if first.get("data-pin") != second.get("data-pin"):
                        distance = math.hypot(float(first.get("cx")) - float(second.get("cx")),
                                              float(first.get("cy")) - float(second.get("cy")))
                        self.assertGreaterEqual(distance, 18, crop)
        self.assertEqual(count, 205)

    def test_belt_corrections_are_source_exact_and_not_grade_headlines(self):
        corrections = json.loads(CORRECTIONS.read_text())
        self.assertEqual(len(corrections["crops"]), 24)
        self.assertEqual(sum(len(rows) for rows in corrections["crops"].values()), 116)
        for crop, rows in corrections["crops"].items():
            svg = E.parse(ROOT / "public/gramshakti/crops" / crop / "002.svg").getroot()
            for record in self.records[crop]["belts"]:
                correction = rows[record["id"]]
                self.assertEqual(correction["sourceLocator"], record["locator"])
                self.assertEqual(correction["sourceOriginQuote"], record["origin"])
                heading = next(t for t in svg.findall("s:text", N)
                               if t.get("data-belt-name") is not None
                               and t.get("data-action") == "source:belt:" + record["id"])
                self.assertEqual(heading.get("data-belt-name"), correction["geographyHeadline"])
                self.assertNotEqual(heading.get("data-belt-name"), record["variety"])
                self.assertEqual(heading.get("data-action"), "source:belt:" + record["id"])

    def test_relocating_one_node_never_drags_another_node_at_the_same_point(self):
        root = E.fromstring('''<svg xmlns="http://www.w3.org/2000/svg">
          <path d="M0,0 L100,0 L100,100 L0,100 Z" data-action="state:AA"><title>A</title></path>
          <path d="M120,0 L220,0 L220,100 L120,100 Z" data-action="state:BB"><title>B</title></path>
          <circle cx="170" cy="50" r="8" stroke="#ff0000" data-pin="0"/>
          <circle cx="170" cy="50" r="3" fill="#ff0000"/>
          <circle cx="170" cy="50" r="8" stroke="#00ff00" data-pin="1"/>
          <circle cx="170" cy="50" r="3" fill="#00ff00"/>
        </svg>''')
        records = {"sample": {"processing": [
            {"id": "a", "name": "A", "stateCodes": ["AA"], "locator": {}},
            {"id": "b", "name": "B", "stateCodes": ["BB"], "locator": {}},
        ]}}
        asset = {"clusters": [{"color": "#ff0000"}, {"color": "#00ff00"}]}
        correct_processing_pins(root, "sample", records, asset)
        green = [c for c in root.findall("s:circle", N) if c.get("fill") == "#00ff00" or c.get("stroke") == "#00ff00"]
        self.assertTrue(all(c.get("cx") == "170" and c.get("cy") == "50" for c in green))

    def test_running_artwork_corrections_again_is_idempotent(self):
        for crop, asset in self.assets.items():
            for screen in ("002", "006"):
                path = ROOT / "public/gramshakti/crops" / crop / (screen + ".svg")
                before = path.read_bytes()
                svg = E.fromstring(before)
                if screen == "002":
                    correct_belt_panel(svg, crop, self.records)
                else:
                    self.assertEqual(correct_processing_pins(svg, crop, self.records, asset), [])
                self.assertEqual(E.tostring(svg, encoding="utf-8"), before, crop + "/" + screen)


if __name__ == "__main__":
    unittest.main()

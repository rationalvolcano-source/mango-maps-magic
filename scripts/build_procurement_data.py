"""Extract the approved Drive snapshots without inferring missing APY.

Usage: python scripts/build_procurement_data.py SOURCE_DIRECTORY
Sources: crosswalks.docx, production-context.docx and district-apy.xlsx.
"""
import hashlib
import json
import re
import sys
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

from openpyxl import load_workbook

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1])
LIB = ROOT / "src/lib/gramshakti"
NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
CROSSWALK = "https://drive.google.com/file/d/1_OP2pkz8uEIJ0ptXEiSfv_l8OezL-l3-/view"
CONTEXT = "https://drive.google.com/file/d/1e9EXVD5b2MfbSr7UyhieBx8YooXf-wP1/view"
DISTRICT = "https://docs.google.com/spreadsheets/d/1YQLRV8QGIk9lO1MygZA9heofVSnxtZpDHSkm2yzTYLg/edit"
assets = json.loads((LIB / "asset-manifest.json").read_text())
codes = json.loads((LIB / "state-codes.json").read_text())
canonical = json.loads((LIB / "canonical-crops.json").read_text())


def key(value):
    return re.sub(r"[^a-z0-9]", "", str(value or "").lower().replace("&", "and"))


aliases = {key(x): x for x in canonical}
aliases.update({"apples": "Apple", "capsicum": "Capsicum", "orange": "Oranges", "chikoo": "Sapota", "chikku": "Sapota"})
slugs = {v["name"]: k for k, v in assets.items()}
state_alias = {key(n): c for n, c in codes.items()}
state_alias.update({"orissa": "OR", "od": "OR", "uk": "UK", "ut": "UK", "jandk": "JK", "jk": "JK", "andamanandnicobar": "AN", "uttaranchal": "UK", "pondicherry": "PY"})
state_alias.update({c.lower(): c for c in codes.values()})


def states(text):
    """Explicit named state/code matches, never district-to-state guesses."""
    result = []
    clean = str(text or "").replace("&", " and ")
    for name, code in codes.items():
        pattern = r"\b" + r"\s+".join(re.escape(part) for part in name.split()) + r"\b"
        if re.search(pattern, clean, re.I) and code not in result:
            result.append(code)
    for match in re.finditer(r"\b(?:AP|TS|TN|KA|MH|MP|GJ|WB|BR|JH|UP|UK|UT|HP|HR|PB|RJ|KL|AS|CG|OR|OD|JK)\b", clean):
        code = state_alias.get(match.group().lower())
        if code and code not in result:
            result.append(code)
    return result


def doc_blocks(filename, url):
    path = SOURCE / filename
    digest = hashlib.sha256(path.read_bytes()).hexdigest()
    body = ET.fromstring(ZipFile(path).read("word/document.xml")).find("w:body", NS)
    blocks = []
    table = 0
    for i, node in enumerate(body):
        locator = {"url": url, "document": filename, "block": i + 1, "sha256": digest}
        if node.tag.endswith("}tbl"):
            table += 1
            rows = [["\n".join("".join(t.text or "" for t in p.findall(".//w:t", NS)) for p in cell.findall("w:p", NS)).strip() for cell in row.findall("w:tc", NS)] for row in node.findall("w:tr", NS)]
            blocks.append({"kind": "table", "rows": rows, "locator": {**locator, "table": table}})
        elif node.tag.endswith("}p"):
            text = "".join(t.text or "" for t in node.findall(".//w:t", NS)).strip()
            if text:
                blocks.append({"kind": "paragraph", "text": text, "locator": locator})
    return blocks


def split_sections(blocks):
    result = {}
    current = None
    for block in blocks:
        if block["kind"] == "paragraph":
            text = block["text"]
            name = aliases.get(key(text.strip(" -–—:"))) if len(text) < 50 else None
            if name:
                current = name
                result.setdefault(name, [])
                continue
        if current:
            result[current].append(block)
    return result


cross = split_sections(doc_blocks("crosswalks.docx", CROSSWALK))
contexts = split_sections(doc_blocks("production-context.docx", CONTEXT))
# Exact source block starts, read from each crop's processing section.
starts = {
    "mango": [47, 51, 55, 59], "banana": [136, 140, 144, 148],
    "apple": [224, 231, 236], "guava": [324, 329, 333],
    "orange": [409, 415, 423], "grapes": [498, 502, 506],
    "papaya": [602, 606, 610, 614], "pomegranate": [730, 734, 738],
    "pineapple": [815, 819, 823], "litchi": [907, 911, 915],
    "sapota": [997, 1001, 1005], "jackfruit": [1082, 1086, 1090, 1094],
    "potato": [1265, 1270, 1275], "onion": [1360, 1365, 1372],
    "tomato": [1459, 1463, 1467], "capsicum": [1562, 1566, 1570, 1574],
}


def column(headers, pattern, fallback):
    return next((i for i, h in enumerate(headers) if re.search(pattern, h, re.I)), fallback)


def rows_with_locators(block):
    seen = set()
    for number, cells in enumerate(block["rows"][1:], 2):
        signature = tuple(cells)
        if not any(cells) or signature in seen:
            continue
        seen.add(signature)
        yield cells, {**block["locator"], "row": number}


result = {}
for slug, asset in assets.items():
    blocks = cross.get(asset["name"], [])
    if not blocks:
        raise ValueError(f"Missing canonical crosswalk section: {slug}")
    tables = [b for b in blocks if b["kind"] == "table"]
    calendars = []
    belts = []
    protection_locators = []
    for b in tables:
        headers = b["rows"][0]
        header = " ".join(headers).lower()
        if any(x in header for x in ["market arrival", "harvest", "mandi arrival", "tender window"]) and "cultivar" in header:
            state_col = column(headers, "state|region", 0)
            cultivar_col = column(headers, "cultivar|variety|hybrid", 1)
            system_col = next((i for i, h in enumerate(headers) if "system" in h.lower() or "crop season" in h.lower()), None)
            window_cols = [i for i, h in enumerate(headers) if re.search(r"window|harvest|arrival|release", h, re.I)]
            previous = ""
            for cells, loc in rows_with_locators(b):
                previous = cells[state_col] or previous
                calendars.append({"id": f"{slug}-calendar-{loc['table']}-{loc['row']}", "state": previous, "stateCodes": states(previous), "variety": cells[cultivar_col], "system": cells[system_col] if system_col is not None else "", "windows": [{"label": headers[i], "text": cells[i]} for i in window_cols if i < len(cells) and cells[i]], "cells": cells, "headers": headers, "locator": loc})
        elif any(x in header for x in ["morphology", "commercial traits", "quality profile", "commercial profile", "commercial specifications"]) and ("destination" in header or "export" in header):
            origin_col = column(headers, "origin|geographic|commercial belt", 0)
            variety_col = column(headers, "variety|varieties|cultivar|group", 1 if origin_col == 0 else 0)
            traits_col = column(headers, "trait|morphology|quality|agronomic|commercial specifications", 2)
            destination_col = column(headers, "destination|export|trade", 3)
            for cells, loc in rows_with_locators(b):
                belts.append({"id": f"{slug}-belt-{loc['table']}-{loc['row']}", "origin": cells[origin_col], "stateCodes": states(cells[origin_col]), "variety": cells[variety_col], "traits": cells[traits_col], "destinations": cells[destination_col], "cells": cells, "headers": headers, "locator": loc})
        elif "pest" in header and ("pathogen" in header or "impact" in header):
            for cells, loc in rows_with_locators(b):
                protection_locators.append({"name": cells[1], "locator": loc})
    # The source includes a duplicate Jackfruit section: keep exact first rows once.
    def unique(values, fields):
        seen = set()
        output = []
        for value in values:
            identity = tuple(json.dumps(value[f], sort_keys=True) for f in fields)
            if identity not in seen:
                seen.add(identity)
                output.append(value)
        return output
    calendars = unique(calendars, ["state", "variety", "windows"])
    belts = unique(belts, ["origin", "variety"])
    processing = []
    for index, start in enumerate(starts[slug]):
        stop = starts[slug][index + 1] if index + 1 < len(starts[slug]) else start + 12
        selected = [b for b in blocks if b["kind"] == "paragraph" and start <= b["locator"]["block"] < stop]
        # End a node before a new crop-stage / protection section begins.
        clean = []
        for b in selected:
            if clean and re.search(r"^(Crop Phenology|Phenological|Detailed Phenol|State-Wise|Major Pest|Pest|Field Management)", b["text"], re.I):
                break
            clean.append(b)
        if not clean or clean[0]["locator"]["block"] != start:
            raise ValueError(f"Unresolved processing anchor {slug}/{start}")
        title = re.sub(r"^\d\.\s*", "", clean[0]["text"])
        fields = clean[1:]
        products = [b["text"] for b in fields if re.match(r"^(Primary Products|Products|Strategic Role)", b["text"], re.I)]
        catchment = [b["text"] for b in fields if re.search(r"^(Catchment|Primary/Direct Catchment|Secondary/Transshipment|Key Cent|Primary Supply)", b["text"], re.I)]
        node_states = states(title)
        for field in fields:
            if re.match(r"^(Key Centers|Primary Facilities|Key Processors)", field["text"], re.I):
                node_states = list(dict.fromkeys(node_states + states(field["text"])))
        if slug == "banana" and index == 0:
            node_states = ["MH", "GJ"]  # Jalgaon processor and Gujarat industrial belt, block 138. MP occurs only as catchment (139).
        processing.append({"id": f"{slug}-processing-{index}", "name": title, "stateCodes": node_states, "products": products, "catchment": catchment, "paragraphs": clean, "locator": clean[0]["locator"], "index": index})
    # Regional varieties are exact source statements, not inferred processor acceptance.
    for node in processing:
        regional = [r for r in calendars if set(r["stateCodes"]) & set(node["stateCodes"])]
        node["relatedVarieties"] = [{"variety":r["variety"],"geography":r["state"],"locator":r["locator"],"scope":"Regional calendar context; processor acceptance requires verification"} for r in regional]
    # State-wise estimated district/belt passages are kept as literal estimates.
    context_blocks = contexts.get(asset["name"], [])
    summary = []
    estimate_rows = []
    estimate_passages = []
    current_state = []
    for b in context_blocks:
        if b["kind"] == "table":
            headers = b["rows"][0]
            for cells, loc in rows_with_locators(b):
                if cells:
                    estimate_rows.append({"id": f"{slug}-estimate-table-{loc['table']}-{loc['row']}", "stateCodes": states(cells[0]), "headers": headers, "cells": cells, "locator": loc})
        else:
            text = b["text"]
            possible = re.sub(r"^\d+[.)]\s*", "", text).strip(" :")
            if key(possible) in state_alias:
                current_state = [state_alias[key(possible)]]
            elif re.match(r"^Remaining (District|Belt|Region)", text, re.I) or (current_state and re.search(r"\d.*%", text)):
                estimate_passages.append({"id": f"{slug}-estimate-{b['locator']['block']}", "stateCodes": current_state.copy(), "text": text, "locator": b["locator"]})
            elif not summary and re.search(r"produces|production|output", text, re.I):
                summary.append(b)
    result[slug] = {"calendar": calendars, "belts": belts, "processing": processing, "protectionLocators": unique(protection_locators, ["name"]), "productionContext": {"summary": summary, "rows": estimate_rows, "passages": estimate_passages, "url": CONTEXT, "classification": "Production Context estimate; not official district APY"}}
    if not calendars or not belts or len(processing) != len(asset["clusters"]):
        raise ValueError(f"Incomplete source tables: {slug}")

# District Master is the canonical branch; auxiliary tabs are provenance, not duplicate observations.
workbook = load_workbook(SOURCE / "district-apy.xlsx", read_only=True, data_only=True)
source_registry = {str(r[0]): {"title": r[1], "status": r[2], "url": r[3], "scope": r[4]} for r in workbook["Data sources"].values if len(r) > 4 and str(r[0]).startswith("SRC-")}
master = workbook["District APY Master"]
districts = {slug: [] for slug in assets}
district_keys = set()
for number, row in enumerate(master.values, 1):
    if number == 1 or len(row) < 23:
        continue
    crop = aliases.get(key(row[1]))
    slug = slugs.get(crop)
    if not slug:
        continue
    identity = (slug, row[3], row[2], row[0])
    if identity in district_keys:
        raise ValueError(f"Duplicate district master record: {identity}")
    district_keys.add(identity)
    source = source_registry.get(str(row[18]), {})
    districts[slug].append({"id": f"{slug}-district-{number}", "row": number, "year": row[0], "district": row[2], "state": row[3], "area": row[4], "production": row[5], "yield": row[6], "yieldKind":"Derived yield" if row[18]=="SRC-08" and row[9]=="tonnes/ha" else "Published/native yield", "areaUnit": row[7], "productionUnit": row[8], "yieldUnit": row[9], "missingFlag": row[10] or "NOT_SUPPLIED", "normalizedProduction": row[11] if isinstance(row[11], (int, float)) else None, "derivedYield": row[12] if isinstance(row[12], (int, float)) else None, "sourceId": row[18], "areaPage": row[19], "productionPage": row[20], "yieldPage": row[21], "status": row[22], "sourceTitle": source.get("title", "District APY Master"), "sourceUrl": source.get("url") if str(source.get("url", "")).startswith("https://") else DISTRICT})

output = {"snapshot": "2026-10-15", "crosswalkUrl": CROSSWALK, "productionContextUrl": CONTEXT, "districtUrl": DISTRICT, "crops": result, "district": districts}
(LIB / "procurement-records.json").write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
source_pack = json.loads((SOURCE.parent / "mango_build_pack_v1/GramShakti_Mango_Build_Data_v1.json").read_text())
(LIB / "lgd-states.json").write_text(json.dumps(source_pack["lgd_states"], ensure_ascii=False, indent=2) + "\n")
print(json.dumps({k: {"calendar": len(v["calendar"]), "belts": len(v["belts"]), "processing": len(v["processing"]), "estimates": len(v["productionContext"]["passages"]), "district": len(districts[k])} for k, v in result.items()}, indent=2))

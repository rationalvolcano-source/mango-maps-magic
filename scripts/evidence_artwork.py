"""Source-exact SVG corrections shared by both artwork preparation scripts.

No geography is geocoded here. Processing markers are indicative positions within
the supplied SVG state polygon, and never facility/district coordinates.
"""
import json
import math
import re
import textwrap
from pathlib import Path
from xml.etree import ElementTree as E

SVG = "http://www.w3.org/2000/svg"
N = {"s": SVG}
E.register_namespace("", SVG)
E.register_namespace("xlink", "http://www.w3.org/1999/xlink")
CORRECTIONS = Path(__file__).parent / "data" / "belt-geography-corrections.json"


def source_system_column(headers):
    """Prefer the actual system column over a cultivar header containing 'Class'."""
    patterns = [r"^Season(?:\s*/\s*System)?$", r"^Cropping (?:System|Regime)$",
                r"^Production System$", r"^Season / Class$", r"^Primary Species$",
                r"^Ecosystem$", r"^Botanical Class$", r"^Staple Class$",
                r"^Botanical & End-Use Class$", r"^Market Class$", r"^Maturity Class$",
                r"^Maturity Group$", r"^Agro-Ecological Belt$", r"^Cropping Ecosystem$"]
    for pattern in patterns:
        index = next((i for i, h in enumerate(headers) if re.fullmatch(pattern, h.strip(), re.I)), None)
        if index is not None:
            return index
    return None


def _text(element):
    return "".join(element.itertext()).strip()


def _position(element):
    return (float(element.get("x", element.get("cx", "-9999"))),
            float(element.get("y", element.get("cy", "-9999"))))


def _bind(element, action, label):
    element.set("data-action", action)
    element.set("role", "button")
    element.set("tabindex", "0")
    element.set("aria-label", label)
    element.set("class", "asset-target")


def _add_text(root, x, y, content, size, action, label=None, width=None, max_lines=1, weight="600"):
    lines = textwrap.wrap(content, width=width, break_long_words=False, break_on_hyphens=False) if width else [content]
    if len(lines) > max_lines:
        raise ValueError("Unfitted correction text: " + content)
    element = E.SubElement(root, "{" + SVG + "}text", {
        "x": str(x), "y": str(y), "class": "sans", "fill": "#173E30",
        "font-size": str(size), "font-weight": weight,
    })
    element.text = lines[0] if lines else ""
    for line in lines[1:]:
        E.SubElement(element, "{" + SVG + "}tspan", {"x": str(x), "dy": "10.5"}).text = line
    _bind(element, action, label or content)
    element.set("class", "sans asset-target")
    return element


def correct_belt_panel(root, crop, records, corrections=None):
    """Show a source geography first; keep cultivar/grade in its own field.

    Only the 24 field-crop panels are changed. Horticulture panels contain
    editorial belt/state mappings that require separate source-by-source review.
    """
    corrections = corrections if corrections is not None else json.loads(CORRECTIONS.read_text())
    cohort = corrections["crops"].get(crop)
    if cohort is None:
        return False
    rows = records[crop]["belts"]
    if set(cohort) != {row["id"] for row in rows}:
        raise ValueError("Belt correction/source identity mismatch: " + crop)
    for row in rows:
        correction = cohort[row["id"]]
        if (correction["sourceOriginQuote"] != row["origin"]
                or correction["varietyOrTradeLabel"] != row["variety"]
                or correction["sourceLocator"] != row["locator"]):
            raise ValueError("Belt correction source has changed: " + row["id"])
    for element in list(root):
        x, y = _position(element)
        if 1325 <= x <= 1848 and 414 <= y <= 707 and element.tag.rsplit("}", 1)[-1] in {"text", "rect", "circle", "line", "polygon"}:
            root.remove(element)
    for element in root.findall("s:text", N):
        x, y = _position(element)
        if x >= 1320 and y == 384:
            element.text = "COMMERCIAL SOURCE GEOGRAPHIES"
        if x >= 1320 and y == 405:
            element.text = "Source geography first; variety / trade grade separate"
    palette = ["#EFA33A", "#2E8B70", "#8C6BB1", "#4C78A8", "#C86F32", "#D45A5A"]
    for i, row in enumerate(rows):
        correction = cohort[row["id"]]
        y = 436 + i * 47
        action = "source:belt:" + row["id"]
        complete = row["origin"] + " | Variety / trade grade: " + row["variety"]
        circle = E.SubElement(root, "{" + SVG + "}circle", {
            "cx": "1354", "cy": str(y - 5), "r": "10", "fill": palette[i],
            "fill-opacity": ".16", "stroke": palette[i],
        })
        _bind(circle, action, complete)
        heading = correction["geographyHeadline"] or "Belt not identified in source"
        if len(textwrap.wrap(heading, 86, break_long_words=False, break_on_hyphens=False)) > 2:
            heading = "Open the complete source geography →"
        element = _add_text(root, 1378, y, heading, 9.4, action, complete, width=86, max_lines=2, weight="750")
        element.set("data-belt-name", correction["geographyHeadline"])
        grade = "Variety / trade grade: " + row["variety"]
        if len(grade) > 103:
            grade = "Variety / trade grade: open full source →"
        _add_text(root, 1378, y + 24, grade, 8.1, action, complete)
        count = len(correction["sourceGeographies"])
        note = (f"{count} source geographies; open full record →" if count > 1 else "Open the complete geography and variety / grade source →")
        _add_text(root, 1378, y + 35, note, 7.7, action, complete)
    return True


def polygon_rings(path):
    if set(re.findall(r"[A-Za-z]", path.get("d", ""))) - {"M", "L", "Z"}:
        raise ValueError("Unsupported state path command; do not approximate geometry")
    result = []
    for part in re.split("[Mm]", path.get("d", ""))[1:]:
        values = [float(n) for n in re.findall(r"-?\d+(?:\.\d+)?", part)]
        if len(values) >= 6:
            result.append(list(zip(values[::2], values[1::2])))
    return result


def _inside_ring(x, y, ring):
    found = False
    for i, (px, py) in enumerate(ring):
        qx, qy = ring[i - 1]
        if (py > y) != (qy > y) and x < (qx - px) * (y - py) / (qy - py) + px:
            found = not found
    return found


def inside_state(x, y, path):
    return bool(sum(_inside_ring(x, y, ring) for ring in polygon_rings(path)) % 2)


def _interior_point(path, occupied, node_index):
    ring = max(polygon_rings(path), key=len)
    left = min(x for x, _ in ring)
    right = max(x for x, _ in ring)
    top = min(y for _, y in ring)
    bottom = max(y for _, y in ring)
    cx, cy = (left + right) / 2, (top + bottom) / 2
    candidates = [(cx, cy)] + [(left + (right - left) * i / 48, top + (bottom - top) * j / 48)
                               for i in range(1, 48) for j in range(1, 48)]
    for x, y in sorted(candidates, key=lambda p: (p[0] - cx) ** 2 + (p[1] - cy) ** 2):
        x, y = round(x, 2), round(y, 2)
        if inside_state(x, y, path) and all(i == node_index or math.hypot(x - ox, y - oy) >= 22 for ox, oy, i in occupied):
            return x, y
    raise ValueError("No separated indicative marker fits the source state polygon")


def correct_processing_pins(root, crop, records, asset):
    """Move only circles belonging to one node; separate overlapping node targets."""
    state_paths = {}
    for path in root.findall(".//s:path", N):
        action = path.get("data-action", "")
        if action.startswith("state:") and path.find("s:title", N) is not None:
            state_paths[action[6:]] = path
    pins = [c for c in root.findall(".//s:circle", N) if c.get("data-pin") is not None]
    occupied = []
    changes = []
    for circle in pins:
        index = int(circle.get("data-pin"))
        row = records[crop]["processing"][index]
        color = asset["clusters"][index]["color"].lower()
        if circle.get("stroke", "").lower() != color:
            raise ValueError("Marker/node colour identity mismatch")
        allowed = [code for code in row["stateCodes"] if code in state_paths]
        if not allowed:
            raise ValueError("No supplied state polygon for processing node: " + row["id"])
        ox, oy = _position(circle)
        current = [code for code in allowed if inside_state(ox, oy, state_paths[code])]
        collides = any(i != index and math.hypot(ox - x, oy - y) < 22 for x, y, i in occupied)
        if current and not collides:
            nx, ny, code = ox, oy, current[0]
        else:
            code = current[0] if current else allowed[0]
            nx, ny = _interior_point(state_paths[code], occupied, index)
            for other in root.findall(".//s:circle", N):
                x, y = _position(other)
                own_node = other.get("data-pin") in (None, str(index))
                own_color = other.get("stroke", "").lower() == color or other.get("fill", "").lower() == color
                if own_node and own_color and abs(x - ox) < .075 and abs(y - oy) < .075:
                    other.set("cx", str(nx))
                    other.set("cy", str(ny))
            changes.append({"crop": crop, "node": row["id"], "name": row["name"],
                            "before": [ox, oy], "after": [nx, ny], "state": code,
                            "reason": "overlapping node targets" if current else "outside source node jurisdiction",
                            "sourceLocator": row["locator"]})
        circle.set("data-pin-state", code)
        circle.set("aria-label", row["name"] + " · indicative " + code + " position; exact facility location unverified")
        occupied.append((nx, ny, index))
    for circle in pins:
        index = int(circle.get("data-pin"))
        x, y = _position(circle)
        row = records[crop]["processing"][index]
        if not any(inside_state(x, y, state_paths[c]) for c in row["stateCodes"] if c in state_paths):
            raise ValueError("Processing pin failed source-jurisdiction containment: " + row["id"])
    for a, first in enumerate(pins):
        for second in pins[a + 1:]:
            if first.get("data-pin") != second.get("data-pin") and math.dist(_position(first), _position(second)) < 18:
                raise ValueError("Different processing nodes still overlap")
    return changes

import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import {
  cropAssets,
  fieldCropSlugs,
  isCropSlug,
  primaryPurposeLabel,
  sourceRecords,
  type CropSlug,
} from "@/lib/gramshakti/assets";
import {
  calendarFor,
  cropRecords,
  defaultYearForCrop,
  districtHistory,
  monthsInWindow,
  productionRecords,
  protectionEvidence,
  stateProduction,
} from "@/lib/gramshakti/procurement";
import audit from "@/lib/gramshakti/artwork-audit.json";

describe("Rice-to-Niger source and artwork release", () => {
  it("releases exactly the 24 approved crops in addition to the original 16", () => {
    expect(fieldCropSlugs).toHaveLength(24);
    expect(fieldCropSlugs[0]).toBe("rice");
    expect(fieldCropSlugs.at(-1)).toBe("niger-seeds");
    expect(Object.keys(cropAssets)).toHaveLength(40);
    expect(isCropSlug("maize")).toBe(false);
    expect(isCropSlug("sugarcane")).toBe(false);
    expect(primaryPurposeLabel("rice")).toBe("Primary");
    expect(primaryPurposeLabel("cotton")).toBe("Primary");
    expect(primaryPurposeLabel("mango")).toBe("Fresh");
  });
  it("retains cotton and combined jute/mesta tonne conversions exactly once", () => {
    expect(stateProduction("cotton", "GJ", "2024-25")).toMatchObject({
      tonnes: 1217200,
      originalConversion: "million bales (170 kg each); source value × 170,000 = tonnes",
    });
    expect(stateProduction("jute-mesta", "WB", "2024-25")).toMatchObject({
      tonnes: 1265400,
      originalConversion: "million bales (180 kg each); source value × 180,000 = tonnes",
    });
    expect(stateProduction("rice", "PB", "2024-25")?.tonnes).toBe(14360000);
    expect(productionRecords("niger-seeds")).toEqual([]);
    expect(stateProduction("castor", "GJ", "2024-25")).toBeUndefined();
    expect(defaultYearForCrop("barley")).toBe("2021-22");
  });
  it("retains all supplied Tamil Nadu district rows including the Urad crop alias", () => {
    for (const crop of [
      "rice",
      "jowar",
      "bajra",
      "ragi",
      "gram",
      "pigeon-pea",
      "black-gram",
      "moong",
    ] as CropSlug[]) {
      const rows = districtHistory(crop, "TN");
      expect(rows, crop).toHaveLength(38);
      expect(
        rows.every((row) => row.year === "2024-25"),
        crop,
      ).toBe(true);
      expect(
        rows.every((row) => row.areaUnit === "ha"),
        crop,
      ).toBe(true);
    }
    expect(districtHistory("black-gram", "TN")[0]?.cropLabel).toBe("Urad");
    expect(districtHistory("rice", "PB")).toEqual([]);
  });
  it("keeps the unheaded Barley source separate from Ragi and preserves context-only estimates", () => {
    expect(cropRecords("barley").productionContext.passages.length).toBeGreaterThan(0);
    expect(
      cropRecords("barley").productionContext.passages.every(
        (row) => row.locator.block >= 2114 && row.locator.block < 2168,
      ),
    ).toBe(true);
    expect(
      cropRecords("ragi").productionContext.passages.every((row) => row.locator.block < 2114),
    ).toBe(true);
    expect(
      cropRecords("soybean").productionContext.passages.some((row) =>
        row.stateCodes.includes("MH"),
      ),
    ).toBe(true);
    expect(cropRecords("niger-seeds").productionContext.passages.length).toBeGreaterThan(0);
  });
  it("keeps Basmati node varieties and node jurisdiction distinct from catchments", () => {
    const northern = cropRecords("rice").processing[0]!;
    expect([...northern.stateCodes].sort()).toEqual(["HR", "PB"]);
    expect(northern.catchment.join(" ")).toContain("Uttar Pradesh");
    expect(northern.relatedVarieties.some((row) => /non[- ]?basmati/i.test(row.variety))).toBe(
      false,
    );
    expect(northern.relatedVarieties.some((row) => row.variety.includes("1121"))).toBe(true);
    expect(cropRecords("rice").processing[1]?.stateCodes).toEqual(["WB"]);
    expect(
      northern.relatedVarieties.every((row) =>
        row.scope.includes("processor acceptance requires verification"),
      ),
    ).toBe(true);
  });
  it("expands literal day-qualified month ranges and retains Boro availability", () => {
    expect(monthsInWindow("June 15 – October 31")).toEqual([5, 6, 7, 8, 9]);
    expect(calendarFor("rice", "June", "WB").some((row) => row.system === "Boro (Summer)")).toBe(
      true,
    );
    expect(calendarFor("rice", "February", "WB")).toEqual([]);
  });
  it("opens the correct crop-specific later crosswalk without exposing treatment prescriptions", () => {
    for (const crop of fieldCropSlugs as CropSlug[]) {
      const evidence = protectionEvidence(crop, 0)!;
      expect(evidence.url).toContain("1J3ZQGbI51KarrX-dpLAqXTtFyjptqtav");
      expect(evidence.passage).toContain("Cross Walks-2.0.docx");
      expect(evidence.passage).not.toMatch(/@\s*\d|\d\s*(?:g\/L|mL\/L|tablets\/MT)/i);
    }
    expect(sourceRecords.ragi.protection).toHaveLength(2);
  });
  it("checks all 72 original map geometries, exact bytes, source controls and removal of truncated template copy", () => {
    const rows = audit.assets.filter((row) => fieldCropSlugs.includes(row.crop));
    expect(rows).toHaveLength(72);
    for (const row of rows) {
      const bytes = readFileSync(`public/gramshakti/crops/${row.crop}/${row.screen}.svg`);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(row.application_sha256);
      const svg = new DOMParser().parseFromString(bytes.toString(), "image/svg+xml");
      const paths = [...svg.querySelectorAll("path")].map((path) => path.getAttribute("d"));
      const expected = "source_geometry_sha256" in row ? row.source_geometry_sha256 : undefined;
      expect(expected).toMatch(/^[a-f0-9]{64}$/);
      expect(createHash("sha256").update(JSON.stringify(paths)).digest("hex")).toBe(expected);
      const text = [...svg.querySelectorAll("text")].map((node) => node.textContent).join(" ");
      expect(text).not.toMatch(
        /Windows combine displayed|Peak = count|FINAL STATIC|State production:|HIGH PRESSURE|Crosswalk-listed varieties|…/,
      );
      if (row.screen === "006") {
        expect(svg.querySelectorAll("[data-cluster]").length).toBe(3);
        expect(
          new Set(
            [...svg.querySelectorAll("[data-pin]")].map((node) => node.getAttribute("data-pin")),
          ).size,
        ).toBe(3);
      }
      if (row.screen === "002") {
        expect(svg.querySelector('[data-action="processing"]')).not.toBeNull();
        expect(svg.querySelector('[data-action="protection"]')).not.toBeNull();
        expect(svg.querySelector('[data-action^="state:"]')).not.toBeNull();
      }
    }
  });
});

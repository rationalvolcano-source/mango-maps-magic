import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { cropAssets, isCropSlug, type CropSlug } from "@/lib/gramshakti/assets";
import audit from "@/lib/gramshakti/artwork-audit.json";
import {
  calendarFor,
  cropRecords,
  districtHistory,
  lgdState,
  monthsInWindow,
  productionEvidence,
  resolveState,
  stateHistory,
  stateProduction,
} from "@/lib/gramshakti/procurement";
import { selectionSearch } from "@/lib/gramshakti/data";

describe("Source-backed procurement release", () => {
  it("provides real availability, commercial and processing records for all forty released crops", () => {
    expect(Object.keys(cropAssets)).toHaveLength(40);
    for (const crop of Object.keys(cropAssets) as CropSlug[]) {
      const records = cropRecords(crop);
      expect(records.calendar.length, crop).toBeGreaterThan(0);
      expect(records.belts.length, crop).toBeGreaterThan(0);
      expect(records.processing.length, crop).toBe(cropAssets[crop].clusters.length);
      for (const row of [...records.calendar, ...records.belts, ...records.processing]) {
        expect(row.locator.url).toMatch(/^https:\/\//);
        expect(row.locator.sha256).toMatch(/^[a-f0-9]{64}$/);
        expect(row.locator.block).toBeGreaterThan(0);
      }
    }
  });
  it("recovers the three calendars omitted by the earlier extraction", () => {
    expect(cropRecords("apple").calendar).toHaveLength(13);
    expect(cropRecords("jackfruit").calendar).toHaveLength(8);
    expect(cropRecords("potato").calendar).toHaveLength(13);
  });
  it("uses actual month windows including year-wrap and does not infer months from durations", () => {
    expect(monthsInWindow("October – June (Staggered picks)")).toEqual([
      0, 1, 2, 3, 4, 5, 9, 10, 11,
    ]);
    expect(monthsInWindow("April – mid-June")).toEqual([3, 4, 5]);
    expect(monthsInWindow("Round the year (Hosur & Nilgiris)")).toHaveLength(12);
    expect(monthsInWindow("Staggered 9-month harvest cycles")).toEqual([]);
    expect(calendarFor("capsicum", "January", "WB")).toHaveLength(1);
    expect(calendarFor("capsicum", "July", "WB")).toHaveLength(0);
    expect(calendarFor("mango", "June", "AP").some((r) => r.variety === "Totapuri")).toBe(true);
  });
  it("keeps advance estimates, missing production and tonnes distinct", () => {
    expect(stateProduction("mango", "TN", "2024-25")?.tonnes).toBe(1016060);
    const capsicum = stateProduction("capsicum", "JH", "2024-25");
    expect(capsicum?.tonnes).toBe(63600);
    expect(capsicum?.status).toContain("ADVANCE_ESTIMATE");
    expect(productionEvidence("capsicum", capsicum, "JH", "2024-25").displayUnit).toBe("Tonnes");
    expect(stateProduction("capsicum", "WB", "2024-25")).toBeUndefined();
    expect(stateHistory("mango", "AP").some((r) => r.year === "2018-19")).toBe(false);
  });
  it("retains exact district years, native units and the missed Onion/Oranges evidence", () => {
    const tamil = districtHistory("mango", "TN");
    expect(tamil).toHaveLength(38);
    expect(tamil.find((r) => r.district === "Ariyalur")).toMatchObject({
      year: "2024-25",
      area: 522,
      production: 3054,
      yield: 5855,
      yieldUnit: "kg/ha",
    });
    expect(districtHistory("onion", "KA")).toHaveLength(30);
    expect(districtHistory("onion", "KA").every((r) => r.year === "2021-22")).toBe(true);
    expect(districtHistory("orange", "TN")).toHaveLength(38);
    expect(districtHistory("capsicum", "WB")).toEqual([]);
  });
  it("uses numeric LGD identity while preserving distinct node and catchment jurisdictions", () => {
    expect(resolveState("Jammu & Kashmir")).toBe("JK");
    expect(resolveState("Jammu And Kashmir")).toBe("JK");
    expect(lgdState("JK")?.lgd_state_code).toBe("1");
    expect(cropRecords("apple").processing[0]?.stateCodes).toEqual(["UK"]);
    expect(cropRecords("banana").processing[0]?.stateCodes).not.toContain("MP");
    expect(cropRecords("capsicum").processing[0]?.stateCodes).not.toContain("HP");
    expect(isCropSlug("constructor")).toBe(false);
    expect(isCropSlug("__proto__")).toBe(false);
  });
  it("preserves selections and accepts only bounded safe brief record identifiers", () => {
    expect(
      selectionSearch({
        purpose: "processed",
        month: "June",
        year: "2021-22",
        items: "mango-calendar-1-4",
      }),
    ).toEqual({
      purpose: "processed",
      month: "June",
      year: "2021-22",
      items: "mango-calendar-1-4",
    });
    expect(selectionSearch({ items: "<script>alert(1)</script>" }).items).toBeUndefined();
  });
  it("ships all 120 source-verified SVGs with preserved map geometry and local runtime paths", () => {
    expect(audit.sources_verified).toBe(120);
    expect(audit.geometry_preserved).toBe(120);
    for (const row of audit.assets) {
      const crop = row.crop as CropSlug;
      const screen = row.screen as "002" | "003" | "006";
      const asset = cropAssets[crop].screens[screen];
      expect(asset.application).toMatch(/^\/gramshakti\/crops\//);
      const path = resolve("public", asset.application.slice(1));
      expect(existsSync(path)).toBe(true);
      const data = readFileSync(path);
      expect(createHash("sha256").update(data).digest("hex")).toBe(row.application_sha256);
      const svg = new DOMParser().parseFromString(data.toString(), "image/svg+xml");
      expect(svg.querySelector("parsererror")).toBeNull();
      expect(svg.querySelectorAll("[data-action]").length).toBeGreaterThan(
        screen === "003" ? 10 : 20,
      );
      const text = [...svg.querySelectorAll("text")].map((e) => e.textContent).join(" ");
      expect(text).not.toMatch(
        /HIGH PRESSURE|MIXED SIGNALS|FINAL STATIC SPECIFICATION|State production:/,
      );
    }
  });
});

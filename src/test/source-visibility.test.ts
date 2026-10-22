import { describe, expect, it } from "vitest";
import { isPublicSource, readablePassage } from "@/lib/gramshakti/source-visibility";
import { cropAssets, type CropSlug } from "@/lib/gramshakti/assets";
import { protectionEvidence, cropRecords, beltEvidence } from "@/lib/gramshakti/procurement";

describe("source lockdown", () => {
  it("never treats crosswalk, Production Context or internal sheets as openable", () => {
    expect(
      isPublicSource("https://drive.google.com/file/d/1_OP2pkz8uEIJ0ptXEiSfv_l8OezL-l3-/view"),
    ).toBe(false);
    expect(
      isPublicSource("https://docs.google.com/document/d/1e9EXVD5b2MfbSr7UyhieBx8YooXf-wP1/edit"),
    ).toBe(false);
    expect(isPublicSource("https://agriwelfare.gov.in/en/StatHortEst")).toBe(true);
  });
  it("removes automated locator text from every protection and belt passage", () => {
    for (const crop of Object.keys(cropAssets) as CropSlug[]) {
      const p = protectionEvidence(crop, 0);
      if (p) expect(readablePassage(p.passage)).not.toMatch(/body block|\.docx/);
      const belt = cropRecords(crop).belts[0];
      if (belt) expect(readablePassage(beltEvidence(crop, belt).passage)).not.toMatch(/body block/);
    }
  });
});

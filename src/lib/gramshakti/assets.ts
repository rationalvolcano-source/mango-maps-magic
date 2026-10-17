import manifest from "./asset-manifest.json";
import records from "./source-records.json";
import stateCodes from "./state-codes.json";
import canonical from "./canonical-crops.json";
import fieldCrops from "./field-crops.json";
import { type Evidence } from "./data";
export type Screen = "002" | "003" | "006";
export const cropAssets = manifest;
export type CropSlug = keyof typeof manifest;
export const canonicalCrops = canonical;
export const fieldCropSlugs: readonly string[] = fieldCrops;
export const isFieldCrop = (crop: string) => fieldCropSlugs.includes(crop);
export const primaryPurposeLabel = (crop: string) => (isFieldCrop(crop) ? "Primary" : "Fresh");
export const stateNames = stateCodes;
export function isCropSlug(value: string): value is CropSlug {
  return Object.hasOwn(manifest, value);
}
export function cropSlug(name: string) {
  return Object.keys(manifest).find((k) => manifest[k as CropSlug].name === name);
}
export const sourceRecords = records;
export const crosswalkUrl =
  "https://docs.google.com/document/d/1_OP2pkz8uEIJ0ptXEiSfv_l8OezL-l3-/edit";
export function sourceRecord(
  title: string,
  passage: string,
  url = crosswalkUrl,
  overrides: Partial<Evidence> = {},
): Evidence {
  return {
    title,
    passage,
    url,
    period: "Source reporting period; static reference, not live analytics",
    nativeUnit: "Descriptive source context",
    displayUnit: "Descriptive source context",
    evidenceClass: "Source passage",
    transformation: "Original visual preserved; supported local corrections only",
    caveat:
      "Source context is not an outbreak forecast or pesticide prescription. No rates, schedules, PHIs or regulatory validation are implied.",
    ...overrides,
  };
}
export const blockerReasons: Record<string, string> = {
  Maize:
    "BLOCKED_CONTENT_MISMATCH — extracted section contained no target mentions and matched Wheat most strongly.",
  Sugarcane: "MISSING_CROSSWALK — no dedicated canonical heading was found.",
  "Green Chillies": "BLOCKED_INCOMPLETE — 0/4 required evidence signatures.",
  Tapioca: "BLOCKED_CONTENT_MISMATCH — section matched Sweet Potato.",
  Arecanut: "BLOCKED_CONTENT_MISMATCH — section matched Sweet Potato.",
};

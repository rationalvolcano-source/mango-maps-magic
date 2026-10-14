import snapshot from "./procurement-records.json";
import official from "./official-records.json";
import stateCodes from "./state-codes.json";
import lgd from "./lgd-states.json";
import { cropAssets, sourceRecords, type CropSlug } from "./assets";
import { months, type Evidence } from "./data";

export type Locator = {
  url: string;
  document: string;
  block: number;
  sha256: string;
  table?: number | undefined;
  row?: number | undefined;
};
export type CalendarRow = {
  id: string;
  state: string;
  stateCodes: string[];
  variety: string;
  system: string;
  windows: { label: string; text: string }[];
  cells: string[];
  headers: string[];
  locator: Locator;
};
export type BeltRow = {
  id: string;
  origin: string;
  stateCodes: string[];
  variety: string;
  traits: string;
  destinations: string;
  cells: string[];
  headers: string[];
  locator: Locator;
};
export type ProcessingRow = {
  id: string;
  name: string;
  stateCodes: string[];
  products: string[];
  catchment: string[];
  paragraphs: { text: string; locator: Locator }[];
  locator: Locator;
  index: number;
  relatedVarieties: { variety: string; geography: string; locator: Locator; scope: string }[];
};
export type EstimateRow = {
  id: string;
  stateCodes: string[];
  headers: string[];
  cells: string[];
  locator: Locator;
};
export type EstimatePassage = { id: string; stateCodes: string[]; text: string; locator: Locator };
export type CropRecords = {
  calendar: CalendarRow[];
  belts: BeltRow[];
  processing: ProcessingRow[];
  protectionLocators: { name: string; locator: Locator }[];
  productionContext: {
    summary: { text: string; locator: Locator }[];
    rows: EstimateRow[];
    passages: EstimatePassage[];
    url: string;
    classification: string;
  };
};
export type ProductionRow = {
  row: number;
  year: string;
  state: string;
  tonnes: number;
  authority: string;
  publication: string;
  url: string;
  originalConversion: string;
  status: string;
};
export type DistrictRow = {
  id: string;
  row: number;
  year: string;
  district: string;
  state: string;
  area: number | null;
  production: number | null;
  yield: number | null;
  yieldKind: string;
  areaUnit: string;
  productionUnit: string;
  yieldUnit: string;
  missingFlag: string;
  normalizedProduction: number | null;
  derivedYield: number | null;
  sourceId: string;
  areaPage: number | null;
  productionPage: number | null;
  yieldPage: number | null;
  status: string | null;
  sourceTitle: string;
  sourceUrl: string;
};
type Snapshot = {
  snapshot: string;
  crosswalkUrl: string;
  productionContextUrl: string;
  districtUrl: string;
  crops: Record<CropSlug, CropRecords>;
  district: Record<CropSlug, DistrictRow[]>;
};
export const procurement = snapshot as unknown as Snapshot;
export const cropRecords = (crop: CropSlug): CropRecords => procurement.crops[crop];
export const productionRecords = (crop: CropSlug): ProductionRow[] => official[crop].production;
export const districtRecords = (crop: CropSlug): DistrictRow[] => procurement.district[crop];
export const normalizeName = (value: string) =>
  value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]/g, "");
const aliases: Record<string, string> = Object.fromEntries(
  Object.entries(stateCodes).map(([name, code]) => [normalizeName(name), code]),
);
Object.assign(aliases, {
  jandk: "JK",
  jk: "JK",
  od: "OR",
  orissa: "OR",
  uttaranchal: "UK",
  ut: "UK",
  pondicherry: "PY",
  andamanandnicobar: "AN",
});
for (const code of Object.values(stateCodes)) aliases[code.toLowerCase()] = code;
export function resolveState(value: string): string | undefined {
  const key = normalizeName(value);
  return Object.hasOwn(aliases, key) ? aliases[key] : undefined;
}
export function stateName(code: string): string | undefined {
  return Object.entries(stateCodes).find(([, value]) => value === code)?.[0];
}
export function lgdState(code: string) {
  return lgd.find((row) => resolveState(row.state_name) === code);
}
export function statesInText(value: string): string[] {
  const text = value.replace(/&/g, " and ");
  const found = new Set<string>();
  for (const [name, code] of Object.entries(stateCodes)) {
    const pattern = name
      .split(/\s+/)
      .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s+");
    if (new RegExp(`\\b${pattern}\\b`, "i").test(text)) found.add(code);
  }
  for (const match of text.matchAll(
    /\b(?:AP|TS|TN|KA|MH|MP|GJ|WB|BR|JH|UP|UK|UT|HP|HR|PB|RJ|KL|AS|CG|OR|OD|JK)\b/g,
  )) {
    const code = resolveState(match[0]);
    if (code) found.add(code);
  }
  return [...found];
}
export const sameState = (value: string, code: string) => resolveState(value) === code;
export const yearsForCrop = (crop: CropSlug) =>
  [
    ...new Set([
      "2024-25",
      ...productionRecords(crop).map((row) => row.year),
      ...districtRecords(crop).map((row) => row.year),
    ]),
  ]
    .sort()
    .reverse();
export function stateProduction(
  crop: CropSlug,
  code: string,
  year: string,
): ProductionRow | undefined {
  return productionRecords(crop).find((row) => sameState(row.state, code) && row.year === year);
}
export function stateHistory(crop: CropSlug, code: string): ProductionRow[] {
  return productionRecords(crop)
    .filter((row) => sameState(row.state, code))
    .sort((a, b) => a.year.localeCompare(b.year));
}
export function rankedProduction(crop: CropSlug, year: string): ProductionRow[] {
  return productionRecords(crop)
    .filter((row) => row.year === year)
    .sort((a, b) => b.tonnes - a.tonnes);
}
export function districtHistory(crop: CropSlug, code: string): DistrictRow[] {
  return districtRecords(crop)
    .filter((row) => sameState(row.state, code))
    .sort((a, b) => b.year.localeCompare(a.year) || a.district.localeCompare(b.district));
}
export const formatNumber = (value: number | null | undefined) =>
  value == null ? "—" : value.toLocaleString("en-IN", { maximumFractionDigits: 3 });
export function statusLabel(status: string | null | undefined): string {
  if (!status) return "Source status not supplied";
  if (status.includes("ADVANCE")) return "Official advance estimate";
  if (status.includes("FINAL_ESTIMATE")) return "Official final estimate";
  if (status.includes("STATE_CONTROL")) return "Official published state record";
  if (status.includes("GOVT_VERIFIED")) return "Government source record";
  if (status.startsWith("PASS")) return "Source QA passed";
  return status.replaceAll("_", " ");
}

const monthRegex =
  "January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec";
export function monthsInWindow(text: string): number[] {
  if (/round[ -]the[ -]year|year[ -]round|throughout the year|all year/i.test(text))
    return Array.from({ length: 12 }, (_, i) => i);
  const result = new Set<number>();
  // Only literal month names/ranges are expanded. Crop seasons, durations and vague prose remain unknown.
  const range = new RegExp(
    `\\b(${monthRegex})\\b\\s*(?:\\([^)]*\\)\\s*)?(?:[–—-]|to|through|until)\\s*(?:(?:early|mid|late)[ -]*)?\\b(${monthRegex})\\b`,
    "gi",
  );
  for (const match of text.matchAll(range)) {
    const start = months.findIndex((m) =>
      m.toLowerCase().startsWith(match[1]!.toLowerCase().slice(0, 3)),
    );
    const end = months.findIndex((m) =>
      m.toLowerCase().startsWith(match[2]!.toLowerCase().slice(0, 3)),
    );
    if (start < 0 || end < 0) continue;
    for (let current = start, steps = 0; steps < 12; steps++, current = (current + 1) % 12) {
      result.add(current);
      if (current === end) break;
    }
  }
  for (const match of text.matchAll(new RegExp(`\\b(${monthRegex})\\b`, "gi"))) {
    const i = months.findIndex((m) =>
      m.toLowerCase().startsWith(match[1]!.toLowerCase().slice(0, 3)),
    );
    if (i >= 0) result.add(i);
  }
  return [...result].sort((a, b) => a - b);
}
export function calendarMatches(row: CalendarRow, month?: string): boolean {
  if (!month) return true;
  const index = months.indexOf(month);
  return row.windows.some((w) => monthsInWindow(w.text).includes(index));
}
export function calendarFor(crop: CropSlug, month?: string, code?: string): CalendarRow[] {
  return cropRecords(crop).calendar.filter(
    (row) => (!code || row.stateCodes.includes(code)) && calendarMatches(row, month),
  );
}
export function availabilityEvidence(crop: CropSlug, code: string, month: string): Evidence {
  const rows = calendarFor(crop, month, code);
  return sourceEvidence(
    `${cropAssets[crop].name} · ${stateName(code) ?? code} · ${month}`,
    rows.length
      ? rows
          .map(
            (row) =>
              `${locatorText(row.locator)}\n${row.headers.map((h, i) => `${h}: ${row.cells[i] || "Merged state cell; see state label"}`).join("\n")}`,
          )
          .join("\n\n")
      : "No exact source window for this state/month. Missing evidence does not establish that supply is absent.",
    procurement.crosswalkUrl,
    {
      transformation:
        "Month overlap derived from literal source calendar ranges; early/mid/late qualifiers remain in the original passage.",
      caveat:
        "The visual may aggregate multiple cultivar rows. These are named source windows, not live stock, prices or guaranteed procurement availability.",
    },
  );
}
export const locatorText = (loc: Locator): string =>
  `${loc.document} · body block ${loc.block}${loc.table ? ` · table ${loc.table}` : ""}${loc.row ? ` · row ${loc.row}` : ""}`;
export function sourceEvidence(
  title: string,
  passage: string,
  url: string,
  overrides: Partial<Evidence> = {},
): Evidence {
  return {
    title,
    passage,
    url,
    period: "Source reporting period; see the literal passage",
    nativeUnit: "Descriptive source fields",
    displayUnit: "Source fields retained",
    evidenceClass: "Crosswalk source context",
    transformation: "Exact source extraction; no missing values estimated",
    caveat:
      "Source context requires current commercial verification. It is not a stock, capacity, creditworthiness or pesticide-use claim.",
    ...overrides,
  };
}
export function calendarEvidence(crop: CropSlug, row: CalendarRow): Evidence {
  return sourceEvidence(
    `${cropAssets[crop].name} · ${row.state} · ${row.variety}`,
    `${locatorText(row.locator)}\nState (including merged-cell continuation): ${row.state}\n${row.headers.map((h, i) => `${h}: ${row.cells[i] || "—"}`).join("\n")}`,
    row.locator.url,
  );
}
export function beltEvidence(crop: CropSlug, row: BeltRow): Evidence {
  return sourceEvidence(
    `${cropAssets[crop].name} · ${row.variety}`,
    `${locatorText(row.locator)}\n${row.headers.map((h, i) => `${h}: ${row.cells[i] || "—"}`).join("\n")}`,
    row.locator.url,
  );
}
export function processingEvidence(crop: CropSlug, row: ProcessingRow): Evidence {
  return sourceEvidence(
    `${cropAssets[crop].name} · ${row.name}`,
    row.paragraphs.map((p) => `${locatorText(p.locator)}\n${p.text}`).join("\n\n"),
    row.locator.url,
    {
      caveat:
        "Processing-node jurisdiction, catchment and commercial belt are distinct. Facilities and product roles are descriptive source context; operating status and capacity require direct verification.",
    },
  );
}
export function productionEvidence(
  crop: CropSlug,
  row: ProductionRow | undefined,
  code: string,
  year: string,
): Evidence {
  return sourceEvidence(
    `${cropAssets[crop].name} · ${stateName(code) ?? code} · production`,
    row
      ? `Mandatory Crops Statewise Production · row ${row.row}\n${row.authority}\n${row.publication}\n${row.state} · ${row.year}\n${row.tonnes} tonnes\nClassification: ${row.status}\nRecorded upstream conversion: ${row.originalConversion}`
      : `No exact ${year} crop/state production record is supplied.`,
    "https://docs.google.com/spreadsheets/d/1JkNGc4fvKO9_dXegJKpTuj5TZSxNWt4CaAnSJsn5oa8/edit",
    {
      period: year,
      nativeUnit: "Tonnes, already normalized in the canonical workbook",
      displayUnit: "Tonnes",
      evidenceClass: row ? statusLabel(row.status) : "Missing record",
      transformation:
        "No rescaling. No district sum substituted. Area and yield are not supplied in this state table.",
      caveat:
        "Year and estimate status belong to this record. Coverage is partial; missing is not zero.",
      ...(row?.url ? { upstreamUrl: row.url } : {}),
    },
  );
}
export function districtEvidence(crop: CropSlug, row: DistrictRow): Evidence {
  return sourceEvidence(
    `${cropAssets[crop].name} · ${row.district} · ${row.year}`,
    `District APY Master · row ${row.row}\n${row.sourceId} · ${row.sourceTitle}\n${row.state} · ${row.district} · ${row.year}\nArea: ${row.area ?? "—"} ${row.areaUnit}\nProduction: ${row.production ?? "—"} ${row.productionUnit}\nPublished/native yield: ${row.yield ?? "—"} ${row.yieldUnit} (${row.yieldKind})\nArea page: ${row.areaPage ?? "—"}; production page: ${row.productionPage ?? "—"}; yield page: ${row.yieldPage ?? "—"}\n${row.status ?? "—"} · ${row.missingFlag}`,
    procurement.districtUrl,
    {
      period: row.year,
      nativeUnit: `${row.areaUnit}; ${row.productionUnit}; ${row.yieldUnit}`,
      displayUnit: "Original district units",
      evidenceClass: "Official district source record",
      transformation:
        "Native APY retained, including published yield and source zero/missing flags. No aggregate substituted for state totals.",
      caveat:
        "District coverage and years vary by crop/state. Source discrepancies remain documented in the workbook.",
      ...(row.sourceUrl.startsWith("https://") ? { upstreamUrl: row.sourceUrl } : {}),
    },
  );
}
export function estimateEvidence(crop: CropSlug, row: EstimateRow | EstimatePassage): Evidence {
  const passage =
    "text" in row ? row.text : row.headers.map((h, i) => `${h}: ${row.cells[i] || "—"}`).join("\n");
  return sourceEvidence(
    `${cropAssets[crop].name} · Production Context estimate`,
    `${locatorText(row.locator)}\n${passage}`,
    row.locator.url,
    {
      evidenceClass: "Production Context estimate",
      caveat:
        "This is a source estimate, not official district APY. Preserve the passage’s time basis; do not multiply its shares by a different-year state total.",
    },
  );
}
export function protectionEvidence(crop: CropSlug, index: number): Evidence | undefined {
  const row = sourceRecords[crop].protection[index];
  if (!row) return undefined;
  const loc = cropRecords(crop).protectionLocators.find(
    (p) => normalizeName(p.name) === normalizeName(row.name),
  );
  return sourceEvidence(
    `${cropAssets[crop].name} · ${row.name}`,
    `${loc ? locatorText(loc.locator) : row.passage}\nGeography: ${row.geography}\nCommercial impact: ${row.impact}\nManagement modes: ${row.modes.join(" · ")}`,
    procurement.crosswalkUrl,
    {
      caveat:
        "Regional pest/management context only. No input-pressure score, outbreak forecast, validated chemical label, dose, schedule or PHI is implied.",
    },
  );
}

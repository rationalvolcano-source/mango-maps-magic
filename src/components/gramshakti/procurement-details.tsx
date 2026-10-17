import { useEffect, useState } from "react";
import { Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  FileText,
  Plus,
  Printer,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSource, SelectionControls, AppHeader } from "./shared";
import {
  cropAssets,
  isCropSlug,
  sourceRecords,
  canonicalCrops,
  cropSlug,
  primaryPurposeLabel,
  type CropSlug,
  type Screen,
} from "@/lib/gramshakti/assets";
import { months } from "@/lib/gramshakti/data";
import {
  availabilityEvidence,
  beltEvidence,
  calendarEvidence,
  calendarFor,
  cropRecords,
  districtEvidence,
  districtHistory,
  estimateEvidence,
  formatNumber,
  lgdState,
  locatorText,
  processingEvidence,
  productionEvidence,
  protectionEvidence,
  rankedProduction,
  resolveState,
  sourceEvidence,
  stateHistory,
  stateName,
  stateProduction,
  statusLabel,
  yearsForCrop,
  defaultYearForCrop,
  procurement,
  type CalendarRow,
  type ProcessingRow,
  type DistrictRow,
} from "@/lib/gramshakti/procurement";

export function ProductionYearControl({ crop }: { crop: CropSlug }) {
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  return (
    <label className="year-control">
      Production year{" "}
      <select
        aria-label="Production year"
        value={search.year ?? defaultYearForCrop(crop)}
        onChange={(e) =>
          navigate({ to: ".", search: (p) => ({ ...p, year: e.target.value, items: undefined }) })
        }
      >
        {yearsForCrop(crop).map((year) => (
          <option key={year}>{year}</option>
        ))}
      </select>
    </label>
  );
}

export function CropJourneyNavigation({ crop, screen }: { crop: CropSlug; screen?: Screen }) {
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  return (
    <nav className="journey-tabs" aria-label="Crop journey">
      <label>
        Crop{" "}
        <select
          aria-label="Choose crop"
          value={crop}
          onChange={(e) =>
            navigate({
              to: "/procurement/$crop",
              params: { crop: e.target.value },
              search: (p) => ({ ...p, items: undefined }),
            })
          }
        >
          {canonicalCrops
            .map((name) => ({ name, slug: cropSlug(name) }))
            .filter((row) => row.slug)
            .map((row) => (
              <option value={row.slug} key={row.slug}>
                {row.name}
              </option>
            ))}
        </select>
      </label>
      <Button asChild variant={screen === "002" ? "default" : "ghost"} size="sm">
        <Link to="/procurement/$crop" params={{ crop }} search={search}>
          Sourcing
        </Link>
      </Button>
      <Button asChild variant={screen === "006" ? "default" : "ghost"} size="sm">
        <Link to="/procurement/$crop/processing" params={{ crop }} search={search}>
          Processing
        </Link>
      </Button>
      <Button asChild variant={screen === "003" ? "default" : "ghost"} size="sm">
        <Link to="/procurement/$crop/crop-protection" params={{ crop }} search={search}>
          Crop protection
        </Link>
      </Button>
      <ProductionYearControl crop={crop} />
    </nav>
  );
}

function useShortlist(crop: CropSlug) {
  const search = useSearch({ strict: false });
  const key = `gramshakti-brief-v1:${crop}:${search.purpose ?? "fresh"}:${search.month ?? "any"}:${search.year ?? defaultYearForCrop(crop)}`;
  const [stored, setStored] = useState<{ key: string; ids: string[] }>({ key: "", ids: [] });
  const ids = stored.key === key ? stored.ids : [];
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(key) ?? "[]");
      setStored({
        key,
        ids: Array.isArray(saved)
          ? saved.filter((x: unknown) => typeof x === "string").slice(0, 5)
          : [],
      });
    } catch {
      setStored({ key, ids: [] });
    }
  }, [key]);
  function toggle(id: string) {
    const next = ids.includes(id)
      ? ids.filter((x) => x !== id)
      : ids.length < 5
        ? [...ids, id]
        : ids;
    setStored({ key, ids: next });
    try {
      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      /* The brief still works without browser storage. */
    }
  }
  return { ids, toggle, search };
}

function BriefLink({ crop, ids }: { crop: CropSlug; ids: string[] }) {
  return (
    <Button asChild variant="outline" size="sm">
      <Link
        to="/procurement/$crop/brief"
        params={{ crop }}
        search={(p) => ({ ...p, items: ids.join(",") })}
      >
        <FileText />
        Sourcing brief{ids.length ? ` (${ids.length})` : ""}
      </Link>
    </Button>
  );
}

function AddCandidate({
  id,
  selected,
  onToggle,
  full,
}: {
  id: string;
  selected: boolean;
  onToggle: (id: string) => void;
  full: boolean;
}) {
  return (
    <Button
      size="sm"
      variant={selected ? "secondary" : "outline"}
      onClick={() => onToggle(id)}
      disabled={full && !selected}
      aria-label={`${selected ? "Remove" : "Add"} candidate ${id}`}
    >
      {selected ? <Check /> : <Plus />}
      {selected ? "Added" : "Add to brief"}
    </Button>
  );
}

function CalendarTable({
  crop,
  rows,
  ids,
  onToggle,
}: {
  crop: CropSlug;
  rows: CalendarRow[];
  ids: string[];
  onToggle: (id: string) => void;
}) {
  const source = useSource();
  return (
    <div className="table-scroll">
      <table className="evidence-table">
        <thead>
          <tr>
            <th>Origin</th>
            <th>Variety / system</th>
            <th>Source availability windows</th>
            <th>Evidence / brief</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                {row.state}
                <div className="state-links">
                  {row.stateCodes.map((code) => (
                    <Link
                      key={code}
                      to="/procurement/$crop/state/$stateCode"
                      params={{ crop, stateCode: code }}
                      search={(p) => p}
                    >
                      {stateName(code)} <ArrowRight className="size-3" />
                    </Link>
                  ))}
                </div>
              </td>
              <td>
                <strong>{row.variety}</strong>
                {row.system && <p className="table-note">{row.system}</p>}
              </td>
              <td>
                {row.windows.map((window, i) => (
                  <p key={i} className="source-window">
                    <span>{window.label}</span>
                    {window.text}
                  </p>
                ))}
              </td>
              <td>
                <div className="table-actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => source(calendarEvidence(crop, row))}
                  >
                    <BookOpen />
                    Source
                  </Button>
                  <AddCandidate
                    id={row.id}
                    selected={ids.includes(row.id)}
                    onToggle={onToggle}
                    full={ids.length >= 5}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && (
        <div className="coverage-empty">
          No exact source window matches this selection. Try another month; unrecorded supply is not
          treated as zero.
        </div>
      )}
    </div>
  );
}

function NodeCard({
  crop,
  row,
  selected,
  onToggle,
  full,
  onOpen,
}: {
  crop: CropSlug;
  row: ProcessingRow;
  selected: boolean;
  onToggle: (id: string) => void;
  full: boolean;
  onOpen?: ((index: number) => void) | undefined;
}) {
  const source = useSource();
  const original = cropAssets[crop].clusters[row.index];
  const variety = original?.texts[4];
  const hasVariety =
    !!variety && !/Read full|not supplied|mapping pending|source-linked cultivars/i.test(variety);
  return (
    <article className="processing-record-card">
      <span className="record-index">{row.index + 1}</span>
      <h3>{row.name}</h3>
      <p className="record-geography">
        {row.stateCodes.map((c) => stateName(c)).join(" · ") ||
          "Jurisdiction: see the exact source passage"}
      </p>
      <div className="record-fields">
        <div>
          <span>Key varieties / source region</span>
          <p>
            {hasVariety
              ? variety
              : "Node-specific varieties are not explicitly supplied. See the linked regional belt records."}
          </p>
        </div>
        <div>
          <span>Products / strategic role</span>
          {row.products.length ? (
            row.products.map((text, i) => <p key={i}>{text}</p>)
          ) : (
            <p>See the exact node passage.</p>
          )}
        </div>
        <div>
          <span>Catchment / inflows</span>
          {row.catchment.length ? (
            row.catchment.map((text, i) => <p key={i}>{text}</p>)
          ) : (
            <p>Full source context is available below.</p>
          )}
        </div>
      </div>
      <details className="full-records">
        <summary>Regional variety evidence</summary>
        {row.relatedVarieties.map((value, i) => (
          <div key={i}>
            <p>
              <strong>{value.variety}</strong> · {value.geography}
            </p>
            <p className="table-note">{value.scope}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                source(
                  sourceEvidence(
                    `${cropAssets[crop].name} · ${value.variety}`,
                    `${locatorText(value.locator)}\n${value.geography}\n${value.variety}`,
                    value.locator.url,
                    { caveat: value.scope },
                  ),
                )
              }
            >
              Variety source
            </Button>
          </div>
        ))}
      </details>
      <div className="record-actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (onOpen ? onOpen(row.index) : source(processingEvidence(crop, row)))}
        >
          Full node context <ArrowRight />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => source(processingEvidence(crop, row))}>
          <BookOpen />
          Source
        </Button>
        <AddCandidate id={row.id} selected={selected} onToggle={onToggle} full={full} />
      </div>
      <p className="table-note">
        Descriptive node context; operating capacity requires verification.
      </p>
    </article>
  );
}

export function DetailedProcurement({
  crop,
  screen,
  onOpenCluster,
}: {
  crop: CropSlug;
  screen: Screen;
  onOpenCluster?: ((index: number) => void) | undefined;
}) {
  const source = useSource();
  const { ids, toggle, search } = useShortlist(crop);
  const records = cropRecords(crop);
  const year = search.year ?? defaultYearForCrop(crop);
  const month = search.month;
  const [state, setState] = useState("");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  useEffect(() => {
    setState("");
    setQuery("");
    setType("All");
  }, [crop, screen]);
  const stateChoices = [...new Set(records.calendar.flatMap((row) => row.stateCodes))].sort(
    (a, b) => (stateName(a) ?? a).localeCompare(stateName(b) ?? b),
  );
  const rows = calendarFor(crop, month, state || undefined).filter((row) =>
    `${row.variety} ${row.system}`.toLowerCase().includes(query.toLowerCase()),
  );
  const ranking = rankedProduction(crop, year);
  return (
    <div className="procurement-workspace">
      <div className="workspace-heading">
        <div>
          <span className="eyebrow">YOUR PROCUREMENT WORKSPACE</span>
          <h2>
            {cropAssets[crop].name} ·{" "}
            {search.purpose === "processed"
              ? "Processing inputs"
              : `${primaryPurposeLabel(crop)} sourcing`}
            {month ? ` · ${month}` : ""}
          </h2>
          <p>
            The original visual stays a fixed source snapshot. The records below follow your
            selection.
          </p>
        </div>
        <BriefLink crop={crop} ids={ids} />
      </div>
      {screen === "002" && (
        <>
          <section className="workspace-section">
            <div className="section-heading">
              <div>
                <h2>State production · {year}</h2>
                <p>{ranking.length} supplied state/UT records · exact source values in tonnes</p>
              </div>
            </div>
            <div className="state-summary-grid">
              {ranking.slice(0, 8).map((row) => {
                const code = resolveState(row.state);
                return (
                  <article key={row.state} className="state-summary-card">
                    {code ? (
                      <Link
                        to="/procurement/$crop/state/$stateCode"
                        params={{ crop, stateCode: code }}
                        search={(p) => p}
                      >
                        <h3>
                          {row.state} <ArrowRight className="size-4" />
                        </h3>
                      </Link>
                    ) : (
                      <h3>{row.state}</h3>
                    )}
                    <strong>
                      {formatNumber(row.tonnes)} <small>t</small>
                    </strong>
                    <span className="evidence-chip">{statusLabel(row.status)}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => source(productionEvidence(crop, row, code ?? row.state, year))}
                    >
                      <BookOpen />
                      Source
                    </Button>
                  </article>
                );
              })}
            </div>
            {ranking.length === 0 && (
              <p className="coverage-empty">
                No official {year} records are supplied. Select an explicitly available historical
                year.
              </p>
            )}
            <details className="full-records">
              <summary>All supplied state records and coverage</summary>
              <div className="table-scroll">
                <table className="evidence-table">
                  <thead>
                    <tr>
                      <th>State / UT</th>
                      <th>Year</th>
                      <th>Production · tonnes</th>
                      <th>Source classification</th>
                      <th>Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((row) => {
                      const code = resolveState(row.state);
                      return (
                        <tr key={row.state}>
                          <td>
                            {code ? (
                              <Link
                                to="/procurement/$crop/state/$stateCode"
                                params={{ crop, stateCode: code }}
                                search={(p) => p}
                              >
                                {row.state}
                              </Link>
                            ) : (
                              row.state
                            )}
                          </td>
                          <td>{row.year}</td>
                          <td>{formatNumber(row.tonnes)}</td>
                          <td>{statusLabel(row.status)}</td>
                          <td>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                source(productionEvidence(crop, row, code ?? row.state, year))
                              }
                            >
                              Source
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p>
                Counts describe cached coverage; missing states are not zero and record sums are not
                national estimates.
              </p>
            </details>
          </section>
          <section className="workspace-section">
            <div className="section-heading">
              <div>
                <h2>Availability and candidate origins</h2>
                <p>
                  {search.purpose === "processed"
                    ? "Raw-crop source windows; processing suitability is confirmed through the node/belt context."
                    : "Source harvest, market-arrival and storage windows."}
                </p>
              </div>
            </div>
            <div className="record-filters">
              <label>
                State{" "}
                <select
                  aria-label="Availability state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">All source states</option>
                  {stateChoices.map((code) => (
                    <option key={code} value={code}>
                      {stateName(code)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Variety / system{" "}
                <input
                  aria-label="Find variety or system"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search source varieties"
                />
              </label>
              <span>{rows.length} matching source rows</span>
            </div>
            {month && (
              <p className="context-note">
                Month matches are derived from literal named windows. Early/mid/late qualifiers
                remain intact; this does not confirm current stock.
              </p>
            )}
            <CalendarTable crop={crop} rows={rows} ids={ids} onToggle={toggle} />
          </section>
          <section className="workspace-section">
            <h2>Commercial varieties, belts and destinations</h2>
            <div className="commercial-record-grid">
              {records.belts.map((row) => (
                <article className="commercial-record" key={row.id}>
                  <h3>{row.variety}</h3>
                  <p className="record-geography">{row.origin}</p>
                  <details>
                    <summary>Quality profile and destinations</summary>
                    <p>{row.traits}</p>
                    <p>
                      <strong>Destinations:</strong> {row.destinations}
                    </p>
                  </details>
                  <Button size="sm" variant="ghost" onClick={() => source(beltEvidence(crop, row))}>
                    <BookOpen />
                    Exact belt source
                  </Button>
                </article>
              ))}
            </div>
          </section>
          {search.purpose === "processed" && (
            <section className="workspace-section">
              <h2>Relevant processing context</h2>
              <p className="context-note">
                Nodes describe industrial roles and catchments. They are separate from cultivar
                distribution and available supplier capacity.
              </p>
              <div className="processing-record-grid">
                {records.processing.map((row) => (
                  <NodeCard
                    key={row.id}
                    crop={crop}
                    row={row}
                    selected={ids.includes(row.id)}
                    onToggle={toggle}
                    full={ids.length >= 5}
                    onOpen={onOpenCluster}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
      {screen === "006" && (
        <section className="workspace-section">
          <h2>Processing nodes and catchments</h2>
          <p className="context-note">
            Every card opens the exact node passage. Node jurisdiction, catchment inflow and
            commercial belt remain distinct.
          </p>
          <div className="processing-record-grid">
            {records.processing.map((row) => (
              <NodeCard
                key={row.id}
                crop={crop}
                row={row}
                selected={ids.includes(row.id)}
                onToggle={toggle}
                full={ids.length >= 5}
                onOpen={onOpenCluster}
              />
            ))}
          </div>
          <details className="full-records">
            <summary>Production Context estimates and their reporting basis</summary>
            {records.productionContext.summary.map((p) => (
              <div key={p.locator.block}>
                <p>{p.text}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    source(
                      sourceEvidence(
                        `${cropAssets[crop].name} · Production Context`,
                        `${locatorText(p.locator)}\n${p.text}`,
                        p.locator.url,
                        {
                          evidenceClass: "Production Context estimate",
                          caveat:
                            "This estimate retains its original reporting basis. It is separate from selected-year official production and not an operating-capacity claim.",
                        },
                      ),
                    )
                  }
                >
                  Source
                </Button>
              </div>
            ))}
          </details>
        </section>
      )}
      {screen === "003" && (
        <section className="workspace-section">
          <div className="section-heading">
            <div>
              <h2>Regional pest and management context</h2>
              <p>
                Source-backed targets and methods; national input-supply pressure remains a separate
                data dependency.
              </p>
            </div>
          </div>
          <div className="record-filters">
            <label>
              Type{" "}
              <select
                aria-label="Protection record type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option>All</option>
                <option>Pests</option>
                <option>Diseases</option>
              </select>
            </label>
            <label>
              Find target / geography{" "}
              <input
                aria-label="Find pest or geography"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search targets and source regions"
              />
            </label>
          </div>
          <div className="protection-record-grid">
            {sourceRecords[crop].protection
              .map((row, index) => ({ row, index }))
              .filter(
                ({ row }) =>
                  (type === "All" || row.type === type) &&
                  `${row.name} ${row.geography}`.toLowerCase().includes(query.toLowerCase()),
              )
              .map(({ row, index }) => (
                <article className="protection-record" key={row.name}>
                  <span className="evidence-chip">{row.type}</span>
                  <h3>{row.name}</h3>
                  <p className="record-geography">{row.geography}</p>
                  <p>{row.impact}</p>
                  <div className="mode-chips">
                    {row.modes.map((mode) => (
                      <span key={mode}>{mode}</span>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const record = protectionEvidence(crop, index);
                      if (record) source(record);
                    }}
                  >
                    <BookOpen />
                    Exact target source
                  </Button>
                </article>
              ))}
          </div>
          <p className="context-note">
            The listed modes describe source context. No dose, schedule, PHI, outbreak forecast or
            pesticide-pressure tier is supplied.
          </p>
        </section>
      )}
      <div className="workspace-footer">
        <span>
          Evidence snapshot · {procurement.snapshot} · your selection is preserved when navigating.
        </span>
        <BriefLink crop={crop} ids={ids} />
      </div>
    </div>
  );
}

function ProductionHistory({ crop, code }: { crop: CropSlug; code: string }) {
  const source = useSource();
  const rows = stateHistory(crop, code);
  const maximum = Math.max(1, ...rows.map((r) => r.tonnes));
  const series = Array.from({ length: 12 }, (_, i) => {
    const start = 2013 + i;
    const year = `${start}-${String(start + 1).slice(-2)}`;
    return { year, row: rows.find((r) => r.year === year) };
  });
  return (
    <section className="state-detail-section">
      <div className="section-heading">
        <div>
          <h2>Historical state production</h2>
          <p>Exact supplied records · tonnes · gaps remain visible</p>
        </div>
      </div>
      <div
        className="history-chart"
        role="img"
        aria-label={`${cropAssets[crop].name} state production history with explicit missing years`}
      >
        {series.map(({ year, row }) => (
          <div className="history-year" key={year}>
            <div className="history-track">
              {row ? (
                <button
                  type="button"
                  style={{ height: `${Math.max(3, (row.tonnes / maximum) * 100)}%` }}
                  aria-label={`${year}: ${row.tonnes} tonnes; open source`}
                  onClick={() => source(productionEvidence(crop, row, code, year))}
                />
              ) : (
                <span aria-label={`${year}: missing record`}>—</span>
              )}
            </div>
            <span>{year}</span>
          </div>
        ))}
      </div>
      <details className="full-records">
        <summary>{rows.length} exact annual records and sources</summary>
        <div className="table-scroll">
          <table className="evidence-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Production · tonnes</th>
                <th>Classification</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.year}>
                  <td>{row.year}</td>
                  <td>{formatNumber(row.tonnes)}</td>
                  <td>{statusLabel(row.status)}</td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => source(productionEvidence(crop, row, code, row.year))}
                    >
                      Source
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && <p>No exact historical state record supplied.</p>}
      </details>
    </section>
  );
}

function DistrictAPY({ crop, code }: { crop: CropSlug; code: string }) {
  const source = useSource();
  const records = districtHistory(crop, code);
  const [year, setYear] = useState("all");
  const [district, setDistrict] = useState("");
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    setYear("all");
    setDistrict("");
    setExpanded(false);
  }, [crop, code]);
  const years = [...new Set(records.map((row) => row.year))].sort().reverse();
  const filtered = records.filter(
    (row) =>
      (year === "all" || row.year === year) &&
      row.district.toLowerCase().includes(district.toLowerCase()),
  );
  const shown = expanded ? filtered : filtered.slice(0, 6);
  return (
    <section className="state-detail-section">
      <div className="section-heading">
        <div>
          <h2>District area, production and yield</h2>
          <p>Native official-source fields · each district record retains its own reporting year</p>
        </div>
        <span className="evidence-chip">{records.length} supplied records</span>
      </div>
      {records.length > 0 && (
        <div className="record-filters">
          <label>
            District year{" "}
            <select
              aria-label="District reporting year"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setExpanded(false);
              }}
            >
              <option value="all">All supplied years</option>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </label>
          <label>
            Find district{" "}
            <input
              aria-label="Find district"
              placeholder="District name"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            />
          </label>
        </div>
      )}
      <div className="table-scroll">
        <table className="evidence-table">
          <thead>
            <tr>
              <th>District</th>
              <th>Year</th>
              <th>Area</th>
              <th>Production</th>
              <th>Native yield</th>
              <th>Source status</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row: DistrictRow) => (
              <tr key={row.id}>
                <td>
                  {row.district}
                  {row.cropLabel && <div className="table-note">{row.cropLabel}</div>}
                </td>
                <td>{row.year}</td>
                <td>
                  {formatNumber(row.area)} <small>{row.areaUnit}</small>
                </td>
                <td>
                  {formatNumber(row.production)} <small>{row.productionUnit}</small>
                </td>
                <td>
                  {formatNumber(row.yield)} <small>{row.yieldUnit}</small>
                  <div className="table-note">{row.yieldKind}</div>
                </td>
                <td>
                  {statusLabel(row.status)}
                  <div className="table-note">{row.missingFlag}</div>
                </td>
                <td>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => source(districtEvidence(crop, row))}
                  >
                    <BookOpen />
                    Source
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length > 6 && (
        <Button variant="ghost" className="mt-3" onClick={() => setExpanded((x) => !x)}>
          {expanded ? "Show compact view" : `Show all ${filtered.length} district records`}
        </Button>
      )}
      {!records.length && (
        <p className="coverage-empty">
          No official district APY is supplied for this crop/state. Relevant source estimates appear
          separately below.
        </p>
      )}
      {records.length > 0 && filtered.length === 0 && (
        <p className="coverage-empty">No district records match the selected filter.</p>
      )}
      <p className="table-note">
        A published zero stays zero; a missing field stays “—”. District values are never summed to
        replace a state production record.
      </p>
    </section>
  );
}

export function StateProcurementPage({
  crop: rawCrop,
  stateCode,
}: {
  crop: string;
  stateCode: string;
}) {
  if (!isCropSlug(rawCrop) || !stateName(stateCode))
    return (
      <main className="page-container">
        <h1>Geography unavailable</h1>
        <Button asChild className="mt-5">
          <Link to="/procurement" search={(p) => p}>
            Back to crop directory
          </Link>
        </Button>
      </main>
    );
  return <StateDetail crop={rawCrop} code={stateCode} />;
}

function StateDetail({ crop, code }: { crop: CropSlug; code: string }) {
  const source = useSource();
  const { ids, toggle, search } = useShortlist(crop);
  const year = search.year ?? defaultYearForCrop(crop);
  const record = stateProduction(crop, code, year);
  const records = cropRecords(crop);
  const geography = lgdState(code);
  const estimates = records.productionContext.passages.filter((row) =>
    row.stateCodes.includes(code),
  );
  const estimateRows = records.productionContext.rows.filter((row) =>
    row.stateCodes.includes(code),
  );
  const nodes = records.processing.filter((row) => row.stateCodes.includes(code));
  const calendar = calendarFor(crop, search.month, code);
  return (
    <>
      <AppHeader />
      <main className="page-container state-detail-page">
        <Button asChild variant="ghost">
          <Link to="/procurement/$crop" params={{ crop }} search={(p) => p}>
            <ArrowLeft />
            Back to sourcing
          </Link>
        </Button>
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">STATE SOURCING CONTEXT</span>
            <h1>
              {cropAssets[crop].name} · {stateName(code)}
            </h1>
            <p>
              {geography
                ? `LGD state code ${geography.lgd_state_code} · geography snapshot ${geography.snapshot_date}`
                : "Canonical state identity"}
            </p>
          </div>
          <BriefLink crop={crop} ids={ids} />
        </div>
        <div className="state-controls">
          <SelectionControls primaryLabel={primaryPurposeLabel(crop)} />
          <ProductionYearControl crop={crop} />
        </div>
        <section className="state-production-card">
          <div>
            <span>Official state production · {year}</span>
            <strong>
              {formatNumber(record?.tonnes)} <small>tonnes</small>
            </strong>
            <span className="evidence-chip">
              {record ? statusLabel(record.status) : "No exact record supplied"}
            </span>
          </div>
          <div>
            <p>
              {record?.publication ??
                `No exact ${year} record is supplied. Historical records and qualitative availability remain separate.`}
            </p>
            <Button
              variant="outline"
              onClick={() => source(productionEvidence(crop, record, code, year))}
            >
              <BookOpen />
              Production source
            </Button>
          </div>
        </section>
        <ProductionHistory crop={crop} code={code} />
        <DistrictAPY crop={crop} code={code} />
        <section className="state-detail-section">
          <h2>District and commercial-belt estimates</h2>
          <p className="context-note">
            These literal passages come exclusively from Production Context. They are estimates,
            with their own time basis, and do not fill missing official APY.
          </p>
          {records.productionContext.summary[0] && (
            <details className="full-records">
              <summary>National context and reporting basis</summary>
              <p>{records.productionContext.summary[0].text}</p>
            </details>
          )}
          <div className="estimate-grid">
            {estimates.map((row) => (
              <article className="estimate-card" key={row.id}>
                <span className="evidence-chip estimate">Source estimate</span>
                <p>{row.text}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => source(estimateEvidence(crop, row))}
                >
                  <BookOpen />
                  Estimate source
                </Button>
              </article>
            ))}
          </div>
          {estimateRows.length > 0 && (
            <details className="full-records">
              <summary>Additional state estimates from the same source</summary>
              {estimateRows.map((row) => (
                <div key={row.id} className="estimate-card">
                  <p>
                    {row.headers
                      .map((header, i) => `${header}: ${row.cells[i] || "—"}`)
                      .join(" · ")}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => source(estimateEvidence(crop, row))}
                  >
                    Source
                  </Button>
                </div>
              ))}
            </details>
          )}
          {estimates.length === 0 && estimateRows.length === 0 && (
            <p className="coverage-empty">No state-linked Production Context estimate supplied.</p>
          )}
        </section>
        <section className="state-detail-section">
          <h2>Availability and varieties{search.month ? ` · ${search.month}` : ""}</h2>
          <CalendarTable crop={crop} rows={calendar} ids={ids} onToggle={toggle} />
        </section>
        <section className="state-detail-section">
          <h2>Processing-node jurisdiction</h2>
          <div className="processing-record-grid">
            {nodes.map((row) => (
              <NodeCard
                key={row.id}
                crop={crop}
                row={row}
                selected={ids.includes(row.id)}
                onToggle={toggle}
                full={ids.length >= 5}
              />
            ))}
          </div>
          {nodes.length === 0 && (
            <p className="coverage-empty">
              No processing node is explicitly assigned to this state. Cross-state catchments remain
              visible in their original node records.
            </p>
          )}
          <Button asChild variant="outline" className="mt-4">
            <Link to="/procurement/$crop/processing" params={{ crop }} search={(p) => p}>
              All processing geographies <ArrowRight />
            </Link>
          </Button>
        </section>
        <div className="workspace-footer">
          <Button asChild variant="ghost">
            <Link to="/procurement/$crop/crop-protection" params={{ crop }} search={(p) => p}>
              Regional crop protection <ArrowRight />
            </Link>
          </Button>
          <BriefLink crop={crop} ids={ids} />
        </div>
      </main>
    </>
  );
}

export function SourcingBriefPage({ crop: rawCrop }: { crop: string }) {
  if (!isCropSlug(rawCrop))
    return (
      <main className="page-container">
        <h1>Crop unavailable</h1>
        <Link to="/procurement">Back to directory</Link>
      </main>
    );
  return <BriefPage crop={rawCrop} />;
}

function BriefPage({ crop }: { crop: CropSlug }) {
  const source = useSource();
  const search = useSearch({ strict: false });
  const navigate = useNavigate();
  const records = cropRecords(crop);
  const year = search.year ?? defaultYearForCrop(crop);
  const ids = (search.items ?? "").split(",").filter(Boolean).slice(0, 5);
  const calendars = records.calendar.filter((row) => ids.includes(row.id));
  const nodes = records.processing.filter((row) => ids.includes(row.id));
  const remove = (id: string) =>
    navigate({ to: ".", search: (p) => ({ ...p, items: ids.filter((x) => x !== id).join(",") }) });
  return (
    <>
      <div className="brief-toolbar">
        <Button asChild variant="ghost">
          <Link to="/procurement/$crop" params={{ crop }} search={(p) => p}>
            <ArrowLeft />
            Back to sourcing
          </Link>
        </Button>
        <Button onClick={() => window.print()}>
          <Printer />
          Print / Save PDF
        </Button>
      </div>
      <main className="sourcing-brief">
        <div className="brief-brand">
          GramShakti <span>SOURCING BRIEF</span>
        </div>
        <h1>
          {cropAssets[crop].name} ·{" "}
          {search.purpose === "processed"
            ? "Processing inputs"
            : `${primaryPurposeLabel(crop)} sourcing`}
        </h1>
        <p className="brief-meta">
          Target month: {search.month ?? "Any month"} · Official production year: {year} · Evidence
          snapshot: {procurement.snapshot}
        </p>
        <p className="context-note">
          Candidate origins and descriptive processing context selected for further verification.
          This brief does not establish live stock, price, supplier capacity or creditworthiness.
        </p>
        {!calendars.length && !nodes.length && (
          <div className="coverage-empty">
            <p>
              No source records selected yet. Add availability rows or processing nodes from the
              procurement workspace.
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link to="/procurement/$crop" params={{ crop }} search={(p) => p}>
                Choose source records <ArrowRight />
              </Link>
            </Button>
          </div>
        )}
        {calendars.map((row) => (
          <section key={row.id} className="brief-record">
            <div className="section-heading">
              <div>
                <span className="eyebrow">CANDIDATE ORIGIN</span>
                <h2>
                  {row.state} · {row.variety}
                </h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="no-print"
                aria-label={`Remove ${row.variety}`}
                onClick={() => remove(row.id)}
              >
                <Trash2 />
              </Button>
            </div>
            {row.system && (
              <p>
                <strong>System:</strong> {row.system}
              </p>
            )}
            {row.windows.map((w, i) => (
              <p key={i}>
                <strong>{w.label}:</strong> {w.text}
              </p>
            ))}
            <p>
              <strong>Selection basis:</strong> Named source window
              {search.month ? ` reviewed for ${search.month}` : ""}; suitability and current supply
              require confirmation.
            </p>
            {row.stateCodes.map((code) => {
              const production = stateProduction(crop, code, year);
              return (
                <p key={code}>
                  <strong>
                    {stateName(code)} · {year}:
                  </strong>{" "}
                  {production
                    ? `${formatNumber(production.tonnes)} tonnes · ${statusLabel(production.status)}`
                    : "No exact official production record supplied."}
                </p>
              );
            })}
            <p className="brief-reference">{locatorText(row.locator)}</p>
            <a href={row.locator.url} target="_blank" rel="noreferrer">
              Original source document
            </a>
            <Button
              className="no-print"
              variant="ghost"
              size="sm"
              onClick={() => source(calendarEvidence(crop, row))}
            >
              <BookOpen />
              Read exact evidence
            </Button>
          </section>
        ))}
        {nodes.map((row) => (
          <section key={row.id} className="brief-record">
            <div className="section-heading">
              <div>
                <span className="eyebrow">PROCESSING CONTEXT</span>
                <h2>{row.name}</h2>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="no-print"
                aria-label={`Remove ${row.name}`}
                onClick={() => remove(row.id)}
              >
                <Trash2 />
              </Button>
            </div>
            {row.products.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {row.catchment.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="brief-reference">{locatorText(row.locator)}</p>
            <a href={row.locator.url} target="_blank" rel="noreferrer">
              Original processing source
            </a>
            <Button
              className="no-print"
              size="sm"
              variant="ghost"
              onClick={() => source(processingEvidence(crop, row))}
            >
              <BookOpen />
              Read exact node evidence
            </Button>
          </section>
        ))}
        {(calendars.length > 0 || nodes.length > 0) && (
          <section className="brief-record">
            <h2>Next verification steps</h2>
            <ol>
              <li>
                Confirm the current cultivar, quality specification, harvest/storage window and
                available quantity with the origin.
              </li>
              <li>
                Verify supplier/processor identity, operating status, capacity, commercial terms and
                logistics.
              </li>
              <li>
                Check source-year coverage and estimate status; obtain missing district evidence
                where it affects the decision.
              </li>
              <li>
                Use current approved regulatory guidance for quality, residue and crop-protection
                compliance.
              </li>
            </ol>
            <p className="table-note">
              No historical shares have been multiplied by selected-year production. No district sum
              is presented as a state total.
            </p>
          </section>
        )}
      </main>
    </>
  );
}

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ZoomIn, ZoomOut, Maximize, BookOpen, ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useSource, SelectionControls, AppHeader } from "./shared";
import {
  CropJourneyNavigation,
  DetailedProcurement,
  StateProcurementPage,
} from "./procurement-details";
import {
  cropAssets,
  isCropSlug,
  cropSlug,
  blockerReasons,
  type Screen,
  type CropSlug,
} from "@/lib/gramshakti/assets";
import {
  availabilityEvidence,
  beltEvidence,
  cropRecords,
  locatorText,
  processingEvidence,
  protectionEvidence,
  sourceEvidence,
} from "@/lib/gramshakti/procurement";
import { months } from "@/lib/gramshakti/data";
import directory from "@/assets/gramshakti/directory.svg.asset.json";

const artworkCache = new Map<string, Promise<string>>();
function loadArtwork(url: string): Promise<string> {
  const cached = artworkCache.get(url);
  if (cached) return cached;
  const pending = fetch(url)
    .then(async (response) => {
      if (!response.ok) throw new Error("Artwork unavailable (" + response.status + ")");
      const text = await response.text();
      if (!text.includes("<svg")) throw new Error("The artwork response is not an SVG.");
      const { default: purify } = await import("dompurify");
      return purify.sanitize(text, {
        USE_PROFILES: { svg: true, svgFilters: true },
        ADD_ATTR: [
          "data-action",
          "data-cluster",
          "data-pin",
          "data-state-name",
          "data-pin-state",
          "data-belt-name",
          "tabindex",
          "role",
          "aria-label",
          "data-evidence-cell",
        ],
      });
    })
    .catch((error) => {
      artworkCache.delete(url);
      throw error;
    });
  artworkCache.set(url, pending);
  return pending;
}

export function OriginalCanvas({
  url,
  onAction,
  label,
  children,
}: {
  url: string;
  onAction: (action: string, target: Element) => void;
  label: string;
  children?: ReactNode;
}) {
  const [markup, setMarkup] = useState("");
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [fit, setFit] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setMarkup("");
    setError("");
    loadArtwork(url)
      .then((text) => {
        if (active) setMarkup(text);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : String(reason));
      });
    return () => {
      active = false;
    };
  }, [url, attempt]);
  function activate(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;
    const element = target.closest("[data-action]");
    const action = element?.getAttribute("data-action");
    if (element && action) {
      onAction(action, element);
      return true;
    }
    return false;
  }
  return (
    <>
      <div className="canvas-tools">
        <span>{label}</span>
        <div className="flex gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="Zoom out"
            onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
          >
            <ZoomOut />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Fit artwork"
            onClick={() => {
              setZoom(1);
              setFit(true);
            }}
          >
            <Maximize />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Zoom in"
            onClick={() => {
              setFit(false);
              setZoom((z) => Math.min(6, z + 0.5));
            }}
          >
            <ZoomIn />
          </Button>
        </div>
      </div>
      <div className="canvas-scroll">
        <div className={`original-canvas zoom-${zoom * 10}${fit ? " artwork-fit" : ""}`}>
          <div
            role="group"
            aria-label={label}
            onClick={(e) => activate(e.target)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && activate(e.target)) e.preventDefault();
            }}
            dangerouslySetInnerHTML={{ __html: markup }}
          />
          {markup && children}
        </div>
      </div>
      {!markup && (
        <div className="artwork-loading" role="status">
          <p>{error || "Loading original artwork…"}</p>
          {error && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                artworkCache.delete(url);
                setAttempt((x) => x + 1);
              }}
            >
              <RotateCcw />
              Retry artwork
            </Button>
          )}
        </div>
      )}
    </>
  );
}

export function CropArtworkPage({ crop, screen = "002" }: { crop: string; screen?: Screen }) {
  return isCropSlug(crop) ? (
    <ArtworkJourney crop={crop} screen={screen} />
  ) : (
    <UnavailableCrop name={crop} />
  );
}
function ArtworkJourney({ crop, screen }: { crop: CropSlug; screen: Screen }) {
  const navigate = useNavigate();
  const source = useSource();
  const [selected, setSelected] = useState<number>();
  const container = useRef<HTMLDivElement>(null);
  const asset = cropAssets[crop];
  const records = cropRecords(crop);
  useEffect(() => {
    setSelected(undefined);
  }, [crop, screen]);
  function selectCluster(index: number) {
    if (!records.processing[index]) return;
    setSelected(index);
    container.current
      ?.querySelectorAll("[data-cluster],[data-pin]")
      .forEach((e) =>
        e.classList.toggle(
          "selected-asset",
          e.getAttribute("data-cluster") === String(index) ||
            e.getAttribute("data-pin") === String(index),
        ),
      );
  }
  function action(key: string, el: Element) {
    if (key === "directory") {
      navigate({ to: "/procurement", search: (p) => p });
      return;
    }
    if (key === "objectives") {
      navigate({ to: "/choose", search: (p) => p });
      return;
    }
    if (key === "landscape") {
      navigate({ to: "/procurement/$crop", params: { crop }, search: (p) => p });
      return;
    }
    if (key === "processing") {
      navigate({ to: "/procurement/$crop/processing", params: { crop }, search: (p) => p });
      return;
    }
    if (key === "protection") {
      navigate({ to: "/procurement/$crop/crop-protection", params: { crop }, search: (p) => p });
      return;
    }
    if (key.startsWith("state:")) {
      navigate({
        to: "/procurement/$crop/state/$stateCode",
        params: { crop, stateCode: key.slice(6) },
        search: (p) => p,
      });
      return;
    }
    if (key.startsWith("month:")) {
      const month = months[Number(key.slice(6))];
      if (month) navigate({ to: ".", search: (p) => ({ ...p, month }) });
      return;
    }
    if (key.startsWith("cluster:")) {
      selectCluster(Number(key.slice(8)));
      return;
    }
    if (key.startsWith("target:")) {
      const record = protectionEvidence(crop, Number(key.slice(7)));
      if (record) source(record);
      return;
    }
    if (key.startsWith("source:availability:")) {
      const [, , code, index] = key.split(":");
      const month = months[Number(index)];
      if (code && month) source(availabilityEvidence(crop, code, month));
      return;
    }
    if (key.startsWith("source:belt:")) {
      const ids = key.slice(12).split(",");
      const rows = records.belts.filter((row) => ids.includes(row.id));
      if (rows.length === 1) source(beltEvidence(crop, rows[0]!));
      else
        source(
          sourceEvidence(
            `${asset.name} · ${el.getAttribute("data-belt-name") ?? el.getAttribute("aria-label") ?? "commercial belt"}`,
            rows.length
              ? rows
                  .map(
                    (row) =>
                      `${locatorText(row.locator)}\n${row.headers.map((h, i) => h + ": " + (row.cells[i] || "—")).join("\n")}`,
                  )
                  .join("\n\n")
              : "The exact source link for this visual object is not supplied.",
            records.belts[0]?.locator.url ?? asset.screens[screen].sourceUrl,
            {
              caveat:
                "This visual composition can refer to multiple exact cultivar/belt statements. Their distinct geographic scopes are retained.",
            },
          ),
        );
      return;
    }
    if (key.startsWith("source:belt-geography:")) {
      const codes = key.slice("source:belt-geography:".length).split(",");
      const rows = records.belts.filter((row) =>
        row.stateCodes.some((code) => codes.includes(code)),
      );
      source(
        sourceEvidence(
          asset.name + " · named commercial geography",
          rows.length
            ? rows
                .map((row) => `${locatorText(row.locator)}\n${row.origin}\n${row.variety}`)
                .join("\n\n")
            : "The geography is represented in the processing source; an exact table-variety belt relationship is not supplied.",
          asset.screens[screen].sourceUrl,
          {
            caveat:
              "Related regional source statements are separate from the named belt and do not establish a processor or available volume.",
          },
        ),
      );
      return;
    }
    source(
      sourceEvidence(
        asset.name + " · source register",
        `Original visual: ${asset.screens[screen].filename}\n\n${asset.screens[screen].footer.join("\n")}\n\nExact source tables are available through the record controls below. Production records retain their own reporting years and classification.`,
        asset.screens[screen].sourceUrl,
        {
          evidenceClass: "Original artwork provenance",
          transformation:
            "Original map geometry retained. Approved text, jurisdiction and interaction edits applied to a separate application copy.",
          caveat:
            "The visual is a fixed source snapshot. Interactive records below use the selected year/month. Pin placement is indicative at state level; it is not verified district geometry.",
        },
      ),
    );
  }
  const cluster = selected === undefined ? undefined : records.processing[selected];
  return (
    <>
      <AppHeader />
      <main ref={container} className="asset-page">
        <div className="asset-navigation">
          <Button asChild variant="ghost" size="sm">
            <Link to="/procurement" search={(p) => p}>
              Change crop
            </Link>
          </Button>
          <SelectionControls />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => action("source:register", container.current!)}
          >
            <BookOpen />
            Sources
          </Button>
        </div>
        <CropJourneyNavigation crop={crop} screen={screen} />
        <OriginalCanvas
          url={asset.screens[screen].application}
          label={
            asset.name +
            " · " +
            (screen === "002"
              ? "Sourcing landscape"
              : screen === "003"
                ? "Regional crop protection"
                : "Processing geographies")
          }
          onAction={action}
        />
        <DetailedProcurement crop={crop} screen={screen} onOpenCluster={selectCluster} />
        <Sheet
          open={selected !== undefined}
          onOpenChange={(open) => {
            if (!open) {
              setSelected(undefined);
              container.current
                ?.querySelectorAll(".selected-asset")
                .forEach((e) => e.classList.remove("selected-asset"));
            }
          }}
        >
          <SheetContent className="overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>{cluster?.name}</SheetTitle>
              <SheetDescription>
                Processing-node source context · jurisdiction and catchment remain distinct
              </SheetDescription>
            </SheetHeader>
            {cluster && (
              <div className="node-source-detail">
                <h3 className="font-semibold">Source regional varieties</h3>
                {cluster.relatedVarieties.map((value, i) => (
                  <div key={i}>
                    <p>
                      <strong>{value.variety}</strong> · {value.geography}
                    </p>
                    <p className="table-note">{value.scope}</p>
                  </div>
                ))}
                {cluster.paragraphs.map((paragraph) => (
                  <p key={paragraph.locator.block}>{paragraph.text}</p>
                ))}
                <p className="context-note">
                  This source describes processing roles and catchments. Current operation, capacity
                  and exact district placement require verification.
                </p>
                <Button
                  onClick={() => {
                    setSelected(undefined);
                    source(processingEvidence(crop, cluster));
                  }}
                >
                  <BookOpen />
                  Open exact node evidence
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </main>
    </>
  );
}

export function AssetDirectoryPage() {
  const navigate = useNavigate();
  const source = useSource();
  const [unavailable, setUnavailable] = useState<string>();
  function choose(name: string) {
    const crop = cropSlug(name);
    if (crop)
      navigate({
        to: "/procurement/$crop",
        params: { crop },
        search: (p) => ({ ...p, items: undefined }),
      });
    else setUnavailable(name);
  }
  function action(key: string) {
    if (key.startsWith("crop:")) choose(key.slice(5));
    else if (key === "objectives") navigate({ to: "/choose", search: (p) => p });
    else if (key === "fresh" || key === "processed")
      navigate({ to: ".", search: (p) => ({ ...p, purpose: key }) });
    else
      source(
        sourceEvidence(
          "Canonical crop directory",
          "58 exact canonical crop labels. The detailed procurement cohort contains Mango, Banana, Oranges, Guava, Grapes, Papaya, Pineapple, Pomegranate, Apple, Litchi, Sapota, Jackfruit, Potato, Onion, Tomato and Capsicum.",
          "https://drive.google.com/file/d/1y9x68mcXrpeZvialSUjloVbJ9G_wWHdC/view",
        ),
      );
  }
  return (
    <>
      <AppHeader />
      <main className="asset-page">
        <div className="asset-navigation">
          <SelectionControls />
          <Button asChild size="sm" variant="ghost">
            <Link to="/choose" search={(p) => p}>
              Change objective
            </Link>
          </Button>
        </div>
        <OriginalCanvas
          url={directory.url}
          label="Procurement · original 58-crop directory"
          onAction={action}
        />
        <Sheet
          open={!!unavailable}
          onOpenChange={(open) => {
            if (!open) setUnavailable(undefined);
          }}
        >
          <SheetContent>
            <SheetHeader>
              <SheetTitle>
                {unavailable && blockerReasons[unavailable]
                  ? "Source repair required"
                  : "Outside this procurement release"}
              </SheetTitle>
              <SheetDescription>{unavailable}</SheetDescription>
            </SheetHeader>
            <p className="mt-6">
              {(unavailable && blockerReasons[unavailable]) ||
                "The current detailed procurement release covers Mango through Capsicum. This canonical crop is retained for a later source-backed module."}
            </p>
          </SheetContent>
        </Sheet>
      </main>
    </>
  );
}
export function UnavailableCrop({ name }: { name: string }) {
  return (
    <main className="page-container">
      <h1>Crop unavailable</h1>
      <p>{name}</p>
      <Button asChild className="mt-6">
        <Link to="/procurement" search={(p) => p}>
          Back to crop directory
        </Link>
      </Button>
    </main>
  );
}
export const StateAssetPage = StateProcurementPage;

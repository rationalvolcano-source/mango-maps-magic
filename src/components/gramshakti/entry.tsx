import { Link } from "@tanstack/react-router";
import { ArrowRight, CloudSun, MapPinned } from "lucide-react";
import { Button } from "@/components/ui/button";
import entry from "@/assets/gramshakti/entry.png.asset.json";
import logo from "@/assets/gramshakti/logo.png.asset.json";
export function WelcomePage() {
  return (
    <main className="source-entry-scroll">
      <div className="source-entry welcome-source">
        <img className="source-entry-image" src={entry.url} alt="Agricultural India landscape" />
        <div className="source-welcome-panel">
          <img className="source-logo" src={logo.url} alt="GramShakti" />
          <span className="eyebrow">GRAMSHAKTI INTELLIGENCE</span>
          <h1>
            Explore India’s
            <br />
            agricultural landscape.
          </h1>
          <p>
            Evidence-led sourcing, opportunity
            <br />
            and climate intelligence.
          </p>
          <Button asChild>
            <Link to="/choose" search={(p) => p}>
              Enter GramShakti <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
const objectives = [
  {
    title: "Procurement",
    copy: "Explore sourcing geographies, seasons and processing context.",
    path: "/procurement" as const,
    viewBox: "425 454 142 142",
  },
  {
    title: "Opportunity / FPO Discovery",
    copy: "Crop clusters and FPO intelligence.",
    path: "/opportunity" as const,
    viewBox: "878 454 142 142",
  },
  {
    title: "CLIM — Climate Analysis",
    copy: "Crop-stage climate and soil intelligence.",
    path: "/clim" as const,
    viewBox: undefined,
  },
];
export function ChoosePage() {
  return (
    <main className="source-entry-scroll">
      <div className="source-entry">
        <img
          className="source-entry-image"
          src={entry.url}
          alt="GramShakti agricultural India objective selection"
        />
        <div className="source-objectives">
          {objectives.map((o, i) => (
            <Button asChild variant="ghost" className="source-objective" key={o.path}>
              <Link to={o.path} search={(p) => p}>
                {o.viewBox ? (
                  <svg className="source-objective-icon" viewBox={o.viewBox} aria-hidden="true">
                    <image href={entry.url} width="1672" height="941" />
                  </svg>
                ) : (
                  <span className="source-climate-icon">
                    <CloudSun />
                  </span>
                )}
                <h2>{o.title}</h2>
                <p>{o.copy}</p>
                {i > 0 && <span className="development-chip">In development</span>}
                <span className="source-objective-arrow">
                  <ArrowRight />
                </span>
              </Link>
            </Button>
          ))}
        </div>
      </div>
    </main>
  );
}
export function FuturePage({ climate = false }: { climate?: boolean }) {
  const Icon = climate ? CloudSun : MapPinned;
  return (
    <main className="page-container entry-blocked">
      <Icon className="size-10 text-leaf" />
      <span className="development-chip mt-6">In development</span>
      <h1 className="mt-5">
        {climate ? "CLIM — Climate Analysis" : "Opportunity / FPO Discovery"}
      </h1>
      <p className="mt-5">This module is not yet available.</p>
      <Button asChild className="mt-6">
        <Link to="/choose" search={(p) => p}>
          Back to objectives <ArrowRight />
        </Link>
      </Button>
    </main>
  );
}

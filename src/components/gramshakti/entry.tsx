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
function OriginalIcon({ viewBox }: { viewBox: string }) {
  return (
    <svg className="source-objective-icon" viewBox={viewBox} aria-hidden="true">
      <image href={entry.url} width="1672" height="941" />
    </svg>
  );
}
export function ChoosePage() {
  return (
    <main className="source-entry-scroll">
      <div className="source-entry">
        <img
          className="source-entry-image"
          src={entry.url}
          alt="GramShakti agricultural India objective selection"
        />
        <div className="source-entry-copy">
          <h1>What would you like to do?</h1>
          <p>Choose how you want to explore India&rsquo;s agricultural landscape.</p>
        </div>
        <div className="source-objectives">
          <Button asChild variant="ghost" className="source-objective">
            <Link to="/procurement" search={(p) => p}>
              <OriginalIcon viewBox="425 454 142 142" />
              <span className="source-objective-version">Version 1.0</span>
              <h2>Procurement Intelligence Dashboard</h2>
              <p>
                Explore crop production, sourcing belts, seasonality and processing context.
              </p>
              <span className="source-objective-arrow">
                <ArrowRight />
              </span>
            </Link>
          </Button>
          <div className="source-objective source-objective-soon" aria-disabled="true">
            <OriginalIcon viewBox="878 454 142 142" />
            <span className="source-objective-version">Version 2.0</span>
            <h2>GramShakti AI — Procurement Decision Report</h2>
            <p>A guided procurement reporting and FPO qualification experience.</p>
            <span className="development-chip">Under construction</span>
          </div>
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

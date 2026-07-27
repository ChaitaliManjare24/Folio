import { fetchSettings } from "@/lib/config";
import PortfolioClient from "./PortfolioClient";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import ChatWidget from "@/components/ChatWidget";
import "../landing.css";
import "./portfolio.css";

export const revalidate = 60;

type Any = Record<string, any>;

function hl(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith("**") && p.endsWith("**")
      ? <span key={i} className="hl">{p.slice(2, -2)}</span>
      : <span key={i}>{p}</span>
  );
}

const arrow = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export default async function PortfolioPage() {
  const settings = await fetchSettings();
  const lc = (settings.landingContent || {}) as Any;
  const nav = lc.nav || {};
  const footer = lc.footer || {};
  const pf = (settings.portfolioItems || {}) as Any;
  const hero = pf.hero || {};
  const items: Any[] = pf.items || [];
  const webItems = items.filter((i) => i.category !== "apps");
  const appItems = items.filter((i) => i.category === "apps");

  const brand = footer.brand || "Amit/build";
  const [brandA, brandB] = brand.split("/");

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet" />

      <LandingHeader settings={settings} />

      <main id="top">
        <section style={{ paddingTop: "120px", paddingBottom: "20px" }}>
          <div className="wrap">
            <p className="kicker reveal"><span>[ {hero.kickerLabel || "Portfolio"} ]</span> {hero.kickerText || "Selected work"}</p>
            <h1 className="hero-title reveal" style={{ fontSize: "clamp(32px,5vw,56px)", maxWidth: "700px" }}>{hero.title ? hl(hero.title) : null}</h1>
            <p className="reveal" style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--muted)", maxWidth: "580px", marginTop: "20px", lineHeight: 1.7 }}>{hero.subtitle || ""}</p>
          </div>
          <div className="wrap">
            <PortfolioClient webItems={webItems} appItems={appItems} />
          </div>
        </section>
      </main>

      <LandingFooter settings={settings} />
      <ChatWidget />
    </>
  );
}

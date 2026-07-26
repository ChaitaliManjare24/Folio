import Script from "next/script";
import { fetchSettings } from "@/lib/config";
import "../landing.css";

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
  const tabs = pf.tabs || [{ id: "web", label: "Web Design" }, { id: "apps", label: "Apps" }];

  const brand = footer.brand || "Amit/build";
  const [brandA, brandB] = brand.split("/");

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet" />
      <Script src="/landing-assets/script.js" strategy="afterInteractive" />

      <div className="blueprint" aria-hidden="true" />
      <div className="scroll-progress" aria-hidden="true"><i></i></div>

      <header className="site-header" id="header">
        <div className="wrap header-inner">
          <a href="/" className="logo" aria-label="Home">
            <svg viewBox="0 0 32 32" className="logo-mark" aria-hidden="true"><path d="M4 28 L16 4 L28 28" /><path d="M9 28 L16 14 L23 28" /><circle cx="16" cy="28" r="2" className="logo-dot" /></svg>
            <span className="logo-text">{brandA}<span>/{brandB || "build"}</span></span>
          </a>
          <nav className="nav" aria-label="Primary">
            <a href="/#principles">{nav.principles || "Principles"}</a>
            <a href="/#process">{nav.process || "Process"}</a>
            <a href="/#stack">{nav.stack || "Stack"}</a>
            <a href="/portfolio" className="nav-highlight">{nav.projects || "Projects"}</a>
            <a href="/blog" className="nav-highlight">{nav.blog || "Blog"}</a>
            <a href="/#faq">{nav.faq || "FAQ"}</a>
          </nav>
          <div className="header-cta">
            <a href="/#top" className="status-pill"><i></i> {lc.statusPill || "Building"}</a>
            <a href="/contact" className="btn btn-dark"><span>{nav.contact || "Contact"}</span>{arrow}</a>
          </div>
        </div>
      </header>

      <main id="top">
        <section style={{ paddingTop: "120px", paddingBottom: "20px" }}>
          <div className="wrap">
            <p className="kicker reveal"><span>[ {hero.kickerLabel || "Portfolio"} ]</span> {hero.kickerText || "Selected work"}</p>
            <h1 className="hero-title reveal" style={{ fontSize: "clamp(32px,5vw,56px)", maxWidth: "700px" }}>{hero.title ? hl(hero.title) : null}</h1>
            <p className="reveal" style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--muted)", maxWidth: "580px", marginTop: "20px", lineHeight: 1.7 }}>{hero.subtitle || ""}</p>
            <div className="tabs reveal" style={{ marginTop: "48px" }}>
              {tabs.map((t: Any, i: number) => (
                <button key={t.id} className={`tab${i === 0 ? " active" : ""}`} data-tab={t.id}>{t.label} <span className="tab-count">({t.id === "apps" ? appItems.length : webItems.length})</span></button>
              ))}
            </div>
          </div>
        </section>

        {/* WEB GRID */}
        <div className="tab-panel" id="panel-web">
          <section className="services" style={{ paddingTop: "0", paddingBottom: "100px" }}>
            <div className="wrap">
              <div className="pf-grid">
                {webItems.map((item, i) => (
                  <a key={i} href={item.href} className="pf-link" target="_blank" rel="noopener noreferrer">
                    <article className="pf-card reveal" style={{ "--i": i } as any}>
                      <div className="pf-preview">
                        {item.preview ? <iframe loading="lazy" src={item.preview} scrolling="no" tabIndex={-1} aria-hidden="true" /> : null}
                        <div className="pf-shade" />
                        <span className="pf-tag">{item.tag}</span>
                      </div>
                      <div className="pf-body"><span className="pf-num">{item.num}</span><h3>{item.title}</h3><p>{item.tagline}</p><span className="pf-view">View page →</span></div>
                    </article>
                  </a>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* APPS GRID */}
        <div className="tab-panel" id="panel-apps" style={{ display: "none" }}>
          <section className="services" style={{ paddingTop: "0", paddingBottom: "100px" }}>
            <div className="wrap">
              <div className="cards">
                {appItems.map((item, i) => (
                  <article key={i} className="card reveal" style={{ "--i": i } as any}>
                    <span className="card-num">{item.num || `A${i + 1}`}</span>
                    <h3>{item.title}</h3>
                    <p>{item.tagline}</p>
                    <ul className="card-tags">
                      {item.href ? <li><a href={item.href} target="_blank" rel="noopener noreferrer">Live →</a></li> : null}
                      {item.github ? <li><a href={item.github} target="_blank" rel="noopener noreferrer">Source →</a></li> : null}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="wrap footer-grid">
          <div className="footer-brand">
            <a href="/" className="logo">
              <svg viewBox="0 0 32 32" className="logo-mark" aria-hidden="true"><path d="M4 28 L16 4 L28 28" /><path d="M9 28 L16 14 L23 28" /><circle cx="16" cy="28" r="2" className="logo-dot" /></svg>
              <span className="logo-text">{brandA}<span>/{brandB || "build"}</span></span>
            </a>
            <p>{footer.tagline || ""}</p>
            <p className="footer-loc">{footer.location || ""}</p>
          </div>
          <nav className="footer-col"><h4>{footer.exploreTitle || "explore"}</h4>
            <a href="/#principles">{nav.principles || "Principles"}</a><a href="/#process">{nav.process || "Process"}</a>
            <a href="/#stack">{nav.stack || "Stack"}</a><a href="/portfolio" className="nav-highlight">{nav.projects || "Projects"}</a>
            <a href="/blog" className="nav-highlight">{nav.blog || "Blog"}</a>
          </nav>
          <nav className="footer-col"><h4>{footer.connectTitle || "connect"}</h4>
            {(footer.connect || []).map((l: Any, i: number) => <a key={i} href={l.href}>{l.label}</a>)}
          </nav>
        </div>
        <div className="wrap footer-base">
          <span>© {new Date().getFullYear()} {footer.copyright || ""}</span>
          <span>commit: <code>{footer.commit || ""}</code></span>
        </div>
      </footer>
    </>
  );
}

import type { PublicSettings } from "@/lib/config";

type Any = Record<string, any>;

export default function LandingFooter({ settings }: { settings: PublicSettings }) {
  const c = (settings.landingContent || {}) as Any;
  const nav = c.nav || {};
  const footer = c.footer || {};
  const brand = footer.brand || "Amit/build";
  const [brandA, brandB] = brand.split("/");

  return (
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
        <nav className="footer-col" aria-label="Explore">
          <h4>{footer.exploreTitle || "explore"}</h4>
          <a href="/#principles">{nav.principles || "Principles"}</a>
          <a href="/#process">{nav.process || "Process"}</a>
          <a href="/#stack">{nav.stack || "Stack"}</a>
          <a href="/about">About</a>
          <a href="/portfolio" className="nav-highlight">{nav.projects || "Projects"}</a>
          <a href="/open-source" className="nav-highlight">Open Source</a>
          <a href="/blog" className="nav-highlight">{nav.blog || "Blog"}</a>
        </nav>
        <nav className="footer-col" aria-label="Connect">
          <h4>{footer.connectTitle || "connect"}</h4>
          {(footer.connect || []).map((l: Any, i: number) => <a key={i} href={l.href}>{l.label}</a>)}
        </nav>
        <div className="footer-col">
          <h4>{footer.uptimeTitle || "uptime"}</h4>
          <p className="status-ok"><i></i> {footer.statusText || "All systems operational"}</p>
          <p className="clock" id="clock">--:--:--</p>
          <p className="clock-loc">{footer.clockLabel || "IST"}</p>
        </div>
      </div>
      <div className="wrap footer-base">
        <span>© {new Date().getFullYear()} {footer.copyright || ""}</span>
        <span>commit: <code>{footer.commit || ""}</code></span>
      </div>
    </footer>
  );
}

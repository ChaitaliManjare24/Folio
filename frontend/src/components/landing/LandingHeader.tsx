import type { PublicSettings } from "@/lib/config";

type Any = Record<string, any>;
const arrow = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export default function LandingHeader({ settings }: { settings: PublicSettings }) {
  const c = (settings.landingContent || {}) as Any;
  const nav = c.nav || {};
  const footer = c.footer || {};
  const brand = footer.brand || "Amit/build";
  const [brandA, brandB] = brand.split("/");

  return (
    <>
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
            <a href="/about" className="nav-highlight">About</a>
            <a href="/portfolio" className="nav-highlight">{nav.projects || "Projects"}</a>
            <a href="/open-source" className="nav-highlight">Open Source</a>
            <a href="/blog" className="nav-highlight">{nav.blog || "Blog"}</a>
            <a href="/#faq">{nav.faq || "FAQ"}</a>
          </nav>
          <div className="header-cta">
            <a href="/#top" className="status-pill"><i></i> {c.statusPill || "Building"}</a>
            <a href="/contact" className="btn btn-dark"><span>{nav.contact || "Contact"}</span>{arrow}</a>
            <button className="menu-toggle" id="menuToggle" aria-label="Open menu" aria-expanded="false"><span></span><span></span></button>
          </div>
        </div>
        <div className="mobile-nav" id="mobileNav" aria-hidden="true">
          <a href="/#principles">{nav.principles || "Principles"}</a>
          <a href="/#process">{nav.process || "Process"}</a>
          <a href="/#stack">{nav.stack || "Stack"}</a>
          <a href="/about">About</a>
          <a href="/portfolio" className="nav-highlight">{nav.projects || "Projects"}</a>
          <a href="/open-source" className="nav-highlight">Open Source</a>
          <a href="/blog" className="nav-highlight">{nav.blog || "Blog"}</a>
          <a href="/#faq">{nav.faq || "FAQ"}</a>
          <a href="/contact" className="btn btn-dark">{nav.contact || "Contact"}</a>
        </div>
      </header>
    </>
  );
}

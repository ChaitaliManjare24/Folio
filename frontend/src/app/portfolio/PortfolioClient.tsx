"use client";

import { useState, useEffect, useRef, useCallback } from "react";

type Item = {
  num?: string;
  title: string;
  tag?: string;
  tagline: string;
  href: string;
  preview?: string;
  category: string;
  github?: string;
};

const PER_PAGE = 9;

export default function PortfolioClient({
  webItems: webItemsRaw,
  appItems: appItemsRaw,
}: {
  webItems: Record<string, any>[];
  appItems: Record<string, any>[];
}) {
  const webItems = webItemsRaw as Item[];
  const appItems = appItemsRaw as Item[];
  const [tab, setTab] = useState<"web" | "apps">("web");
  const [page, setPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  const totalPages = Math.max(1, Math.ceil(webItems.length / PER_PAGE));

  // Iframe scaling — scales the 1280px-wide iframe previews to fit their boxes
  const scaleIframes = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    grid.querySelectorAll<HTMLElement>(".pf-preview").forEach((box) => {
      const iframe = box.querySelector("iframe");
      if (!iframe) return;
      const w = box.clientWidth;
      if (w === 0) return;
      const scale = w / 1280;
      iframe.style.transform = `scale(${scale})`;
      iframe.style.height = `${box.clientHeight / scale}px`;
    });
  }, []);

  useEffect(() => {
    scaleIframes();
    const onResize = () => scaleIframes();
    window.addEventListener("resize", onResize);
    // Re-scale a few times after load (iframes load async)
    const t1 = setTimeout(scaleIframes, 400);
    const t2 = setTimeout(scaleIframes, 1200);
    return () => {
      window.removeEventListener("resize", onResize);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [scaleIframes, tab, page]);

  const start = (page - 1) * PER_PAGE;
  const end = start + PER_PAGE;

  return (
    <>
      {/* TABS */}
      <div className="tabs reveal" style={{ marginTop: "48px" }}>
        <button className={`tab${tab === "web" ? " active" : ""}`} onClick={() => { setTab("web"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          Web Design <span className="tab-count">({webItems.length})</span>
        </button>
        <button className={`tab${tab === "apps" ? " active" : ""}`} onClick={() => { setTab("apps"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
          Apps <span className="tab-count">({appItems.length})</span>
        </button>
      </div>

      {/* WEB PANEL */}
      {tab === "web" && (
        <section className="services" style={{ paddingTop: "0", paddingBottom: "100px" }}>
          <div className="wrap">
            <div className="pf-grid" id="web-grid" ref={gridRef}>
              {webItems.map((item, i) => (
                <a
                  key={i}
                  href={item.href}
                  className="pf-link"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: i >= start && i < end ? "block" : "none" }}
                >
                  <article className="pf-card reveal" style={{ "--i": i } as React.CSSProperties}>
                    <div className="pf-preview">
                      {item.preview ? (
                        <iframe loading="lazy" src={item.preview} scrolling="no" tabIndex={-1} aria-hidden="true" />
                      ) : null}
                      <div className="pf-shade" />
                      <span className="pf-tag">{item.tag}</span>
                    </div>
                    <div className="pf-body">
                      <span className="pf-num">{item.num}</span>
                      <h3>{item.title}</h3>
                      <p>{item.tagline}</p>
                      <span className="pf-view">View page →</span>
                    </div>
                  </article>
                </a>
              ))}
            </div>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" id="prevPage" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Prev</button>
                <span className="page-info" id="pageInfo">Page <b>{page}</b> of <b>{totalPages}</b></span>
                <button className="page-btn" id="nextPage" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next →</button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* APPS PANEL */}
      {tab === "apps" && (
        <section className="services" style={{ paddingTop: "0", paddingBottom: "100px" }}>
          <div className="wrap">
            <div className="cards">
              {appItems.map((item, i) => (
                <article key={i} className="card reveal" style={{ "--i": i } as React.CSSProperties}>
                  <span className="card-num">{item.num || `A${i + 1}`}</span>
                  <h3>{item.title}</h3>
                  <p>{item.tagline}</p>
                  <div className="app-links">
                    {item.href ? <a href={item.href} target="_blank" rel="noopener noreferrer">Live →</a> : null}
                    {item.github ? <a href={item.github} target="_blank" rel="noopener noreferrer">Source →</a> : null}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

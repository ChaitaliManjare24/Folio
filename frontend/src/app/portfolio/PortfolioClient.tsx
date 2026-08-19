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

type Category = {
  id: string;
  label: string;
  order: number;
};

const PER_PAGE = 9;

export default function PortfolioClient({
  categories,
  items: itemsRaw,
}: {
  categories: Category[];
  items: Record<string, any>[];
}) {
  const items = itemsRaw as Item[];
  const [tab, setTab] = useState<string>(categories[0]?.id || "web");
  const [page, setPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  // Filter items by current category
  const tabItems = items.filter(item => item.category === tab);
  const totalPages = Math.max(1, Math.ceil(tabItems.length / PER_PAGE));

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
        {categories.map((category) => {
          const categoryItems = items.filter(item => item.category === category.id);
          return (
            <button
              key={category.id}
              className={`tab${tab === category.id ? " active" : ""}`}
              onClick={() => { setTab(category.id); setPage(1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            >
              {category.label} <span className="tab-count">({categoryItems.length})</span>
            </button>
          );
        })}
      </div>

      {/* PANELS */}
      {categories.map((category) => {
        const categoryItems = items.filter(item => item.category === category.id);
        const categoryTotalPages = Math.max(1, Math.ceil(categoryItems.length / PER_PAGE));
        const categoryStart = (tab === category.id ? (page - 1) * PER_PAGE : 0);
        const categoryEnd = tab === category.id ? categoryStart + PER_PAGE : PER_PAGE;

        return (
          <section
            key={category.id}
            className="services"
            style={{ paddingTop: "0", paddingBottom: "100px", display: tab === category.id ? "" : "none" }}
          >
            <div className="wrap">
              {/* Grid for items with previews */}
              <div className="pf-grid" id={`${category.id}-grid`} ref={tab === category.id ? gridRef : null}>
                {categoryItems.map((item, i) => (
                  <a
                    key={i}
                    href={item.href}
                    className="pf-link"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: i >= categoryStart && i < categoryEnd ? "block" : "none" }}
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
              {tab === category.id && categoryTotalPages > 1 && (
                <div className="pagination">
                  <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>← Prev</button>
                  <span className="page-info">Page <b>{page}</b> of <b>{categoryTotalPages}</b></span>
                  <button className="page-btn" disabled={page >= categoryTotalPages} onClick={() => setPage((p) => Math.min(categoryTotalPages, p + 1))}>Next →</button>
                </div>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { OpenSourceProject } from "@/types";
import "./open-source.css";

export default function OpenSourcePage({ projects }: { projects: OpenSourceProject[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeLanguage, setActiveLanguage] = useState("All");

  const categories = useMemo(() => {
    const set = new Set(projects.map((p) => p.category).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [projects]);

  const languages = useMemo(() => {
    const set = new Set(projects.map((p) => p.language).filter(Boolean) as string[]);
    return ["All", ...Array.from(set).sort()];
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (activeLanguage !== "All" && p.language !== activeLanguage) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.tagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.topics.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [projects, query, activeCategory, activeLanguage]);

  return (
    <div className="os-section">
      <div className="wrap" style={{ maxWidth: "var(--maxw)", margin: "0 auto", paddingInline: "var(--pad)" }}>
        {/* Header */}
        <div className="os-head">
          <p className="os-kicker"><span>// Directory</span> Open source projects worth knowing</p>
          <h1 className="os-title">Discover <span className="hl">Open Source</span></h1>
          <p className="os-subtitle">A curated directory of open-source projects across AI, dev tools, web, and more — hand-picked and maintained.</p>
        </div>

        {/* Search */}
        <input
          type="text"
          className="os-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects, authors, topics…"
        />

        {/* Filters */}
        <div className="os-filters">
          <div className="os-filter-group">
            <span className="os-filter-label">Category</span>
            {categories.map((c) => (
              <button key={c} className={`os-pill${activeCategory === c ? " active" : ""}`} onClick={() => setActiveCategory(c)}>{c}</button>
            ))}
          </div>
          <div className="os-filter-group">
            <span className="os-filter-label">Language</span>
            {languages.map((l) => (
              <button key={l} className={`os-pill${activeLanguage === l ? " active" : ""}`} onClick={() => setActiveLanguage(l)}>{l}</button>
            ))}
          </div>
        </div>

        <p className="os-count">{filtered.length} {filtered.length === 1 ? "project" : "projects"}</p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="os-empty">No projects match your filters.</p>
        ) : (
          <div className="os-grid">
            {filtered.map((p) => (
              <Link key={p.id} href={`/open-source/${p.slug}`} className="os-card-link">
                <article className="os-card reveal">
                  <div className="os-card-body">
                    <div className="os-card-top">
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 className="os-card-title">{p.title}</h3>
                        <p className="os-card-author">by {p.author}</p>
                      </div>
                      {p.language && <span className="os-lang-badge">{p.language}</span>}
                    </div>
                    <p className="os-card-tagline">{p.tagline}</p>
                    {p.topics.length > 0 && (
                      <div className="os-card-topics">
                        {p.topics.slice(0, 4).map((t) => <span key={t}>{t}</span>)}
                      </div>
                    )}
                    <div className="os-card-stats">
                      {p.stars > 0 && <span>★ {p.stars.toLocaleString()}</span>}
                      {p.forks > 0 && <span>⑂ {p.forks.toLocaleString()}</span>}
                      {p.license && <span>{p.license}</span>}
                      {p.category && <span>{p.category}</span>}
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import type { OpenSourceProject } from "@/types";

export default function OpenSourcePage({ projects }: { projects: OpenSourceProject[] }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [activeLanguage, setActiveLanguage] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.category && set.add(p.category));
    return ["All", ...Array.from(set).sort()];
  }, [projects]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.language && set.add(p.language));
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
    <PageWrapper>
      <div className="max-w-[var(--max-width)] mx-auto px-[var(--space-4)] md:px-[var(--space-8)] py-[var(--space-16)]">
        {/* Header */}
        <div className="mb-[var(--space-12)]">
          <p
            className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-widest mb-[var(--space-4)]"
            style={{ color: "var(--color-accent)" }}
          >
            Open Source
          </p>
          <h1
            className="font-[family-name:var(--font-display)] text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-semibold mb-[var(--space-4)]"
            style={{ color: "var(--color-text)", fontSize: "clamp(2rem, 5vw, var(--text-3xl))" }}
          >
            Discover Open Source
          </h1>
          <p
            className="font-[family-name:var(--font-body)] text-[var(--text-base)] max-w-[var(--measure)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            A curated directory of open-source projects worth knowing — across AI, dev tools, web, and more.
          </p>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-[var(--space-4)] mb-[var(--space-10)]">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, authors, topics..."
            className="w-full font-[family-name:var(--font-body)] text-[var(--text-base)] p-[var(--space-3)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 transition-colors"
            style={{
              background: "var(--color-bg-subtle)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              color: "var(--color-text)",
            }}
          />
          <div className="flex flex-wrap gap-[var(--space-4)]">
            <FilterGroup label="Category" options={categories} active={activeCategory} onSelect={setActiveCategory} />
            <FilterGroup label="Language" options={languages} active={activeLanguage} onSelect={setActiveLanguage} />
          </div>
        </div>

        {/* Results count */}
        <p
          className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-wider mb-[var(--space-6)]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {filtered.length} {filtered.length === 1 ? "project" : "projects"}
        </p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p className="font-[family-name:var(--font-body)] text-[var(--text-base)]" style={{ color: "var(--color-text-tertiary)" }}>
            No projects match your filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-6)]">
            {filtered.map((project) => (
              <RepoCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}

function FilterGroup({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: string[];
  active: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-[var(--space-2)]">
      <span
        className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-wider mr-[var(--space-1)]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}:
      </span>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] px-[var(--space-3)] py-[var(--space-1)] cursor-pointer transition-colors"
          style={{
            background: active === opt ? "var(--color-accent)" : "var(--color-bg-muted)",
            color: active === opt ? "var(--color-accent-on)" : "var(--color-text-secondary)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
          }}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

function RepoCard({ project }: { project: OpenSourceProject }) {
  return (
    <Link
      href={`/open-source/${project.slug}`}
      className="group flex flex-col p-[var(--space-6)] transition-colors"
      style={{ background: "var(--color-bg-subtle)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}
    >
      <div className="flex items-start justify-between gap-[var(--space-3)] mb-[var(--space-3)]">
        <div className="min-w-0">
          <h3
            className="font-[family-name:var(--font-display)] text-[var(--text-lg)] font-semibold group-hover:text-[var(--color-accent)] transition-colors truncate"
            style={{ color: "var(--color-text)" }}
          >
            {project.title}
          </h3>
          <p
            className="font-[family-name:var(--font-mono)] text-[var(--text-xs)]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {project.author}
          </p>
        </div>
        {project.language && (
          <span
            className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] px-[var(--space-2)] py-[var(--space-1)] flex-shrink-0"
            style={{ background: "var(--color-accent-lightest)", color: "var(--color-accent)", borderRadius: "var(--radius-sm)" }}
          >
            {project.language}
          </span>
        )}
      </div>

      <p
        className="font-[family-name:var(--font-body)] text-[var(--text-sm)] mb-[var(--space-4)] line-clamp-2"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {project.tagline}
      </p>

      {project.topics.length > 0 && (
        <div className="flex flex-wrap gap-[var(--space-1)] mb-[var(--space-4)]">
          {project.topics.slice(0, 4).map((t) => (
            <span
              key={t}
              className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] px-[var(--space-2)] py-[var(--space-1)]"
              style={{ background: "var(--color-bg-muted)", color: "var(--color-text-tertiary)", borderRadius: "var(--radius-sm)" }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      <div
        className="flex items-center gap-[var(--space-4)] mt-auto pt-[var(--space-3)] font-[family-name:var(--font-mono)] text-[var(--text-xs)]"
        style={{ color: "var(--color-text-tertiary)", borderTop: "1px solid var(--color-border)" }}
      >
        {project.stars > 0 && <span>★ {project.stars.toLocaleString()}</span>}
        {project.forks > 0 && <span>⑂ {project.forks.toLocaleString()}</span>}
        {project.license && <span>{project.license}</span>}
      </div>
    </Link>
  );
}

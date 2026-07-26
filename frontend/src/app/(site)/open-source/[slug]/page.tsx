import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import { fetchSettings, isServerFetchErrorStatus, logPublicFetchError, serverFetch } from "@/lib/config";
import type { OpenSourceProject } from "@/types";
import "../open-source.css";

export const revalidate = 60;

const arrow = <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, fill: "none", stroke: "currentColor", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" }}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const settings = await fetchSettings();
  try {
    const project = await serverFetch<OpenSourceProject>(`/api/opensource/${slug}`);
    const title = `${project.title} — Open Source`;
    return {
      title,
      description: project.tagline,
      alternates: { canonical: `/open-source/${project.slug}` },
      openGraph: { title, description: project.tagline, type: "article" },
    };
  } catch {
    return { title: "Open Source", description: settings.siteConfig.description };
  }
}

export default async function OpenSourceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  let project: OpenSourceProject | null = null;
  try {
    project = await serverFetch<OpenSourceProject>(`/api/opensource/${slug}`);
  } catch (error) {
    if (isServerFetchErrorStatus(error, 404)) notFound();
    logPublicFetchError(`failed to load open-source project ${slug}`, error);
  }

  if (!project) {
    return (
      <PageWrapper>
        <div className="os-section"><div className="wrap" style={{ maxWidth: "var(--maxw)", margin: "0 auto", paddingInline: "var(--pad)" }}>
          <p style={{ fontFamily: "var(--sans-l)", fontSize: 17, color: "var(--muted)" }}>This project is temporarily unavailable.</p>
        </div></div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "SoftwareApplication",
        name: project.title, description: project.tagline,
        url: project.homepageUrl || project.githubUrl,
        applicationCategory: project.category || "DeveloperApplication",
        author: { "@type": "Organization", name: project.author },
        license: project.license || undefined,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      }) }} />

      <div className="os-section">
        <div className="wrap" style={{ maxWidth: "var(--maxw)", margin: "0 auto", paddingInline: "var(--pad)" }}>
          <Link href="/open-source" className="os-back">&larr; All projects</Link>

          {/* Badges */}
          <div className="os-badges">
            {project.category && <span className="os-badge os-badge-cat">{project.category}</span>}
            {project.featured && <span className="os-badge os-badge-featured">Featured</span>}
          </div>

          {/* Title */}
          <h1 className="os-detail-title">{project.title}</h1>
          <p className="os-detail-author">by {project.author}</p>
          <p className="os-detail-tagline">{project.tagline}</p>

          {/* Actions */}
          <div className="os-actions">
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-dark" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 15, padding: "13px 22px", borderRadius: 8, background: "var(--ink)", color: "var(--paper)", textDecoration: "none", fontFamily: "var(--sans-l)" }}>
              <span>View on GitHub</span>{arrow}
            </a>
            {project.homepageUrl && (
              <a href={project.homepageUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: 15, padding: "13px 22px", borderRadius: 8, border: "1px solid var(--line)", color: "var(--ink)", textDecoration: "none", fontFamily: "var(--sans-l)" }}>
                <span>Live demo</span>{arrow}
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="os-stats-row">
            <div className="os-stat-item">
              <p className="os-stat-label">Stars</p>
              <p className="os-stat-value">{project.stars > 0 ? project.stars.toLocaleString() : "—"}</p>
            </div>
            <div className="os-stat-item">
              <p className="os-stat-label">Forks</p>
              <p className="os-stat-value">{project.forks > 0 ? project.forks.toLocaleString() : "—"}</p>
            </div>
            <div className="os-stat-item">
              <p className="os-stat-label">Language</p>
              <p className="os-stat-value" style={{ fontSize: 18 }}>{project.language || "—"}</p>
            </div>
            <div className="os-stat-item">
              <p className="os-stat-label">License</p>
              <p className="os-stat-value" style={{ fontSize: 18 }}>{project.license || "—"}</p>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div style={{ marginTop: 40 }}>
              <p className="os-section-label">About</p>
              <p className="os-desc">{project.description}</p>
            </div>
          )}

          {/* Topics */}
          {project.topics.length > 0 && (
            <div style={{ marginTop: 36 }}>
              <p className="os-section-label">Topics</p>
              <div className="os-topics-detail">
                {project.topics.map((t) => <span key={t}>{t}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import {
  fetchSettings,
  getSiteUrl,
  isServerFetchErrorStatus,
  logPublicFetchError,
  serverFetch,
} from "@/lib/config";
import type { OpenSourceProject } from "@/types";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const settings = await fetchSettings();
  try {
    const project = await serverFetch<OpenSourceProject>(`/api/opensource/${slug}`);
    const title = `${project.title} — Open Source`;
    const description = project.tagline || project.description;
    return {
      title,
      description,
      alternates: { canonical: `/open-source/${project.slug}` },
      openGraph: { title, description, type: "article" },
    };
  } catch {
    return { title: "Open Source", description: settings.siteConfig.description };
  }
}

export default async function OpenSourceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const siteUrl = getSiteUrl();

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
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--space-4)] md:px-[var(--space-8)] py-[var(--space-16)]">
          <p className="font-[family-name:var(--font-body)] text-[var(--text-base)]" style={{ color: "var(--color-text-tertiary)" }}>
            This project is temporarily unavailable.
          </p>
        </div>
      </PageWrapper>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: project.title,
    description: project.tagline || project.description,
    url: project.homepageUrl || project.githubUrl,
    applicationCategory: project.category || "DeveloperApplication",
    author: { "@type": "Organization", name: project.author },
    license: project.license || undefined,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <PageWrapper>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-[var(--max-width)] mx-auto px-[var(--space-4)] md:px-[var(--space-8)] py-[var(--space-16)]">
        <Link
          href="/open-source"
          className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-wider mb-[var(--space-8)] inline-block transition-colors hover:text-[var(--color-accent)]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          &larr; All open source
        </Link>

        <header className="mb-[var(--space-10)]">
          <div className="flex flex-wrap items-center gap-[var(--space-3)] mb-[var(--space-4)]">
            {project.category && (
              <span
                className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-wider px-[var(--space-2)] py-[var(--space-1)]"
                style={{ background: "var(--color-accent-lightest)", color: "var(--color-accent)", borderRadius: "var(--radius-sm)" }}
              >
                {project.category}
              </span>
            )}
            {project.featured && (
              <span
                className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-wider px-[var(--space-2)] py-[var(--space-1)]"
                style={{ background: "var(--color-bg-muted)", color: "var(--color-text-tertiary)", borderRadius: "var(--radius-sm)" }}
              >
                Featured
              </span>
            )}
          </div>
          <h1
            className="font-[family-name:var(--font-display)] text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-semibold mb-[var(--space-3)]"
            style={{ color: "var(--color-text)", fontSize: "clamp(1.75rem, 4vw, var(--text-3xl))" }}
          >
            {project.title}
          </h1>
          <p className="font-[family-name:var(--font-mono)] text-[var(--text-sm)]" style={{ color: "var(--color-text-tertiary)" }}>
            by {project.author}
          </p>
          <p
            className="font-[family-name:var(--font-body)] text-[var(--text-lg)] mt-[var(--space-4)] max-w-[var(--measure)]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {project.tagline}
          </p>
        </header>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-[var(--space-3)] mb-[var(--space-10)]">
          <a
            href={project.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-[var(--space-2)] font-[family-name:var(--font-mono)] text-[var(--text-sm)] uppercase tracking-wider px-[var(--space-5)] py-[var(--space-3)] transition-opacity hover:opacity-90"
            style={{ background: "var(--color-accent)", color: "var(--color-accent-on)", borderRadius: "var(--radius-md)" }}
          >
            View on GitHub &rarr;
          </a>
          {project.homepageUrl && (
            <a
              href={project.homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[var(--space-2)] font-[family-name:var(--font-mono)] text-[var(--text-sm)] uppercase tracking-wider px-[var(--space-5)] py-[var(--space-3)] transition-colors"
              style={{ background: "var(--color-bg-muted)", color: "var(--color-text-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}
            >
              Live demo &rarr;
            </a>
          )}
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-[var(--space-4)] mb-[var(--space-10)] p-[var(--space-6)]"
          style={{ background: "var(--color-bg-subtle)", borderRadius: "var(--radius-lg)" }}
        >
          <Stat label="Stars" value={project.stars > 0 ? project.stars.toLocaleString() : "—"} />
          <Stat label="Forks" value={project.forks > 0 ? project.forks.toLocaleString() : "—"} />
          <Stat label="Language" value={project.language || "—"} />
          <Stat label="License" value={project.license || "—"} />
        </div>

        {/* Description */}
        {project.description && (
          <div className="mb-[var(--space-10)]">
            <h2
              className="font-[family-name:var(--font-display)] text-[var(--text-xl)] font-semibold mb-[var(--space-4)]"
              style={{ color: "var(--color-text)" }}
            >
              About
            </h2>
            <p
              className="font-[family-name:var(--font-body)] text-[var(--text-base)] max-w-[var(--measure)] whitespace-pre-line"
              style={{ color: "var(--color-text-secondary)" }}
            >
              {project.description}
            </p>
          </div>
        )}

        {/* Topics */}
        {project.topics.length > 0 && (
          <div className="mb-[var(--space-10)]">
            <h2
              className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-widest mb-[var(--space-3)]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Topics
            </h2>
            <div className="flex flex-wrap gap-[var(--space-2)]">
              {project.topics.map((t) => (
                <span
                  key={t}
                  className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] px-[var(--space-3)] py-[var(--space-1)]"
                  style={{ background: "var(--color-bg-muted)", color: "var(--color-text-tertiary)", borderRadius: "var(--radius-sm)" }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>
    </PageWrapper>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-wider mb-[var(--space-1)]"
        style={{ color: "var(--color-text-tertiary)" }}
      >
        {label}
      </p>
      <p className="font-[family-name:var(--font-display)] text-[var(--text-lg)] font-semibold" style={{ color: "var(--color-text)" }}>
        {value}
      </p>
    </div>
  );
}

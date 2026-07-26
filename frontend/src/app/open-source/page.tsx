import type { Metadata } from "next";
import PageWrapper from "@/components/PageWrapper";
import { fetchSettings, logPublicFetchError, serverFetch } from "@/lib/config";
import type { OpenSourceProject } from "@/types";
import OpenSourcePage from "./OpenSourceClient";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  return {
    title: "Open Source",
    description: `A curated directory of open-source projects, hand-picked by ${settings.siteConfig.authorName}.`,
    alternates: { canonical: "/open-source" },
    openGraph: { title: "Open Source", type: "website" },
  };
}

export default async function Page() {
  let projects: OpenSourceProject[] = [];
  let errored = false;
  try {
    projects = await serverFetch<OpenSourceProject[]>("/api/opensource");
  } catch (error) {
    errored = true;
    logPublicFetchError("failed to load open-source page", error);
  }

  if (errored || projects.length === 0) {
    return (
      <PageWrapper>
        <div className="max-w-[var(--max-width)] mx-auto px-[var(--space-4)] md:px-[var(--space-8)] py-[var(--space-16)]">
          <p
            className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-widest mb-[var(--space-4)]"
            style={{ color: "var(--color-accent)" }}
          >
            Open Source
          </p>
          <h1
            className="font-[family-name:var(--font-display)] text-[var(--text-2xl)] md:text-[var(--text-3xl)] font-semibold mb-[var(--space-4)]"
            style={{ color: "var(--color-text)" }}
          >
            Discover Open Source
          </h1>
          <p className="font-[family-name:var(--font-body)] text-[var(--text-base)]" style={{ color: "var(--color-text-tertiary)" }}>
            {errored ? "Projects are temporarily unavailable. Please try again later." : "No open-source projects listed yet."}
          </p>
        </div>
      </PageWrapper>
    );
  }

  return <OpenSourcePage projects={projects} />;
}

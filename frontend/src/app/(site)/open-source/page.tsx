import type { Metadata } from "next";
import PageWrapper from "@/components/PageWrapper";
import { fetchSettings, logPublicFetchError, serverFetch } from "@/lib/config";
import type { OpenSourceProject } from "@/types";
import OpenSourcePage from "./OpenSourceClient";
import "./open-source.css";

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
        <div className="os-section">
          <div className="wrap" style={{ maxWidth: "var(--maxw)", margin: "0 auto", paddingInline: "var(--pad)" }}>
            <div className="os-head">
              <p className="os-kicker"><span>// Directory</span> Open source projects worth knowing</p>
              <h1 className="os-title">Discover <span className="hl">Open Source</span></h1>
            </div>
            <p style={{ fontFamily: "var(--sans-l)", fontSize: 17, color: "var(--muted)" }}>
              {errored ? "Projects are temporarily unavailable. Please try again later." : "No open-source projects listed yet."}
            </p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <OpenSourcePage projects={projects} />
    </PageWrapper>
  );
}

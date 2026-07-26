import type { Metadata } from "next";
import { connection } from "next/server";
import PageWrapper from "@/components/PageWrapper";
import { fetchSettings, logPublicFetchError, serverFetch } from "@/lib/config";
import "../pages.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  return { title: "About", description: `Learn more about ${settings.siteConfig.authorName} and the work behind ${settings.siteConfig.title}.` };
}

interface Experience { id: string; role: string; period: string; description: string; order: number; }

export default async function AboutPage() {
  await connection();
  const settings = await fetchSettings();
  const { siteConfig: cfg, bioAbout, skillGroups } = settings;
  let experience: Experience[] = [];
  try { experience = await serverFetch<Experience[]>("/api/experience"); } catch (error) { logPublicFetchError("failed to load experience", error); }

  return (
    <PageWrapper settings={settings}>
      <div className="pg-section">
        <div className="wrap" style={{ maxWidth: "var(--maxw)", margin: "0 auto", paddingInline: "var(--pad)" }}>
          {/* Header */}
          <div className="pg-head">
            <p className="pg-kicker"><span>// About</span> Who's behind the work</p>
            <h1 className="pg-title">{cfg.authorName}</h1>
          </div>

          {/* Bio */}
          <div className="ab-bio">
            {bioAbout.map((p, i) => <p key={i} style={{ marginBottom: 18 }}>{p}</p>)}
          </div>

          {/* Skills */}
          {skillGroups.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <p className="os-section-label" style={{ fontFamily: "var(--mono-l)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--faint)", marginBottom: 16 }}>Skills & Tools</p>
              <div className="ab-skills">
                {skillGroups.map((group, i) => (
                  <div key={i} className="ab-skill-group reveal">
                    <h3>{group.category}</h3>
                    <div className="ab-skill-list">
                      {group.skills.map((skill, j) => (
                        <span key={j} className="ab-skill" data-level={skill.level}>{skill.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <div style={{ marginTop: 56 }}>
              <p className="os-section-label" style={{ fontFamily: "var(--mono-l)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--faint)", marginBottom: 20 }}>Experience</p>
              {experience.map((exp) => (
                <div key={exp.id} className="ab-exp reveal">
                  <p className="ab-exp-role">{exp.role}</p>
                  <p className="ab-exp-period">{exp.period}</p>
                  <p className="ab-exp-desc">{exp.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

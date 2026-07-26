import type { Metadata } from "next";
import PageWrapper from "@/components/PageWrapper";
import ContactForm from "@/components/ContactForm";
import { fetchSettings } from "@/lib/config";
import "../pages.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  return { title: "Contact", description: `Get in touch with ${settings.siteConfig.authorName}.` };
}

export default async function ContactPage() {
  const settings = await fetchSettings();
  const social = settings.siteConfig.socialLinks || {};

  return (
    <PageWrapper settings={settings}>
      <div className="pg-section">
        <div className="wrap" style={{ maxWidth: "var(--maxw)", margin: "0 auto", paddingInline: "var(--pad)" }}>
          <div className="pg-head">
            <p className="pg-kicker"><span>// Contact</span> Let's talk</p>
            <h1 className="pg-title">Get in <span className="hl">touch</span></h1>
            <p className="pg-subtitle">Have a question, project idea, or just want to say hello? Fill out the form below and I'll get back to you. No pitches, no funnels.</p>
          </div>

          <ContactForm />

          {/* Social links */}
          {Object.keys(social).length > 0 && (
            <div style={{ marginTop: 48 }}>
              <p className="os-section-label" style={{ fontFamily: "var(--mono-l)", fontSize: 12, textTransform: "uppercase", letterSpacing: ".06em", color: "var(--faint)", marginBottom: 14 }}>Or find me on</p>
              <div className="ct-social">
                {Object.entries(social).map(([platform, url]) => (
                  <a key={platform} href={url} target="_blank" rel="noopener noreferrer" style={{ textTransform: "capitalize" }}>{platform}</a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

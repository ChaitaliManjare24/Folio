"use client";

import { useState, useEffect } from "react";
import { useAuth, logoutAdmin } from "@/lib/auth";
import { adminApiRequest, getAdminErrorMessage } from "@/lib/admin-api";
import AdminSidebar from "@/components/admin/Sidebar";
import { AuthProvider } from "@/lib/auth";
import { UIProvider, useUI } from "@/components/admin/Toast";

// Sections of landing_content that are editable as JSON
const LANDING_SECTIONS: { key: string; label: string; hint: string }[] = [
  { key: "statusPill", label: "Status Pill (header badge)", hint: "Plain string, e.g. \"Building — Q3 2026\"" },
  { key: "nav", label: "Navigation labels", hint: "Object: { principles, process, stack, projects, blog, faq, contact }" },
  { key: "hero", label: "Hero section", hint: "Kicker, title (** for highlights), subtitle, CTAs, badges, code editor" },
  { key: "trust", label: "Trust bar (By the numbers)", hint: "{ label, items: [...] }" },
  { key: "principles", label: "Principles cards", hint: "Array of { num, title, body, tags }" },
  { key: "process", label: "Process steps", hint: "Array of { num, title, body, time }" },
  { key: "stats", label: "Stats counters", hint: "Array of { prefix?, count, suffix?, plus?, label }" },
  { key: "stack", label: "Stack / toolbox", hint: "{ label, labelText, title, items: [\"TypeScript\", ...] }" },
  { key: "writing", label: "Latest writing header", hint: "{ label, labelText, title, moreLabel }" },
  { key: "faq", label: "FAQ items", hint: "Array of { q, a }" },
  { key: "cta", label: "Final CTA", hint: "{ label, labelText, title, subtitle, primary, secondary, links }" },
  { key: "footer", label: "Footer", hint: "{ brand, tagline, location, connect, copyright, ... }" },
];

export default function AdminLandingPage() {
  return (
    <AuthProvider>
      <UIProvider>
        <LandingContent />
      </UIProvider>
    </AuthProvider>
  );
}

function LandingContent() {
  const { token } = useAuth();
  const { toast } = useUI();
  const [landing, setLanding] = useState<Record<string, any> | null>(null);
  const [portfolioJson, setPortfolioJson] = useState("");
  const [sectionText, setSectionText] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const s = await adminApiRequest<Record<string, any>>("/api/settings");
        const lc = s.landing_content || {};
        setLanding(lc);
        setPortfolioJson(JSON.stringify(s.portfolio_items || { hero: {}, items: [] }, null, 2));
        const texts: Record<string, string> = {};
        for (const sec of LANDING_SECTIONS) {
          texts[sec.key] = typeof lc[sec.key] === "string" ? JSON.stringify(lc[sec.key]) : JSON.stringify(lc[sec.key] ?? "", null, 2);
        }
        setSectionText(texts);
      } catch (err) {
        toast(getAdminErrorMessage(err, "Failed to load landing content"), "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, toast]);

  const save = async () => {
    if (saving || !landing) return;
    setSaving(true);
    try {
      // Reassemble landing_content from section textareas
      const updated: Record<string, any> = {};
      for (const sec of LANDING_SECTIONS) {
        const raw = sectionText[sec.key]?.trim();
        if (!raw) continue;
        try {
          updated[sec.key] = JSON.parse(raw);
        } catch {
          toast(`Invalid JSON in "${sec.label}" — fix it before saving.`, "error");
          setSaving(false);
          return;
        }
      }
      let portfolio;
      try {
        portfolio = JSON.parse(portfolioJson);
      } catch {
        toast("Invalid JSON in Portfolio items — fix it before saving.", "error");
        setSaving(false);
        return;
      }
      await adminApiRequest("/api/settings", {
        method: "PUT",
        body: JSON.stringify({ landing_content: updated, portfolio_items: portfolio }),
      });
      toast("Landing & portfolio content saved", "success");
    } catch (err) {
      toast(getAdminErrorMessage(err, "Save failed"), "error");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = { background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text)", fontFamily: "var(--font-mono, monospace)", fontSize: "12px" } as const;

  return (
    <div className="admin-main min-h-screen flex flex-col md:flex-row" style={{ background: "var(--color-bg)" }}>
      <AdminSidebar onLogout={logoutAdmin} />
      <main className="min-w-0 w-full flex-1 overflow-x-hidden p-[var(--space-4)] sm:p-[var(--space-6)] md:p-[var(--space-8)]">
        <div className="mb-[var(--space-6)] flex flex-col gap-[var(--space-3)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-[var(--text-xl)] font-semibold" style={{ color: "var(--color-text)" }}>Landing & Portfolio</h1>
            <p className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] mt-[var(--space-1)]" style={{ color: "var(--color-text-tertiary)" }}>
              Edit every section of the homepage &amp; portfolio. Use ** around words to highlight them. Also editable via MCP <code>update_settings</code> (<code>landing_content</code>, <code>portfolio_items</code>).
            </p>
          </div>
          <button onClick={save} disabled={saving || loading} className="inline-flex min-h-[40px] items-center justify-center px-5 py-2.5 font-[family-name:var(--font-body)] text-[var(--text-sm)] font-medium transition-all hover:brightness-110 disabled:opacity-50" style={{ background: "var(--color-accent)", color: "var(--color-accent-on)", borderRadius: "var(--radius-md)" }}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>

        {loading ? (
          <p className="font-[family-name:var(--font-mono)] text-[var(--text-sm)]" style={{ color: "var(--color-text-tertiary)" }}>Loading...</p>
        ) : (
          <div className="flex flex-col gap-[var(--space-5)]">
            {LANDING_SECTIONS.map((sec) => (
              <div key={sec.key} className="p-[var(--space-4)]" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
                <label className="font-[family-name:var(--font-display)] text-[var(--text-sm)] font-semibold block mb-[var(--space-1)]" style={{ color: "var(--color-text)" }}>{sec.label}</label>
                <p className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] mb-[var(--space-2)]" style={{ color: "var(--color-text-tertiary)" }}>{sec.hint}</p>
                <textarea
                  value={sectionText[sec.key] || ""}
                  onChange={(e) => setSectionText((t) => ({ ...t, [sec.key]: e.target.value }))}
                  rows={sec.key === "statusPill" ? 1 : 6}
                  className="w-full p-[var(--space-3)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                  style={inputStyle}
                  spellCheck={false}
                />
              </div>
            ))}

            <div className="p-[var(--space-4)]" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
              <label className="font-[family-name:var(--font-display)] text-[var(--text-sm)] font-semibold block mb-[var(--space-1)]" style={{ color: "var(--color-text)" }}>Portfolio items</label>
              <p className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] mb-[var(--space-2)]" style={{ color: "var(--color-text-tertiary)" }}>{`{ hero: {...}, items: [{ num, title, tag, tagline, href, preview, category, github? }] }`}</p>
              <textarea
                value={portfolioJson}
                onChange={(e) => setPortfolioJson(e.target.value)}
                rows={14}
                className="w-full p-[var(--space-3)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30"
                style={inputStyle}
                spellCheck={false}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

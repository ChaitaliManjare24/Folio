"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth, logoutAdmin } from "@/lib/auth";
import { adminApiRequest, getAdminErrorMessage, isAdminApiError } from "@/lib/admin-api";
import AdminSidebar from "@/components/admin/Sidebar";
import { AuthProvider } from "@/lib/auth";
import { UIProvider, useUI } from "@/components/admin/Toast";

interface OSSProject {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  githubUrl: string;
  homepageUrl?: string | null;
  author: string;
  language?: string | null;
  category?: string | null;
  topics: string[];
  stars: number;
  forks: number;
  license?: string | null;
  thumbnail?: string | null;
  featured: boolean;
  order: number;
}

const emptyForm = {
  title: "",
  slug: "",
  tagline: "",
  description: "",
  githubUrl: "",
  homepageUrl: "",
  author: "",
  language: "",
  category: "",
  topics: "",
  stars: 0,
  forks: 0,
  license: "",
  thumbnail: "",
  featured: false,
  order: 0,
};

export default function AdminOpenSourcePage() {
  return (
    <AuthProvider>
      <UIProvider>
        <OpenSourceContent />
      </UIProvider>
    </AuthProvider>
  );
}

function OpenSourceContent() {
  const { token } = useAuth();
  const { toast, confirm } = useUI();
  const [projects, setProjects] = useState<OSSProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<OSSProject | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApiRequest<OSSProject[]>("/api/opensource");
      setProjects(data);
    } catch (err) {
      console.error(err);
      toast(getAdminErrorMessage(err, "Failed to load open-source projects"), "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!token) return;
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [token, load]);

  const startCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm(emptyForm);
    setFormError(null);
  };

  const startEdit = (p: OSSProject) => {
    setCreating(false);
    setEditing(p);
    setForm({
      title: p.title,
      slug: p.slug,
      tagline: p.tagline,
      description: p.description,
      githubUrl: p.githubUrl,
      homepageUrl: p.homepageUrl || "",
      author: p.author,
      language: p.language || "",
      category: p.category || "",
      topics: p.topics.join(", "),
      stars: p.stars,
      forks: p.forks,
      license: p.license || "",
      thumbnail: p.thumbnail || "",
      featured: p.featured,
      order: p.order,
    });
    setFormError(null);
  };

  const cancel = () => {
    setEditing(null);
    setCreating(false);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    setFormError(null);
    const payload = {
      title: form.title,
      slug: form.slug || undefined,
      tagline: form.tagline,
      description: form.description,
      githubUrl: form.githubUrl,
      homepageUrl: form.homepageUrl || null,
      author: form.author,
      language: form.language || null,
      category: form.category || null,
      topics: form.topics.split(",").map((s) => s.trim()).filter(Boolean),
      stars: Number(form.stars),
      forks: Number(form.forks),
      license: form.license || null,
      thumbnail: form.thumbnail || null,
      featured: form.featured,
      order: Number(form.order),
    };

    try {
      if (editing) {
        await adminApiRequest(`/api/opensource/${editing.id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await adminApiRequest("/api/opensource", { method: "POST", body: JSON.stringify(payload) });
      }
      cancel();
      await load();
      toast(editing ? "Project updated" : "Project created", "success");
    } catch (err) {
      console.error(err);
      const message = getAdminErrorMessage(err, "Save failed");
      setFormError(message);
      toast(message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    if (!(await confirm("Delete this open-source project?"))) return;
    setDeletingId(id);
    try {
      await adminApiRequest(`/api/opensource/${id}`, { method: "DELETE" });
      await load();
      toast("Project deleted", "success");
    } catch (err) {
      console.error(err);
      if (isAdminApiError(err) && err.status === 404) {
        await load();
        toast("Project was already deleted.", "info");
      } else {
        toast(getAdminErrorMessage(err, "Delete failed"), "error");
      }
    } finally {
      setDeletingId(null);
    }
  };

  const inputStyle = { background: "var(--color-bg)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", color: "var(--color-text)" } as const;
  const labelClass = "font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-wider block mb-[var(--space-1)]";
  const labelStyle = { color: "var(--color-text-tertiary)" } as const;
  const fieldClass = "w-full px-[var(--space-3)] py-[var(--space-2)] text-[var(--text-sm)] outline-none focus:ring-2 focus:ring-[var(--color-accent)]/30 focus:border-[var(--color-accent)] transition-colors";

  return (
    <div className="admin-main min-h-screen flex flex-col md:flex-row" style={{ background: "var(--color-bg)" }}>
      <AdminSidebar onLogout={logoutAdmin} />
      <main className="min-w-0 w-full flex-1 overflow-x-hidden p-[var(--space-4)] sm:p-[var(--space-6)] md:p-[var(--space-8)]">
        <div className="mb-[var(--space-8)] flex flex-col gap-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-[var(--text-xl)] font-semibold" style={{ color: "var(--color-text)" }}>
            Open Source
          </h1>
          {!creating && !editing && (
            <button
              onClick={startCreate}
              className="inline-flex min-h-[40px] items-center justify-center self-start px-5 py-2.5 font-[family-name:var(--font-body)] text-[var(--text-sm)] font-medium transition-all duration-150 hover:brightness-110 sm:self-auto"
              style={{ background: "var(--color-accent)", color: "var(--color-accent-on)", borderRadius: "var(--radius-md)", minHeight: "40px" }}
            >
              + New Project
            </button>
          )}
        </div>

        {(creating || editing) && (
          <div className="mb-[var(--space-8)] p-[var(--space-6)]" style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)" }}>
            <h2 className="font-[family-name:var(--font-display)] text-[var(--text-base)] font-semibold mb-[var(--space-4)]" style={{ color: "var(--color-text)" }}>
              {editing ? "Edit Open-Source Project" : "New Open-Source Project"}
            </h2>
            <div className="flex flex-col gap-[var(--space-4)]">
              <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
                <div>
                  <label className={labelClass} style={labelStyle}>Title *</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={fieldClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Slug (blank = auto from title)</label>
                  <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="my-project" className={fieldClass} style={inputStyle} />
                </div>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Tagline (one-liner shown on cards) *</label>
                <input value={form.tagline} onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))} className={fieldClass} style={inputStyle} />
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Description (longer, shown on detail page)</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} className={fieldClass} style={inputStyle} />
              </div>
              <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
                <div>
                  <label className={labelClass} style={labelStyle}>GitHub URL *</label>
                  <input value={form.githubUrl} onChange={(e) => setForm((f) => ({ ...f, githubUrl: e.target.value }))} placeholder="https://github.com/user/repo" className={fieldClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Homepage / Live URL</label>
                  <input value={form.homepageUrl} onChange={(e) => setForm((f) => ({ ...f, homepageUrl: e.target.value }))} placeholder="https://..." className={fieldClass} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-3">
                <div>
                  <label className={labelClass} style={labelStyle}>Author / Org</label>
                  <input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} placeholder="username" className={fieldClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Language</label>
                  <input value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))} placeholder="TypeScript" className={fieldClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>License</label>
                  <input value={form.license} onChange={(e) => setForm((f) => ({ ...f, license: e.target.value }))} placeholder="MIT" className={fieldClass} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-[var(--space-4)] md:grid-cols-2">
                <div>
                  <label className={labelClass} style={labelStyle}>Category</label>
                  <input value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="AI, Dev Tools, Web..." className={fieldClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Topics (comma-separated)</label>
                  <input value={form.topics} onChange={(e) => setForm((f) => ({ ...f, topics: e.target.value }))} placeholder="ai, cms, nextjs" className={fieldClass} style={inputStyle} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-[var(--space-4)] md:grid-cols-4">
                <div>
                  <label className={labelClass} style={labelStyle}>Stars</label>
                  <input type="number" value={form.stars} onChange={(e) => setForm((f) => ({ ...f, stars: Number(e.target.value) }))} className={fieldClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Forks</label>
                  <input type="number" value={form.forks} onChange={(e) => setForm((f) => ({ ...f, forks: Number(e.target.value) }))} className={fieldClass} style={inputStyle} />
                </div>
                <div>
                  <label className={labelClass} style={labelStyle}>Order</label>
                  <input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))} className={fieldClass} style={inputStyle} />
                </div>
                <div className="flex items-end gap-[var(--space-2)] pb-[var(--space-2)]">
                  <input type="checkbox" id="oss-featured" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
                  <label htmlFor="oss-featured" className="font-[family-name:var(--font-body)] text-[var(--text-sm)]" style={{ color: "var(--color-text-secondary)" }}>Featured</label>
                </div>
              </div>
              <div>
                <label className={labelClass} style={labelStyle}>Thumbnail URL</label>
                <input value={form.thumbnail} onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))} placeholder="/uploads/thumb.webp" className={fieldClass} style={inputStyle} />
              </div>
              {formError && <p className="text-[var(--text-sm)]" style={{ color: "var(--color-error)" }}>{formError}</p>}
              <div className="mt-[var(--space-2)] flex flex-wrap gap-[var(--space-3)]">
                <button onClick={handleSave} disabled={saving || !form.title || !form.githubUrl} className="font-[family-name:var(--font-body)] text-[var(--text-sm)] font-medium px-5 py-2.5 transition-all duration-150 cursor-pointer hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: "var(--color-accent)", color: "var(--color-accent-on)", borderRadius: "var(--radius-md)", minHeight: "40px" }}>
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
                <button onClick={cancel} disabled={saving} className="font-[family-name:var(--font-body)] text-[var(--text-sm)] font-medium px-5 py-2.5 transition-colors cursor-pointer hover:text-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed" style={{ color: "var(--color-text-tertiary)", minHeight: "40px" }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <p className="font-[family-name:var(--font-mono)] text-[var(--text-sm)]" style={{ color: "var(--color-text-tertiary)" }}>Loading...</p>
        ) : projects.length === 0 ? (
          <p className="font-[family-name:var(--font-body)] text-[var(--text-sm)]" style={{ color: "var(--color-text-tertiary)" }}>No open-source projects yet. Click “+ New Project” to add one.</p>
        ) : (
          <div className="flex flex-col">
            {projects.map((project) => (
              <div key={project.id} className="flex flex-col gap-[var(--space-3)] py-[var(--space-4)] sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: "1px solid var(--color-border)" }}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-[var(--space-2)] sm:gap-[var(--space-3)]">
                    <h3 className="font-[family-name:var(--font-display)] text-[var(--text-sm)] font-semibold" style={{ color: "var(--color-text)" }}>{project.title}</h3>
                    {project.featured && <span className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] px-[var(--space-2)] py-[0.125rem]" style={{ background: "var(--color-accent-lightest)", color: "var(--color-accent)", borderRadius: "var(--radius-sm)" }}>Featured</span>}
                    {project.language && <span className="font-[family-name:var(--font-mono)] text-[var(--text-xs)]" style={{ color: "var(--color-text-tertiary)" }}>{project.language}</span>}
                    {project.stars > 0 && <span className="font-[family-name:var(--font-mono)] text-[var(--text-xs)]" style={{ color: "var(--color-text-tertiary)" }}>★ {project.stars}</span>}
                  </div>
                  <p className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] mt-[var(--space-1)]" style={{ color: "var(--color-text-tertiary)" }}>/{project.slug} · {project.author}</p>
                </div>
                <div className="flex flex-wrap gap-[var(--space-3)]">
                  <a href={`/open-source/${project.slug}`} target="_blank" rel="noopener noreferrer" className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] cursor-pointer transition-colors hover:text-[var(--color-accent)]" style={{ color: "var(--color-text-tertiary)" }}>View</a>
                  <button disabled={deletingId === project.id} onClick={() => startEdit(project)} className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] cursor-pointer transition-colors hover:text-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed" style={{ color: "var(--color-text-tertiary)" }}>Edit</button>
                  <button disabled={deletingId === project.id} onClick={() => handleDelete(project.id)} className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] cursor-pointer transition-colors hover:text-[var(--color-error)] disabled:opacity-50 disabled:cursor-not-allowed" style={{ color: "var(--color-text-tertiary)" }}>{deletingId === project.id ? "Deleting..." : "Delete"}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

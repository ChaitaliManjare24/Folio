import type { Metadata } from "next";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import BlogSearch from "@/components/BlogSearch";
import { fetchSettings, logPublicFetchError, serverFetch } from "@/lib/config";
import type { Post, Category } from "@/types";
import "../pages.css";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSettings();
  return {
    title: "Blog",
    description: `Writing by ${settings.siteConfig.authorName} about AI tools, techniques, agents, and software development.`,
  };
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string; search?: string }> }) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  let posts: Post[] = [];
  let categories: Category[] = [];
  let totalPages = 1;
  let postsError = false;

  try {
    const catParam = params.category ? `&category=${params.category}` : "";
    const searchParam = params.search ? `&search=${encodeURIComponent(params.search)}` : "";
    const data = await serverFetch<{ data: Post[]; total: number; totalPages: number }>(`/api/posts?perPage=12&page=${page}${catParam}${searchParam}`);
    posts = data.data;
    totalPages = data.totalPages;
  } catch (error) {
    postsError = true;
    logPublicFetchError("failed to load blog listing", error);
  }
  try { categories = await serverFetch<Category[]>("/api/categories"); } catch (error) { logPublicFetchError("failed to load categories", error); }

  return (
    <PageWrapper>
      <div className="pg-section">
        <div className="wrap" style={{ maxWidth: "var(--maxw)", margin: "0 auto", paddingInline: "var(--pad)" }}>
          {/* Header */}
          <div className="pg-head">
            <p className="pg-kicker"><span>// Writing</span> Essays, guides & field notes</p>
            <h1 className="pg-title">From the <span className="hl">blog</span></h1>
          </div>

          <BlogSearch />

          {/* Category filters */}
          {categories.length > 0 && (
            <div className="os-filters" style={{ marginTop: 20, marginBottom: 28 }}>
              <Link href="/blog" className={`os-pill${!params.category ? " active" : ""}`}>All</Link>
              {categories.map((cat) => (
                <Link key={cat.id} href={`/blog?category=${cat.slug}`} className={`os-pill${params.category === cat.slug ? " active" : ""}`}>{cat.name}</Link>
              ))}
            </div>
          )}

          {/* Posts */}
          {postsError ? (
            <p style={{ fontFamily: "var(--sans-l)", fontSize: 16, color: "var(--muted)" }}>Posts are temporarily unavailable.</p>
          ) : posts.length > 0 ? (
            <div className="bl-grid">
              {posts.map((post) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="bl-card-link">
                  <article className="bl-card reveal">
                    <div className="bl-card-body">
                      <p className="bl-card-cat">{post.category?.name || "Essay"}</p>
                      <h3 className="bl-card-title">{post.title}</h3>
                      {post.excerpt && <p className="bl-card-excerpt">{post.excerpt}</p>}
                      <div className="bl-card-meta">
                        <span>{post.publishedAt ? formatDate(post.publishedAt) : "Draft"}</span>
                        <span>·</span>
                        <span>{post.readingTime} min read</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ fontFamily: "var(--sans-l)", fontSize: 16, color: "var(--muted)" }}>No published posts yet.</p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 40 }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link key={p} href={`/blog?page=${p}${params.category ? `&category=${params.category}` : ""}`}
                  className="os-pill" style={p === page ? { background: "var(--accent-landing)", color: "#fff", borderColor: "var(--accent-landing)" } : {}}>
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { marked, Renderer } from "marked";
import { codeToHtml } from "shiki";
import PageWrapper from "@/components/PageWrapper";
import {
  fetchSettings,
  getSiteUrl,
  isServerFetchErrorStatus,
  logPublicFetchError,
  serverFetch,
  toAbsoluteUrl,
} from "@/lib/config";
import type { Post } from "@/types";
import TableOfContents from "@/components/TableOfContents";
import ReadingProgressBar from "@/components/ReadingProgressBar";
import CommentSection from "@/components/CommentSection";
import PostReactions from "@/components/PostReactions";
import PostShareButtons from "@/components/PostShareButtons";
import PageViewTracker from "@/components/PageViewTracker";
import PostViewCount from "@/components/PostViewCount";

export const revalidate = 60;

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function toSafeUrl(href: string) {
  const value = href.trim();
  const lower = value.toLowerCase();

  if (
    lower.startsWith("/") ||
    lower.startsWith("#") ||
    lower.startsWith("http://") ||
    lower.startsWith("https://") ||
    lower.startsWith("mailto:")
  ) {
    return value;
  }

  return "#";
}

function toSafeImageUrl(src: string) {
  const value = src.trim();
  const lower = value.toLowerCase();

  if (
    lower.startsWith("/") ||
    lower.startsWith("http://") ||
    lower.startsWith("https://")
  ) {
    return value;
  }

  return "";
}

const BLOCKED_TAGS = /<\/?(script|style|iframe|object|embed|form|input|button|textarea|select|link|meta|base)\b[^>]*>/gi;
const BLOCKED_TAG_BLOCKS = /<(script|style|iframe|object|embed|form|textarea|select)\b[^>]*>[\s\S]*?<\/\1>/gi;
const ALLOWED_TAGS = new Set([
  "a",
  "blockquote",
  "br",
  "code",
  "div",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "hr",
  "img",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "span",
  "strong",
  "u",
  "ul",
]);

function sanitizeRenderedHtml(html: string) {
  const withoutBlockedContent = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(BLOCKED_TAG_BLOCKS, "")
    .replace(BLOCKED_TAGS, "");

  return withoutBlockedContent.replace(/<\/?([a-zA-Z0-9:-]+)([^>]*)>/g, (match, rawTagName: string, rawAttrs: string) => {
    const tagName = rawTagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tagName)) {
      return "";
    }

    if (match.startsWith("</")) {
      return `</${tagName}>`;
    }

    if (tagName === "br" || tagName === "hr") {
      return `<${tagName}>`;
    }

    const attrs: string[] = [];
    const attrRegex = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let attrMatch: RegExpExecArray | null;

    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrValue = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? "";

      if (attrName.startsWith("on") || attrName === "style") {
        continue;
      }

      if (tagName === "a" && attrName === "href") {
        const safeHref = toSafeUrl(attrValue);
        attrs.push(`href="${escapeHtml(safeHref)}"`);
        if (safeHref.startsWith("http://") || safeHref.startsWith("https://")) {
          attrs.push('target="_blank"', 'rel="noopener noreferrer"');
        }
        continue;
      }

      if (tagName === "a" && attrName === "title") {
        attrs.push(`title="${escapeHtml(attrValue)}"`);
        continue;
      }

      if (tagName === "img" && attrName === "src") {
        const safeSrc = toSafeImageUrl(attrValue);
        if (!safeSrc) {
          return "";
        }
        attrs.push(`src="${escapeHtml(safeSrc)}"`);
        continue;
      }

      if (tagName === "img" && (attrName === "alt" || attrName === "title")) {
        attrs.push(`${attrName}="${escapeHtml(attrValue)}"`);
      }
    }

    if (tagName === "img" && !attrs.some((attr) => attr.startsWith("src="))) {
      return "";
    }

    const attrString = attrs.length > 0 ? ` ${attrs.join(" ")}` : "";
    return `<${tagName}${attrString}>`;
  });
}

function isHtmlContent(body: string): boolean {
  const trimmed = body.trim();
  return /^<[a-zA-Z]/.test(trimmed) || /<(p|h[1-6]|div|ul|ol|blockquote|pre|img)\b/i.test(trimmed);
}

function renderBody(body: string): string {
  if (isHtmlContent(body)) {
    return sanitizeRenderedHtml(body);
  }
  return sanitizeRenderedHtml(renderMarkdown(body));
}

const CODE_BLOCK_RE = /<pre><code(?:\s+class="language-(\w+)")?>([\s\S]*?)<\/code><\/pre>/g;

async function highlightCodeBlocks(html: string): Promise<string> {
  const matches = Array.from(html.matchAll(CODE_BLOCK_RE));
  if (matches.length === 0) return html;

  let result = html;
  for (const match of matches) {
    const lang = match[1] || "text";
    const code = match[2].replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
    try {
      const highlighted = await codeToHtml(code, {
        lang,
        theme: "github-dark-default",
        transformers: [],
      });
      result = result.replace(match[0], `<div class="shiki-wrapper">${highlighted}</div>`);
    } catch {
      // leave as-is if shiki can't handle it
    }
  }
  return result;
}

function renderMarkdown(markdown: string) {
  const renderer = new Renderer();

  renderer.html = ({ text }) => escapeHtml(text);
  renderer.link = ({ href, title, tokens }) => {
    const safeHref = toSafeUrl(href);
    const text = renderer.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    const relAttr = safeHref.startsWith("http") ? ' rel="noopener noreferrer"' : "";
    const targetAttr = safeHref.startsWith("http") ? ' target="_blank"' : "";

    return `<a href="${escapeHtml(safeHref)}"${titleAttr}${targetAttr}${relAttr}>${text}</a>`;
  };
  renderer.image = ({ href, title, text }) => {
    const safeHref = toSafeImageUrl(href);
    if (!safeHref) return "";
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : "";
    return `<img src="${escapeHtml(safeHref)}" alt="${escapeHtml(text)}"${titleAttr}>`;
  };

  return marked.parse(markdown, { renderer }) as string;
}

const AUTHOR_JOB_TITLE = "Performance Marketing & Automation Engineer";
const AUTHOR_DESCRIPTION =
  "10+ years managing $50M+ in ad spend across Meta, Google, Bing, and TikTok";
const PUBLISHER_NAME = "bit2byte";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

interface FaqItem {
  question: string;
  answer: string;
}

function extractFaqItems(html: string): FaqItem[] {
  if (!html) return [];

  const headingMatch = html.match(
    /<h[1-6][^>]*>\s*(?:Frequently\s+Asked\s+Questions|FAQ)\s*<\/h[1-6]>/i
  );
  if (!headingMatch || headingMatch.index === undefined) return [];

  const afterHeading = html.slice(headingMatch.index + headingMatch[0].length);
  const ulMatch = afterHeading.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
  if (!ulMatch) return [];

  const ulContent = ulMatch[1];
  const items: FaqItem[] = [];
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  let liMatch: RegExpExecArray | null;

  while ((liMatch = liRegex.exec(ulContent)) !== null) {
    const li = liMatch[1];
    const strongMatch = li.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
    const pMatch = li.match(/<p[^>]*>([\s\S]*?)<\/p>/i);

    const question = stripHtml(strongMatch ? strongMatch[1] : "");

    let answerRaw = "";
    if (pMatch) {
      answerRaw = pMatch[1];
    } else if (strongMatch) {
      const strongEnd = li.toLowerCase().indexOf("</strong>");
      if (strongEnd >= 0) answerRaw = li.slice(strongEnd + "</strong>".length);
    }
    const answer = stripHtml(answerRaw);

    if (question && answer) {
      items.push({ question, answer });
    }
  }

  return items;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const settings = await fetchSettings();
  const siteUrl = getSiteUrl();

  try {
    const post = await serverFetch<Post>(`/api/posts/${slug}`);
    const title = post.metaTitle || post.title;
    const description = post.metaDescription || post.excerpt || post.title;
    const canonicalUrl = `${siteUrl}/blog/${post.slug}`;
    const featuredImageUrl = toAbsoluteUrl(post.ogImage || post.featuredImage);
    const imageUrl = featuredImageUrl || `${siteUrl}/blog/${post.slug}/opengraph-image`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        type: "article",
        url: canonicalUrl,
        title,
        description,
        siteName: settings.siteConfig.title,
        publishedTime: post.publishedAt || undefined,
        modifiedTime: post.updatedAt || undefined,
        images: [{ url: imageUrl }],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch (error) {
    if (isServerFetchErrorStatus(error, 404)) {
      return {
        title: "Post Not Found",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    logPublicFetchError(`failed to generate metadata for post ${slug}`, error);
    return {
      title: "Post Unavailable",
      description: settings.siteConfig.description,
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

export default async function BlogPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { slug } = await params;
  const { preview: previewToken } = await searchParams;
  const settings = await fetchSettings();
  const siteUrl = getSiteUrl();

  let post: Post | null = null;
  let relatedPosts: Post[] = [];
  try {
    post = await serverFetch<Post>(`/api/posts/${slug}${previewToken ? `?preview=${previewToken}` : ""}`);
  } catch (error) {
    if (isServerFetchErrorStatus(error, 404)) {
      notFound();
    }

    logPublicFetchError(`failed to load post ${slug}`, error);
  }

  if (!post) {
    return (
      <PageWrapper>
        <article className="max-w-[var(--max-width)] mx-auto px-[var(--space-4)] md:px-[var(--space-8)] py-[var(--space-16)]">
          <Link
            href="/blog"
            className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-wider mb-[var(--space-8)] inline-block transition-colors hover:text-[var(--color-accent)]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            &larr; Back to blog
          </Link>
          <h1
            className="font-[family-name:var(--font-display)] text-[var(--text-xl)] md:text-[var(--text-2xl)] font-semibold mb-[var(--space-4)]"
            style={{ color: "var(--color-text)" }}
          >
            This post is temporarily unavailable.
          </h1>
          <p
            className="font-[family-name:var(--font-body)] text-[var(--text-base)]"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Please try again later.
          </p>
        </article>
      </PageWrapper>
    );
  }

  if (post.category) {
    try {
      const data = await serverFetch<{ data: Post[] }>(
        `/api/posts?category=${post.category.slug}&perPage=3`
      );
      relatedPosts = data.data.filter((p) => p.id !== post.id);
    } catch {
    }
  }

  const renderedBody = await highlightCodeBlocks(
    renderBody(post.body ?? "").replace(/<h1[^>]*>[\s\S]*?<\/h1>/i, "")
  );

  const authorName = settings.siteConfig.authorName || "Amit Sharma";
  const publisherName = PUBLISHER_NAME;
  const publisherLogoUrl =
    toAbsoluteUrl(settings.siteConfig.logoUrl) || `${siteUrl}/uploads/logo-mark.svg`;
  const postImageUrl =
    toAbsoluteUrl(post.ogImage || post.featuredImage) ||
    `${siteUrl}/blog/${post.slug}/opengraph-image`;
  const canonicalUrl = `${siteUrl}/blog/${post.slug}`;

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt || post.metaDescription || post.title,
    datePublished: post.publishedAt || undefined,
    dateModified: post.updatedAt || post.publishedAt || undefined,
    image: postImageUrl,
    author: {
      "@type": "Person",
      name: authorName,
      url: `${siteUrl}/about`,
      jobTitle: AUTHOR_JOB_TITLE,
      description: AUTHOR_DESCRIPTION,
    },
    publisher: {
      "@type": "Organization",
      name: publisherName,
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: publisherLogoUrl,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": canonicalUrl,
    },
  };

  const faqItems = extractFaqItems(post.body ?? "");
  const faqPageSchema =
    faqItems.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqItems.map(({ question, answer }) => ({
            "@type": "Question",
            name: question,
            acceptedAnswer: {
              "@type": "Answer",
              text: answer,
            },
          })),
        }
      : null;

  const breadcrumbElements: Array<{ position: number; name: string; item?: string }> = [
    { position: 1, name: "Home", item: `${siteUrl}/` },
    { position: 2, name: "Blog", item: `${siteUrl}/blog` },
  ];
  if (post.category) {
    breadcrumbElements.push({
      position: 3,
      name: post.category.name,
      item: `${siteUrl}/blog?category=${post.category.slug}`,
    });
  }
  breadcrumbElements.push({ position: breadcrumbElements.length + 1, name: post.title });

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbElements.map((el) => ({
      "@type": "ListItem",
      position: el.position,
      name: el.name,
      ...(el.item ? { item: el.item } : {}),
    })),
  };

  const showUpdatedDate =
    !!post.updatedAt &&
    !!post.publishedAt &&
    new Date(post.updatedAt).getTime() - new Date(post.publishedAt).getTime() >
      24 * 60 * 60 * 1000;

  return (
    <PageWrapper>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      {faqPageSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ReadingProgressBar />
      <article className="max-w-[var(--max-width)] mx-auto px-[var(--space-4)] md:px-[var(--space-8)] py-[var(--space-16)]">
        <Link
          href="/blog"
          className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-wider mb-[var(--space-8)] inline-block transition-colors hover:text-[var(--color-accent)]"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          &larr; Back to blog
        </Link>

        <header className="mb-[var(--space-12)]">
          <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-4)]">
            {post.category && (
              <span
                className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-wider px-[var(--space-2)] py-[var(--space-1)]"
                style={{
                  background: "var(--color-accent-lightest)",
                  color: "var(--color-accent)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                {post.category.name}
              </span>
            )}
            {post.publishedAt && (
              <span
                className="font-[family-name:var(--font-mono)] text-[var(--text-xs)]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {formatDate(post.publishedAt)}
              </span>
            )}
            {showUpdatedDate && post.updatedAt && (
              <span
                className="font-[family-name:var(--font-mono)] text-[var(--text-xs)]"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                &middot; Updated {formatDate(post.updatedAt)}
              </span>
            )}
            <span
              className="font-[family-name:var(--font-mono)] text-[var(--text-xs)]"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {post.readingTime} min read
            </span>
          </div>
          <h1
            className="font-[family-name:var(--font-display)] text-[var(--text-xl)] md:text-[var(--text-2xl)] font-semibold leading-[var(--leading-tight)] mb-[var(--space-6)]"
            style={{
              color: "var(--color-text)",
              fontSize: "clamp(1.75rem, 4vw, var(--text-2xl))",
            }}
          >
            {post.title}
          </h1>
          {post.featuredImage && (
            <img
              src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3201"}${post.featuredImage}`}
              alt={post.title}
              loading="lazy"
              style={{
                width: "100%",
                maxHeight: "480px",
                objectFit: "cover",
                borderRadius: "var(--radius-lg)",
              }}
            />
          )}
        </header>

        <TableOfContents />

        {post.tldr && post.tldr.trim() && (
          <div
            className="tldr-box"
            role="region"
            aria-label="Key takeaways"
            dangerouslySetInnerHTML={{
              __html: `<strong>Quick answer:</strong> ${sanitizeRenderedHtml(post.tldr)}`,
            }}
          />
        )}

        <div
          className="prose"
          dangerouslySetInnerHTML={{
            __html: renderedBody,
          }}
        />

        {post.tags && post.tags.length > 0 && (
          <div
            className="mt-[var(--space-12)] pt-[var(--space-6)] flex flex-wrap gap-[var(--space-2)]"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            {post.tags.map((tag) => (
              <span
                key={tag.id}
                className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] px-[var(--space-3)] py-[var(--space-1)]"
                style={{
                  background: "var(--color-bg-muted)",
                  color: "var(--color-text-tertiary)",
                  borderRadius: "var(--radius-sm)",
                }}
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        <PageViewTracker />
        <PostViewCount path={`/blog/${post.slug}`} />

        <div
          className="mt-[var(--space-12)] pt-[var(--space-6)] flex flex-col gap-[var(--space-6)]"
          style={{ borderTop: "1px solid var(--color-border)" }}
        >
          <PostReactions postId={post.id} />
          <PostShareButtons slug={post.slug} title={post.title} />
        </div>

        {relatedPosts.length > 0 && (
          <div
            className="mt-[var(--space-16)] pt-[var(--space-8)]"
            style={{ borderTop: "1px solid var(--color-border)" }}
          >
            <h2
              className="font-[family-name:var(--font-display)] text-[var(--text-xl)] font-semibold mb-[var(--space-8)]"
              style={{ color: "var(--color-text)" }}
            >
              Continue Reading
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-6)]">
              {relatedPosts.map((related) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group p-[var(--space-6)] transition-colors"
                  style={{
                    background: "var(--color-bg-subtle)",
                    borderRadius: "var(--radius-lg)",
                  }}
                >
                  {related.category && (
                    <span
                      className="font-[family-name:var(--font-mono)] text-[var(--text-xs)] uppercase tracking-wider mb-[var(--space-2)] block"
                      style={{ color: "var(--color-accent)" }}
                    >
                      {related.category.name}
                    </span>
                  )}
                  <h3
                    className="font-[family-name:var(--font-display)] text-[var(--text-base)] font-semibold group-hover:text-[var(--color-accent)] transition-colors"
                    style={{ color: "var(--color-text)" }}
                  >
                    {related.title}
                  </h3>
                </Link>
              ))}
            </div>
          </div>
         )}

        <CommentSection postId={post.id} />
      </article>
    </PageWrapper>
  );
}

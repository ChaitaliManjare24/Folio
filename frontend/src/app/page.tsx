import Link from "next/link";
import { fetchAllPublishedPosts, fetchSettings } from "@/lib/config";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import ChatWidget from "@/components/ChatWidget";
import "./landing.css";

export const revalidate = 60;

type Any = Record<string, any>;

// Render a title string with **highlighted** segments wrapped in <span class="hl">
function hl(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <span key={i} className="hl">{p.slice(2, -2)}</span>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

// Lightweight syntax highlight for the editor code block
function highlightCode(code: string) {
  const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return esc
    .replace(/(\/\/[^\n]*)/g, '<span class="c-com">$1</span>')
    .replace(/(&quot;[^&]*?&quot;)/g, '<span class="c-str">$1</span>')
    .replace(/\b(import|from|const|new|await|return|true|false)\b/g, '<span class="c-kw">$1</span>')
    .replace(/\b(Builder|ship)\b/g, '<span class="c-fn">$1</span>');
}

const arrow = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
const check = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>;
const plus = <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M6 12h12" /></svg>;

export default async function HomePage() {
  const settings = await fetchSettings();
  const c = (settings.landingContent || {}) as Any;
  const nav = c.nav || {};
  const hero = c.hero || {};
  const trust = c.trust || {};
  const principles = c.principles || {};
  const process = c.process || {};
  const stack = c.stack || {};
  const writing = c.writing || {};
  const faq = c.faq || {};
  const cta = c.cta || {};
  const footer = c.footer || {};

  let posts: Any[] = [];
  try {
    posts = await fetchAllPublishedPosts();
  } catch {
    posts = [];
  }
  const tickerCards = posts.slice(0, 20).map((p) => ({
    slug: p.slug,
    title: p.title,
    category: p.category?.name || "Essay",
    date: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
    read: p.readingTime ? `${p.readingTime} min read` : "",
  }));

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800;900&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet" />

      <LandingHeader settings={settings} />

      <main id="top">
        {/* HERO */}
        <section className="hero">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="kicker reveal"><span>[ {hero.kickerLabel || "01"} ]</span> {hero.kickerText || ""}</p>
              <h1 className="hero-title reveal">{hero.title ? hl(hero.title) : null}</h1>
              <p className="hero-sub reveal">{hero.subtitle || ""}</p>
              <div className="hero-actions reveal">
                <a href={hero.ctaPrimary?.href || "/contact"} className="btn btn-dark"><span>{hero.ctaPrimary?.label || "Get in touch"}</span>{arrow}</a>
                <a href={hero.ctaSecondary?.href || "/blog"} className="btn btn-ghost">{hero.ctaSecondary?.label || "Read the writing"}</a>
              </div>
              <ul className="hero-badges reveal">
                {(hero.badges || []).map((b: string, i: number) => <li key={i}>{check} {b}</li>)}
              </ul>
            </div>
            <div className="editor reveal">
              <div className="editor-bar">
                <span className="dots"><i></i><i></i><i></i></span>
                <span className="editor-file">{hero.editor?.file || "build.ts"}</span>
                <span className="editor-tag">{hero.editor?.tag || "deploy"}</span>
              </div>
              <pre className="editor-code" dangerouslySetInnerHTML={{ __html: `<code>${(hero.editor?.code || "").split("\n").map((ln: string, i: number) => `<span class="ln">${i + 1}</span>${highlightCode(ln)}`).join("\n")}<span class="cursor" aria-hidden="true"></span></code>` }} />
              <div className="editor-status">
                {(hero.editor?.status || []).map((s: string, i: number) => (
                  <span key={i} className={i === 0 ? "ok" : i === 2 ? "ml-auto" : ""}>{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="wrap trust reveal">
            <span className="trust-label">{trust.label || "By the numbers"}</span>
            <div className="trust-logos">{(trust.items || []).map((t: string, i: number) => <span key={i}>{t}</span>)}</div>
          </div>
        </section>

        {/* PRINCIPLES */}
        <section className="services" id="principles">
          <div className="wrap">
            <div className="section-head">
              <p className="section-label reveal"><span>// {principles.label || "02"}</span> {principles.labelText || ""}</p>
              <h2 className="section-title reveal">{principles.title ? hl(principles.title) : null}</h2>
            </div>
            <div className="cards">
              {(principles.items || []).map((card: Any, i: number) => (
                <article key={i} className="card reveal" style={{ "--i": i } as any}>
                  <span className="card-num">{card.num}</span>
                  <h3>{card.title}</h3>
                  <p>{card.body}</p>
                  <ul className="card-tags">{(card.tags || []).map((t: string, j: number) => <li key={j}>{t}</li>)}</ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* PROCESS */}
        <section className="process" id="process">
          <div className="wrap">
            <div className="section-head">
              <p className="section-label reveal"><span>// {process.label || "03"}</span> {process.labelText || ""}</p>
              <h2 className="section-title reveal">{process.title ? hl(process.title) : null}</h2>
            </div>
            <ol className="steps">
              {(process.items || []).map((step: Any, i: number) => (
                <li key={i} className="step reveal" style={{ "--i": i } as any}>
                  <span className="step-num">{step.num}</span>
                  <div><h3>{step.title}</h3><p>{step.body}</p><span className="step-time">{step.time}</span></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* STATS */}
        <section className="stats">
          <div className="wrap stats-grid">
            {(c.stats || []).map((s: Any, i: number) => (
              <div key={i} className="stat reveal">
                {s.prefix ? <span className="stat-suffix">{s.prefix}</span> : null}
                <span className="stat-num" data-count={s.count || 0}>0</span>
                {s.suffix ? <span className="stat-suffix">{s.suffix}</span> : null}
                {s.plus ? <span className="stat-plus">+</span> : null}
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* STACK */}
        <section className="stack" id="stack">
          <div className="wrap">
            <div className="section-head">
              <p className="section-label reveal"><span>// {stack.label || "04"}</span> {stack.labelText || ""}</p>
              <h2 className="section-title reveal">{stack.title ? hl(stack.title) : null}</h2>
            </div>
            <div className="stack-grid reveal">
              {(stack.items || []).map((t: string, i: number) => <span key={i}>{t}</span>)}
            </div>
          </div>
        </section>

        {/* WRITING / BLOG TICKER */}
        {tickerCards.length > 0 && (
          <section className="services" id="writing" style={{ paddingBottom: "100px" }}>
            <div className="wrap">
              <div className="section-head row">
                <div>
                  <p className="section-label reveal"><span>// {writing.label || "05"}</span> {writing.labelText || ""}</p>
                  <h2 className="section-title reveal">{writing.title ? hl(writing.title) : null}</h2>
                </div>
                <a href="/blog" className="blog-more reveal">{writing.moreLabel || "Read all posts"} {arrow}</a>
              </div>
              <div className="blog-ticker reveal">
                <div className="blog-ticker-track" id="blog-track">
                  {[...tickerCards, ...tickerCards].map((p, i) => (
                    <a key={i} href={`/blog/${p.slug}`} className="blog-ticker-card">
                      <span className="blog-cat">{p.category}</span>
                      <h3>{p.title}</h3>
                      <span className="blog-meta">{[p.date, p.read].filter(Boolean).join(" · ")}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* FAQ */}
        {faq.items && faq.items.length > 0 && (
          <section className="faq" id="faq">
            <div className="wrap faq-layout">
              <div className="faq-side">
                <p className="section-label reveal"><span>// {faq.label || "06"}</span> {faq.labelText || ""}</p>
                <h2 className="section-title reveal">{faq.title ? hl(faq.title) : null}</h2>
                <p className="faq-intro reveal">{faq.intro || ""}</p>
              </div>
              <div className="faq-list">
                {(faq.items || []).map((item: Any, i: number) => (
                  <details key={i} className="faq-item reveal">
                    <summary>{item.q}{plus}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="cta" id="contact">
          <div className="wrap cta-inner">
            <p className="section-label reveal"><span>// {cta.label || "07"}</span> {cta.labelText || ""}</p>
            <h2 className="cta-title reveal">{cta.title ? hl(cta.title) : null}</h2>
            <p className="cta-sub reveal">{cta.subtitle || ""}</p>
            <div className="hero-actions reveal" style={{ justifyContent: "center", marginTop: "34px" }}>
              <a href={cta.primary?.href || "/contact"} className="btn btn-dark btn-lg"><span>{cta.primary?.label || "Say hi"}</span>{arrow}</a>
              <a href={cta.secondary?.href || "/blog"} className="btn btn-ghost btn-lg">{cta.secondary?.label || "Read the writing"}</a>
            </div>
            <div className="cta-direct reveal">
              {(cta.links || []).map((l: Any, i: number) => (
                <span key={i}><a href={l.href}>{l.label}</a>{i < (cta.links || []).length - 1 ? <span> · </span> : null}</span>
              ))}
            </div>
          </div>
        </section>
      </main>

      <LandingFooter settings={settings} />
      <ChatWidget />
    </>
  );
}

import { Router } from "express";
import prisma from "../utils/db";
import { logError } from "../utils/logging";

const router = Router();

// Simple in-memory rate limiter (IP → { count, resetAt })
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 3600_000 });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

async function getAiConfig() {
  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ["internal_ai_api_key", "internal_ai_base_url", "internal_ai_model", "chatbot_enabled", "chatbot_model", "chatbot_system_prompt", "chatbot_rate_limit", "chatbot_suggestions"] } },
  });
  const map: Record<string, string | null> = {};
  for (const r of rows) map[r.key] = r.value;

  const apiKey = map.internal_ai_api_key || process.env.AI_API_KEY?.trim() || "";
  const baseUrl = (map.internal_ai_base_url || process.env.AI_BASE_URL?.trim() || "").replace(/\/$/, "");
  const defaultModel = map.internal_ai_model || process.env.AI_MODEL?.trim() || "";

  return {
    apiKey,
    baseUrl,
    model: map.chatbot_model || defaultModel,
    enabled: map.chatbot_enabled === "true",
    systemPrompt: map.chatbot_system_prompt || "",
    rateLimit: parseInt(map.chatbot_rate_limit || "25", 10),
    suggestions: (() => { try { return JSON.parse(map.chatbot_suggestions || "[]"); } catch { return []; } })(),
  };
}

// ---- Function definitions (NO hardcoded data — all from DB/settings) ----
const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "get_site_info",
      description: "Get the website's name, tagline, description, author name, bio, and social links.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_recent_posts",
      description: "Get the most recent published blog posts.",
      parameters: { type: "object", properties: { count: { type: "number", description: "Number of posts (default 3, max 10)" } } },
    },
  },
  {
    type: "function",
    function: {
      name: "search_blog",
      description: "Search blog posts by keyword.",
      parameters: { type: "object", properties: { query: { type: "string", description: "Search query" } }, required: ["query"] },
    },
  },
  {
    type: "function",
    function: {
      name: "get_post",
      description: "Get full details of a specific blog post by its slug.",
      parameters: { type: "object", properties: { slug: { type: "string", description: "The post's URL slug" } }, required: ["slug"] },
    },
  },
  {
    type: "function",
    function: {
      name: "list_categories",
      description: "List all blog categories.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_open_source",
      description: "List open-source projects in the directory.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "list_portfolio",
      description: "List portfolio/work showcase items.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_faq",
      description: "Get frequently asked questions and answers from the site.",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function executeFunction(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "get_site_info": {
      const rows = await prisma.siteSetting.findMany({ where: { key: { in: ["site_title", "tagline", "description", "author_name", "bio_about_1", "bio_about_2", "bio_about_3", "social_links"] } } });
      const s: Record<string, string> = {};
      for (const r of rows) s[r.key] = r.value;
      return JSON.stringify({
        siteName: s.site_title || "",
        tagline: s.tagline || "",
        description: s.description || "",
        author: s.author_name || "",
        bio: [s.bio_about_1, s.bio_about_2, s.bio_about_3].filter(Boolean),
        socialLinks: (() => { try { return JSON.parse(s.social_links || "{}"); } catch { return {}; } })(),
      });
    }
    case "get_recent_posts": {
      const count = Math.min(Math.max(args.count as number || 3, 1), 10);
      const posts = await prisma.post.findMany({ where: { status: "PUBLISHED", publishedAt: { not: null } }, orderBy: { publishedAt: "desc" }, take: count, select: { title: true, slug: true, excerpt: true, publishedAt: true, readingTime: true, category: { select: { name: true } } } });
      return JSON.stringify(posts.map((p) => ({ title: p.title, slug: p.slug, excerpt: p.excerpt, date: p.publishedAt, category: p.category?.name, readingTime: p.readingTime })));
    }
    case "search_blog": {
      const q = String(args.query || "");
      const posts = await prisma.post.findMany({ where: { status: "PUBLISHED", OR: [{ title: { contains: q, mode: "insensitive" } }, { excerpt: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }] }, orderBy: { publishedAt: "desc" }, take: 5, select: { title: true, slug: true, excerpt: true, publishedAt: true, category: { select: { name: true } } } });
      return JSON.stringify(posts.map((p) => ({ title: p.title, slug: p.slug, excerpt: p.excerpt?.slice(0, 200), date: p.publishedAt, category: p.category?.name })));
    }
    case "get_post": {
      const post = await prisma.post.findUnique({ where: { slug: String(args.slug) }, select: { title: true, slug: true, excerpt: true, body: true, publishedAt: true, readingTime: true, category: { select: { name: true } }, tags: { select: { name: true } } } });
      if (!post) return JSON.stringify({ error: "Post not found" });
      return JSON.stringify({ title: post.title, slug: post.slug, excerpt: post.excerpt, content: post.body.replace(/<[^>]*>/g, "").slice(0, 3000), date: post.publishedAt, readingTime: post.readingTime, category: post.category?.name, tags: post.tags.map((t) => t.name) });
    }
    case "list_categories": {
      const cats = await prisma.category.findMany({ select: { name: true, slug: true, _count: { select: { posts: { where: { status: "PUBLISHED" } } } } } });
      return JSON.stringify(cats.map((c) => ({ name: c.name, slug: c.slug, postCount: c._count.posts })));
    }
    case "list_open_source": {
      const projects = await prisma.openSourceProject.findMany({ orderBy: [{ featured: "desc" }, { stars: "desc" }], select: { title: true, slug: true, tagline: true, author: true, language: true, category: true, stars: true, license: true, topics: true, githubUrl: true } });
      return JSON.stringify(projects);
    }
    case "list_portfolio": {
      const row = await prisma.siteSetting.findUnique({ where: { key: "portfolio_items" } });
      if (!row) return JSON.stringify([]);
      try { const d = JSON.parse(row.value); return JSON.stringify((d.items || []).map((i: any) => ({ title: i.title, tagline: i.tagline, category: i.category, href: i.href }))); } catch { return JSON.stringify([]); }
    }
    case "get_faq": {
      const row = await prisma.siteSetting.findUnique({ where: { key: "landing_content" } });
      if (!row) return JSON.stringify([]);
      try { const d = JSON.parse(row.value); return JSON.stringify(d.faq?.items || []); } catch { return JSON.stringify([]); }
    }
    default:
      return JSON.stringify({ error: `Unknown function: ${name}` });
  }
}

// POST /api/chat — public chat endpoint with function calling
router.post("/", async (req, res) => {
  try {
    const config = await getAiConfig();
    if (!config.enabled) { res.status(403).json({ error: "Chat is disabled" }); return; }
    if (!config.apiKey || !config.baseUrl) { res.status(503).json({ error: "AI not configured" }); return; }

    const ip = (req.headers["x-forwarded-for"] as string || req.ip || "unknown").split(",")[0].trim();
    if (!checkRateLimit(ip, config.rateLimit)) { res.status(429).json({ error: "Rate limit exceeded. Try again later." }); return; }

    const userMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    if (userMessages.length === 0) { res.status(400).json({ error: "No messages provided" }); return; }

    const defaultSystem = "You are a helpful assistant for a website. Use the available functions to look up information about the site's content — blog posts, categories, open-source projects, portfolio, FAQ, and site details. Never guess or fabricate information; always use functions to get real data. Be concise, friendly, and helpful. If a function returns no results, say so honestly.";
    const systemPrompt = config.systemPrompt?.trim() || defaultSystem;

    const messages: Array<Record<string, unknown>> = [
      { role: "system", content: systemPrompt },
      ...userMessages.slice(-6).map((m: any) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "") })),
    ];

    // Function calling loop (max 5 rounds)
    let assistantContent = "";
    for (let round = 0; round < 5; round++) {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.apiKey}` },
        body: JSON.stringify({ model: config.model, messages, tools: toolDefinitions, tool_choice: "auto", max_tokens: 1500, temperature: 0.6 }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => "");
        logError("Chat API error", { status: response.status, body: errText.slice(0, 200) });
        res.status(502).json({ error: "AI request failed" });
        return;
      }

      const data = await response.json() as Record<string, unknown>;
      const choices = data.choices as Array<Record<string, unknown>> | undefined;
      const choice = choices?.[0];
      if (!choice) { res.status(502).json({ error: "No response from AI" }); return; }

      const msg = choice.message as Record<string, unknown>;
      const toolCalls = (msg.tool_calls || []) as Array<Record<string, unknown>>;
      if (toolCalls.length > 0) {
        messages.push({ role: "assistant", content: String(msg.content || ""), tool_calls: toolCalls });
        for (const tc of toolCalls) {
          const fn = tc.function as Record<string, unknown> | undefined;
          const fnName = String(fn?.name || "");
          const fnArgs = (() => { try { return JSON.parse(String(fn?.arguments || "{}")); } catch { return {}; } })();
          const result = await executeFunction(fnName, fnArgs);
          messages.push({ role: "tool", tool_call_id: String(tc.id), content: result });
        }
        continue; // Next round — LLM will process tool results
      }

      // Final answer (no more tool calls)
      assistantContent = String(msg.content || "");
      break;
    }

    if (!assistantContent) assistantContent = "I'm not sure how to help with that. Try asking about blog posts, projects, or the site.";

    res.json({ content: assistantContent });
  } catch (error) {
    logError("Chat endpoint error", { error: error instanceof Error ? error.message : String(error) });
    res.status(500).json({ error: "Something went wrong" });
  }
});

// GET /api/chat/config — public, returns widget config (no secrets)
router.get("/config", async (_req, res) => {
  try {
    const config = await getAiConfig();
    res.json({
      enabled: config.enabled,
      suggestions: config.suggestions,
      rateLimit: config.rateLimit,
    });
  } catch {
    res.json({ enabled: false, suggestions: [], rateLimit: 25 });
  }
});

export default router;

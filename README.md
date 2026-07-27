<div align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind">
  <img src="https://img.shields.io/badge/MCP-6F42B1?style=flat-square&logoColor=white" alt="MCP">
  <img src="https://img.shields.io/badge/MIT-License-green?style=flat-square" alt="MIT">
  <br><br>
  <img src="docs/screenshots/home.png" width="100%">
</div>

# SimpleAIFolio

A full-stack portfolio, blog, and open-source directory platform with a built-in AI blog studio, website chatbot, and MCP server. Manage everything from any AI tool — or the admin panel.

**Live demo:** [bit2byte.app](https://bit2byte.app/) | **Follow:** [X/Twitter](https://x.com/bit2byteapp) · [LinkedIn](https://www.linkedin.com/in/bit2byte/) · [Substack](https://substack.com/@bit2byteapp) · [GitHub](https://github.com/asharma02192)

---

## Demo

https://github.com/user-attachments/assets/aca6f081-9c8f-4cef-be3d-dfcd41df68f0

| Blog | Dashboard | Portfolio | Contact |
|------|-----------|-----------|---------|
| <img src="docs/screenshots/blog.png" width="250"> | <img src="docs/screenshots/dashboard.png" width="250"> | <img src="docs/screenshots/portfolio.png" width="250"> | <img src="docs/screenshots/contact.png" width="250"> |

---

## Quick Start

```bash
git clone https://github.com/asharma02192/SimpleAIFolio.git
cd SimpleAIFolio
cp .env.example .env
# Edit .env — set DB_PASSWORD, JWT_SECRET, REVALIDATE_SECRET, SEED_ADMIN_*
docker compose -f docker-compose.prod.yml up -d --build
```

That's it. Frontend on `:3200`, backend on `:3201`, admin at `/admin`.

---

## Features

**Website**
- CMS-driven landing page (hero, principles, process, stats, FAQ — all editable)
- Blog with syntax highlighting, TOC, reading progress, TL;DR box
- Open-source project directory (`/open-source`) with search & filters
- Portfolio gallery with template previews (`/portfolio`)
- AI chatbot (function calling, 13 tools, zero hardcoded data)
- GEO optimization (FAQPage schema, BreadcrumbList, E-E-A-T, og:image)
- Mobile responsive with hamburger menu

**AI Blog Studio**
- Research-backed drafts (Exa integration — mandatory before generation)
- Async generation (3–7 min) with auto-retry on network errors
- Async rewrites (15 actions — improve intro, add examples, more human, etc.)
- Quality scoring (1–10 across accuracy, depth, originality, voice, proof, SEO)
- Writing profile injection (author credibility, stories, opinions, voice)
- Auto-generated TL;DR for AI search optimization

**Admin CMS** (`/admin`)
- Dashboard with analytics, AI usage costs, and alerts
- Post editor with scheduling, autosave, TL;DR field
- Open-source directory manager
- Landing page editor (all homepage sections)
- Comment moderation, media library, newsletter, snippets
- Chatbot settings (model, suggestions, rate limit, system prompt)
- Multi-user with role-based access (admin / editor / author)

**MCP Server** (68 tools)
- Full CRUD for posts, open-source projects, categories, tags, experience
- AI writer integration (async drafts, rewrites, research, quality scores)
- Site settings including landing content & chatbot config
- Connect via Claude Code, Cursor, Windsurf, or any MCP client

---

## Connect Your AI Tool

Get your MCP URL from **Admin > Settings > Site Wide > MCP**.

**Claude Desktop** — add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "simpleaifolio": {
      "url": "https://yoursite.com/mcp/mcp"
    }
  }
}
```

Then just ask: *"Write a blog post about Docker best practices"* or *"Add a new open-source project"* — the AI handles everything.

---

## Documentation

| Topic | Link |
|-------|------|
| Production Deployment | [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) |
| Local Development | [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) |
| Troubleshooting | [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) |
| Agent Prompt (68 tools) | [docs/AGENT_PROMPT.md](docs/AGENT_PROMPT.md) |

---

## Project Structure

```
SimpleAIFolio/
├── frontend/          # Next.js 16 (App Router, SSR/ISR)
├── backend/           # Express + Prisma + PostgreSQL
├── mcp-server/        # MCP server (68 tools, 6 resources)
├── deploy/            # Nginx gateway config
├── docs/              # Screenshots, deployment, agent guide
└── docker-compose.prod.yml
```

---

## License

[MIT](./LICENSE) — Free to use, modify, and distribute.

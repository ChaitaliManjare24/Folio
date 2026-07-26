import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { apiRequest } from "../client.js";
import { ok, fail } from "./helpers.js";
import type { ToolResult } from "./helpers.js";

interface OpenSourceProject {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  githubUrl: string;
  homepageUrl: string | null;
  author: string;
  language: string | null;
  category: string | null;
  topics: string[];
  stars: number;
  forks: number;
  license: string | null;
  thumbnail: string | null;
  featured: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export const openSourceTools: Tool[] = [
  {
    name: "list_opensource",
    description: "List curated open-source projects (anyone's repos), sorted by featured then stars. Supports optional category/language/topic/search filters.",
    inputSchema: {
      type: "object",
      properties: {
        category: { type: "string", description: "Filter by category" },
        language: { type: "string", description: "Filter by primary language" },
        topic: { type: "string", description: "Filter by a topic tag" },
        search: { type: "string", description: "Search title/tagline/description/author" },
        featured: { type: "boolean", description: "Only featured projects" },
      },
    },
  },
  {
    name: "get_opensource",
    description: "Get a single open-source project by slug or ID.",
    inputSchema: {
      type: "object",
      properties: {
        slug: { type: "string", description: "Project slug" },
        id: { type: "string", description: "Project ID (UUID)" },
      },
    },
  },
  {
    name: "create_opensource",
    description: "Add an open-source project to the curated directory. Title, tagline, description, githubUrl, and author are required. Showcase anyone's repo (not just your own).",
    inputSchema: {
      type: "object",
      required: ["title", "githubUrl", "author"],
      properties: {
        title: { type: "string", description: "Project / repo name" },
        slug: { type: "string", description: "URL slug (blank = auto from title)" },
        tagline: { type: "string", description: "One-line summary shown on cards" },
        description: { type: "string", description: "Longer description for the detail page" },
        githubUrl: { type: "string", description: "GitHub repo URL (required)" },
        homepageUrl: { type: "string", description: "Live demo / homepage URL" },
        author: { type: "string", description: "Repo owner / org (e.g. 'vercel', 'asharma02192')" },
        language: { type: "string", description: "Primary language (e.g. 'TypeScript')" },
        category: { type: "string", description: "Category (e.g. 'AI', 'Dev Tools', 'Web')" },
        topics: { type: "array", items: { type: "string" }, description: "Topic tags" },
        stars: { type: "number", description: "Star count (manual for now)", default: 0 },
        forks: { type: "number", description: "Fork count (manual for now)", default: 0 },
        license: { type: "string", description: "License (e.g. 'MIT')" },
        thumbnail: { type: "string", description: "Thumbnail image path/URL" },
        featured: { type: "boolean", description: "Feature this project", default: false },
        order: { type: "number", description: "Sort order (lower = first)", default: 0 },
      },
    },
  },
  {
    name: "update_opensource",
    description: "Update any field of an open-source project (by ID). Only provided fields change. Useful for refreshing stars/forks manually.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "Project ID (UUID)" },
        title: { type: "string" },
        slug: { type: "string" },
        tagline: { type: "string" },
        description: { type: "string" },
        githubUrl: { type: "string" },
        homepageUrl: { type: "string" },
        author: { type: "string" },
        language: { type: "string" },
        category: { type: "string" },
        topics: { type: "array", items: { type: "string" } },
        stars: { type: "number" },
        forks: { type: "number" },
        license: { type: "string" },
        thumbnail: { type: "string" },
        featured: { type: "boolean" },
        order: { type: "number" },
      },
    },
  },
  {
    name: "delete_opensource",
    description: "Delete an open-source project from the directory by ID.",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "Project ID (UUID)" },
        confirm: { type: "boolean", description: "Must be true to confirm deletion", default: false },
      },
    },
  },
];

export async function handleOpenSourceTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  switch (name) {
    case "list_opensource": {
      const params = new URLSearchParams();
      for (const k of ["category", "language", "topic", "search"]) {
        if (args[k]) params.set(k, String(args[k]));
      }
      if (args.featured === true) params.set("featured", "true");
      const qs = params.toString();
      const { status, data } = await apiRequest<OpenSourceProject[]>("GET", `/api/opensource${qs ? `?${qs}` : ""}`, undefined, false);
      if (status !== 200) return fail(data);
      const projects = data.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        tagline: p.tagline,
        author: p.author,
        language: p.language,
        category: p.category,
        topics: p.topics,
        stars: p.stars,
        forks: p.forks,
        license: p.license,
        featured: p.featured,
      }));
      return ok({ projects, total: projects.length });
    }

    case "get_opensource": {
      let status: number;
      let data: unknown;
      if (args.slug) {
        ({ status, data } = await apiRequest<OpenSourceProject>("GET", `/api/opensource/${args.slug}`, undefined, false));
      } else if (args.id) {
        ({ status, data } = await apiRequest<OpenSourceProject>("GET", `/api/opensource/admin/${args.id}`));
      } else {
        return fail("Either 'slug' or 'id' is required");
      }
      if (status !== 200) return fail(data);
      return ok(data);
    }

    case "create_opensource": {
      const body: Record<string, unknown> = {};
      for (const k of ["title", "slug", "tagline", "description", "githubUrl", "homepageUrl", "author", "language", "category", "topics", "stars", "forks", "license", "thumbnail", "featured", "order"]) {
        if (args[k] !== undefined) body[k] = args[k];
      }
      const { status, data } = await apiRequest<OpenSourceProject>("POST", "/api/opensource", body);
      if (status !== 201) return fail(data);
      return ok({ success: true, project: { id: data.id, slug: data.slug, title: data.title } });
    }

    case "update_opensource": {
      const { id, confirm: _unused, ...updates } = args;
      if (!id) return fail("'id' is required");
      const body: Record<string, unknown> = {};
      for (const k of ["title", "slug", "tagline", "description", "githubUrl", "homepageUrl", "author", "language", "category", "topics", "stars", "forks", "license", "thumbnail", "featured", "order"]) {
        if (updates[k] !== undefined) body[k] = updates[k];
      }
      const { status, data } = await apiRequest<OpenSourceProject>("PUT", `/api/opensource/${id}`, body);
      if (status !== 200) return fail(data);
      return ok({ success: true, project: { id: data.id, slug: data.slug, title: data.title } });
    }

    case "delete_opensource": {
      if (!args.confirm) return fail("Set confirm=true to confirm deletion");
      const { status, data } = await apiRequest("DELETE", `/api/opensource/${args.id}`);
      if (status !== 204) return fail(data);
      return ok({ success: true, deleted: true, id: args.id });
    }

    default:
      return fail(`Unknown tool: ${name}`);
  }
}

import { Router } from "express";
import prisma from "../utils/db";
import { isPrismaErrorCode, param, trimmedString } from "../utils/express";
import { authMiddleware, AuthRequest, requireRoleWithClient } from "../middleware/auth";
import { triggerFrontendRevalidation } from "../services/revalidate";

type OpenSourcePrisma = {
  openSourceProject: any;
  user: any;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

async function ensureUniqueSlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || "open-source-project";
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.openSourceProject.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
}

export function createOpenSourceRouter({ prismaClient = prisma }: { prismaClient?: OpenSourcePrisma } = {}) {
  const router = Router();

  // GET /api/opensource - public list (optional filters)
  router.get("/", async (req, res) => {
    try {
      const category = trimmedString(req.query.category as string);
      const language = trimmedString(req.query.language as string);
      const topic = trimmedString(req.query.topic as string);
      const search = trimmedString(req.query.search as string);
      const featuredOnly = req.query.featured === "true";

      const where: Record<string, unknown> = {};
      if (category) where.category = category;
      if (language) where.language = language;
      if (topic) where.topics = { has: topic };
      if (featuredOnly) where.featured = true;
      if (search) {
        where.OR = [
          { title: { contains: search, mode: "insensitive" } },
          { tagline: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { author: { contains: search, mode: "insensitive" } },
        ];
      }

      const projects = await prismaClient.openSourceProject.findMany({
        where,
        orderBy: [{ featured: "desc" }, { stars: "desc" }, { order: "asc" }],
      });
      res.json(projects);
    } catch (error) {
      console.error("Get open-source projects error:", error);
      res.status(500).json({ error: "Failed to fetch open-source projects" });
    }
  });

  // GET /api/opensource/admin/:id - admin single by id (must be before /:slug)
  router.get("/admin/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const project = await prismaClient.openSourceProject.findUnique({
        where: { id: param(req, "id") },
      });
      if (!project) {
        res.status(404).json({ error: "Open-source project not found" });
        return;
      }
      res.json(project);
    } catch (error) {
      console.error("Get open-source project (admin) error:", error);
      res.status(500).json({ error: "Failed to fetch open-source project" });
    }
  });

  // GET /api/opensource/:slug - public single
  router.get("/:slug", async (req, res) => {
    try {
      const project = await prismaClient.openSourceProject.findUnique({
        where: { slug: param(req, "slug") },
      });
      if (!project) {
        res.status(404).json({ error: "Open-source project not found" });
        return;
      }
      res.json(project);
    } catch (error) {
      console.error("Get open-source project error:", error);
      res.status(500).json({ error: "Failed to fetch open-source project" });
    }
  });

  // POST /api/opensource - admin create
  router.post("/", authMiddleware, requireRoleWithClient(prismaClient, "admin", "editor"), async (req: AuthRequest, res) => {
    try {
      const {
        tagline,
        description,
        githubUrl,
        homepageUrl,
        author,
        language,
        category,
        topics,
        stars,
        forks,
        license,
        thumbnail,
        featured,
        order,
      } = req.body;
      const title = trimmedString(req.body.title);
      const requestedSlug = trimmedString(req.body.slug);

      if (!title || !trimmedString(description) || !trimmedString(githubUrl)) {
        res.status(400).json({ error: "Title, description, and githubUrl are required" });
        return;
      }

      const slug = await ensureUniqueSlug(requestedSlug || slugify(title));

      const project = await prismaClient.openSourceProject.create({
        data: {
          title,
          slug,
          tagline: trimmedString(tagline) || title,
          description: trimmedString(description) || "",
          githubUrl: trimmedString(githubUrl) || "",
          homepageUrl: trimmedString(homepageUrl) || null,
          author: trimmedString(author) || "Unknown",
          language: trimmedString(language) || null,
          category: trimmedString(category) || null,
          topics: Array.isArray(topics) ? topics : [],
          stars: typeof stars === "number" ? stars : 0,
          forks: typeof forks === "number" ? forks : 0,
          license: trimmedString(license) || null,
          thumbnail: trimmedString(thumbnail) || null,
          featured: featured || false,
          order: typeof order === "number" ? order : 0,
        },
      });
      await triggerFrontendRevalidation({ type: "project" });
      res.status(201).json(project);
    } catch (error) {
      console.error("Create open-source project error:", error);
      if (isPrismaErrorCode(error, "P2002")) {
        res.status(409).json({ error: "A project with this slug already exists" });
        return;
      }
      res.status(500).json({ error: "Failed to create open-source project" });
    }
  });

  // PUT /api/opensource/:id - admin update
  router.put("/:id", authMiddleware, requireRoleWithClient(prismaClient, "admin", "editor"), async (req: AuthRequest, res) => {
    try {
      const existing = await prismaClient.openSourceProject.findUnique({ where: { id: param(req, "id") } });
      if (!existing) {
        res.status(404).json({ error: "Open-source project not found" });
        return;
      }

      const data: Record<string, unknown> = {};
      const fields = [
        "tagline",
        "description",
        "githubUrl",
        "homepageUrl",
        "author",
        "language",
        "category",
        "license",
        "thumbnail",
      ];
      for (const f of fields) {
        if (req.body[f] !== undefined) data[f] = req.body[f] === "" ? null : req.body[f];
      }
      if (req.body.title !== undefined) data.title = trimmedString(req.body.title);
      if (req.body.slug !== undefined) {
        const requestedSlug = slugify(trimmedString(req.body.slug));
        data.slug = await ensureUniqueSlug(requestedSlug, existing.id);
      }
      if (req.body.topics !== undefined) data.topics = Array.isArray(req.body.topics) ? req.body.topics : [];
      if (req.body.stars !== undefined) data.stars = typeof req.body.stars === "number" ? req.body.stars : 0;
      if (req.body.forks !== undefined) data.forks = typeof req.body.forks === "number" ? req.body.forks : 0;
      if (req.body.featured !== undefined) data.featured = req.body.featured;
      if (req.body.order !== undefined) data.order = req.body.order;

      const project = await prismaClient.openSourceProject.update({
        where: { id: param(req, "id") },
        data,
      });
      await triggerFrontendRevalidation({ type: "project" });
      res.json(project);
    } catch (error) {
      console.error("Update open-source project error:", error);
      if (isPrismaErrorCode(error, "P2002")) {
        res.status(409).json({ error: "A project with this slug already exists" });
        return;
      }
      if (isPrismaErrorCode(error, "P2025")) {
        res.status(404).json({ error: "Open-source project not found" });
        return;
      }
      res.status(500).json({ error: "Failed to update open-source project" });
    }
  });

  // DELETE /api/opensource/:id - admin
  router.delete("/:id", authMiddleware, requireRoleWithClient(prismaClient, "admin", "editor"), async (req: AuthRequest, res) => {
    try {
      await prismaClient.openSourceProject.delete({ where: { id: param(req, "id") } });
      await triggerFrontendRevalidation({ type: "project" });
      res.status(204).send();
    } catch (error) {
      console.error("Delete open-source project error:", error);
      if (isPrismaErrorCode(error, "P2025")) {
        res.status(404).json({ error: "Open-source project not found" });
        return;
      }
      res.status(500).json({ error: "Failed to delete open-source project" });
    }
  });

  return router;
}

export default createOpenSourceRouter();

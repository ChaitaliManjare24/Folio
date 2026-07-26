import { Router } from "express";
import prisma from "../utils/db";
import { authMiddleware, AuthRequest, requireRoleWithClient } from "../middleware/auth";
import { triggerFrontendRevalidation } from "../services/revalidate";

type SchedulerPrisma = Pick<typeof prisma, "post" | "user">;
type RevalidateFn = typeof triggerFrontendRevalidation;

export function createSchedulerRouter({
  prismaClient = prisma,
  revalidate = triggerFrontendRevalidation,
}: {
  prismaClient?: SchedulerPrisma;
  revalidate?: RevalidateFn;
} = {}) {
  const router = Router();

  router.post("/publish-due", authMiddleware, requireRoleWithClient(prismaClient as any, "admin"), async (_req: AuthRequest, res) => {
    try {
      const cutoff = new Date();
      const duePosts = await prismaClient.post.findMany({
        where: {
          status: "SCHEDULED",
          scheduledAt: { not: null, lte: cutoff },
        },
        select: { slug: true },
      });

      const publishedAt = new Date();
      const result = await prismaClient.post.updateMany({
        where: {
          status: "SCHEDULED",
          scheduledAt: { not: null, lte: cutoff },
        },
        data: {
          status: "PUBLISHED",
          publishedAt,
        },
      });

      await Promise.all(
        duePosts.map((post) =>
          revalidate({
            type: "post",
            slug: post.slug,
          })
        )
      );

      res.json({ published: result.count });
    } catch (err) {
      console.error("Publish scheduled posts error:", err);
      res.status(500).json({ error: "Failed to publish scheduled posts" });
    }
  });

  return router;
}

export default createSchedulerRouter();

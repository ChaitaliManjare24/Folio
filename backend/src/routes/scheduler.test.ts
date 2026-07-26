import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import jwt from "jsonwebtoken";
import { createSchedulerRouter } from "./scheduler";
import { createTestApp } from "../test/test-app";

const originalJwtSecret = process.env.JWT_SECRET;

beforeEach(() => {
  process.env.JWT_SECRET = "scheduler-test-secret";
});

afterEach(() => {
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

test("POST /api/admin/publish-due revalidates published scheduled posts", async () => {
  const revalidatePayloads: Array<{ type: string; slug?: string | null }> = [];
  const prismaClient = {
    post: {
      findMany: async () => [{ slug: "scheduled-one" }, { slug: "scheduled-two" }],
      updateMany: async () => ({ count: 2 }),
    },
    user: {
      findUnique: async () => ({ role: "admin", name: "Admin" }),
    },
  };
  const app = createTestApp(
    "/api/admin",
    createSchedulerRouter({
      prismaClient: prismaClient as any,
      revalidate: async (payload) => {
        revalidatePayloads.push(payload);
        return true;
      },
    })
  );
  const token = jwt.sign({ userId: "user-1" }, process.env.JWT_SECRET!, { expiresIn: "1h" });

  const response = await request(app)
    .post("/api/admin/publish-due")
    .set("Authorization", `Bearer ${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.published, 2);
  assert.deepEqual(revalidatePayloads, [
    { type: "post", slug: "scheduled-one" },
    { type: "post", slug: "scheduled-two" },
  ]);
});

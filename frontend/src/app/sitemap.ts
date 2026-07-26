import type { MetadataRoute } from "next";
import { fetchAllPublishedPosts, getSiteUrl, logPublicFetchError, serverFetch } from "@/lib/config";
import type { OpenSourceProject } from "@/types";

export const revalidate = 60;
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getSiteUrl();

  const pages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/portfolio`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/open-source`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    const posts = await fetchAllPublishedPosts();
    const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt || post.updatedAt || post.createdAt || Date.now()),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    let openSourceEntries: MetadataRoute.Sitemap = [];
    try {
      const ossProjects = await serverFetch<OpenSourceProject[]>("/api/opensource");
      openSourceEntries = ossProjects.map((project) => ({
        url: `${baseUrl}/open-source/${project.slug}`,
        lastModified: new Date(project.updatedAt || project.createdAt || Date.now()),
        changeFrequency: "monthly",
        priority: 0.6,
      }));
    } catch {
      // ignore open-source fetch failures in sitemap
    }

    return [...pages, ...postEntries, ...openSourceEntries];
  } catch (error) {
    logPublicFetchError("failed to build sitemap", error);
    return pages;
  }
}

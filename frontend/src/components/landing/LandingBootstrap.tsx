"use client";

import { useEffect } from "react";

/**
 * Runs the blog-ticker animation-duration calculation after mount.
 * NOTE: the main landing interactions (scroll progress, reveal, mobile menu,
 * clock) are loaded via the <Script src="/landing-assets/script.js"> tag in the
 * page. Do NOT load script.js here too — double-loading double-binds event
 * listeners (e.g. the hamburger menu would toggle open+closed on each click).
 */
export default function LandingBootstrap() {
  useEffect(() => {
    const track = document.getElementById("blog-track") as HTMLElement | null;
    if (track) {
      const setDuration = () => {
        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0) {
          const duration = Math.max(30, halfWidth / 80);
          track.style.animationDuration = `${duration}s`;
        }
      };
      requestAnimationFrame(() => requestAnimationFrame(setDuration));
    }
  }, []);

  return null;
}

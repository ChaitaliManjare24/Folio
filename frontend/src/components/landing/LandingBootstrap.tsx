"use client";

import { useEffect } from "react";

/**
 * Loads the landing page's interaction script (scroll progress, reveal-on-scroll,
 * mobile menu) and sets the blog-ticker animation duration after mount.
 * The DOM structure is rendered server-side with the same IDs/classes the script expects.
 */
export default function LandingBootstrap() {
  useEffect(() => {
    // Load the landing script.js once
    const existing = document.getElementById("landing-script");
    if (!existing) {
      const s = document.createElement("script");
      s.id = "landing-script";
      s.src = "/landing-assets/script.js";
      s.async = true;
      document.body.appendChild(s);
    }

    // Blog ticker: measure width and set a seamless-loop animation duration
    const track = document.getElementById("blog-track") as HTMLElement | null;
    if (track) {
      const setDuration = () => {
        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0) {
          const duration = Math.max(30, halfWidth / 80);
          track.style.animationDuration = `${duration}s`;
        }
      };
      // Cards are duplicated server-side for the loop; set duration after paint
      requestAnimationFrame(() => requestAnimationFrame(setDuration));
    }

    // Footer clock
    const clock = document.getElementById("clock");
    if (clock) {
      const tick = () => {
        const now = new Date();
        clock.textContent = now.toLocaleTimeString("en-US", { hour12: false, timeZone: "Asia/Kolkata" });
      };
      tick();
      const id = window.setInterval(tick, 1000);
      return () => {
        window.clearInterval(id);
        if (existing) existing.remove();
      };
    }
  }, []);

  return null;
}

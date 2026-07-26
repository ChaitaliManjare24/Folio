"use client";

import { useEffect } from "react";

/**
 * All landing page interactions as a React effect — replaces the external
 * script.js. Runs on every page that uses LandingHeader. Handles:
 * header scroll state, scroll progress bar, mobile hamburger menu (event
 * delegation), scroll-reveal animations, count-up stats, FAQ accordion,
 * footer clock, blog-ticker animation duration.
 */
export default function LandingInteractions() {
  useEffect(() => {
    const $ = (s: string) => document.querySelector(s);
    const $$ = (s: string) => [...document.querySelectorAll(s)];

    /* ---- header shrink + scroll progress ---- */
    const onScroll = () => {
      const y = window.scrollY;
      const header = $("#header") as HTMLElement | null;
      if (header) header.classList.toggle("scrolled", y > 24);
      const progress = $(".scroll-progress i") as HTMLElement | null;
      if (progress) {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    /* ---- mobile menu (event delegation) ---- */
    const onDocClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const toggle = target.closest("#menuToggle") as HTMLElement | null;
      if (toggle) {
        e.preventDefault();
        const mobile = $("#mobileNav") as HTMLElement | null;
        if (!mobile) return;
        const open = toggle.classList.toggle("open");
        mobile.classList.toggle("open", open);
        toggle.setAttribute("aria-expanded", String(open));
        mobile.setAttribute("aria-hidden", String(!open));
        return;
      }
      const navLink = target.closest("#mobileNav a");
      if (navLink) {
        const t = $("#menuToggle") as HTMLElement | null;
        const m = $("#mobileNav") as HTMLElement | null;
        if (t) { t.classList.remove("open"); t.setAttribute("aria-expanded", "false"); }
        if (m) { m.classList.remove("open"); m.setAttribute("aria-hidden", "true"); }
      }
    };
    document.addEventListener("click", onDocClick);

    /* ---- scroll reveal ---- */
    const reveals = $$(".reveal");
    let revealObserver: IntersectionObserver | undefined;
    if (reveals.length && "IntersectionObserver" in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) en.target.classList.add("in");
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      reveals.forEach((el) => obs.observe(el));
      revealObserver = obs;
    }

    /* ---- count-up stats ---- */
    const statNums = $$(".stat-num");
    let statObserver: IntersectionObserver | undefined;
    if (statNums.length && "IntersectionObserver" in window) {
      const animated = new WeakSet();
      const obs = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting || animated.has(en.target)) return;
          animated.add(en.target);
          const el = en.target as HTMLElement;
          const target = +(el.dataset.count || "0");
          const dur = 1700;
          const startT = performance.now();
          const step = (now: number) => {
            const t = Math.min((now - startT) / dur, 1);
            el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))).toString();
            if (t < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      }, { threshold: 0.5 });
      statNums.forEach((c) => obs.observe(c));
      statObserver = obs;
    }

    /* ---- FAQ accordion ---- */
    $$(".faq-item").forEach((item) => {
      item.addEventListener("toggle", () => {
        if ((item as HTMLDetailsElement).open) {
          $$(".faq-item").forEach((o) => { if (o !== item) (o as HTMLDetailsElement).open = false; });
        }
      });
    });

    /* ---- footer clock ---- */
    const clock = $("#clock") as HTMLElement | null;
    let clockId: ReturnType<typeof setInterval> | undefined;
    if (clock) {
      const tick = () => {
        try {
          clock.textContent = new Intl.DateTimeFormat("en-GB", {
            hour: "2-digit", minute: "2-digit", second: "2-digit",
            hour12: false, timeZone: "Asia/Kolkata",
          }).format(new Date());
        } catch { /* noop */ }
      };
      tick();
      clockId = setInterval(tick, 1000);
    }

    /* ---- footer year ---- */
    const year = $("#year") as HTMLElement | null;
    if (year) year.textContent = String(new Date().getFullYear());

    /* ---- blog ticker animation duration ---- */
    const track = $("#blog-track") as HTMLElement | null;
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

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onDocClick);
      revealObserver?.disconnect();
      statObserver?.disconnect();
      if (clockId) clearInterval(clockId);
    };
  }, []);

  return null;
}

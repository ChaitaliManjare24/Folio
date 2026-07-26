"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { navLinks } from "@/lib/config";

export default function Navigation({
  siteTitle,
  logoUrl,
}: {
  siteTitle: string;
  logoUrl?: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const brandLetter = siteTitle.trim().charAt(0).toUpperCase() || "A";

  return (
    <header
      className="sticky top-0 z-40"
      style={{ height: "var(--nav-height)", background: "var(--color-bg)" }}
    >
      <nav
        className="flex items-center justify-between h-full px-[var(--space-6)] lg:px-[var(--space-12)] max-w-[var(--max-width)] mx-auto"
      >
        {/* Logo */}
         <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-[1.25rem] font-extrabold flex items-center gap-[9px]"
          style={{ color: "var(--color-text)", letterSpacing: "-0.02em" }}
        >
          {logoUrl ? (
            <img src={logoUrl} alt={siteTitle} className="h-[26px] w-auto rounded-[var(--radius-sm)]" style={{ maxHeight: "26px" }} />
          ) : (
            <span
              className="inline-flex items-center justify-center w-8 h-8 text-[var(--text-sm)] font-bold"
              style={{
                background: "var(--color-accent)",
                color: "var(--color-accent-on)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              {brandLetter}
            </span>
          )}
          {siteTitle}
          <span
            className="font-[family-name:var(--font-mono)] font-medium text-[0.75rem]"
            style={{ color: "var(--color-text-tertiary)", letterSpacing: 0 }}
          >
            /build
          </span>
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-[28px]">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  data-active={isActive ? "true" : undefined}
                  className="nav-link font-[family-name:var(--font-mono)] text-[0.8125rem] font-medium py-[6px] transition-colors duration-150"
                  style={{
                    color: isActive ? "var(--color-accent)" : "#34322d",
                    letterSpacing: "0.01em",
                  }}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex flex-col gap-[5px] p-[var(--space-2)]"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <span
            className="block w-5 h-[2px] rounded-full transition-transform"
            style={{
              background: "var(--color-text)",
              transform: mobileOpen
                ? "rotate(45deg) translate(2.5px, 2.5px)"
                : "none",
            }}
          />
          <span
            className="block w-5 h-[2px] rounded-full transition-opacity"
            style={{
              background: "var(--color-text)",
              opacity: mobileOpen ? 0 : 1,
            }}
          />
          <span
            className="block w-5 h-[2px] rounded-full transition-transform"
            style={{
              background: "var(--color-text)",
              transform: mobileOpen
                ? "rotate(-45deg) translate(2.5px, -2.5px)"
                : "none",
            }}
          />
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className="md:hidden overflow-hidden transition-all"
        style={{
          maxHeight: mobileOpen ? "300px" : "0",
          background: "var(--color-bg-elevated)",
          borderBottom: mobileOpen ? "1px solid var(--color-border)" : "none",
          transitionTimingFunction: "var(--ease-out-quart)",
          transitionDuration: "var(--duration-slow)",
        }}
      >
        <ul className="flex flex-col py-[var(--space-4)] px-[var(--space-6)] gap-[var(--space-2)]">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="font-[family-name:var(--font-body)] text-[var(--text-base)] font-medium block px-[var(--space-3)] py-[var(--space-3)] transition-colors duration-150"
                  style={{
                    color: isActive
                      ? "var(--color-accent)"
                      : "var(--color-text-secondary)",
                    background: isActive ? "var(--color-accent-lightest)" : "transparent",
                    borderRadius: "var(--radius-md)",
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--color-bg-muted)"; }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
      {/* Bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1px]"
        style={{ background: "var(--color-border)" }}
      />
    </header>
  );
}

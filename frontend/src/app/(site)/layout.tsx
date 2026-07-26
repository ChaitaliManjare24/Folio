import "@/app/globals.css";
import "@/app/landing-bridge.css";
import "@/app/landing.css";
import Script from "next/script";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Script src="/landing-assets/script.js" strategy="afterInteractive" />
      {children}
    </>
  );
}

import "@/app/globals.css";
import "@/app/landing-ui.css";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      {children}
    </>
  );
}

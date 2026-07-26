import { fetchSettings, type PublicSettings } from "@/lib/config";
import AnnouncementBar from "@/components/AnnouncementBar";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";

export default async function PageWrapper({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings?: PublicSettings;
}) {
  const resolvedSettings = settings ?? await fetchSettings();

  return (
    <>
      <AnnouncementBar announcement={resolvedSettings.announcement} />
      <LandingHeader settings={resolvedSettings} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <LandingFooter settings={resolvedSettings} />
    </>
  );
}

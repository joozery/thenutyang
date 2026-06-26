import type { HomepageSettingsData } from '@/lib/homepage-settings';

export function VideoSection({ settings }: { settings: HomepageSettingsData }) {
  if (!settings.videoPublished || !settings.videoUrl) return null;

  return (
    <section
      className="relative bg-cover bg-center bg-no-repeat py-12 md:py-16"
      style={{ backgroundImage: "url('/sectionvideo.png')" }}
    >

      <div className="relative container mx-auto px-4 md:px-8">

        {(settings.videoTitle || settings.videoDesc) && (
          <div className="mb-6 text-center">
            {settings.videoTitle && (
              <h2 className="text-xl md:text-2xl font-bold text-white">{settings.videoTitle}</h2>
            )}
            {settings.videoDesc && (
              <p className="text-sm text-slate-300 mt-1">{settings.videoDesc}</p>
            )}
          </div>
        )}

        <div className="max-w-3xl mx-auto rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
          <div className="aspect-video bg-black">
            <video
              src={settings.videoUrl}
              controls
              className="w-full h-full object-cover"
              preload="metadata"
            />
          </div>
        </div>

      </div>
    </section>
  );
}

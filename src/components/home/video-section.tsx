import type { HomepageSettingsData } from '@/lib/homepage-settings';

function youtubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  // youtu.be/ID
  const short = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  // youtube.com/watch?v=ID or /embed/ID
  const long = url.match(/(?:v=|\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (long) return `https://www.youtube.com/embed/${long[1]}`;
  return null;
}

export function VideoSection({ settings }: { settings: HomepageSettingsData }) {
  if (!settings.videoPublished || !settings.videoUrl) return null;

  const embedUrl = youtubeEmbedUrl(settings.videoUrl);
  if (!embedUrl) return null;

  return (
    <section className="bg-slate-900 py-12 md:py-16">
      <div className="container mx-auto px-4 md:px-8">
        {(settings.videoTitle || settings.videoDesc) && (
          <div className="text-center mb-8">
            {settings.videoTitle && (
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                {settings.videoTitle}
              </h2>
            )}
            {settings.videoDesc && (
              <p className="text-slate-400 text-sm md:text-base mt-2 max-w-xl mx-auto">
                {settings.videoDesc}
              </p>
            )}
          </div>
        )}

        <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-white/10">
          <div className="aspect-video">
            <iframe
              src={`${embedUrl}?rel=0&modestbranding=1`}
              title={settings.videoTitle || 'วิดีโอ'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

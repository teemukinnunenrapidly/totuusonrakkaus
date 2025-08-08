"use client";

interface VimeoEmbedProps {
  vimeoUrl: string;
  title?: string;
}

export default function VimeoEmbed({ vimeoUrl, title }: VimeoEmbedProps) {
  // Muunna Vimeo URL video ID:ksi
  const getVimeoId = (url: string): string | null => {
    // Tuki eri Vimeo URL-muodoille
    const patterns = [
      /vimeo\.com\/(\d+)/, // https://vimeo.com/123456789
      /vimeo\.com\/groups\/\w+\/videos\/(\d+)/, // https://vimeo.com/groups/name/videos/123456789
      /player\.vimeo\.com\/video\/(\d+)/, // https://player.vimeo.com/video/123456789
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  };

  const videoId = getVimeoId(vimeoUrl);

  if (!videoId) {
    return (
              <div className="bg-gray-100 p-8 text-center">
        <div className="text-gray-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-600 font-medium">Virheellinen Vimeo URL</p>
        <p className="text-sm text-gray-500 mt-2">
          Tarkista että URL on oikeassa muodossa:<br />
          https://vimeo.com/123456789
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?h=hash&dnt=1&title=0&byline=0&portrait=0&controls=1&pip=0&dnt=1&transparent=0&logo=0&badge=0&color=00adef&muted=0&autopause=0&autoplay=0&loop=0&background=0&quality=auto&playsinline=0&fullscreen=1&volume=1`}
          className="absolute top-0 left-0 w-full h-full"
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title={title || "Vimeo video"}
        />
      </div>
      {title && (
        <p className="text-sm text-gray-600 mt-2 text-center">{title}</p>
      )}
    </div>
  );
}

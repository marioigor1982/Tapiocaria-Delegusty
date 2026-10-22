import React, { useState, useRef, useEffect } from 'react';

export interface GalleryVideo {
  id: string;
  url: string;
}

const GALLERY_VIDEOS: GalleryVideo[] = [
  {
    id: 'video-1',
    url: 'https://lh3.googleusercontent.com/gcs/APGMKjd9Ki7gIfLKR5l71O2O-RExy1K0C94fIpbcgI1P7C6TE3hScd4uHxyi413tqKukIdIY2bflIUFMAbyUluuNBUSDdhnG89oebEySHQDKRpuN5kudGaZF45sRG996_Gu_qdbVTYT_Vg8_8hhtcHgX8Uh3I1wCWa4TwkzHftJUyvjCbrxWMqpMJnBnXe50CMcNPjCy=m18',
  },
  {
    id: 'video-2',
    url: 'https://lh3.googleusercontent.com/gcs/APGMKjeryz99Aqv9wCxdu7YTo6eXt3HkoT0GDigTJHG_4Hppttgb8m-zKLDJGZy7-_YZZR86xHI5b07HtBtOnEGJsCgtQ2NhG9gWANCY9mw23ieolGEP41UJox9XnulCtM2zlMVHG3xkP90X5PPQ1XIv9RawwN_vGVcT5rcxUuX6KWa2KeUd5KxVw-_Bmh9KiF4_dj5b=m18',
  },
];

const Gallery: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState<GalleryVideo | null>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveVideo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMouseEnter = (id: string) => {
    const video = videoRefs.current[id];
    if (video) {
      video.play().catch(() => {
        // Ignora política de autoplay caso bloqueado pelo navegador
      });
    }
  };

  const handleMouseLeave = (id: string) => {
    const video = videoRefs.current[id];
    if (video) {
      video.pause();
    }
  };

  return (
    <section id="galeria" className="py-16 sm:py-24 bg-gradient-to-b from-orange-50 via-white to-orange-50/60 relative">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-900 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-orange-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span>Momentos Delegusty</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-orange-950 font-kievit-serif tracking-tight">
            Galeria & Bastidores
          </h2>
          <div className="w-24 h-1 bg-orange-500 mx-auto my-4 rounded-full"></div>
          <p className="text-base sm:text-lg text-gray-600 font-light leading-relaxed">
            Confira nossos vídeos exclusivos no formato vertical <strong>(9:16)</strong>. Passe o mouse para ver e clique para reproduzir em tela cheia!
          </p>
        </div>

        {/* 9:16 Media Grid (Clean, sem nomes, botão play laranja no hover) */}
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-8 justify-items-center">
          {GALLERY_VIDEOS.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveVideo(item)}
              onMouseEnter={() => handleMouseEnter(item.id)}
              onMouseLeave={() => handleMouseLeave(item.id)}
              className="group relative w-full max-w-[320px] aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer border-2 border-orange-200/50 hover:border-orange-500 flex items-center justify-center select-none"
            >
              {/* Thumbnail Video with silent loop preview */}
              <video
                ref={(el) => {
                  videoRefs.current[item.id] = el;
                }}
                src={item.url}
                playsInline
                loop
                muted
                preload="metadata"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Subtle dark gradient overlay to give depth */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300 pointer-events-none" />

              {/* Botão laranja de play que aparece quando o mouse passa em cima */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full bg-orange-600 group-hover:bg-orange-500 text-white flex items-center justify-center shadow-[0_0_35px_rgba(234,88,12,0.7)] opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-75 group-hover:scale-100">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    className="w-9 h-9 sm:w-10 sm:h-10 ml-1 drop-shadow"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Reprodução Exclusiva Ampliada */}
      {activeVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setActiveVideo(null)}
        >
          {/* Modal Container: Aspect 9:16 Vertical Reel Player */}
          <div
            className="relative w-full max-w-sm sm:max-w-md aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.9)] border border-orange-500/40 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 z-40 w-11 h-11 rounded-full bg-black/75 hover:bg-orange-600 text-white flex items-center justify-center transition-all duration-200 hover:scale-110 border border-white/20 cursor-pointer shadow-lg"
              aria-label="Fechar vídeo"
              title="Fechar (Esc)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Exclusive Video Player */}
            <video
              src={activeVideo.url}
              autoPlay
              controls
              playsInline
              loop
              className="w-full h-full object-contain bg-black"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;

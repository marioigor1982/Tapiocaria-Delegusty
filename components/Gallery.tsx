import React, { useState, useRef, useEffect } from 'react';

export interface GalleryMediaItem {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'iframe' | 'image';
  url: string;
  badge?: string;
  isCustom?: boolean;
}

const DEFAULT_GALLERY_ITEMS: GalleryMediaItem[] = [
  {
    id: 'video-preparo-1',
    title: 'Preparo Artesanal da Nossa Massa',
    description: 'A goma fresquinha e peneirada na hora para criar a crocância e maciez perfeitas.',
    type: 'video',
    url: 'https://lh3.googleusercontent.com/gcs/APGMKjd9Ki7gIfLKR5l71O2O-RExy1K0C94fIpbcgI1P7C6TE3hScd4uHxyi413tqKukIdIY2bflIUFMAbyUluuNBUSDdhnG89oebEySHQDKRpuN5kudGaZF45sRG996_Gu_qdbVTYT_Vg8_8hhtcHgX8Uh3I1wCWa4TwkzHftJUyvjCbrxWMqpMJnBnXe50CMcNPjCy=m18',
    badge: 'Vídeo 9:16',
  },
  {
    id: 'video-recheio-2',
    title: 'Recheios Generosos & Sabor Único',
    description: 'Ingredientes de primeira qualidade recheados com muito carinho e capricho.',
    type: 'video',
    url: 'https://lh3.googleusercontent.com/gcs/APGMKjeryz99Aqv9wCxdu7YTo6eXt3HkoT0GDigTJHG_4Hppttgb8m-zKLDJGZy7-_YZZR86xHI5b07HtBtOnEGJsCgtQ2NhG9gWANCY9mw23ieolGEP41UJox9XnulCtM2zlMVHG3xkP90X5PPQ1XIv9RawwN_vGVcT5rcxUuX6KWa2KeUd5KxVw-_Bmh9KiF4_dj5b=m18',
    badge: 'Vídeo 9:16',
  },
];

const LOCAL_STORAGE_KEY = 'delegusty_gallery_custom_items';

const Gallery: React.FC = () => {
  const [items, setItems] = useState<GalleryMediaItem[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...DEFAULT_GALLERY_ITEMS, ...parsed];
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_GALLERY_ITEMS;
  });

  const [activeItem, setActiveItem] = useState<GalleryMediaItem | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newType, setNewType] = useState<'video' | 'iframe' | 'image'>('iframe');

  // Video playback states for grid cards
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);

  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  const toggleVideoPlay = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const vid = videoRefs.current[id];
    if (!vid) return;

    if (playingVideoId === id) {
      vid.pause();
      setPlayingVideoId(null);
    } else {
      // Pause any previously playing video
      if (playingVideoId && videoRefs.current[playingVideoId]) {
        videoRefs.current[playingVideoId]?.pause();
      }
      vid.play().then(() => {
        setPlayingVideoId(id);
      }).catch(() => {
        // Autoplay policy or error
      });
    }
  };

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;

    let cleanUrl = newUrl.trim();
    let detectedType = newType;

    // If user pasted an entire iframe tag like <iframe src="..." ...>
    if (cleanUrl.includes('<iframe') && cleanUrl.includes('src=')) {
      const match = cleanUrl.match(/src=["']([^"']+)["']/i);
      if (match && match[1]) {
        cleanUrl = match[1];
        detectedType = 'iframe';
      }
    }

    // Auto-detect mp4 or video extension
    if (cleanUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) || cleanUrl.includes('=m18') || cleanUrl.includes('video')) {
      if (detectedType !== 'image') {
        detectedType = 'video';
      }
    }

    const newItem: GalleryMediaItem = {
      id: `custom-${Date.now()}`,
      title: newTitle.trim() || 'Nova Mídia da Galeria',
      description: newDescription.trim() || undefined,
      type: detectedType,
      url: cleanUrl,
      badge: detectedType === 'iframe' ? 'iFrame 9:16' : detectedType === 'video' ? 'Vídeo 9:16' : 'Foto 9:16',
      isCustom: true,
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);

    try {
      const customOnes = updatedItems.filter(i => i.isCustom);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnes));
    } catch {
      // ignore
    }

    setNewTitle('');
    setNewDescription('');
    setNewUrl('');
    setIsAddModalOpen(false);
  };

  const handleRemoveCustomItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    try {
      const customOnes = updated.filter(i => i.isCustom);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnes));
    } catch {
      // ignore
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
            Acompanhe nossos vídeos no formato vertical <strong>(9:16)</strong>: o preparo artesanal da massa fresca, recheios irresistíveis e o carinho dedicado a cada pedido!
          </p>

          {/* Action button to insert new link/iFrame */}
          <div className="mt-6 flex flex-wrap justify-center items-center gap-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-orange-50 border border-orange-300 text-orange-800 text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-95"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-orange-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Inserir Novo Vídeo / Link (iFrame)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-orange-100/80 hover:bg-orange-200/80 text-orange-900 text-xs sm:text-sm font-medium transition-colors"
              title={isMuted ? "Ativar som dos vídeos" : "Silenciar vídeos"}
            >
              {isMuted ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-gray-700">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                  </svg>
                  <span>Áudio: Desativado</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-orange-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                  </svg>
                  <span>Áudio: Ativado</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 9:16 Media Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-8">
          {items.map((item) => {
            const isPlaying = playingVideoId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setActiveItem(item)}
                className="group relative bg-stone-900 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 cursor-pointer border border-orange-200/40 flex flex-col"
              >
                {/* 9:16 Aspect Ratio Frame */}
                <div className="relative w-full aspect-[9/16] bg-black overflow-hidden flex items-center justify-center">
                  {item.type === 'video' ? (
                    <>
                      <video
                        ref={(el) => {
                          videoRefs.current[item.id] = el;
                        }}
                        src={item.url}
                        playsInline
                        loop
                        muted={isMuted}
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />

                      {/* Play/Pause Overlay Control */}
                      <button
                        type="button"
                        onClick={(e) => toggleVideoPlay(item.id, e)}
                        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 z-10 ${
                          isPlaying ? 'opacity-0 group-hover:opacity-100 bg-black/30' : 'opacity-100 bg-black/40'
                        }`}
                        aria-label={isPlaying ? 'Pausar vídeo' : 'Reproduzir vídeo'}
                      >
                        <div className="w-16 h-16 rounded-full bg-orange-600/90 hover:bg-orange-600 text-white flex items-center justify-center shadow-2xl transform transition-transform group-hover:scale-110">
                          {isPlaying ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7">
                              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Zm9.75 0a.75.75 0 0 1 .75.75v12a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-8 h-8 ml-1">
                              <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </>
                  ) : item.type === 'iframe' ? (
                    <iframe
                      src={item.url}
                      className="w-full h-full border-0 pointer-events-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      title={item.title}
                    />
                  ) : (
                    <img
                      src={item.url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Gradient bottom overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-10" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
                    <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide border border-white/20">
                      {item.badge || '9:16'}
                    </span>
                    {item.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCustomItem(item.id, e)}
                        className="pointer-events-auto p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white transition-colors"
                        title="Remover vídeo"
                        aria-label="Remover vídeo"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Bottom Text Content */}
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white z-20 pointer-events-none">
                    <h3 className="font-bold text-base sm:text-lg line-clamp-2 drop-shadow-md text-orange-100 group-hover:text-white transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-xs text-stone-300 line-clamp-2 mt-1 leading-snug font-light">
                        {item.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-orange-400 font-medium">
                      <span>Clique para expandir</span>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Modal Viewer for 9:16 Media */}
      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setActiveItem(null)}
        >
          <div
            className="relative w-full max-w-sm sm:max-w-md aspect-[9/16] bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/20 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setActiveItem(null)}
              className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-all hover:scale-105 border border-white/30 cursor-pointer"
              aria-label="Fechar visualizador"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Media Area */}
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {activeItem.type === 'video' ? (
                <video
                  ref={modalVideoRef}
                  src={activeItem.url}
                  autoPlay
                  controls
                  playsInline
                  loop
                  className="w-full h-full object-contain"
                />
              ) : activeItem.type === 'iframe' ? (
                <iframe
                  src={activeItem.url}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={activeItem.title}
                />
              ) : (
                <img
                  src={activeItem.url}
                  alt={activeItem.title}
                  className="w-full h-full object-contain"
                />
              )}

              {/* Title Overlay at Bottom */}
              <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black via-black/80 to-transparent text-white pointer-events-none">
                <span className="inline-block px-2 py-0.5 rounded-full bg-orange-600 text-[11px] font-bold uppercase tracking-wider mb-1">
                  {activeItem.badge || 'Delegusty 9:16'}
                </span>
                <h3 className="text-lg font-bold text-white drop-shadow">
                  {activeItem.title}
                </h3>
                {activeItem.description && (
                  <p className="text-xs text-stone-300 mt-1">
                    {activeItem.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insert Link / iFrame Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-orange-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-2 cursor-pointer"
              aria-label="Fechar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 font-kievit-serif">
                  Adicionar à Galeria 9:16
                </h3>
                <p className="text-xs text-gray-500">
                  Insira o link de um vídeo, iFrame ou reel para exibir na galeria
                </p>
              </div>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tipo de Mídia
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewType('iframe')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      newType === 'iframe'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    iFrame / Link
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('video')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      newType === 'video'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Vídeo (MP4)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewType('image')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      newType === 'image'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    Foto (9:16)
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="media-url" className="block text-xs font-semibold text-gray-700 mb-1">
                  Link ou Código do iFrame *
                </label>
                <textarea
                  id="media-url"
                  rows={3}
                  required
                  placeholder={
                    newType === 'iframe'
                      ? 'Cole o link de incorporação ou a tag <iframe src="..."></iframe>'
                      : newType === 'video'
                      ? 'https://.../video.mp4'
                      : 'https://.../imagem.jpg'
                  }
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full text-xs font-mono p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50 resize-none"
                />
              </div>

              <div>
                <label htmlFor="media-title" className="block text-xs font-semibold text-gray-700 mb-1">
                  Título do Vídeo
                </label>
                <input
                  id="media-title"
                  type="text"
                  placeholder="Ex: Tapioca de Nutella saindo quentinha"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label htmlFor="media-desc" className="block text-xs font-semibold text-gray-700 mb-1">
                  Descrição (Opcional)
                </label>
                <input
                  id="media-desc"
                  type="text"
                  placeholder="Ex: Bastidores da nossa cozinha com muito queijo!"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-sm p-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold shadow-md hover:shadow transition-all cursor-pointer active:scale-95"
                >
                  Adicionar à Galeria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default Gallery;

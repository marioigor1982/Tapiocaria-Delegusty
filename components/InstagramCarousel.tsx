import React, { useState } from 'react';
import { InstagramIcon } from './icons/InstagramIcon';

interface InstagramPostItem {
  id: string;
  embedUrl: string;
  postUrl: string;
  title: string;
  dateLabel: string;
  isCover?: boolean;
}

const INSTAGRAM_POSTS: InstagramPostItem[] = [
  {
    id: 'post-cover-23-06',
    embedUrl: 'https://www.instagram.com/p/DLQ6iyLNL6O/embed',
    postUrl: 'https://www.instagram.com/p/DLQ6iyLNL6O/',
    title: 'Nossa Origem & Tradição',
    dateLabel: '23/06/2026',
    isCover: true,
  },
  {
    id: 'post-perfil',
    embedUrl: 'https://www.instagram.com/delegusty.tapioca/embed',
    postUrl: 'https://www.instagram.com/delegusty.tapioca?igsh=YjZld3hheDN2eGMz',
    title: 'Delegusty Tapioca • Instagram Oficial',
    dateLabel: 'Feed Delegusty',
    isCover: false,
  },
];

const InstagramCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentPost = INSTAGRAM_POSTS[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? INSTAGRAM_POSTS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === INSTAGRAM_POSTS.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Top Banner / Indicator */}
      <div className="flex items-center justify-between mb-3 px-1 text-xs text-orange-950">
        <div className="flex items-center gap-1.5 font-semibold">
          <InstagramIcon className="w-4 h-4 text-pink-600" />
          <span>{currentPost.isCover ? '⭐ Capa Principal' : 'Publicação'}</span>
          <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-[11px] font-bold">
            {currentPost.dateLabel}
          </span>
        </div>
        <span className="text-gray-500 font-medium">
          {currentIndex + 1} de {INSTAGRAM_POSTS.length}
        </span>
      </div>

      {/* Frame Container */}
      <div className="relative h-[550px] w-full overflow-hidden rounded-2xl shadow-xl bg-gray-100 border border-orange-200/60">
        <iframe
          key={currentPost.embedUrl}
          src={currentPost.embedUrl}
          className="w-full h-full border-0"
          allowFullScreen={true}
          scrolling="no"
          loading="lazy"
          title={`Publicação Instagram - ${currentPost.title} (${currentPost.dateLabel})`}
        ></iframe>

        {/* Carousel Navigation Arrows */}
        {INSTAGRAM_POSTS.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Post anterior"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-lg backdrop-blur-sm cursor-pointer z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Próximo post"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-lg backdrop-blur-sm cursor-pointer z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Dots Navigation */}
      {INSTAGRAM_POSTS.length > 1 && (
        <div className="flex justify-center items-center gap-2 mt-3">
          {INSTAGRAM_POSTS.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 transition-all rounded-full ${
                idx === currentIndex ? 'w-6 bg-orange-600' : 'w-2 bg-orange-200 hover:bg-orange-300'
              }`}
              aria-label={`Ver post ${idx + 1}: ${item.title}`}
            />
          ))}
        </div>
      )}

      {/* Direct Link to Instagram */}
      <div className="mt-2 text-center">
        <a
          href={currentPost.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-orange-700 hover:text-orange-900 font-medium inline-flex items-center gap-1 hover:underline"
        >
          <span>Abrir post no aplicativo do Instagram</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>
      </div>
    </div>
  );
};

export default InstagramCarousel;

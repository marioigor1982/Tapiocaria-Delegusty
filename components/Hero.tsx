import React, { useState, useEffect, useCallback } from 'react';
import { useStoreStatus } from '../hooks/useStoreStatus';

const VALID_HERO_IMAGES = [
    "https://i.pinimg.com/originals/01/86/6b/01866b9c1a1546c3d82b5d90dfcf2694.jpg",
    "https://img.freepik.com/fotos-premium/tapioca-recheada-com-tapioca-brasileira-de-frango_434193-1156.jpg?semt=ais_hybrid&w=740",
    "https://t3.ftcdn.net/jpg/05/46/01/62/360_F_546016297_G0pTcVLFOb5BkzqyDy7joxASlX3sorgz.jpg",
    "https://lh3.googleusercontent.com/bp6YP0cgX2t01Ft8cdH2U8StozQtTdpywOsXrsaGaXdZ-yzPATUy8QHKEtzMpYrAn1_FRVbg-QwAftpguA=w1351",
    "https://lh3.googleusercontent.com/vnUETwcpdemTDFco0ggiO_SmKtkhPz3VIVFBu0VWKAWtxcgRKHJVkWU4TGHYGsw5HYUvWb24-ewDRknP0g=w1351",
    "https://lh3.googleusercontent.com/TOVEmybaj5bxloT-07aO_1nPHr1tzoyalot67gZdVa9AdGjSiyTFodIGIeFqbeHbjLcnEQZGbT4xxKhk7w=w1351",
    "https://lh3.googleusercontent.com/ojYdFNikPlNNicaZcGsWLlsIFo9HWLZEWfZyPfgTTTBoRcIa1EjF9ufpXrjX9mt0XVqNJT-neF_cQfPDKA=w1351",
    "https://lh3.googleusercontent.com/eWmQO2t05SN2n1aLQ9J7cz4_nNoub9_6bzDdQWSEoH_ZOaviTE7yyd24i1XSGqEyZKqDchYWyKcHpgzWtQ=w1351",
];

const subtitles = [
    "O sabor autêntico da tradição, feito com carinho para você.",
    "A sua tapioca doce e salgada",
    "Gosto inesquecível a cada mordida",
    "Há mais de 20 anos presenteando sabores!"
];

interface HeroProps {
  onOpenOrder?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onOpenOrder }) => {
    const storeStatus = useStoreStatus();
    const [images, setImages] = useState<string[]>(VALID_HERO_IMAGES);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);

    const nextSlide = useCallback(() => {
        if (images.length === 0) return;
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, [images.length]);

    useEffect(() => {
        if (images.length <= 1) return;
        const slideInterval = setInterval(nextSlide, 5000);
        return () => clearInterval(slideInterval);
    }, [nextSlide, images.length]);
    
    useEffect(() => {
        const subtitleInterval = setInterval(() => {
            setCurrentSubtitleIndex((prevIndex) => (prevIndex + 1) % subtitles.length);
        }, 5000);
        return () => clearInterval(subtitleInterval);
    }, []);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const handleImageError = (failedSrc: string) => {
        setImages((prev) => {
            const filtered = prev.filter((img) => img !== failedSrc);
            return filtered.length > 0 ? filtered : prev;
        });
    };

    const handleScrollToMenu = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const menuSection = document.querySelector('#menu');
        if (menuSection) {
            menuSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section id="home" className="relative h-screen flex items-center justify-center text-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                {images.map((src, index) => (
                     <img
                        key={src}
                        src={src}
                        alt={`Tapioca saborosa ${index + 1}`}
                        onError={() => handleImageError(src)}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100' : 'opacity-0'}`}
                    />
                ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent z-0"></div>

            <div className="relative z-10 text-center p-4 max-w-4xl mx-auto">
                <h1 className="font-kievit-serif font-bold text-5xl sm:text-7xl md:text-8xl mb-4 text-shadow-strong tracking-tight">
                    Tapioca Delegusty
                </h1>
                <p key={currentSubtitleIndex} className="text-xl md:text-2xl max-w-2xl mx-auto mb-8 text-shadow-strong font-light animate-fade-in-up">
                    {subtitles[currentSubtitleIndex]}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <a
                        href="#menu"
                        onClick={handleScrollToMenu}
                        className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-full text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        Ver Cardápio
                    </a>
                    {onOpenOrder && (
                        <button
                            type="button"
                            onClick={onOpenOrder}
                            className={`font-bold py-3 px-8 rounded-full text-base sm:text-lg transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center gap-2 cursor-pointer ${
                                storeStatus.isOpen 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-stone-900/80 hover:bg-stone-900 text-stone-100 border border-stone-600 backdrop-blur-sm'
                            }`}
                        >
                            {storeStatus.isOpen ? (
                                <>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.67 0-1.19-.578-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                    <span>Faça seu Pedido</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                                    <span>Fechado</span>
                                    <span className="text-xs bg-stone-700/80 text-stone-300 px-2.5 py-0.5 rounded-full font-normal">
                                        {storeStatus.badgeOpenText}
                                    </span>
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
                {images.map((_, index) => (
                <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/75'
                    }`}
                    aria-label={`Ir para imagem ${index + 1}`}
                />
                ))}
            </div>
             <style>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out forwards;
                }
            `}</style>
        </section>
    );
};

export default Hero;
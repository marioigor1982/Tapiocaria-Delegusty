import React, { useState, useEffect, useCallback } from 'react';
import { useStoreStatus } from '../hooks/useStoreStatus';

const images = [
    "https://i.pinimg.com/originals/01/86/6b/01866b9c1a1546c3d82b5d90dfcf2694.jpg",
    "https://cdn.create.vista.com/api/media/small/207936640/stock-photo-tapioca-filled-hazelnut-cream-banana-slices",
    "https://cdn.create.vista.com/api/media/small/207500020/stock-photo-tapioca-filled-hazelnuts-cream-fresh-strawberries",
    "https://img.freepik.com/fotos-premium/tapioca-recheada-com-tapioca-brasileira-de-frango_434193-1156.jpg?semt=ais_hybrid&w=740",
    "https://t3.ftcdn.net/jpg/05/46/01/62/360_F_546016297_G0pTcVLFOb5BkzqyDy7joxASlX3sorgz.jpg",
    "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlhU4wODjBtbi6-0ArzoOaYnNZ62p1NBlAWO1F4AS4p9CgT0FbRUkSI3cNDOEemThoCkhSOyGoYgZy5XMPgs0tlG4uCbODPolzssAfEa-jITB5gOe75K5br8j4yErlkNmdli7bv42Jkt383=s680-w680-h510-rw",
    "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkwbC0QSP1OqYn725ZUAVrBMxZ-C06bTVmaiFwe8fHCYCdEFyv2z1EplTQqe9kyd7lIU3ufEvdt_bd7wdpklpOF3AEg1g9mItllOZG2GV6XKXqcUcE7nFMuyiQtI-nWDQJPLWz93fwAQqM=s680-w680-h510-rw",
    "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnjGuVFGTCdCiWZP63d2ADQboUnItoqHe_DODQG6B1NLf-ekS5arqp7Tl6YbVAvUlt_8LcU2AWbJBEsCJuJXYZVZgs0A5iJF2WCORgS3UlfZ1PG4CZhVl6x3oiet5N0kETy-iF6VLbbEYZC=s680-w680-h510-rw",
    "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWk7RWveCNUXK2-7xtZLM-17jzaD9ghtz-6B-KtI8evjxRw2BAwmesIFiWmVk7dphxy70V7Ze3Z6JodxliBqRBPCzURRn6wdQNzgmIj-rDc8moM6e2jiZiUiLuRpz4Wb-8hGsUkHD_6Yl_s=s680-w680-h510-rw",
    "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWk-lC3h0J8fSCtaGk5nLIHNAC6UdM2ULr2vdB_4SsO6YPwQGTAMlgT8PMKKR78MagcP_9amkZ6eT8rKVPYsNZntt699yoz1QbzaI3mgCm6H44gmVc874aIXyg3AqR14kU0Yq8vpkw=s680-w680-h510-rw",
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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(0);

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, []);

    useEffect(() => {
        const slideInterval = setInterval(nextSlide, 5000);
        return () => clearInterval(slideInterval);
    }, [nextSlide]);
    
    useEffect(() => {
        const subtitleInterval = setInterval(() => {
            setCurrentSubtitleIndex((prevIndex) => (prevIndex + 1) % subtitles.length);
        }, 5000);
        return () => clearInterval(subtitleInterval);
    }, []);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
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
                        key={index}
                        src={src}
                        alt={`Tapioca saborosa ${index + 1}`}
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
                                        Abre às 18
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
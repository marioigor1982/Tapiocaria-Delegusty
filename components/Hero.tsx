import React, { useState, useEffect, useCallback } from 'react';

const images = [
    "https://i.pinimg.com/originals/01/86/6b/01866b9c1a1546c3d82b5d90dfcf2694.jpg",
    "https://cdn.create.vista.com/api/media/small/207936640/stock-photo-tapioca-filled-hazelnut-cream-banana-slices",
    "https://cdn.create.vista.com/api/media/small/207500020/stock-photo-tapioca-filled-hazelnuts-cream-fresh-strawberries",
    "https://img.freepik.com/fotos-premium/tapioca-recheada-com-tapioca-brasileira-de-frango_434193-1156.jpg?semt=ais_hybrid&w=740",
    "https://t3.ftcdn.net/jpg/05/46/01/62/360_F_546016297_G0pTcVLFOb5BkzqyDy7joxASlX3sorgz.jpg",
];

const subtitles = [
    "O sabor autêntico da tradição, feito com carinho para você.",
    "A sua tapioca doce e salgada",
    "Gosto inesquecível a cada mordida",
    "Há mais de 20 anos presenteando sabores!"
];

const Hero: React.FC = () => {
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

            <div className="relative z-10 text-center p-4">
                <h1 className="font-story-script text-6xl md:text-8xl mb-4 text-shadow-strong">
                    Tapiocaria Delegusty
                </h1>
                <p key={currentSubtitleIndex} className="text-xl md:text-2xl max-w-2xl mx-auto mb-8 text-shadow-strong font-light animate-fade-in-up">
                    {subtitles[currentSubtitleIndex]}
                </p>
                <a
                    href="#menu"
                    onClick={handleScrollToMenu}
                    className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                    Ver Cardápio
                </a>
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
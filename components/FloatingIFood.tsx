import React, { useState, useEffect } from 'react';

const FloatingIFood: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <a
      href="https://www.ifood.com.br/delivery/sao-paulo-sp/tapiocas-delegusty-conjunto-habitacional-instituto-adventista/a23a8762-6b06-4ee3-85b0-94ab21a38799?UTM_Medium=share"
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 left-6 z-40 group flex items-center bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl transition-all duration-500 ease-in-out transform hover:scale-105 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      aria-label="Pedir pelo iFood"
      title="Pedir pelo iFood (Delivery)"
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md">
        <img
          src="https://i.imgur.com/g4cIv92.png"
          alt="iFood"
          className="w-full h-full object-cover rounded-full"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (!target.src.includes('g4cIv92.jpg')) {
              target.src = 'https://i.imgur.com/g4cIv92.jpg';
            }
          }}
        />
      </div>
      <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
        <span className="text-sm font-bold text-white pr-4 pl-2">Pedir pelo iFood</span>
      </div>
    </a>
  );
};

export default FloatingIFood;

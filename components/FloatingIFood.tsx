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
    <div
      className={`fixed bottom-6 left-6 z-40 flex flex-col gap-3 transition-all duration-500 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {/* iFood */}
      <a
        href="https://www.ifood.com.br/delivery/sao-paulo-sp/tapiocas-delegusty-conjunto-habitacional-instituto-adventista/a23a8762-6b06-4ee3-85b0-94ab21a38799?UTM_Medium=share"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center bg-red-600 hover:bg-red-700 text-white rounded-full shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105"
        aria-label="Pedir pelo iFood"
        title="Pedir pelo iFood (Delivery)"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md bg-white">
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

      {/* Keeta (abaixo do iFood) */}
      <a
        href="https://url-eu.mykeeta.com/BtpUQ7rz"
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center bg-[#FFCC00] hover:bg-[#E6B800] text-stone-900 rounded-full shadow-2xl transition-all duration-300 ease-in-out transform hover:scale-105"
        aria-label="Pedir pela Keeta"
        title="Pedir pela Keeta (Delivery)"
      >
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md bg-white">
          <img
            src="https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkzgXbFvdsyiw3NgBcq0sS-0H144BA8Z_626ZwmIe_3UFgOfErxvI3DHV2hCPd07XxRyzblFYyWCmZKwXbRNz5rSRrrjs5hiV53z9rKB1g7TC3D4laADo9WECHCnxgky5IXHQaCXzzRiT1E=s680-w680-h510-rw"
            alt="Keeta"
            className="w-full h-full object-cover rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/images/keeta-logo.webp';
            }}
          />
        </div>
        <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
          <span className="text-sm font-bold text-stone-900 pr-4 pl-2">Pedir pela Keeta</span>
        </div>
      </a>
    </div>
  );
};

export default FloatingIFood;

import React, { useState, useEffect, useRef } from 'react';

const FloatingIFood: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isContactVisible, setIsContactVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);

    const handleScroll = () => {
      const contactEl = document.getElementById('contato');
      if (contactEl) {
        const rect = contactEl.getBoundingClientRect();
        // Oculta quando a seção Contato entra na área visível da tela
        setIsContactVisible(rect.top < window.innerHeight && rect.bottom > 0);
      }
    };

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    handleScroll();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleContainerClick = (e: React.MouseEvent) => {
    // Se o clique for em um link de pedido, permite navegação normal
    if ((e.target as HTMLElement).closest('a')) {
      return;
    }
    // No toque em mobile, expande ou recolhe o botão
    setIsExpanded((prev) => !prev);
  };

  const shouldShow = isVisible && !isContactVisible;

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-6 left-6 z-40 transition-all duration-500 ease-in-out ${
        shouldShow ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{ userSelect: 'none' }}
    >
      <style>{`
        /* Crossfade suave entre os logos com ciclo de 10s (4s visível + 1s fade) */
        @keyframes deliveryCrossfade {
          0%, 40% {
            opacity: 1;
          }
          50%, 90% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .delivery-fade-logo-1 {
          animation: deliveryCrossfade 10s ease-in-out infinite;
        }

        .delivery-fade-logo-2 {
          animation: deliveryCrossfade 10s ease-in-out infinite -5s;
        }

        /* Pausa a animação e zera opacidade no hover ou quando expandido */
        .delivery-shell:hover .delivery-crossfade-view,
        .delivery-shell.is-active .delivery-crossfade-view {
          opacity: 0 !important;
          pointer-events: none;
        }
        .delivery-shell:hover .delivery-fade-logo-1,
        .delivery-shell:hover .delivery-fade-logo-2,
        .delivery-shell.is-active .delivery-fade-logo-1,
        .delivery-shell.is-active .delivery-fade-logo-2 {
          animation-play-state: paused;
        }

        /* Expansão de largura no hover ou quando expandido (de 74px para ~196px) */
        .delivery-shell:hover,
        .delivery-shell.is-active {
          width: 196px !important;
        }

        /* Revela os botões pills no hover ou expandido */
        .delivery-shell:hover .delivery-pills-view,
        .delivery-shell.is-active .delivery-pills-view {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>

      {/* Botão Flutuante Principal - Dimensão ajustada de 74px */}
      <div
        onClick={handleContainerClick}
        className={`delivery-shell relative h-[74px] w-[74px] rounded-full bg-transparent shadow-2xl cursor-pointer flex items-center overflow-hidden border-0 transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isExpanded ? 'is-active !bg-white' : 'hover:scale-105'
        }`}
        title="Peça seu delivery pelo iFood ou pela Keeta"
        aria-label="Delivery iFood e Keeta"
      >
        {/* ============================================================
            1. ESTADO PADRÃO: LOGOS SOBREPOSTOS COM CROSSFADE SUAVE
            Ocupam 100% do botão circular (74px), sem borda branca ou padding
            ============================================================ */}
        <div className="delivery-crossfade-view absolute inset-0 w-[74px] h-[74px] rounded-full overflow-hidden transition-opacity duration-300">
          {/* Logo 1: iFood */}
          <div className="delivery-fade-logo-1 absolute inset-0 w-full h-full">
            <img
              src="/logo-ifood.png"
              alt="iFood"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://i.imgur.com/g4cIv92.png';
              }}
            />
          </div>

          {/* Logo 2: Keeta (atraso de 5s para alternância perfeita) */}
          <div className="delivery-fade-logo-2 absolute inset-0 w-full h-full">
            <img
              src="/logo-keeta.png"
              alt="Keeta"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkzgXbFvdsyiw3NgBcq0sS-0H144BA8Z_626ZwmIe_3UFgOfErxvI3DHV2hCPd07XxRyzblFYyWCmZKwXbRNz5rSRrrjs5hiV53z9rKB1g7TC3D4laADo9WECHCnxgky5IXHQaCXzzRiT1E=s680-w680-h510-rw';
              }}
            />
          </div>
        </div>

        {/* ============================================================
            2. ESTADO EXPANDIDO (HOVER / TOQUE): DOIS PILLS INDEPENDENTES
            ============================================================ */}
        <div className="delivery-pills-view flex items-center justify-center gap-2 px-2.5 w-full opacity-0 pointer-events-none transition-opacity duration-300 whitespace-nowrap">
          {/* Pill iFood */}
          <a
            href="https://www.ifood.com.br/delivery/sao-paulo-sp/tapiocas-delegusty-conjunto-habitacional-instituto-adventista/a23a8762-6b06-4ee3-85b0-94ab21a38799?UTM_Medium=share"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 bg-[#EA1D2C] hover:bg-[#d11220] active:scale-95 text-white font-bold text-xs py-1.5 px-2 rounded-full shadow-md transition-all duration-200"
            title="Pedir pelo iFood"
            aria-label="Pedir pelo iFood"
          >
            <img
              src="/logo-ifood.png"
              alt="iFood"
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://i.imgur.com/g4cIv92.png';
              }}
            />
            <span>iFood</span>
          </a>

          {/* Pill Keeta */}
          <a
            href="https://url-eu.mykeeta.com/BtpUQ7rz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1 bg-[#FFCC00] hover:bg-[#e6b800] active:scale-95 text-stone-900 font-bold text-xs py-1.5 px-2 rounded-full shadow-md transition-all duration-200"
            title="Pedir pela Keeta"
            aria-label="Pedir pela Keeta"
          >
            <img
              src="/logo-keeta.png"
              alt="Keeta"
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkzgXbFvdsyiw3NgBcq0sS-0H144BA8Z_626ZwmIe_3UFgOfErxvI3DHV2hCPd07XxRyzblFYyWCmZKwXbRNz5rSRrrjs5hiV53z9rKB1g7TC3D4laADo9WECHCnxgky5IXHQaCXzzRiT1E=s680-w680-h510-rw';
              }}
            />
            <span>Keeta</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default FloatingIFood;

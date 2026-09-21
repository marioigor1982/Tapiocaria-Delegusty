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
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    handleScroll();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // No desktop com mouse: expande ao passar o mouse e recolhe ao sair
  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      setIsExpanded(false);
    }
  };

  // No mobile / clique: ao clicar no botão fechado, SEMPRE expande e mostra as 2 opções
  const handleShellClick = (e: React.MouseEvent) => {
    if (!isExpanded) {
      e.preventDefault();
      e.stopPropagation();
      setIsExpanded(true);
    }
  };

  // Se por qualquer motivo um clique alcançar o link antes de expandir, impede navegação e abre as opções
  const handleLinkClick = (e: React.MouseEvent) => {
    if (!isExpanded) {
      e.preventDefault();
      e.stopPropagation();
      setIsExpanded(true);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsExpanded(false);
  };

  const shouldShow = isVisible && !isContactVisible;

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-6 left-6 z-40 transition-all duration-500 ease-in-out ${
        shouldShow ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
      }`}
      style={{ userSelect: 'none' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <style>{`
        /* Animação suave de crossfade contínuo de 12s entre iFood, Keeta e 99Food */
        @keyframes deliveryCrossfadeCycle {
          0%, 28% {
            opacity: 1;
          }
          33.33%, 95% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        .delivery-fade-1 {
          animation: deliveryCrossfadeCycle 12s ease-in-out infinite;
        }

        .delivery-fade-2 {
          animation: deliveryCrossfadeCycle 12s ease-in-out infinite -8s;
        }

        .delivery-fade-3 {
          animation: deliveryCrossfadeCycle 12s ease-in-out infinite -4s;
        }
      `}</style>

      {/* Invólucro Principal do Botão Flutuante (Sem borda ou fundo branco) */}
      <div
        onClick={handleShellClick}
        className={`delivery-shell relative h-[68px] rounded-full bg-transparent cursor-pointer flex items-center transition-all duration-400 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
          isExpanded
            ? 'w-[300px] sm:w-[320px]'
            : 'w-[68px] hover:scale-105 shadow-2xl'
        }`}
        title="Peça seu delivery pelo iFood, Keeta ou 99Food"
        aria-label="Delivery iFood, Keeta e 99Food"
      >
        {/* ============================================================
            1. ESTADO FECHADO (PADRÃO): LOGOS CIRCULARES COM CROSSFADE
            Sem borda branca, preenchendo 100% do círculo (68px)
            ============================================================ */}
        <div
          className={`absolute inset-0 w-[68px] h-[68px] rounded-full overflow-hidden transition-all duration-300 ${
            isExpanded ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 pointer-events-auto scale-100'
          }`}
          aria-hidden={isExpanded}
        >
          {/* Logo 1: iFood */}
          <div className="delivery-fade-1 absolute inset-0 w-full h-full">
            <img
              src="/logo-ifood.png"
              alt="iFood"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://i.imgur.com/g4cIv92.png';
              }}
            />
          </div>

          {/* Logo 2: Keeta */}
          <div className="delivery-fade-2 absolute inset-0 w-full h-full">
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

          {/* Logo 3: 99Food */}
          <div className="delivery-fade-3 absolute inset-0 w-full h-full">
            <img
              src="https://lh3.googleusercontent.com/NtNx2nyQjK48xy204TjKl9baFxjgkWT5437f35kyewTYsUauxW9kyJNbQEZ47_pa8JVoIyfUkEYSYNhX4w=w1420"
              alt="99Food"
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-99food.png';
              }}
            />
          </div>
        </div>

        {/* ============================================================
            2. ESTADO EXPANDIDO: TRÊS OPÇÕES VISÍVEIS (iFood + Keeta + 99Food)
            Sem fundo branco envolvente - Os próprios botões são coloridos
            ============================================================ */}
        <div
          className={`flex items-center justify-between gap-1.5 px-1 w-full h-full transition-all duration-300 ${
            isExpanded ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'
          }`}
        >
          {/* Botão iFood */}
          <a
            href="https://www.ifood.com.br/delivery/sao-paulo-sp/tapiocas-delegusty-conjunto-habitacional-instituto-adventista/a23a8762-6b06-4ee3-85b0-94ab21a38799?UTM_Medium=share"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="flex-1 h-[48px] flex items-center justify-center gap-1.5 bg-[#EA1D2C] hover:bg-[#d11220] active:scale-95 text-white font-bold text-xs sm:text-sm px-2 rounded-full shadow-xl transition-all duration-200"
            title="Abrir no iFood"
            aria-label="Abrir no iFood"
          >
            <img
              src="/logo-ifood.png"
              alt="iFood"
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://i.imgur.com/g4cIv92.png';
              }}
            />
            <span>iFood</span>
          </a>

          {/* Botão Keeta */}
          <a
            href="https://url-eu.mykeeta.com/BtpUQ7rz"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="flex-1 h-[48px] flex items-center justify-center gap-1.5 bg-[#FFCC00] hover:bg-[#e6b800] active:scale-95 text-stone-900 font-bold text-xs sm:text-sm px-2 rounded-full shadow-xl transition-all duration-200"
            title="Abrir na Keeta"
            aria-label="Abrir na Keeta"
          >
            <img
              src="/logo-keeta.png"
              alt="Keeta"
              className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://lh3.googleusercontent.com/gps-cs-s/AHRPTWkzgXbFvdsyiw3NgBcq0sS-0H144BA8Z_626ZwmIe_3UFgOfErxvI3DHV2hCPd07XxRyzblFYyWCmZKwXbRNz5rSRrrjs5hiV53z9rKB1g7TC3D4laADo9WECHCnxgky5IXHQaCXzzRiT1E=s680-w680-h510-rw';
              }}
            />
            <span>Keeta</span>
          </a>

          {/* Botão 99Food */}
          <a
            href="https://oia.99app.com/dlp9/47Uaqz"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleLinkClick}
            className="flex-1 h-[48px] flex items-center justify-center gap-1.5 bg-[#FF8100] hover:bg-[#e67400] active:scale-95 text-white font-bold text-xs sm:text-sm px-2 rounded-full shadow-xl transition-all duration-200"
            title="Abrir no 99Food"
            aria-label="Abrir no 99Food"
          >
            <img
              src="https://lh3.googleusercontent.com/NtNx2nyQjK48xy204TjKl9baFxjgkWT5437f35kyewTYsUauxW9kyJNbQEZ47_pa8JVoIyfUkEYSYNhX4w=w1420"
              alt="99Food"
              className="w-6 h-6 rounded-full object-cover flex-shrink-0 bg-white"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/logo-99food.png';
              }}
            />
            <span>99Food</span>
          </a>

          {/* Botão Fechar / Recolher */}
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-stone-800/80 hover:bg-stone-900 active:scale-90 text-white flex items-center justify-center shadow-md transition-all duration-150 flex-shrink-0"
            title="Fechar opções"
            aria-label="Fechar opções"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FloatingIFood;

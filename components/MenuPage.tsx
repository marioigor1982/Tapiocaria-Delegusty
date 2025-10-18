import React, { useEffect } from 'react';
import type { MenuItem } from '../types';
import MenuItemCard from './MenuItemCard';

interface MenuPageProps {
  title: string;
  items: MenuItem[];
  onBack: () => void;
  onSelectItem: (item: MenuItem) => void;
  backgroundImage?: string;
  targetAnchor?: string | null;
}

const BackArrowIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
);


const MenuPage: React.FC<MenuPageProps> = ({ title, items, onBack, onSelectItem, backgroundImage, targetAnchor }) => {
  const hasBg = !!backgroundImage;

  useEffect(() => {
    if (targetAnchor) {
        const element = document.querySelector(targetAnchor);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('animate-highlight');
            setTimeout(() => {
                element.classList.remove('animate-highlight');
            }, 2500);
        }
    }
  }, [targetAnchor]);

  return (
    <div
      className={hasBg ? 'relative bg-cover bg-center bg-fixed min-h-screen' : 'min-h-screen'}
      style={hasBg ? { backgroundImage: `url(${backgroundImage})` } : {}}
    >
      {hasBg && <div className="absolute inset-0 bg-black/60 z-0"></div>}
      
      <div className="relative z-10 container mx-auto px-4 py-28 sm:py-32">
          <button 
              onClick={onBack} 
              className={`flex items-center mb-8 font-semibold transition-colors duration-300 ${hasBg ? 'text-orange-200 hover:text-white' : 'text-orange-700 hover:text-orange-900'}`}
              aria-label="Voltar para a página inicial"
          >
              <BackArrowIcon className="w-5 h-5 mr-2" />
              Voltar ao Início
          </button>
          <h2 className={`text-3xl sm:text-4xl font-bold text-center mb-12 font-ubuntu uppercase tracking-wider ${hasBg ? 'text-white text-shadow-strong' : 'text-orange-900'}`}>{title}</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {items.map((item) => {
                  const isDrinkPage = title === "Bebidas e Outros";
                  const isGoma = item.name === 'Goma de Tapioca 1kg';
                  const imageFit = isDrinkPage && !isGoma ? 'contain' : 'cover';
                  
                  return (
                    <div id={`item-${item.id}`} key={item.id} className="scroll-mt-32 rounded-lg">
                      <MenuItemCard item={item} onClick={() => onSelectItem(item)} imageFit={imageFit} />
                    </div>
                  );
              })}
          </div>
      </div>
      <style>{`
        @keyframes highlight-fade {
            0%, 50% { 
              box-shadow: 0 0 0 6px rgba(251, 146, 60, 0.6); 
            }
            100% { 
              box-shadow: 0 0 0 0px rgba(251, 146, 60, 0); 
            }
        }
        .animate-highlight {
            animation: highlight-fade 2.5s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MenuPage;
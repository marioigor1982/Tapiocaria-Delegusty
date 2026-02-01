import React, { useState, useEffect } from 'react';
import type { MenuItem, ImageInfo } from '../types';

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface ProductDetailModalProps {
  item: MenuItem;
  onClose: () => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ item, onClose }) => {
  const [activeImage, setActiveImage] = useState<ImageInfo | undefined>(
    item.images.find(img => img.isMain) || item.images[0]
  );
  
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  if (!activeImage) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-title"
    >
      <div 
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden animate-grow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-orange-600 transition-all duration-300 z-20 bg-white/80 rounded-full p-1.5 shadow-md hover:scale-110"
          aria-label="Fechar"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Image Gallery */}
        <div className="w-full md:w-1/2 p-6 flex flex-col gap-4 bg-orange-50/30">
            <div className="aspect-square bg-white rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
                <img 
                    src={activeImage.url} 
                    alt={`Imagem principal de ${item.name}`} 
                    className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" 
                />
            </div>
            {item.images.length > 1 && (
                <div className="grid grid-cols-5 gap-3 mt-2">
                    {item.images.map((image, index) => (
                        <button 
                            key={index}
                            onClick={() => setActiveImage(image)}
                            className={`aspect-square rounded-lg overflow-hidden ring-2 ring-offset-2 transition-all duration-300 ${activeImage.url === image.url ? 'ring-orange-500 scale-105' : 'ring-transparent hover:ring-orange-300'}`}
                            aria-label={`Ver imagem ${index + 1} de ${item.name}`}
                        >
                             <img src={image.url} alt={`Miniatura ${index + 1} de ${item.name}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center overflow-y-auto">
          <span className="text-orange-500 font-semibold text-sm uppercase tracking-widest mb-2">Detalhes do Produto</span>
          <h3 id="product-title" className="text-4xl font-bold text-orange-900 mb-6 font-ubuntu leading-tight">{item.name}</h3>
          <p className="text-gray-700 text-lg mb-8 leading-relaxed border-l-4 border-orange-200 pl-4">{item.description}</p>
          
          <div className="mt-auto flex items-end justify-between">
            <div className="flex flex-col">
                <span className="text-gray-400 text-sm">Preço</span>
                <p className="text-4xl font-black text-orange-700">{item.price}</p>
            </div>
            <button 
                onClick={onClose}
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-orange-200"
            >
                Fechar
            </button>
          </div>
        </div>
      </div>
       <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes grow-modal {
            0% { transform: scale(0.6); opacity: 0; filter: blur(10px); }
            100% { transform: scale(1); opacity: 1; filter: blur(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-grow-modal { animation: grow-modal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      `}</style>
    </div>
  );
};

export default ProductDetailModal;
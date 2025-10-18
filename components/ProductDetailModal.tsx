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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-title"
    >
      <div 
        className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 transition-colors z-20 bg-white/50 rounded-full p-1"
          aria-label="Fechar"
        >
          <CloseIcon className="w-6 h-6" />
        </button>

        {/* Image Gallery */}
        <div className="w-full md:w-1/2 p-4 flex flex-col gap-4">
            <div className="aspect-w-1 aspect-h-1 bg-gray-100 rounded-lg overflow-hidden">
                <img src={activeImage.url} alt={`Imagem principal de ${item.name}`} className="w-full h-full object-cover" />
            </div>
            {item.images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                    {item.images.map((image, index) => (
                        <button 
                            key={index}
                            onClick={() => setActiveImage(image)}
                            className={`aspect-w-1 aspect-h-1 rounded-md overflow-hidden ring-2 ring-offset-2 transition-all ${activeImage.url === image.url ? 'ring-orange-500' : 'ring-transparent hover:ring-orange-300'}`}
                            aria-label={`Ver imagem ${index + 1} de ${item.name}`}
                        >
                             <img src={image.url} alt={`Miniatura ${index + 1} de ${item.name}`} className="w-full h-full object-cover" />
                        </button>
                    ))}
                </div>
            )}
        </div>

        {/* Product Details */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-center overflow-y-auto">
          <h3 id="product-title" className="text-3xl font-bold text-orange-900 mb-4 font-ubuntu">{item.name}</h3>
          <p className="text-gray-600 mb-6 leading-relaxed">{item.description}</p>
          <p className="text-3xl font-bold text-orange-700 mt-auto">{item.price}</p>
        </div>
      </div>
       <style>{`
        @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        @keyframes scale-up {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
        .animate-scale-up { animation: scale-up 0.3s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default ProductDetailModal;
import React, { useState, useEffect } from 'react';
import type { MenuItem, ImageInfo } from '../types';
import { useStoreStatus } from '../hooks/useStoreStatus';

const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface ProductDetailModalProps {
  item: MenuItem;
  onClose: () => void;
  onOrder?: (item: MenuItem) => void;
  currentQuantity?: number;
  onQuantityChange?: (itemId: number, newQty: number) => void;
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
  item, 
  onClose, 
  onOrder,
  currentQuantity,
  onQuantityChange 
}) => {
  const storeStatus = useStoreStatus();
  const [activeImage, setActiveImage] = useState<ImageInfo | undefined>(
    item.images.find(img => img.isMain) || item.images[0]
  );
  const qty = currentQuantity !== undefined ? currentQuantity : 0;
  
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
          
          <div className="mt-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-4 border-t border-orange-100">
            <div className="flex flex-col">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Preço</span>
                <p className="text-3xl sm:text-4xl font-black text-orange-700">{item.price}</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-end gap-3">
              {onQuantityChange ? (
                <div className="flex items-center gap-3">
                  {storeStatus.isOpen ? (
                    <div className="flex items-center bg-stone-100 rounded-xl p-1 border border-stone-300 shadow-inner">
                      <button
                        type="button"
                        onClick={() => onQuantityChange(item.id, qty - 1)}
                        disabled={qty <= 0}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg font-bold text-lg transition-all ${
                          qty > 0
                            ? 'bg-white text-stone-700 hover:bg-red-500 hover:text-white shadow-sm'
                            : 'text-stone-300 cursor-not-allowed'
                        }`}
                        aria-label="Diminuir quantidade"
                      >
                        -
                      </button>
                      <span className="w-10 text-center font-black text-base py-1 text-stone-900">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => onQuantityChange(item.id, qty + 1)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg font-bold text-lg bg-green-600 text-white hover:bg-green-700 shadow-sm transition-all hover:scale-105"
                        aria-label="Adicionar quantidade"
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <div className="text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-100 border border-stone-300 text-stone-600 font-bold text-xs">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Loja Fechada (18h - 23:59h)
                      </span>
                    </div>
                  )}
                  <button 
                      onClick={onClose}
                      className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-md text-sm cursor-pointer"
                  >
                      Concluído
                  </button>
                </div>
              ) : (
                <>
                  <button 
                      onClick={onClose}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-3 rounded-xl font-semibold transition-all text-sm cursor-pointer"
                  >
                      Fechar
                  </button>
                  {onOrder && (
                    storeStatus.isOpen ? (
                      <button 
                          onClick={() => {
                            onOrder(item);
                            onClose();
                          }}
                          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-green-200 text-sm flex items-center gap-2 hover:scale-105 cursor-pointer"
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.67 0-1.19-.578-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                          Fazer Pedido
                      </button>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-100 border border-stone-300 text-stone-700 font-bold text-xs sm:text-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                          <span>Pedidos fechados agora</span>
                        </div>
                        <span className="text-[11px] text-stone-500 font-medium mt-1">
                          {storeStatus.nextOpenText} • Seg a Sáb (18h - 23:59h)
                        </span>
                      </div>
                    )
                  )}
                </>
              )}
            </div>
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
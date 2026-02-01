import React from 'react';
import type { MenuItem } from '../types';

const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.116 3.986 1.24 5.383c.246 1.062-.923 1.918-1.86 1.349L12 18.348l-4.632 2.872c-.937.57-2.106-.287-1.86-1.349l1.24-5.383-4.116-3.986c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.007z" clipRule="evenodd" />
    </svg>
);

interface MenuItemCardProps {
  item: MenuItem;
  onClick: () => void;
  imageFit?: 'cover' | 'contain';
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item, onClick, imageFit = 'cover' }) => {
  const mainImage = item.images.find(img => img.isMain) || item.images[0];
  const imageUrl = mainImage ? mainImage.url : 'https://placehold.co/800x600/FFF/333?text=Imagem+Indisponível';

  return (
    <div 
      className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:-translate-y-3 hover:scale-[1.03] transition-all duration-500 group flex flex-col cursor-pointer ring-0 hover:ring-4 hover:ring-orange-200"
      onClick={onClick}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${item.name}`}
    >
      <div className="overflow-hidden h-52 bg-white relative">
        <img
          src={imageUrl}
          alt={item.name}
          className={`w-full h-full ${imageFit === 'contain' ? 'object-contain p-4' : 'object-cover'} group-hover:scale-110 transition-transform duration-700`}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 flex items-center justify-center">
            <span className="bg-orange-600 text-white px-4 py-2 rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 shadow-lg">
                Ver detalhes
            </span>
        </div>
      </div>
      <div className="p-6 flex flex-col flex-grow bg-white">
        <div className="mb-2">
            <h4 className="text-xl font-bold text-orange-900 group-hover:text-orange-600 transition-colors">{item.name}</h4>
        </div>
        <p className="text-gray-500 text-sm flex-grow line-clamp-2">{item.description}</p>
        <div className="flex justify-between items-center mt-5">
            <p className="text-2xl font-black text-orange-700">{item.price}</p>
            {item.rating && (
            <div className="flex items-center gap-0.5">
                {Array.from({ length: item.rating }).map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                ))}
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
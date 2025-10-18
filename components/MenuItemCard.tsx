
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
      className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300 group flex flex-col cursor-pointer"
      onClick={onClick}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalhes de ${item.name}`}
    >
      <div className="overflow-hidden h-48 bg-white">
        <img
          src={imageUrl}
          alt={item.name}
          className={`w-full h-full ${imageFit === 'contain' ? 'object-contain p-2' : 'object-cover'} group-hover:scale-110 transition-transform duration-500`}
        />
      </div>
      <div className="p-5 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
            <h4 className="text-xl font-bold text-orange-900 pr-2">{item.name}</h4>
            {item.rating && (
            <div className="flex items-center flex-shrink-0">
                {Array.from({ length: item.rating }).map((_, i) => (
                <StarIcon key={i} className="w-4 h-4 text-yellow-400" />
                ))}
            </div>
            )}
        </div>
        <p className="text-gray-600 text-sm flex-grow">{item.description}</p>
        <p className="text-lg font-bold text-orange-700 mt-4">{item.price}</p>
      </div>
    </div>
  );
};

export default MenuItemCard;
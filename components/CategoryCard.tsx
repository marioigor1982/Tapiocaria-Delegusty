import React from 'react';

interface CategoryCardProps {
  title: string;
  imageUrl: string;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ title, imageUrl, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="relative rounded-lg shadow-lg h-80 overflow-hidden cursor-pointer group transform hover:scale-105 transition-transform duration-300"
      role="button"
      tabIndex={0}
      onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    >
      <img src={imageUrl} alt={title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
      <div className="absolute inset-0 bg-black/50 group-hover:bg-black/60 transition-colors duration-300 flex items-center justify-center p-4">
        <h3 className="text-white text-2xl font-bold text-center uppercase tracking-wider drop-shadow-lg">{title}</h3>
      </div>
    </div>
  );
};

export default CategoryCard;
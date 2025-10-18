import React from 'react';
import CategoryCard from './CategoryCard';

type Page = 'doces' | 'salgadas' | 'bebidas';

interface MenuHighlightProps {
    onNavigate: (page: Page) => void;
}

const MenuHighlight: React.FC<MenuHighlightProps> = ({ onNavigate }) => {
    return (
        <section id="menu" className="py-16 sm:py-24 bg-orange-50/50">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl sm:text-4xl font-bold text-center mb-6 text-orange-900 font-ubuntu uppercase tracking-wider">
                        Explore nosso Cardápio
                    </h2>
                    <div className="w-24 h-1 bg-orange-500 mx-auto mb-12"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    <CategoryCard
                        title="Tapiocas Doces"
                        imageUrl="https://www.mika.com.br/image/d2lkdGg9NTIwJmhlaWdodD0zMzAmemM9MSZxPTk5JnNyYz1pbWcvcmVjZWl0YXMvZm90b180Ni5qcGcmc2VjdXJlPXtidXJufQ==.jpg"
                        onClick={() => onNavigate('doces')}
                    />
                    <CategoryCard
                        title="Tapiocas Salgadas"
                        imageUrl="https://blogger.googleusercontent.com/img/a/AVvXsEjwiogmk7qAI0NErXyvIN2qAJQV9yI_52i4j7HhrjX38YjtDKPRZseEO_KlvJ2qigUNemzqfZnbkkvhMUqNcp77RbhkL9nXxGkkTb_gMX8v0gxtLvWU7Z66JLeIwvdW0zF4exFj26CkLbwsTqhYjrsXTJySL5kh7Gu5nzecRhVjgk_89ieGDw3tSIep=w640-h426"
                        onClick={() => onNavigate('salgadas')}
                    />
                    <CategoryCard
                        title="Bebidas e Outros"
                        imageUrl="https://img.freepik.com/fotos-gratis/refrigerante-colorido-bebe-tiro-macro_53876-18225.jpg?semt=ais_hybrid&w=740"
                        onClick={() => onNavigate('bebidas')}
                    />
                </div>
            </div>
        </section>
    );
};

export default MenuHighlight;

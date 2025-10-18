import React, { useState } from 'react';
import Header from './components/Header';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import MenuPage from './components/MenuPage';
import ProductDetailModal from './components/ProductDetailModal';
import { SALTY_TAPIOCAS, SWEET_TAPIOCAS, BEBIDAS_E_OUTROS } from './constants';
import type { Page, MenuItem } from './types';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [targetAnchor, setTargetAnchor] = useState<string | null>(null);

  const saltyWithCategory = SALTY_TAPIOCAS.map(item => ({ ...item, category: 'salgadas' as Page }));
  const sweetWithCategory = SWEET_TAPIOCAS.map(item => ({ ...item, category: 'doces' as Page }));
  const drinksWithCategory = BEBIDAS_E_OUTROS.map(item => ({ ...item, category: 'bebidas' as Page }));
  const allItems = [...saltyWithCategory, ...sweetWithCategory, ...drinksWithCategory];

  const handleNavigation = (page: Page, anchor?: string) => {
    setCurrentPage(page);
    setTargetAnchor(anchor || null); 

    if (page === 'home' && anchor) {
      setTimeout(() => {
        const element = document.querySelector(anchor);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else if (!anchor) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSearchResultSelect = (item: MenuItem) => {
    if (item.category) {
        handleNavigation(item.category, `#item-${item.id}`);
    }
  };

  const goHome = () => handleNavigation('home');

  const handleShowItemDetails = (item: MenuItem) => {
    setSelectedItem(item);
  };

  return (
    <div className="bg-orange-50 min-h-screen text-gray-800">
      <Header 
        onNavigate={handleNavigation} 
        allItems={allItems}
        onSearchResultSelect={handleSearchResultSelect}
      />
      <main>
        {currentPage === 'home' && <HomePage onNavigate={(category) => handleNavigation(category)} />}
        {currentPage === 'salgadas' && <MenuPage 
                                            title="Tapiocas Salgadas" 
                                            items={SALTY_TAPIOCAS} 
                                            onBack={goHome}
                                            onSelectItem={handleShowItemDetails}
                                            backgroundImage="https://i.pinimg.com/originals/52/7e/aa/527eaa0f9ced13fb93d73dbd414c8c3f.jpg"
                                            targetAnchor={targetAnchor}
                                        />}
        {currentPage === 'doces' && <MenuPage 
                                        title="Tapiocas Doces" 
                                        items={SWEET_TAPIOCAS} 
                                        onBack={goHome} 
                                        onSelectItem={handleShowItemDetails}
                                        backgroundImage="https://www.frimesa.com.br/upload/image/recipe/recipe_05_img2_tapioca-de-doce-de-leite.jpg"
                                        targetAnchor={targetAnchor}
                                    />}
        {currentPage === 'bebidas' && <MenuPage 
                                          title="Bebidas e Outros" 
                                          items={BEBIDAS_E_OUTROS} 
                                          onBack={goHome}
                                          onSelectItem={handleShowItemDetails}
                                          backgroundImage="https://img.freepik.com/fotos-premium/bebidas-gaseificadas-salpicos-de-agua-cor-fundo-preto-natural_1091270-9168.jpg?semt=ais_hybrid&w=740"
                                          targetAnchor={targetAnchor}
                                      />}
      </main>
      <Footer />
      <FloatingWhatsApp />
      {selectedItem && <ProductDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  );
};

export default App;
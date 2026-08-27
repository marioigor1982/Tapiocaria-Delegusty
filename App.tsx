import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Header from './components/Header';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import FloatingIFood from './components/FloatingIFood';
import OrderModal from './components/OrderModal';
import Footer from './components/Footer';
import HomePage from './components/HomePage';
import MenuPage from './components/MenuPage';
import ProductDetailModal from './components/ProductDetailModal';
import { SALTY_TAPIOCAS, SWEET_TAPIOCAS, BEBIDAS_E_OUTROS } from './constants';
import type { Page, MenuItem } from './types';

// Utility to create URL slugs
const slugify = (text: string) => 
  text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [targetAnchor, setTargetAnchor] = useState<string | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [preselectedOrderItemId, setPreselectedOrderItemId] = useState<number | undefined>(undefined);

  // Memoize all items with their category for URL lookups and ordering
  const allItems = useMemo(() => {
    const salty = SALTY_TAPIOCAS.map(item => ({ ...item, category: 'salgadas' as Page }));
    const sweet = SWEET_TAPIOCAS.map(item => ({ ...item, category: 'doces' as Page }));
    const drinks = BEBIDAS_E_OUTROS.map(item => ({ ...item, category: 'bebidas' as Page }));
    return [...salty, ...sweet, ...drinks];
  }, []);

  // Logic to parse the current URL and update state
  const parseUrl = useCallback(() => {
    const path = window.location.pathname.split('/').filter(Boolean);
    const category = path[0] as Page;
    const productSlug = path[1];

    if (category && ['doces', 'salgadas', 'bebidas'].includes(category)) {
      setCurrentPage(category);
      if (productSlug) {
        const item = allItems.find(i => slugify(i.name) === productSlug && i.category === category);
        if (item) {
          setSelectedItem(item);
        } else {
          setSelectedItem(null);
        }
      } else {
        setSelectedItem(null);
      }
    } else {
      setCurrentPage('home');
      setSelectedItem(null);
    }
  }, [allItems]);

  // Sync state with browser navigation
  useEffect(() => {
    parseUrl();
    window.addEventListener('popstate', parseUrl);
    return () => window.removeEventListener('popstate', parseUrl);
  }, [parseUrl]);

  // Update URL function
  const updateUrl = (page: Page, item?: MenuItem) => {
    let newPath = '/';
    if (page !== 'home') {
      newPath = `/${page}`;
      if (item) {
        newPath += `/${slugify(item.name)}`;
      }
    }
    
    if (window.location.pathname !== newPath) {
      window.history.pushState(null, '', newPath);
    }
  };

  const handleNavigation = (page: Page, anchor?: string) => {
    setCurrentPage(page);
    setTargetAnchor(anchor || null);
    setSelectedItem(null);
    updateUrl(page);

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

  const handleShowItemDetails = (item: MenuItem) => {
    setSelectedItem(item);
    const category = item.category || currentPage;
    updateUrl(category as Page, item);
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    updateUrl(currentPage);
  };

  const handleSearchResultSelect = (item: MenuItem) => {
    if (item.category) {
        handleNavigation(item.category, `#item-${item.id}`);
        handleShowItemDetails(item);
    }
  };

  const handleOpenOrder = (item?: MenuItem) => {
    if (item) {
      setPreselectedOrderItemId(item.id);
    } else {
      setPreselectedOrderItemId(undefined);
    }
    setIsOrderModalOpen(true);
  };

  const handleCloseOrder = () => {
    setIsOrderModalOpen(false);
    setPreselectedOrderItemId(undefined);
  };

  const goHome = () => handleNavigation('home');

  return (
    <div className="bg-orange-50 min-h-screen text-gray-800">
      <Header 
        onNavigate={handleNavigation} 
        allItems={allItems}
        onSearchResultSelect={handleSearchResultSelect}
        onOpenOrder={() => handleOpenOrder()}
      />
      <main>
        {currentPage === 'home' && (
          <HomePage 
            onNavigate={(category) => handleNavigation(category)} 
            onOpenOrder={() => handleOpenOrder()}
          />
        )}
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
                                        backgroundImage="https://imgur.com/sRE8o8g.jpg"
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

      {/* Floating Buttons: Only shown on Home page as requested */}
      {currentPage === 'home' && (
        <>
          <FloatingIFood />
          <FloatingWhatsApp />
        </>
      )}

      {selectedItem && (
        <ProductDetailModal 
          item={selectedItem} 
          onClose={handleCloseModal}
          onOrder={(item) => handleOpenOrder(item)}
        />
      )}

      {isOrderModalOpen && (
        <OrderModal 
          allItems={allItems}
          initialItemId={preselectedOrderItemId}
          onClose={handleCloseOrder}
        />
      )}
    </div>
  );
};

export default App;
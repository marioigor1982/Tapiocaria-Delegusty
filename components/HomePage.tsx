import React from 'react';
import Hero from './Hero';
import AboutUs from './AboutUs';
import Gallery from './Gallery';
import MenuHighlight from './MenuHighlight';

type Page = 'doces' | 'salgadas' | 'bebidas';

interface HomePageProps {
    onNavigate: (page: Page) => void;
    onOpenOrder?: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate, onOpenOrder }) => {
  return (
    <>
      <Hero onOpenOrder={onOpenOrder} />
      <AboutUs />
      <Gallery />
      <MenuHighlight onNavigate={onNavigate} />
    </>
  );
};

export default HomePage;

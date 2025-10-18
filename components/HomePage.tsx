import React from 'react';
import Hero from './Hero';
import AboutUs from './AboutUs';
import MenuHighlight from './MenuHighlight';

type Page = 'doces' | 'salgadas' | 'bebidas';

interface HomePageProps {
    onNavigate: (page: Page) => void;
}

const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  return (
    <>
      <Hero />
      <AboutUs />
      <MenuHighlight onNavigate={onNavigate} />
    </>
  );
};

export default HomePage;

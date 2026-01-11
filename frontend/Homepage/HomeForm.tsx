import React from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import FeatureSection from './FeatureSection';
import Footer from './Footer';

interface HomePageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ onLoginClick, onRegisterClick }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar onLoginClick={onLoginClick} onRegisterClick={onRegisterClick} />
      <main className="flex-grow">
        <HeroSection />
        <FeatureSection />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
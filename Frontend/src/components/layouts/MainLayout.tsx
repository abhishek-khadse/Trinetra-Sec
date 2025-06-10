import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../navigation/Navbar';
import Footer from '../navigation/Footer';
import MobileMenu from '../navigation/MobileMenu';

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-dark-800 text-gray-100">
      <Navbar onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Outlet />
      </main>
      
      <Footer />
    </div>
  );
};

export default MainLayout;
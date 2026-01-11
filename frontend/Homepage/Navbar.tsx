import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from './Icons';

interface NavbarProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, onRegisterClick }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '#', text: 'Trang chủ' },
    { href: '/register', text: 'Làm bài' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-2 sm:px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 sm:h-16">
          {/* Logo/App Name */}
          <div className="flex-shrink-0">
            <a href="#" className="text-2xl font-bold text-sky-600 hover:text-sky-700 transition-colors">
              QuizSpark
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex md:items-center md:space-x-4 lg:space-x-6">
            {navLinks.map((link) => (
              <a
                key={link.text}
                href={link.href}
                className="text-slate-600 hover:text-sky-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                aria-label={link.text}
              >
                {link.text}
              </a>
            ))}
          </div>

          <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-3">
            <button
              onClick={onLoginClick}
              className="text-slate-600 hover:text-sky-600 px-3 py-2 rounded-md text-sm font-medium transition-colors border border-slate-300 hover:border-sky-500"
              aria-label="Đăng nhập"
            >
              Đăng nhập
            </button>
            <button
              onClick={onRegisterClick}
              className="bg-sky-500 text-white hover:bg-sky-600 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              aria-label="Đăng ký"
            >
              Đăng ký
            </button>
          </div>


          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-sky-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-sky-500 transition-all"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? "Close main menu" : "Open main menu"}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div id="mobile-menu" className="md:hidden border-t border-slate-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <a
                key={`mobile-${link.text}`}
                href={link.href}
                className="text-slate-600 hover:bg-sky-50 hover:text-sky-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                aria-label={link.text}
              >
                {link.text}
              </a>
            ))}
          </div>
          <div className="pt-2 pb-3 border-t border-slate-200">
            <div className="px-2 space-y-1 sm:px-3">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); onLoginClick(); }}
                className="text-slate-600 hover:bg-sky-50 hover:text-sky-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                aria-label="Đăng nhập"
              >
                Đăng nhập
              </a>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); onRegisterClick(); }}
                className="text-slate-600 hover:bg-sky-50 hover:text-sky-600 block px-3 py-2 rounded-md text-base font-medium transition-colors"
                aria-label="Đăng ký"
              >
                Đăng ký
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
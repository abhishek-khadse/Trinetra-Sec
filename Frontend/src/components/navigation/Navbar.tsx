import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Eye, Menu, Bell, User, Shield, LogOut, Book, Users, Brain } from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import MegaMenu from './MegaMenu';
import Button from '../ui/Button';

interface NavbarProps {
  onMenuToggle: () => void;
}

const Navbar = ({ onMenuToggle }: NavbarProps) => {
  const { user, signOut } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMegaMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Security', href: '/file-scanner' },
    { name: 'Learning', href: '/learn/case-studies' },
    { name: 'Knowledge', href: '/web-security' },
    { name: 'Docs', href: '/docs' },
    { name: 'Community', href: '/community' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-dark-900/95 backdrop-blur-sm border-b border-dark-700 shadow-md' : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo and site name */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <Eye className="h-8 w-8 text-primary-500 animate-glow" />
                <span className="ml-2 text-xl font-bold text-white">
                  Trinetra<span className="text-secondary-500">Sec</span>
                </span>
              </Link>
            </div>

            {/* Desktop navigation */}
            <nav className="hidden md:flex space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-primary-400 ${
                    location.pathname === link.href
                      ? 'text-primary-500'
                      : 'text-gray-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <button 
                onClick={() => setMegaMenuOpen(!megaMenuOpen)}
                className="text-sm font-medium transition-colors hover:text-primary-400 text-gray-300 flex items-center"
              >
                More
                <svg 
                  className={`ml-1 h-4 w-4 transition-transform ${megaMenuOpen ? 'rotate-180' : ''}`} 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>

            {/* User controls */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <button className="text-gray-300 hover:text-primary-400 relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 bg-secondary-500 text-dark-900 text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      3
                    </span>
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center text-sm text-gray-300 hover:text-primary-400"
                    >
                      <div className="w-8 h-8 rounded-full bg-dark-600 border border-dark-500 flex items-center justify-center overflow-hidden">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </div>
                    </button>
                    {userMenuOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-dark-700 border border-dark-600 rounded-md shadow-lg py-1 z-50">
                        <div className="px-4 py-2 border-b border-dark-600">
                          <p className="text-sm font-medium text-white">{user.username || user.email}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 flex items-center"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Profile
                        </Link>
                        {user.role === 'admin' && (
                          <Link
                            to="/admin/users"
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 flex items-center"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Admin Panel
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleSignOut();
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-600 flex items-center"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex space-x-2">
                  <Link to="/auth/signin">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hidden md:flex"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth/signup">
                    <Button
                      variant="primary"
                      size="sm"
                      className="hidden md:flex"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                className="md:hidden text-gray-300 hover:text-primary-500"
                onClick={onMenuToggle}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mega Menu */}
      <MegaMenu isOpen={megaMenuOpen} onClose={() => setMegaMenuOpen(false)} />

      {/* Spacer for fixed header */}
      <div className="h-16"></div>
    </>
  );
};

export default Navbar;
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { X, Home, BarChart2, FileText, AlertTriangle, Eye, Zap, Lock, Book, Users } from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import Button from '../ui/Button';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { user, signOut } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent scrolling when menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-dark-900/95 backdrop-blur-sm overflow-y-auto md:hidden">
      <div 
        className="flex flex-col h-full pt-16 pb-6 px-4"
        ref={menuRef}
      >
        <div className="flex justify-end">
          <button
            className="text-gray-400 hover:text-primary-500"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* User info if logged in */}
        {user && (
          <div className="border-b border-dark-700 pb-4 mb-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-dark-600 border border-dark-500 flex items-center justify-center overflow-hidden">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.username || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-white font-medium">{user.username || user.email}</p>
                <p className="text-gray-400 text-sm">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation links */}
        <nav className="flex-grow">
          <ul className="space-y-4">
            <li>
              <Link
                to="/"
                className="flex items-center py-2 text-gray-300 hover:text-primary-500"
                onClick={onClose}
              >
                <Home className="h-5 w-5 mr-3" />
                Home
              </Link>
            </li>
            {user && (
              <li>
                <Link
                  to="/dashboard"
                  className="flex items-center py-2 text-gray-300 hover:text-primary-500"
                  onClick={onClose}
                >
                  <BarChart2 className="h-5 w-5 mr-3" />
                  Dashboard
                </Link>
              </li>
            )}
            <li>
              <Link
                to="/file-scanner"
                className="flex items-center py-2 text-gray-300 hover:text-primary-500"
                onClick={onClose}
              >
                <FileText className="h-5 w-5 mr-3" />
                File Scanner
              </Link>
            </li>
            <li>
              <Link
                to="/threat-feeds"
                className="flex items-center py-2 text-gray-300 hover:text-primary-500"
                onClick={onClose}
              >
                <AlertTriangle className="h-5 w-5 mr-3" />
                Threat Feeds
              </Link>
            </li>
            <li>
              <Link
                to="/"
                className="flex items-center py-2 text-gray-300 hover:text-primary-500"
                onClick={onClose}
              >
                <Eye className="h-5 w-5 mr-3" />
                ReverseX
              </Link>
            </li>
            <li>
              <Link
                to="/"
                className="flex items-center py-2 text-gray-300 hover:text-primary-500"
                onClick={onClose}
              >
                <Zap className="h-5 w-5 mr-3" />
                DDoS Shield
              </Link>
            </li>
            <li>
              <Link
                to="/"
                className="flex items-center py-2 text-gray-300 hover:text-primary-500"
                onClick={onClose}
              >
                <Lock className="h-5 w-5 mr-3" />
                Phishing Detector
              </Link>
            </li>
            <li>
              <Link
                to="/"
                className="flex items-center py-2 text-gray-300 hover:text-primary-500"
                onClick={onClose}
              >
                <Book className="h-5 w-5 mr-3" />
                Documentation
              </Link>
            </li>
            <li>
              <Link
                to="/"
                className="flex items-center py-2 text-gray-300 hover:text-primary-500"
                onClick={onClose}
              >
                <Users className="h-5 w-5 mr-3" />
                Community
              </Link>
            </li>
          </ul>
        </nav>

        {/* Auth buttons */}
        <div className="mt-6 pt-6 border-t border-dark-700">
          {user ? (
            <Button
              variant="ghost"
              fullWidth
              leftIcon={<X className="h-4 w-4" />}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          ) : (
            <div className="space-y-2">
              <Link to="/auth/signin" onClick={onClose}>
                <Button variant="outline" fullWidth>
                  Sign In
                </Button>
              </Link>
              <Link to="/auth/signup" onClick={onClose}>
                <Button variant="primary" fullWidth>
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileMenu;
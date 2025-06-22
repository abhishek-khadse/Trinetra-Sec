import { Outlet } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col">
      {/* Nav for logo */}
      <nav className="bg-dark-900 border-b border-dark-700 py-4">
        <div className="container mx-auto px-4">
          <Link to="/" className="flex items-center">
            <Eye className="h-8 w-8 text-primary-500 animate-glow" />
            <span className="ml-2 text-xl font-bold text-white">
              Trinetra<span className="text-secondary-500">Sec</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Outlet />
        </div>
      </div>

      <footer className="py-4 bg-dark-900 border-t border-dark-700">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} TrinetraSec. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default AuthLayout;
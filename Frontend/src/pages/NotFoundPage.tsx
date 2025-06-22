import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-dark-800 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-secondary-500/20 p-4 rounded-full">
            <AlertTriangle className="h-16 w-16 text-secondary-500 animate-pulse" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <h2 className="text-2xl font-medium text-gray-300 mb-6">Page Not Found</h2>
        
        <p className="text-gray-400 mb-8">
          The page you are looking for doesn't exist or has been moved.
          Please check the URL or navigate back to the home page.
        </p>
        
        <Link to="/">
          <Button leftIcon={<Home className="h-4 w-4" />}>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
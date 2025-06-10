import { Link } from 'react-router-dom';
import { Eye, Github, Twitter, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-dark-900 border-t border-dark-700 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <Link to="/" className="flex items-center">
              <Eye className="h-8 w-8 text-primary-500" />
              <span className="ml-2 text-xl font-bold text-white">
                Trinetra<span className="text-secondary-500">Sec</span>
              </span>
            </Link>
            <p className="mt-4 text-gray-400 text-sm">
              The third eye of cybersecurity. Advanced threat detection and protection for modern enterprises.
            </p>
            <div className="flex mt-6 space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary-500">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary-500">
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/file-scanner" className="text-gray-400 hover:text-primary-400">
                  File Scanner
                </Link>
              </li>
              <li>
                <Link to="/threat-feeds" className="text-gray-400 hover:text-primary-400">
                  Threat Feeds
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  ReverseX
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  DDoS Shield
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  Phishing Detector
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  Documentation
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  API Reference
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  Community Forums
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-white font-medium mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-400 hover:text-primary-400">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-dark-700 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} TrinetraSec. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-8 text-sm">
              <li>
                <Link to="/" className="text-gray-500 hover:text-primary-400">
                  Privacy
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-500 hover:text-primary-400">
                  Terms
                </Link>
              </li>
              <li>
                <Link to="/" className="text-gray-500 hover:text-primary-400">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
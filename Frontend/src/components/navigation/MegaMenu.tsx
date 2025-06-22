import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Shield, Eye, Lock, Terminal, Database, AlertTriangle, Book, Users, Zap, Brain, Cloud, Network, Smartphone, Code, Laptop, School } from 'lucide-react';

interface MegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MegaMenu = ({ isOpen, onClose }: MegaMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="absolute top-[64px] left-0 right-0 z-40 bg-dark-800/95 backdrop-blur-sm border-b border-dark-700 shadow-xl"
      ref={menuRef}
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-8">
          {/* Core Modules */}
          <div>
            <h3 className="text-primary-500 font-semibold mb-4 flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security Modules
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/file-scanner" 
                  className="flex items-center text-gray-300 hover:text-primary-500 transition-colors"
                  onClick={onClose}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span>File Scanner</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/reversex" 
                  className="flex items-center text-gray-300 hover:text-primary-500 transition-colors"
                  onClick={onClose}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span>ReverseX</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/ddos-shield" 
                  className="flex items-center text-gray-300 hover:text-primary-500 transition-colors"
                  onClick={onClose}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  <span>DDoS Shield</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/phishing-detector" 
                  className="flex items-center text-gray-300 hover:text-primary-500 transition-colors"
                  onClick={onClose}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  <span>Phishing Detector</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/threat-feeds" 
                  className="flex items-center text-gray-300 hover:text-primary-500 transition-colors"
                  onClick={onClose}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>Threat Feeds</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Knowledge Centers */}
          <div>
            <h3 className="text-secondary-500 font-semibold mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2" />
              Knowledge Centers
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/web-security" 
                  className="flex items-center text-gray-300 hover:text-secondary-500 transition-colors"
                  onClick={onClose}
                >
                  <Laptop className="h-4 w-4 mr-2" />
                  <span>Web Security</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/app-security" 
                  className="flex items-center text-gray-300 hover:text-secondary-500 transition-colors"
                  onClick={onClose}
                >
                  <Code className="h-4 w-4 mr-2" />
                  <span>Application Security</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/mobile-security" 
                  className="flex items-center text-gray-300 hover:text-secondary-500 transition-colors"
                  onClick={onClose}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  <span>Mobile Security</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/ai-security" 
                  className="flex items-center text-gray-300 hover:text-secondary-500 transition-colors"
                  onClick={onClose}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  <span>AI/ML Security</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/cloud-security" 
                  className="flex items-center text-gray-300 hover:text-secondary-500 transition-colors"
                  onClick={onClose}
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  <span>Cloud Security</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/network-security" 
                  className="flex items-center text-gray-300 hover:text-secondary-500 transition-colors"
                  onClick={onClose}
                >
                  <Network className="h-4 w-4 mr-2" />
                  <span>Network Security</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Learning Center */}
          <div>
            <h3 className="text-primary-500 font-semibold mb-4 flex items-center">
              <School className="h-5 w-5 mr-2" />
              Learning Center
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/learn/case-studies" 
                  className="flex items-center text-gray-300 hover:text-primary-500 transition-colors"
                  onClick={onClose}
                >
                  <Book className="h-4 w-4 mr-2" />
                  <span>Case Studies</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/learn/quiz" 
                  className="flex items-center text-gray-300 hover:text-primary-500 transition-colors"
                  onClick={onClose}
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  <span>Quiz</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/learn/notes" 
                  className="flex items-center text-gray-300 hover:text-primary-500 transition-colors"
                  onClick={onClose}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span>Notes</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/learn/faq" 
                  className="flex items-center text-gray-300 hover:text-primary-500 transition-colors"
                  onClick={onClose}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span>FAQ</span>
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Resources */}
          <div>
            <h3 className="text-secondary-500 font-semibold mb-4 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/docs" 
                  className="flex items-center text-gray-300 hover:text-secondary-500 transition-colors"
                  onClick={onClose}
                >
                  <Book className="h-4 w-4 mr-2" />
                  <span>Documentation</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/community" 
                  className="flex items-center text-gray-300 hover:text-secondary-500 transition-colors"
                  onClick={onClose}
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span>Community</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/assistant" 
                  className="flex items-center text-gray-300 hover:text-secondary-500 transition-colors"
                  onClick={onClose}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  <span>TrinetraGPT</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MegaMenu;
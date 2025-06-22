import { Link } from 'react-router-dom';
import { FileText, AlertTriangle, Eye, Zap, Lock, ChevronRight, ExternalLink } from 'lucide-react';
import Button from '../components/ui/Button';
import Card, { CardContent } from '../components/ui/Card';
import { useState, useEffect } from 'react';
import { generateDummyStats } from '../lib/utils';

const HomePage = () => {
  const [stats, setStats] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    // In a real app, this would be fetched from an API
    setStats(generateDummyStats());
  }, []);

  return (
    <div className="space-y-20">
      {/* Hero Section */}
      <section className="py-12 lg:py-20 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-6">
              <span className="text-white">TrinetraSec</span>
              <span className="block mt-2">
                The 
                <span className="text-primary-500 animate-glow"> Third Eye </span>
                of 
                <span className="text-secondary-500 animate-red-glow"> Cybersecurity</span>
              </span>
            </h1>
            <p className="text-gray-300 text-lg mb-8">
              Advanced threat detection and protection platform for modern enterprises.
              Identify vulnerabilities, detect malware, and protect your digital assets with our
              comprehensive cybersecurity solution.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/file-scanner">
                <Button size="lg">
                  Start Scanning
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/threat-feeds">
                <Button variant="outline" size="lg">
                  Explore Threat Feeds
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-dark-700 border border-dark-600 rounded-lg p-6 shadow-xl">
            {/* Live Stats Display */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-white mb-2">Live Threat Intelligence</h3>
              <p className="text-gray-400">Real-time cybersecurity statistics</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 text-center">
                <h4 className="text-gray-400 text-sm">Malware Detected</h4>
                <p className="text-4xl font-bold text-primary-500 animate-pulse">{stats.malware || 0}</p>
              </div>
              
              <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 text-center">
                <h4 className="text-gray-400 text-sm">Phishing Attempts</h4>
                <p className="text-4xl font-bold text-secondary-500 animate-pulse">{stats.phishing || 0}</p>
              </div>
              
              <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 text-center">
                <h4 className="text-gray-400 text-sm">Ransomware</h4>
                <p className="text-4xl font-bold text-error animate-pulse">{stats.ransomware || 0}</p>
              </div>
              
              <div className="bg-dark-800 border border-dark-600 rounded-lg p-4 text-center">
                <h4 className="text-gray-400 text-sm">Vulnerabilities</h4>
                <p className="text-4xl font-bold text-warning animate-pulse">{stats.vulnerabilities || 0}</p>
              </div>
              
              <div className="col-span-2 bg-dark-800 border border-dark-600 rounded-lg p-4 text-center">
                <h4 className="text-gray-400 text-sm">Attacks Blocked (Today)</h4>
                <p className="text-4xl font-bold text-success animate-pulse">{stats.blockedAttacks || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Comprehensive Security Modules</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Protect your digital assets with our suite of advanced security tools,
            designed to detect and mitigate modern cyber threats.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <Card glowEffect="blue" isHoverable>
            <CardContent>
              <div className="flex items-center mb-4">
                <div className="bg-primary-500/20 p-3 rounded-lg">
                  <FileText className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="ml-3 text-xl font-semibold text-white">File Scanner</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Advanced malware detection powered by YARA rules and machine learning. Scan files for
                known and unknown threats.
              </p>
              <Link to="/file-scanner">
                <Button variant="outline" className="mt-2 w-full">
                  Scan Files
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Feature 2 */}
          <Card glowEffect="red" isHoverable>
            <CardContent>
              <div className="flex items-center mb-4">
                <div className="bg-secondary-500/20 p-3 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-secondary-500" />
                </div>
                <h3 className="ml-3 text-xl font-semibold text-white">Threat Feeds</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Real-time intelligence on the latest threats, vulnerabilities, and IOCs. Stay
                ahead of emerging threats.
              </p>
              <Link to="/threat-feeds">
                <Button variant="outline" className="mt-2 w-full">
                  View Threats
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Feature 3 */}
          <Card glowEffect="blue" isHoverable>
            <CardContent>
              <div className="flex items-center mb-4">
                <div className="bg-primary-500/20 p-3 rounded-lg">
                  <Eye className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="ml-3 text-xl font-semibold text-white">ReverseX</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Binary analysis toolkit for reverse engineering suspicious executables.
                Identify malicious behavior and potential threats.
              </p>
              <Button variant="outline" className="mt-2 w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Feature 4 */}
          <Card glowEffect="red" isHoverable>
            <CardContent>
              <div className="flex items-center mb-4">
                <div className="bg-secondary-500/20 p-3 rounded-lg">
                  <Zap className="h-6 w-6 text-secondary-500" />
                </div>
                <h3 className="ml-3 text-xl font-semibold text-white">DDoS Shield</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Protect your infrastructure from distributed denial-of-service attacks with
                our advanced traffic analysis and mitigation system.
              </p>
              <Button variant="outline" className="mt-2 w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Feature 5 */}
          <Card glowEffect="blue" isHoverable className="md:col-span-2 lg:col-span-1">
            <CardContent>
              <div className="flex items-center mb-4">
                <div className="bg-primary-500/20 p-3 rounded-lg">
                  <Lock className="h-6 w-6 text-primary-500" />
                </div>
                <h3 className="ml-3 text-xl font-semibold text-white">Phishing Detector</h3>
              </div>
              <p className="text-gray-400 mb-4">
                Identify and block phishing attempts with our URL and email analysis tool.
                Protect your organization from social engineering attacks.
              </p>
              <Button variant="outline" className="mt-2 w-full">
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* MITRE ATT&CK Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">MITRE ATT&CK® Coverage</h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Our platform maps to the MITRE ATT&CK framework, providing comprehensive coverage
            against common attack vectors and techniques.
          </p>
        </div>

        <div className="bg-dark-700 border border-dark-600 rounded-lg overflow-hidden">
          <div className="grid grid-cols-4 md:grid-cols-8 gap-px bg-dark-600">
            {/* MITRE ATT&CK Matrix - Simplified representation */}
            {Array.from({ length: 32 }).map((_, i) => {
              // Calculate a "coverage" score - would be real data in actual app
              const coverage = Math.random();
              let bgColor = 'bg-dark-800';
              
              if (coverage > 0.8) {
                bgColor = 'bg-success/20';
              } else if (coverage > 0.5) {
                bgColor = 'bg-info/20';
              } else if (coverage > 0.3) {
                bgColor = 'bg-warning/20';
              } else {
                bgColor = 'bg-error/20';
              }
              
              return (
                <div 
                  key={i} 
                  className={`aspect-square ${bgColor} hover:bg-dark-700 transition-colors cursor-pointer`}
                  title={`ATT&CK Technique T${1000 + i}`}
                >
                  <div className="h-full flex items-center justify-center text-xs text-gray-400 font-mono">
                    T{1000 + i}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="p-4 bg-dark-800 border-t border-dark-600 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              Mapping to MITRE ATT&CK v10.1
            </div>
            <Button variant="ghost" size="sm" rightIcon={<ExternalLink className="h-3 w-3" />}>
              View Full Matrix
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-dark-700 via-dark-700 to-dark-800 rounded-lg p-8 lg:p-12 border border-dark-600">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to secure your digital assets?</h2>
          <p className="text-gray-300 max-w-2xl mx-auto mb-8">
            Start using TrinetraSec today and protect your organization from evolving cyber threats
            with our comprehensive security platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/signup">
              <Button size="lg">
                Get Started
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg">
              Request Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
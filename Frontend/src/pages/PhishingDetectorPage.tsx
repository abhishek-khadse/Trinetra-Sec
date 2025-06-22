import { useState } from 'react';
import { Search, AlertTriangle, Shield, Link as LinkIcon, Mail, RefreshCw, Download } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface ScanResult {
  url: string;
  risk_score: number;
  verdict: 'safe' | 'suspicious' | 'malicious';
  categories: string[];
  indicators: {
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  timestamp: string;
}

const PhishingDetectorPage = () => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([
    {
      url: 'https://suspicious-login.example.com',
      risk_score: 85,
      verdict: 'malicious',
      categories: ['credential-theft', 'brand-impersonation'],
      indicators: [
        {
          type: 'domain',
          description: 'Domain age less than 24 hours',
          severity: 'high',
        },
        {
          type: 'ssl',
          description: 'Invalid SSL certificate',
          severity: 'medium',
        },
      ],
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      url: 'https://legitimate-bank.example.net',
      risk_score: 45,
      verdict: 'suspicious',
      categories: ['financial'],
      indicators: [
        {
          type: 'content',
          description: 'Login form with suspicious patterns',
          severity: 'medium',
        },
      ],
      timestamp: new Date(Date.now() - 7200000).toISOString(),
    },
  ]);

  const handleScan = async () => {
    if (!url) return;
    
    setIsScanning(true);
    setScanResult(null);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock scan result
    const result: ScanResult = {
      url,
      risk_score: Math.floor(Math.random() * 100),
      verdict: Math.random() > 0.6 ? 'malicious' : Math.random() > 0.3 ? 'suspicious' : 'safe',
      categories: ['credential-theft', 'brand-impersonation'],
      indicators: [
        {
          type: 'domain',
          description: 'Domain registered recently',
          severity: 'high',
        },
        {
          type: 'content',
          description: 'Contains suspicious login form',
          severity: 'medium',
        },
        {
          type: 'ssl',
          description: 'Invalid SSL certificate',
          severity: 'medium',
        },
      ],
      timestamp: new Date().toISOString(),
    };
    
    setScanResult(result);
    setRecentScans(prev => [result, ...prev]);
    setIsScanning(false);
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'safe':
        return 'text-success';
      case 'suspicious':
        return 'text-warning';
      case 'malicious':
        return 'text-error';
      default:
        return 'text-gray-400';
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-error';
    if (score >= 50) return 'text-warning';
    return 'text-success';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'text-error';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-info';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Phishing Detector</h1>
        <p className="text-gray-400">
          Analyze URLs and emails for potential phishing attempts and security threats.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scanner Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>URL Scanner</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter URL to scan..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    leftIcon={<LinkIcon className="h-4 w-4" />}
                  />
                  <Button
                    onClick={handleScan}
                    isLoading={isScanning}
                    disabled={!url || isScanning}
                  >
                    Scan
                  </Button>
                </div>

                {scanResult && (
                  <div className="space-y-6">
                    <div className="bg-dark-700 border border-dark-600 rounded-lg overflow-hidden">
                      <div className="p-4 border-b border-dark-600 flex items-center justify-between">
                        <div className="flex items-center">
                          <AlertTriangle className={`h-5 w-5 ${getVerdictColor(scanResult.verdict)} mr-2`} />
                          <h3 className="text-lg font-semibold text-white">Scan Results</h3>
                        </div>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                          scanResult.verdict === 'safe' ? 'bg-success/20 text-success' :
                          scanResult.verdict === 'suspicious' ? 'bg-warning/20 text-warning' :
                          'bg-error/20 text-error'
                        }`}>
                          {scanResult.verdict.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <div>
                            <p className="text-gray-400 text-sm">URL</p>
                            <p className="text-white font-mono text-sm break-all">{scanResult.url}</p>
                          </div>
                          <div>
                            <p className="text-gray-400 text-sm">Risk Score</p>
                            <p className={`text-2xl font-bold ${getRiskColor(scanResult.risk_score)}`}>
                              {scanResult.risk_score}/100
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-gray-400 text-sm mb-2">Categories</p>
                            <div className="flex flex-wrap gap-2">
                              {scanResult.categories.map((category, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-dark-600 text-gray-300 rounded text-xs"
                                >
                                  {category}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <p className="text-gray-400 text-sm mb-2">Indicators</p>
                            <div className="space-y-2">
                              {scanResult.indicators.map((indicator, index) => (
                                <div
                                  key={index}
                                  className="flex items-start p-3 bg-dark-800 rounded-lg"
                                >
                                  <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                                    getSeverityColor(indicator.severity)
                                  }`} />
                                  <div>
                                    <p className="text-white text-sm">{indicator.description}</p>
                                    <p className="text-gray-400 text-xs mt-1">
                                      Type: {indicator.type} | Severity: {indicator.severity}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 flex space-x-4">
                          <Button
                            variant="outline"
                            leftIcon={<Download className="h-4 w-4" />}
                          >
                            Download Report
                          </Button>
                          <Button
                            variant="outline"
                            leftIcon={<RefreshCw className="h-4 w-4" />}
                          >
                            Rescan
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Detection Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-dark-800 rounded-lg">
                  <h3 className="text-white font-medium mb-2 flex items-center">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    URL Analysis
                  </h3>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li>• Domain age verification</li>
                    <li>• SSL certificate validation</li>
                    <li>• Redirect chain analysis</li>
                    <li>• Blacklist checking</li>
                  </ul>
                </div>

                <div className="p-4 bg-dark-800 rounded-lg">
                  <h3 className="text-white font-medium mb-2 flex items-center">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Analysis
                  </h3>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li>• Header inspection</li>
                    <li>• SPF/DKIM validation</li>
                    <li>• Content analysis</li>
                    <li>• Attachment scanning</li>
                  </ul>
                </div>

                <div className="p-4 bg-dark-800 rounded-lg">
                  <h3 className="text-white font-medium mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Protection
                  </h3>
                  <ul className="text-gray-400 text-sm space-y-2">
                    <li>• Real-time blocking</li>
                    <li>• Automated reporting</li>
                    <li>• API integration</li>
                    <li>• Custom rules</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentScans.map((scan, index) => (
                  <div
                    key={index}
                    className="p-3 bg-dark-800 rounded-lg"
                  >
                    <div className="flex items-start">
                      <AlertTriangle className={`h-4 w-4 ${getVerdictColor(scan.verdict)} mt-1 mr-2`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {scan.url}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className={`text-xs font-medium ${getRiskColor(scan.risk_score)}`}>
                            Score: {scan.risk_score}
                          </span>
                          <span className="mx-2 text-gray-600">•</span>
                          <span className="text-xs text-gray-400">
                            {new Date(scan.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PhishingDetectorPage;
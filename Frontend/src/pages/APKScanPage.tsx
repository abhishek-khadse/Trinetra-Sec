import { useState, useRef } from 'react';
import { Upload, FileText, Shield, AlertTriangle, Download, RefreshCw, Smartphone } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatFileSize, formatDateTime } from '../lib/utils';

interface APKScan {
  id: string;
  created_at: string;
  file_name: string;
  file_size: number;
  package_name: string;
  version_code: string;
  version_name: string;
  min_sdk: number;
  target_sdk: number;
  scan_status: 'completed' | 'scanning' | 'failed';
  permissions: string[];
  vulnerabilities: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    description: string;
  }[];
}

// Mock scan history
const mockScanHistory: APKScan[] = [
  {
    id: '1',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    file_name: 'example-app.apk',
    file_size: 15728640, // 15MB
    package_name: 'com.example.app',
    version_code: '123',
    version_name: '1.2.3',
    min_sdk: 21,
    target_sdk: 33,
    scan_status: 'completed',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.ACCESS_FINE_LOCATION',
    ],
    vulnerabilities: [
      {
        severity: 'high',
        type: 'Insecure Data Storage',
        description: 'Application stores sensitive data in shared preferences without encryption',
      },
      {
        severity: 'medium',
        type: 'Excessive Permissions',
        description: 'Application requests permissions that are not necessary for its functionality',
      },
    ],
  },
  {
    id: '2',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    file_name: 'banking-app.apk',
    file_size: 20971520, // 20MB
    package_name: 'com.bank.app',
    version_code: '456',
    version_name: '2.0.0',
    min_sdk: 23,
    target_sdk: 33,
    scan_status: 'completed',
    permissions: [
      'android.permission.INTERNET',
      'android.permission.USE_BIOMETRIC',
    ],
    vulnerabilities: [
      {
        severity: 'critical',
        type: 'SSL Certificate Validation',
        description: 'Application does not properly validate SSL certificates',
      },
    ],
  },
];

const APKScanPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<APKScan | null>(null);
  const [scanHistory, setScanHistory] = useState<APKScan[]>(mockScanHistory);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setScanResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.apk')) {
        setFile(droppedFile);
        setScanResult(null);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleScan = async () => {
    if (!file) return;
    
    setIsScanning(true);
    setScanResult(null);
    
    // Simulate scan
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const result: APKScan = {
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString(),
      file_name: file.name,
      file_size: file.size,
      package_name: 'com.example.' + file.name.replace('.apk', ''),
      version_code: '100',
      version_name: '1.0.0',
      min_sdk: 21,
      target_sdk: 33,
      scan_status: 'completed',
      permissions: [
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
      ],
      vulnerabilities: [
        {
          severity: 'high',
          type: 'Insecure Data Storage',
          description: 'Application stores sensitive data without encryption',
        },
      ],
    };
    
    setScanResult(result);
    setScanHistory(prev => [result, ...prev]);
    setIsScanning(false);
  };

  const handleReset = () => {
    setFile(null);
    setScanResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-error bg-error/20';
      case 'high':
        return 'text-secondary-500 bg-secondary-500/20';
      case 'medium':
        return 'text-warning bg-warning/20';
      case 'low':
        return 'text-info bg-info/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">APK Scanner</h1>
        <p className="text-gray-400">
          Analyze Android applications for security vulnerabilities and malicious behavior.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scanner Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>APK Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className="border-2 border-dashed rounded-lg p-8 text-center border-dark-600"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".apk"
                  ref={fileInputRef}
                />
                
                {!file ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full bg-dark-700">
                        <Upload className="h-8 w-8 text-primary-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium">Upload an APK file for analysis</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Drag and drop an APK file or click to select
                      </p>
                    </div>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                    >
                      Select APK
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full bg-dark-700">
                        <Smartphone className="h-8 w-8 text-primary-500" />
                      </div>
                    </div>
                    <div>
                      <p className="text-white font-medium">{file.name}</p>
                      <p className="text-gray-400 text-sm mt-1">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <div className="flex justify-center space-x-3">
                      <Button
                        onClick={handleScan}
                        isLoading={isScanning}
                        disabled={isScanning}
                      >
                        {isScanning ? 'Analyzing...' : 'Analyze APK'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={isScanning}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Scan Result */}
              {scanResult && (
                <div className="mt-8 space-y-6">
                  <div className="bg-dark-700 border border-dark-600 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-dark-600">
                      <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <p className="text-gray-400 text-sm">Package Name</p>
                          <p className="text-white font-mono">{scanResult.package_name}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Version</p>
                          <p className="text-white">{scanResult.version_name} ({scanResult.version_code})</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Min SDK</p>
                          <p className="text-white">API {scanResult.min_sdk}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-sm">Target SDK</p>
                          <p className="text-white">API {scanResult.target_sdk}</p>
                        </div>
                      </div>

                      {/* Permissions */}
                      <div className="mb-6">
                        <h4 className="text-white font-medium mb-2">Permissions</h4>
                        <div className="bg-dark-800 p-4 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {scanResult.permissions.map((permission, index) => (
                              <div
                                key={index}
                                className="flex items-center text-sm bg-dark-700 p-2 rounded"
                              >
                                <Shield className="h-4 w-4 text-primary-500 mr-2" />
                                <span className="text-gray-300 font-mono text-xs">
                                  {permission.replace('android.permission.', '')}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Vulnerabilities */}
                      <div>
                        <h4 className="text-white font-medium mb-2">Vulnerabilities</h4>
                        <div className="space-y-3">
                          {scanResult.vulnerabilities.map((vuln, index) => (
                            <div
                              key={index}
                              className="bg-dark-800 p-4 rounded-lg"
                            >
                              <div className="flex items-start">
                                <AlertTriangle className={`h-5 w-5 mt-0.5 mr-3 ${
                                  vuln.severity === 'critical' ? 'text-error' :
                                  vuln.severity === 'high' ? 'text-secondary-500' :
                                  vuln.severity === 'medium' ? 'text-warning' :
                                  'text-info'
                                }`} />
                                <div>
                                  <div className="flex items-center mb-1">
                                    <h5 className="text-white font-medium mr-2">{vuln.type}</h5>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSeverityColor(vuln.severity)}`}>
                                      {vuln.severity.toUpperCase()}
                                    </span>
                                  </div>
                                  <p className="text-gray-300 text-sm">{vuln.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
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
            </CardContent>
          </Card>
        </div>

        {/* Recent Scans */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanHistory.map((scan) => (
                  <div
                    key={scan.id}
                    className="bg-dark-800 p-4 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <Smartphone className="h-4 w-4 text-primary-500 mr-2" />
                        <div>
                          <p className="text-white text-sm font-medium">{scan.file_name}</p>
                          <p className="text-gray-400 text-xs">{formatDateTime(scan.created_at)}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        scan.vulnerabilities.length > 0
                          ? 'bg-error/20 text-error'
                          : 'bg-success/20 text-success'
                      }`}>
                        {scan.vulnerabilities.length} Issues
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-gray-400 text-xs font-mono">{scan.package_name}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        Version: {scan.version_name} ({scan.version_code})
                      </p>
                    </div>
                    <div className="mt-3">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" fullWidth>
                View All Scans
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default APKScanPage;
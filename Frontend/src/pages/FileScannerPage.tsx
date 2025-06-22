import { useState, useRef, ChangeEvent } from 'react';
import { Upload, FileText, AlertTriangle, Check, XCircle, Loader, Download, RefreshCw } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { formatFileSize, formatDateTime } from '../lib/utils';
import { FileScan } from '../types';

// Mock scan function - in real app this would upload to Supabase Storage and trigger a scan
const mockScanFile = async (file: File): Promise<FileScan> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate random scan result (for demo)
  const threatLevels: ('none' | 'low' | 'medium' | 'high' | 'critical')[] = [
    'none', 'low', 'medium', 'high', 'critical'
  ];
  
  const randomThreatLevel = threatLevels[Math.floor(Math.random() * threatLevels.length)];
  const detectionCount = randomThreatLevel === 'none' ? 0 : Math.floor(Math.random() * 5) + 1;
  
  // Generate random file hash (for demo)
  const fileHash = Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  
  return {
    id: uuidv4(),
    created_at: new Date().toISOString(),
    user_id: 'user123', // Would come from authenticated user
    file_name: file.name,
    file_size: file.size,
    file_hash: fileHash,
    scan_status: 'completed',
    result_summary: randomThreatLevel === 'none' 
      ? 'No threats detected'
      : `Detected ${detectionCount} potential threat${detectionCount > 1 ? 's' : ''}`,
    threat_level: randomThreatLevel,
    detection_count: detectionCount,
  };
};

// Mock scan history - in real app this would come from Supabase
const mockScanHistory: FileScan[] = [
  {
    id: '1',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user_id: 'user123',
    file_name: 'invoice_2025.pdf',
    file_size: 2457600,
    file_hash: 'a1b2c3d4e5f6g7h8i9j0',
    scan_status: 'completed',
    result_summary: 'Detected 2 potential threats',
    threat_level: 'medium',
    detection_count: 2,
  },
  {
    id: '2',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user_id: 'user123',
    file_name: 'setup_installer.exe',
    file_size: 18457600,
    file_hash: 'k1l2m3n4o5p6q7r8s9t0',
    scan_status: 'completed',
    result_summary: 'Malicious executable detected',
    threat_level: 'critical',
    detection_count: 4,
  },
];

const FileScannerPage = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<FileScan | null>(null);
  const [scanHistory, setScanHistory] = useState<FileScan[]>(mockScanHistory);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setScanResult(null);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setScanResult(null);
    }
  };

  const handleScan = async () => {
    if (!file) return;
    
    setIsScanning(true);
    setScanResult(null);
    
    try {
      const result = await mockScanFile(file);
      setScanResult(result);
      setScanHistory(prev => [result, ...prev]);
    } catch (error) {
      console.error('Scan failed:', error);
      // Handle error
    } finally {
      setIsScanning(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setScanResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getThreatLevelStyle = (level: string | null) => {
    switch (level) {
      case 'none':
        return 'bg-success text-white';
      case 'low':
        return 'bg-info text-white';
      case 'medium':
        return 'bg-warning text-dark-800';
      case 'high':
        return 'bg-secondary-500 text-white';
      case 'critical':
        return 'bg-error text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">File Scanner</h1>
        <p className="text-gray-400">
          Upload and scan files for malware, viruses, and other threats.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scanner Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Scan File</CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center ${
                  isDragging ? 'border-primary-500 bg-primary-500/5' : 'border-dark-600'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
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
                      <p className="text-white font-medium">Drag and drop a file or click to upload</p>
                      <p className="text-gray-400 text-sm mt-1">
                        Supported formats: .exe, .dll, .pdf, .doc, .docx, .xls, .xlsx, .js, .zip, .rar
                      </p>
                    </div>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                    >
                      Select File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 rounded-full bg-dark-700">
                        <FileText className="h-8 w-8 text-primary-500" />
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
                        {isScanning ? 'Scanning...' : 'Scan File'}
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
                <div className="mt-8">
                  <h3 className="text-xl font-semibold text-white mb-4">Scan Results</h3>
                  <div className="bg-dark-700 border border-dark-600 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-dark-600 flex items-center justify-between">
                      <div className="flex items-center">
                        {scanResult.threat_level === 'none' ? (
                          <Check className="h-5 w-5 text-success mr-2" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-secondary-500 mr-2" />
                        )}
                        <span className="font-medium text-white">
                          {scanResult.file_name}
                        </span>
                      </div>
                      <span 
                        className={`text-xs font-medium px-3 py-1 rounded-full ${getThreatLevelStyle(scanResult.threat_level)}`}
                      >
                        {scanResult.threat_level === 'none' ? 'Clean' : scanResult.threat_level.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-400 text-xs">File Size</p>
                          <p className="text-white">{formatFileSize(scanResult.file_size)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Scan Date</p>
                          <p className="text-white">{formatDateTime(scanResult.created_at)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">File Hash (SHA-256)</p>
                          <p className="text-white font-mono text-xs break-all">{scanResult.file_hash}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 text-xs">Detections</p>
                          <p className="text-white">{scanResult.detection_count || 0}</p>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-dark-600">
                        <p className="text-gray-400 text-xs">Result Summary</p>
                        <p className="text-white">{scanResult.result_summary}</p>
                      </div>
                      
                      <div className="mt-4 flex space-x-2">
                        <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                          Download Report
                        </Button>
                        <Button variant="ghost" size="sm" leftIcon={<RefreshCw className="h-4 w-4" />}>
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

        {/* Recent Scans Section */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scanHistory.length > 0 ? (
                  scanHistory.map(scan => (
                    <div key={scan.id} className="bg-dark-800 p-3 rounded-md">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {scan.threat_level === 'none' ? (
                            <Check className="h-4 w-4 text-success shrink-0" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-secondary-500 shrink-0" />
                          )}
                          <div className="ml-2 overflow-hidden">
                            <p className="text-sm font-medium text-white truncate">{scan.file_name}</p>
                            <p className="text-xs text-gray-400">{formatDateTime(scan.created_at)}</p>
                          </div>
                        </div>
                        <span 
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${getThreatLevelStyle(scan.threat_level)}`}
                        >
                          {scan.threat_level === 'none' ? 'Clean' : 
                           scan.threat_level.charAt(0).toUpperCase() + scan.threat_level.slice(1)}
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-gray-400">
                        {scan.result_summary}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400">No scan history</p>
                  </div>
                )}
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

export default FileScannerPage;
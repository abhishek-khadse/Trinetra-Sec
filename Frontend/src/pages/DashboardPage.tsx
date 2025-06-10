import { useState, useEffect } from 'react';
import { FileText, AlertTriangle, Shield, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { useAuth } from '../context/auth-context';
import { formatDate, formatDateTime, getSeverityColor } from '../lib/utils';
import { FileScan, ThreatFeed } from '../types';

// Mock data - in real app this would come from Supabase
const mockScans: FileScan[] = [
  {
    id: '1',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user_id: '123',
    file_name: 'suspicious_invoice.pdf',
    file_size: 2457600,
    file_hash: 'a1b2c3d4e5f6g7h8i9j0',
    scan_status: 'completed',
    result_summary: 'Malicious PDF with embedded JavaScript',
    threat_level: 'high',
    detection_count: 3,
  },
  {
    id: '2',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    user_id: '123',
    file_name: 'company_report.xlsx',
    file_size: 4257800,
    file_hash: 'k1l2m3n4o5p6q7r8s9t0',
    scan_status: 'completed',
    result_summary: 'Clean file, no threats detected',
    threat_level: 'none',
    detection_count: 0,
  },
  {
    id: '3',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    user_id: '123',
    file_name: 'setup.exe',
    file_size: 18457600,
    file_hash: 'u1v2w3x4y5z6a7b8c9d0',
    scan_status: 'completed',
    result_summary: 'Potentially unwanted program detected',
    threat_level: 'medium',
    detection_count: 1,
  },
];

const mockThreats: ThreatFeed[] = [
  {
    id: '1',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    feed_type: 'malware',
    threat_name: 'Emotet Campaign',
    severity: 'high',
    ioc_type: 'hash',
    ioc_value: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    description: 'New Emotet malware campaign targeting financial institutions',
    source: 'VirusTotal',
    is_active: true,
  },
  {
    id: '2',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    feed_type: 'phishing',
    threat_name: 'Microsoft Credential Harvester',
    severity: 'critical',
    ioc_type: 'domain',
    ioc_value: 'microsoft-secure-login.com',
    description: 'Phishing campaign impersonating Microsoft login pages',
    source: 'PhishTank',
    is_active: true,
  },
  {
    id: '3',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    feed_type: 'ransomware',
    threat_name: 'BlackCat Ransomware',
    severity: 'critical',
    ioc_type: 'ip',
    ioc_value: '192.168.1.1',
    description: 'C2 server for BlackCat ransomware operations',
    source: 'Ransomware Tracker',
    is_active: true,
  },
];

const stats = {
  totalScans: 42,
  threatsDetected: 12,
  activeThreats: 5,
  blockedAttacks: 128,
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [recentScans, setRecentScans] = useState<FileScan[]>([]);
  const [recentThreats, setRecentThreats] = useState<ThreatFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading from Supabase
    const loadData = async () => {
      // In a real app, these would be actual Supabase queries
      await new Promise(resolve => setTimeout(resolve, 500));
      setRecentScans(mockScans);
      setRecentThreats(mockThreats);
      setIsLoading(false);
    };

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-primary-500 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-gray-400">
          Welcome back, {user?.username || 'User'}. Here's your security overview.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Scans</p>
                <h3 className="text-3xl font-bold text-white mt-1">{stats.totalScans}</h3>
              </div>
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <FileText className="h-6 w-6 text-primary-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Threats Detected</p>
                <h3 className="text-3xl font-bold text-secondary-500 mt-1">{stats.threatsDetected}</h3>
              </div>
              <div className="bg-secondary-500/20 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-secondary-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Active Threats</p>
                <h3 className="text-3xl font-bold text-warning mt-1">{stats.activeThreats}</h3>
              </div>
              <div className="bg-warning/20 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Blocked Attacks</p>
                <h3 className="text-3xl font-bold text-success mt-1">{stats.blockedAttacks}</h3>
              </div>
              <div className="bg-success/20 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle>Recent File Scans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentScans.length > 0 ? (
                recentScans.map(scan => (
                  <div key={scan.id} className="bg-dark-800 p-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className={`w-2 h-2 rounded-full mr-3 ${
                          scan.threat_level === 'none' ? 'bg-success' :
                          scan.threat_level === 'low' ? 'bg-info' :
                          scan.threat_level === 'medium' ? 'bg-warning' :
                          scan.threat_level === 'high' ? 'bg-secondary-500' :
                          'bg-error'
                        }`}
                      ></div>
                      <div>
                        <p className="text-sm font-medium text-white">{scan.file_name}</p>
                        <p className="text-xs text-gray-400">{formatDateTime(scan.created_at)}</p>
                      </div>
                    </div>
                    <div className={`text-xs font-medium ${getSeverityColor(scan.threat_level || 'low')}`}>
                      {scan.threat_level === 'none' ? 'Clean' : `${scan.detection_count} Detections`}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">No recent scans found</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/file-scanner" className="w-full">
              <Button variant="outline" fullWidth rightIcon={<ChevronRight className="h-4 w-4" />}>
                View All Scans
              </Button>
            </Link>
          </CardFooter>
        </Card>

        {/* Recent Threats */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Threat Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentThreats.length > 0 ? (
                recentThreats.map(threat => (
                  <div key={threat.id} className="bg-dark-800 p-3 rounded-md">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center">
                        <div 
                          className={`w-2 h-2 rounded-full mr-3 ${
                            threat.severity === 'low' ? 'bg-info' :
                            threat.severity === 'medium' ? 'bg-warning' :
                            threat.severity === 'high' ? 'bg-secondary-500' :
                            'bg-error'
                          }`}
                        ></div>
                        <div>
                          <p className="text-sm font-medium text-white">{threat.threat_name}</p>
                          <p className="text-xs text-gray-400">{formatDateTime(threat.created_at)}</p>
                        </div>
                      </div>
                      <span 
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          threat.severity === 'low' ? 'bg-info/20 text-info' :
                          threat.severity === 'medium' ? 'bg-warning/20 text-warning' :
                          threat.severity === 'high' ? 'bg-secondary-500/20 text-secondary-500' :
                          'bg-error/20 text-error'
                        }`}
                      >
                        {threat.severity.charAt(0).toUpperCase() + threat.severity.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{threat.description}</p>
                    <div className="mt-2 flex items-center text-xs">
                      <span className="text-gray-500">IOC:</span>
                      <span className="ml-1 font-mono bg-dark-700 px-2 py-0.5 rounded text-white">
                        {threat.ioc_value.length > 20 
                          ? `${threat.ioc_value.substring(0, 20)}...` 
                          : threat.ioc_value}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-400">No recent threats found</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Link to="/threat-feeds" className="w-full">
              <Button variant="outline" fullWidth rightIcon={<ChevronRight className="h-4 w-4" />}>
                View All Threats
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
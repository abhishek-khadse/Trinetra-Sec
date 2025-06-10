import { useState, useEffect } from 'react';
import { AlertTriangle, Search, Filter, RefreshCw, ExternalLink } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { formatDateTime, getSeverityColor, getThreatTypeColor } from '../lib/utils';
import { ThreatFeed } from '../types';

// Mock threat feed data - in real app this would come from Supabase with real-time updates
const mockThreats: ThreatFeed[] = [
  {
    id: '1',
    created_at: new Date(Date.now() - 1800000).toISOString(),
    feed_type: 'malware',
    threat_name: 'Emotet Campaign',
    severity: 'high',
    ioc_type: 'hash',
    ioc_value: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
    description: 'New Emotet malware campaign targeting financial institutions through malicious Excel documents with embedded macros.',
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
    description: 'Phishing campaign impersonating Microsoft login pages to steal credentials. Emails contain urgent password reset notifications.',
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
    description: 'C2 server for BlackCat ransomware operations. Targets Windows systems and encrypts files with double extortion tactics.',
    source: 'Ransomware Tracker',
    is_active: true,
  },
  {
    id: '4',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    feed_type: 'vulnerability',
    threat_name: 'Critical Java Spring4Shell Vulnerability',
    severity: 'high',
    ioc_type: 'url',
    ioc_value: 'https://exploit-example.com/spring4shell',
    description: 'Critical remote code execution vulnerability in Spring Framework. Affects Spring MVC and Spring WebFlux applications.',
    source: 'NVD',
    is_active: true,
  },
  {
    id: '5',
    created_at: new Date(Date.now() - 172800000).toISOString(),
    feed_type: 'exploit',
    threat_name: 'ProxyShell Exchange Server Exploit',
    severity: 'high',
    ioc_type: 'url',
    ioc_value: 'https://malicious-proxy-exploit.com',
    description: 'Active exploitation of Microsoft Exchange Server vulnerabilities. Allows unauthenticated attackers to execute arbitrary code.',
    source: 'Microsoft',
    is_active: true,
  },
  {
    id: '6',
    created_at: new Date(Date.now() - 259200000).toISOString(),
    feed_type: 'malware',
    threat_name: 'Qakbot Banking Trojan',
    severity: 'medium',
    ioc_type: 'hash',
    ioc_value: 'b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6',
    description: 'Qakbot banking trojan spreading through malicious PDF attachments. Steals banking credentials and provides remote access.',
    source: 'MITRE',
    is_active: true,
  },
];

const ThreatFeedsPage = () => {
  const [threats, setThreats] = useState<ThreatFeed[]>([]);
  const [filteredThreats, setFilteredThreats] = useState<ThreatFeed[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    severity: 'all',
  });

  useEffect(() => {
    // Simulate data loading from Supabase
    const loadThreats = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setThreats(mockThreats);
      setFilteredThreats(mockThreats);
      setIsLoading(false);
    };

    loadThreats();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let result = threats;

    // Apply type filter
    if (filters.type !== 'all') {
      result = result.filter(threat => threat.feed_type === filters.type);
    }

    // Apply severity filter
    if (filters.severity !== 'all') {
      result = result.filter(threat => threat.severity === filters.severity);
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(threat => 
        threat.threat_name.toLowerCase().includes(term) || 
        threat.description?.toLowerCase().includes(term) ||
        threat.ioc_value.toLowerCase().includes(term)
      );
    }

    setFilteredThreats(result);
  }, [threats, filters, searchTerm]);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate data refresh
    setTimeout(() => {
      setIsLoading(false);
    }, 800);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-primary-500 font-medium">Loading threat feeds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Threat Feeds</h1>
        <p className="text-gray-400">
          Stay updated with the latest cybersecurity threats and indicators of compromise.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Active Threats</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search threats..."
              leftIcon={<Search className="h-4 w-4" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              fullWidth
            />
            
            <div className="flex gap-4">
              <div className="relative">
                <select
                  className="appearance-none bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2 pr-8"
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                  <option value="all">All Types</option>
                  <option value="malware">Malware</option>
                  <option value="phishing">Phishing</option>
                  <option value="ransomware">Ransomware</option>
                  <option value="vulnerability">Vulnerability</option>
                  <option value="exploit">Exploit</option>
                </select>
                <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              
              <div className="relative">
                <select
                  className="appearance-none bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2 pr-8"
                  value={filters.severity}
                  onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                >
                  <option value="all">All Severities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Threats List */}
          <div className="space-y-4">
            {filteredThreats.length > 0 ? (
              filteredThreats.map(threat => (
                <div key={threat.id} className="bg-dark-800 rounded-lg border border-dark-600 overflow-hidden">
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                      <div className="flex items-center">
                        <AlertTriangle className={`h-5 w-5 ${getSeverityColor(threat.severity)} mr-2`} />
                        <h3 className="text-lg font-semibold text-white">{threat.threat_name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span 
                          className={`text-xs font-medium px-2 py-1 rounded-full ${getThreatTypeColor(threat.feed_type)}`}
                        >
                          {threat.feed_type.charAt(0).toUpperCase() + threat.feed_type.slice(1)}
                        </span>
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
                    </div>
                    
                    <p className="text-gray-300 mb-3">{threat.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">IOC Type</p>
                        <p className="text-white">{threat.ioc_type.toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">IOC Value</p>
                        <p className="text-white font-mono break-all text-xs">{threat.ioc_value}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Source</p>
                        <p className="text-white">{threat.source}</p>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        Reported {formatDateTime(threat.created_at)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        rightIcon={<ExternalLink className="h-3 w-3" />}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-white mb-2">No threats found</h3>
                <p className="text-gray-400">
                  No threats match your current filters. Try adjusting your search or filters.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreatFeedsPage;
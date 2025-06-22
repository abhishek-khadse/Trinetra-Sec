import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Globe, RefreshCw, Filter, Download, Eye } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface ThreatStream {
  id: string;
  timestamp: string;
  source: string;
  threat_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  indicators: string[];
  location: string;
  confidence: number;
}

const mockThreatStream: ThreatStream[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 300000).toISOString(),
    source: 'Global Threat Intelligence',
    threat_type: 'Malware Campaign',
    severity: 'critical',
    title: 'New Ransomware Campaign Detected',
    description: 'Large-scale ransomware campaign targeting healthcare institutions across multiple countries.',
    indicators: ['192.168.1.100', 'malware-c2.example.com', 'a1b2c3d4e5f6'],
    location: 'Global',
    confidence: 95,
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 600000).toISOString(),
    source: 'Regional SOC',
    threat_type: 'Phishing',
    severity: 'high',
    title: 'Banking Credential Harvesting',
    description: 'Sophisticated phishing campaign impersonating major banking institutions.',
    indicators: ['fake-bank-login.com', 'phish@example.com'],
    location: 'North America',
    confidence: 88,
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 900000).toISOString(),
    source: 'Honeypot Network',
    threat_type: 'Botnet Activity',
    severity: 'medium',
    title: 'Botnet Command & Control Traffic',
    description: 'Increased C2 traffic from known botnet infrastructure.',
    indicators: ['10.0.0.50', 'botnet-c2.example.net'],
    location: 'Europe',
    confidence: 76,
  },
];

const ThreatStreamPage = () => {
  const [threats, setThreats] = useState<ThreatStream[]>([]);
  const [filteredThreats, setFilteredThreats] = useState<ThreatStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    // Simulate loading threat stream data
    const loadThreats = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setThreats(mockThreatStream);
      setFilteredThreats(mockThreatStream);
      setIsLoading(false);
    };

    loadThreats();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = threats;

    if (severityFilter !== 'all') {
      result = result.filter(threat => threat.severity === severityFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(threat => 
        threat.title.toLowerCase().includes(term) ||
        threat.description.toLowerCase().includes(term) ||
        threat.threat_type.toLowerCase().includes(term)
      );
    }

    setFilteredThreats(result);
  }, [threats, severityFilter, searchTerm]);

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

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-success';
    if (confidence >= 70) return 'text-warning';
    return 'text-error';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-primary-500 font-medium">Loading threat stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Threat Stream</h1>
        <p className="text-gray-400">
          Real-time global threat intelligence and security event monitoring.
        </p>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between bg-dark-700 border border-dark-600 rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isLive ? 'bg-success animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-white font-medium">
              {isLive ? 'Live Stream Active' : 'Stream Paused'}
            </span>
          </div>
          <div className="text-gray-400 text-sm">
            Last update: {new Date().toLocaleTimeString()}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={isLive ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? 'Pause' : 'Resume'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Live Threat Feed
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<RefreshCw className="h-4 w-4" />}
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Activity className="h-4 w-4" />}
              fullWidth
            />
            
            <div className="relative">
              <select
                className="appearance-none bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2 pr-8"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Threat Stream */}
          <div className="space-y-4">
            {filteredThreats.map((threat) => (
              <div
                key={threat.id}
                className="bg-dark-800 border border-dark-600 rounded-lg p-4 hover:border-primary-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <AlertTriangle className={`h-5 w-5 mr-2 ${
                      threat.severity === 'critical' ? 'text-error' :
                      threat.severity === 'high' ? 'text-secondary-500' :
                      threat.severity === 'medium' ? 'text-warning' :
                      'text-info'
                    }`} />
                    <h3 className="text-lg font-semibold text-white">{threat.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(threat.severity)}`}>
                      {threat.severity.toUpperCase()}
                    </span>
                    <span className={`text-xs font-medium ${getConfidenceColor(threat.confidence)}`}>
                      {threat.confidence}% confidence
                    </span>
                  </div>
                </div>

                <p className="text-gray-300 mb-4">{threat.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-400">Source</p>
                    <p className="text-white">{threat.source}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Type</p>
                    <p className="text-white">{threat.threat_type}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Location</p>
                    <div className="flex items-center">
                      <Globe className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-white">{threat.location}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-400">Time</p>
                    <p className="text-white">{new Date(threat.timestamp).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Indicators of Compromise</p>
                  <div className="flex flex-wrap gap-2">
                    {threat.indicators.map((indicator, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-dark-700 text-gray-300 rounded text-xs font-mono"
                      >
                        {indicator}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye className="h-4 w-4" />}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredThreats.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No threats in stream</h3>
              <p className="text-gray-400">
                No threats match your current filters or the stream is quiet.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ThreatStreamPage;
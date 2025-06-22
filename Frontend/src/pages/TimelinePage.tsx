import { useState } from 'react';
import { Clock, AlertTriangle, Shield, FileText, RefreshCw, Filter } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface TimelineEvent {
  id: string;
  type: 'scan' | 'alert' | 'incident' | 'system';
  title: string;
  description: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  metadata?: Record<string, string>;
}

const mockEvents: TimelineEvent[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Critical Vulnerability Detected',
    description: 'High-severity vulnerability found in application dependencies.',
    severity: 'critical',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    metadata: {
      'CVE': 'CVE-2025-1234',
      'Package': 'example-package',
      'Version': '1.2.3',
    },
  },
  {
    id: '2',
    type: 'scan',
    title: 'Malware Scan Completed',
    description: 'System-wide malware scan completed successfully.',
    severity: 'low',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    metadata: {
      'Files Scanned': '1,234',
      'Threats Found': '0',
      'Duration': '15m 30s',
    },
  },
  {
    id: '3',
    type: 'incident',
    title: 'DDoS Attack Mitigated',
    description: 'Distributed denial-of-service attack successfully blocked.',
    severity: 'high',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    metadata: {
      'Source IPs': '127',
      'Peak Traffic': '1.2 Gbps',
      'Duration': '45m',
    },
  },
  {
    id: '4',
    type: 'system',
    title: 'System Update Applied',
    description: 'Security patches and updates installed successfully.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    metadata: {
      'Update Size': '234 MB',
      'Components': '5',
      'Restart Required': 'No',
    },
  },
];

const TimelinePage = () => {
  const [events] = useState<TimelineEvent[]>(mockEvents);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    const matchesSeverity = 
      severityFilter === 'all' || 
      (event.severity && event.severity === severityFilter);
    return matchesSearch && matchesType && matchesSeverity;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-5 w-5 text-secondary-500" />;
      case 'scan':
        return <Shield className="h-5 w-5 text-primary-500" />;
      case 'incident':
        return <AlertTriangle className="h-5 w-5 text-error" />;
      default:
        return <Clock className="h-5 w-5 text-info" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
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
        <h1 className="text-3xl font-bold text-white mb-2">Security Timeline</h1>
        <p className="text-gray-400">
          Chronological view of security events, incidents, and system activities.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Event Timeline</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                isLoading={isLoading}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FileText className="h-4 w-4" />}
              >
                Export Events
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Clock className="h-4 w-4" />}
              fullWidth
            />
            
            <div className="flex gap-4">
              <div className="relative">
                <select
                  className="appearance-none bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2 pr-8"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="alert">Alerts</option>
                  <option value="scan">Scans</option>
                  <option value="incident">Incidents</option>
                  <option value="system">System</option>
                </select>
                <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              
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
          </div>

          {/* Timeline */}
          <div className="relative">
            <div className="absolute top-0 bottom-0 left-6 w-px bg-dark-600"></div>
            
            <div className="space-y-8">
              {filteredEvents.map((event) => (
                <div key={event.id} className="relative pl-12">
                  <div className="absolute left-4 top-2 -translate-x-1/2 p-2 rounded-full bg-dark-700 border border-dark-600">
                    {getEventIcon(event.type)}
                  </div>
                  
                  <div className="bg-dark-800 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-white font-medium">{event.title}</h3>
                        <p className="text-gray-400 text-sm">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {event.severity && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                          {event.severity.charAt(0).toUpperCase() + event.severity.slice(1)}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-300 mb-4">{event.description}</p>
                    
                    {event.metadata && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-gray-400">{key}</p>
                            <p className="text-white font-medium">{value}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No events found</h3>
              <p className="text-gray-400">
                No events match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TimelinePage;
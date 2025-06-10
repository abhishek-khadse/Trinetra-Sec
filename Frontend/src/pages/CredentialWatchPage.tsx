import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, Eye, EyeOff, Search, Download, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface CredentialLeak {
  id: string;
  email: string;
  domain: string;
  breach_name: string;
  breach_date: string;
  data_types: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  verified: boolean;
  discovered_date: string;
}

const mockLeaks: CredentialLeak[] = [
  {
    id: '1',
    email: 'user@company.com',
    domain: 'company.com',
    breach_name: 'MegaCorp Data Breach',
    breach_date: '2024-12-15',
    data_types: ['Email', 'Password', 'Phone'],
    severity: 'critical',
    verified: true,
    discovered_date: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: '2',
    email: 'admin@company.com',
    domain: 'company.com',
    breach_name: 'Social Media Platform Leak',
    breach_date: '2024-11-20',
    data_types: ['Email', 'Username'],
    severity: 'medium',
    verified: true,
    discovered_date: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: '3',
    email: 'support@company.com',
    domain: 'company.com',
    breach_name: 'E-commerce Site Breach',
    breach_date: '2024-10-05',
    data_types: ['Email', 'Password', 'Address'],
    severity: 'high',
    verified: false,
    discovered_date: new Date(Date.now() - 259200000).toISOString(),
  },
];

const CredentialWatchPage = () => {
  const [leaks, setLeaks] = useState<CredentialLeak[]>([]);
  const [filteredLeaks, setFilteredLeaks] = useState<CredentialLeak[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [showEmails, setShowEmails] = useState(false);
  const [monitoredDomains, setMonitoredDomains] = useState(['company.com', 'subsidiary.com']);

  useEffect(() => {
    // Simulate loading credential leak data
    const loadLeaks = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLeaks(mockLeaks);
      setFilteredLeaks(mockLeaks);
      setIsLoading(false);
    };

    loadLeaks();
  }, []);

  useEffect(() => {
    // Apply filters
    let result = leaks;

    if (severityFilter !== 'all') {
      result = result.filter(leak => leak.severity === severityFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(leak => 
        leak.email.toLowerCase().includes(term) ||
        leak.breach_name.toLowerCase().includes(term) ||
        leak.domain.toLowerCase().includes(term)
      );
    }

    setFilteredLeaks(result);
  }, [leaks, severityFilter, searchTerm]);

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

  const maskEmail = (email: string) => {
    if (showEmails) return email;
    const [username, domain] = email.split('@');
    const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
    return `${maskedUsername}@${domain}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-primary-500 font-medium">Loading credential watch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Credential Watch</h1>
        <p className="text-gray-400">
          Monitor for compromised credentials and data breaches affecting your organization.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Leaks</p>
                <h3 className="text-3xl font-bold text-white mt-1">{leaks.length}</h3>
              </div>
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-primary-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Critical Breaches</p>
                <h3 className="text-3xl font-bold text-error mt-1">
                  {leaks.filter(l => l.severity === 'critical').length}
                </h3>
              </div>
              <div className="bg-error/20 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-error" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Monitored Domains</p>
                <h3 className="text-3xl font-bold text-info mt-1">{monitoredDomains.length}</h3>
              </div>
              <div className="bg-info/20 p-3 rounded-lg">
                <Search className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Verified Leaks</p>
                <h3 className="text-3xl font-bold text-success mt-1">
                  {leaks.filter(l => l.verified).length}
                </h3>
              </div>
              <div className="bg-success/20 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Credential Leaks</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={showEmails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                onClick={() => setShowEmails(!showEmails)}
              >
                {showEmails ? 'Hide' : 'Show'} Emails
              </Button>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Refresh
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
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search leaks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
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
            </div>
          </div>

          {/* Leaks Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-4">Email</th>
                  <th className="pb-4">Breach</th>
                  <th className="pb-4">Data Types</th>
                  <th className="pb-4">Severity</th>
                  <th className="pb-4">Breach Date</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaks.map((leak) => (
                  <tr key={leak.id} className="border-t border-dark-600">
                    <td className="py-4">
                      <code className="text-white bg-dark-700 px-2 py-1 rounded text-sm">
                        {maskEmail(leak.email)}
                      </code>
                    </td>
                    <td className="py-4">
                      <div>
                        <p className="text-white font-medium">{leak.breach_name}</p>
                        <p className="text-gray-400 text-sm">{leak.domain}</p>
                      </div>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {leak.data_types.map((type, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-dark-700 text-gray-300 rounded text-xs"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(leak.severity)}`}>
                        {leak.severity.charAt(0).toUpperCase() + leak.severity.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 text-gray-300">
                      {new Date(leak.breach_date).toLocaleDateString()}
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        leak.verified ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                      }`}>
                        {leak.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeaks.length === 0 && (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No credential leaks found</h3>
              <p className="text-gray-400">
                No credential leaks match your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Monitored Domains */}
      <Card>
        <CardHeader>
          <CardTitle>Monitored Domains</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {monitoredDomains.map((domain, index) => (
              <div
                key={index}
                className="bg-dark-800 border border-dark-600 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{domain}</p>
                    <p className="text-gray-400 text-sm">
                      {leaks.filter(l => l.domain === domain).length} leaks found
                    </p>
                  </div>
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CredentialWatchPage;
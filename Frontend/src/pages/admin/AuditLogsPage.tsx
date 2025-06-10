import { useState } from 'react';
import { FileText, Search, Filter, Download, Eye, Calendar, User, Activity } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  username: string;
  action: string;
  resource: string;
  resource_id: string;
  ip_address: string;
  user_agent: string;
  status: 'success' | 'failure' | 'warning';
  details: Record<string, any>;
}

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2025-03-15T14:30:00Z',
    user_id: 'user123',
    username: 'john_doe',
    action: 'file_scan',
    resource: 'file',
    resource_id: 'file_456',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    status: 'success',
    details: {
      file_name: 'suspicious_document.pdf',
      file_size: 2457600,
      threat_level: 'medium',
      scan_duration: '15.3s',
    },
  },
  {
    id: '2',
    timestamp: '2025-03-15T14:25:00Z',
    user_id: 'admin456',
    username: 'admin_user',
    action: 'user_role_change',
    resource: 'user',
    resource_id: 'user789',
    ip_address: '10.0.0.50',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    status: 'success',
    details: {
      target_user: 'sarah_smith',
      old_role: 'user',
      new_role: 'moderator',
      reason: 'Promotion to security team',
    },
  },
  {
    id: '3',
    timestamp: '2025-03-15T14:20:00Z',
    user_id: 'user789',
    username: 'failed_login',
    action: 'login_attempt',
    resource: 'auth',
    resource_id: 'session_123',
    ip_address: '203.0.113.45',
    user_agent: 'curl/7.68.0',
    status: 'failure',
    details: {
      reason: 'invalid_credentials',
      attempt_count: 3,
      account_locked: false,
    },
  },
  {
    id: '4',
    timestamp: '2025-03-15T14:15:00Z',
    user_id: 'user456',
    username: 'mike_wilson',
    action: 'threat_feed_update',
    resource: 'threat_feed',
    resource_id: 'feed_789',
    ip_address: '172.16.0.25',
    user_agent: 'TrinetraSec-API/1.0',
    status: 'success',
    details: {
      feed_type: 'malware',
      new_indicators: 15,
      source: 'VirusTotal',
    },
  },
  {
    id: '5',
    timestamp: '2025-03-15T14:10:00Z',
    user_id: 'system',
    username: 'system',
    action: 'module_restart',
    resource: 'module',
    resource_id: 'ddos_shield',
    ip_address: '127.0.0.1',
    user_agent: 'System/Internal',
    status: 'warning',
    details: {
      module_name: 'DDoS Shield',
      restart_reason: 'configuration_update',
      downtime: '2.1s',
    },
  },
];

const AuditLogsPage = () => {
  const [logs] = useState<AuditLog[]>(mockAuditLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.ip_address.includes(searchTerm);
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    
    return matchesSearch && matchesAction && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-success bg-success/20';
      case 'failure':
        return 'text-error bg-error/20';
      case 'warning':
        return 'text-warning bg-warning/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'file_scan':
        return <FileText className="h-4 w-4" />;
      case 'login_attempt':
        return <User className="h-4 w-4" />;
      case 'user_role_change':
        return <User className="h-4 w-4" />;
      case 'threat_feed_update':
        return <Activity className="h-4 w-4" />;
      case 'module_restart':
        return <Activity className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const actions = Array.from(new Set(logs.map(log => log.action)));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Audit Logs</h1>
        <p className="text-gray-400">
          Monitor and review all system activities and user actions.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Events</p>
                <h3 className="text-3xl font-bold text-white mt-1">{logs.length}</h3>
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
                <p className="text-gray-400 text-sm">Success</p>
                <h3 className="text-3xl font-bold text-success mt-1">
                  {logs.filter(l => l.status === 'success').length}
                </h3>
              </div>
              <div className="bg-success/20 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Failures</p>
                <h3 className="text-3xl font-bold text-error mt-1">
                  {logs.filter(l => l.status === 'failure').length}
                </h3>
              </div>
              <div className="bg-error/20 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-error" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Unique Users</p>
                <h3 className="text-3xl font-bold text-info mt-1">
                  {new Set(logs.map(l => l.user_id)).size}
                </h3>
              </div>
              <div className="bg-info/20 p-3 rounded-lg">
                <User className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Logs List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Audit Events</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Calendar className="h-4 w-4" />}
                  >
                    Date Range
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  fullWidth
                />
                
                <div className="flex gap-4">
                  <div className="relative">
                    <select
                      className="appearance-none bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2 pr-8"
                      value={actionFilter}
                      onChange={(e) => setActionFilter(e.target.value)}
                    >
                      <option value="all">All Actions</option>
                      {actions.map(action => (
                        <option key={action} value={action}>
                          {action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </option>
                      ))}
                    </select>
                    <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                  
                  <div className="relative">
                    <select
                      className="appearance-none bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2 pr-8"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="success">Success</option>
                      <option value="failure">Failure</option>
                      <option value="warning">Warning</option>
                    </select>
                    <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Logs Table */}
              <div className="space-y-3">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`bg-dark-800 border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedLog?.id === log.id
                        ? 'border-primary-500'
                        : 'border-dark-600 hover:border-primary-500/50'
                    }`}
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="bg-primary-500/20 p-2 rounded-lg mr-3">
                          {getActionIcon(log.action)}
                        </div>
                        <div>
                          <h3 className="text-white font-medium">
                            {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h3>
                          <p className="text-gray-400 text-sm">by {log.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(log.status)}`}>
                          {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
                      <div>
                        <span>Resource: </span>
                        <span className="text-white">{log.resource}</span>
                      </div>
                      <div>
                        <span>IP: </span>
                        <span className="text-white font-mono">{log.ip_address}</span>
                      </div>
                      <div>
                        <span>Time: </span>
                        <span className="text-white">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div>
                        <span>Date: </span>
                        <span className="text-white">{new Date(log.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredLogs.length === 0 && (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No logs found</h3>
                  <p className="text-gray-400">
                    No audit logs match your current filters.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Log Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedLog ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-white font-medium mb-2">
                      {selectedLog.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedLog.status)}`}>
                      {selectedLog.status.charAt(0).toUpperCase() + selectedLog.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-400">User</p>
                      <p className="text-white">{selectedLog.username}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Timestamp</p>
                      <p className="text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">IP Address</p>
                      <p className="text-white font-mono">{selectedLog.ip_address}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Resource</p>
                      <p className="text-white">{selectedLog.resource}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Resource ID</p>
                      <p className="text-white font-mono">{selectedLog.resource_id}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-2">Details</h4>
                    <div className="bg-dark-700 p-3 rounded-lg">
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-2">User Agent</h4>
                    <p className="text-gray-300 text-xs font-mono break-all">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Select an event to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
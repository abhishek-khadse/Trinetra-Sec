import { useState, useEffect } from 'react';
import { Shield, Activity, Zap, AlertTriangle, Ban, RefreshCw, Download } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';

// Mock data types
interface TrafficStats {
  timestamp: number;
  requests: number;
  bandwidth: number;
  uniqueIPs: number;
}

interface BlockedIP {
  ip: string;
  reason: string;
  timestamp: string;
  requests: number;
  bandwidth: number;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: string;
}

const DDoSShieldPage = () => {
  const [isProtectionEnabled, setIsProtectionEnabled] = useState(true);
  const [trafficData, setTrafficData] = useState<TrafficStats[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock traffic data
      const now = Date.now();
      const mockTrafficData: TrafficStats[] = Array.from({ length: 24 }, (_, i) => ({
        timestamp: now - (23 - i) * 3600000,
        requests: Math.floor(Math.random() * 10000),
        bandwidth: Math.floor(Math.random() * 1000),
        uniqueIPs: Math.floor(Math.random() * 1000),
      }));

      // Mock blocked IPs
      const mockBlockedIPs: BlockedIP[] = [
        {
          ip: '192.168.1.100',
          reason: 'Rate limit exceeded',
          timestamp: new Date(now - 300000).toISOString(),
          requests: 15000,
          bandwidth: 2500,
        },
        {
          ip: '10.0.0.50',
          reason: 'Suspicious traffic pattern',
          timestamp: new Date(now - 600000).toISOString(),
          requests: 12000,
          bandwidth: 1800,
        },
        {
          ip: '172.16.0.25',
          reason: 'SYN flood attack',
          timestamp: new Date(now - 900000).toISOString(),
          requests: 20000,
          bandwidth: 3000,
        },
      ];

      // Mock alerts
      const mockAlerts: Alert[] = [
        {
          id: '1',
          type: 'critical',
          message: 'SYN flood attack detected from multiple IPs',
          timestamp: new Date(now - 300000).toISOString(),
        },
        {
          id: '2',
          type: 'warning',
          message: 'Unusual traffic spike from subnet 192.168.1.0/24',
          timestamp: new Date(now - 600000).toISOString(),
        },
        {
          id: '3',
          type: 'info',
          message: 'New IP range added to allowlist',
          timestamp: new Date(now - 900000).toISOString(),
        },
      ];

      setTrafficData(mockTrafficData);
      setBlockedIPs(mockBlockedIPs);
      setAlerts(mockAlerts);
      setIsLoading(false);
    };

    loadData();
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh
    setTimeout(() => setIsLoading(false), 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-primary-500 font-medium">Loading DDoS Shield...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">DDoS Shield</h1>
        <p className="text-gray-400">
          Real-time DDoS attack detection and mitigation system.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Protection Status</p>
                <h3 className="text-3xl font-bold text-success mt-1">Active</h3>
              </div>
              <div className="bg-success/20 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Current Traffic</p>
                <h3 className="text-3xl font-bold text-primary-500 mt-1">8.2K</h3>
                <p className="text-xs text-gray-400">requests/min</p>
              </div>
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-primary-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Blocked Attacks</p>
                <h3 className="text-3xl font-bold text-secondary-500 mt-1">156</h3>
                <p className="text-xs text-gray-400">last 24h</p>
              </div>
              <div className="bg-secondary-500/20 p-3 rounded-lg">
                <Ban className="h-6 w-6 text-secondary-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Bandwidth Usage</p>
                <h3 className="text-3xl font-bold text-warning mt-1">2.8</h3>
                <p className="text-xs text-gray-400">GB/hour</p>
              </div>
              <div className="bg-warning/20 p-3 rounded-lg">
                <Zap className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Traffic Graph */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Traffic Analysis</CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                    onClick={handleRefresh}
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
              <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-dark-600 rounded-lg">
                <p className="text-gray-400">Traffic visualization would go here</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg ${
                      alert.type === 'critical' ? 'bg-error/10 border border-error/20' :
                      alert.type === 'warning' ? 'bg-warning/10 border border-warning/20' :
                      'bg-info/10 border border-info/20'
                    }`}
                  >
                    <div className="flex items-center mb-2">
                      <AlertTriangle className={`h-5 w-5 mr-2 ${
                        alert.type === 'critical' ? 'text-error' :
                        alert.type === 'warning' ? 'text-warning' :
                        'text-info'
                      }`} />
                      <p className={`text-sm font-medium ${
                        alert.type === 'critical' ? 'text-error' :
                        alert.type === 'warning' ? 'text-warning' :
                        'text-info'
                      }`}>
                        {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)}
                      </p>
                    </div>
                    <p className="text-gray-300 text-sm">{alert.message}</p>
                    <p className="text-gray-400 text-xs mt-2">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Blocked IPs */}
      <Card>
        <CardHeader>
          <CardTitle>Blocked IP Addresses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-4">IP Address</th>
                  <th className="pb-4">Reason</th>
                  <th className="pb-4">Requests</th>
                  <th className="pb-4">Bandwidth</th>
                  <th className="pb-4">Timestamp</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedIPs.map((ip, index) => (
                  <tr key={index} className="border-t border-dark-600">
                    <td className="py-4">
                      <code className="text-white bg-dark-700 px-2 py-1 rounded">
                        {ip.ip}
                      </code>
                    </td>
                    <td className="py-4 text-gray-300">{ip.reason}</td>
                    <td className="py-4 text-gray-300">{ip.requests.toLocaleString()}</td>
                    <td className="py-4 text-gray-300">{ip.bandwidth} MB</td>
                    <td className="py-4 text-gray-300">
                      {new Date(ip.timestamp).toLocaleString()}
                    </td>
                    <td className="py-4">
                      <Button variant="ghost" size="sm">
                        Unblock
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Protection Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Protection Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="text-white font-medium">Basic Protection</h3>
              <div className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                <div>
                  <p className="text-sm text-white">DDoS Protection</p>
                  <p className="text-xs text-gray-400">Layer 3/4 protection</p>
                </div>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isProtectionEnabled}
                    onChange={() => setIsProtectionEnabled(!isProtectionEnabled)}
                    className="sr-only"
                    id="protection-toggle"
                  />
                  <label
                    htmlFor="protection-toggle"
                    className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                      isProtectionEnabled ? 'bg-success' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                        isProtectionEnabled ? 'transform translate-x-6' : ''
                      }`}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-medium">Rate Limiting</h3>
              <div className="p-4 bg-dark-800 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-white">Request Limit</p>
                  <p className="text-sm text-primary-500">1000/min</p>
                </div>
                <input
                  type="range"
                  min="100"
                  max="5000"
                  step="100"
                  value="1000"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-white font-medium">Automatic Blocking</h3>
              <div className="p-4 bg-dark-800 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-white">Block Duration</p>
                  <p className="text-sm text-primary-500">24 hours</p>
                </div>
                <select className="w-full bg-dark-700 border border-dark-600 rounded-md p-2 text-white">
                  <option>1 hour</option>
                  <option>6 hours</option>
                  <option selected>24 hours</option>
                  <option>7 days</option>
                  <option>Permanent</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DDoSShieldPage;
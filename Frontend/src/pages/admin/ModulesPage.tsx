import { useState } from 'react';
import { Package, Settings, ToggleLeft, ToggleRight, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

interface SecurityModule {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'inactive' | 'maintenance';
  version: string;
  last_updated: string;
  usage_count: number;
  enabled: boolean;
  config: Record<string, any>;
}

const mockModules: SecurityModule[] = [
  {
    id: '1',
    name: 'File Scanner',
    description: 'Advanced malware detection using YARA rules and ML models',
    category: 'Detection',
    status: 'active',
    version: '2.1.0',
    last_updated: '2025-03-15T10:00:00Z',
    usage_count: 1234,
    enabled: true,
    config: {
      max_file_size: '100MB',
      scan_timeout: '300s',
      yara_rules_enabled: true,
      ml_detection: true,
    },
  },
  {
    id: '2',
    name: 'Threat Feeds',
    description: 'Real-time threat intelligence from multiple sources',
    category: 'Intelligence',
    status: 'active',
    version: '1.8.2',
    last_updated: '2025-03-14T15:30:00Z',
    usage_count: 5678,
    enabled: true,
    config: {
      update_interval: '5m',
      sources: ['VirusTotal', 'PhishTank', 'MISP'],
      auto_block: true,
    },
  },
  {
    id: '3',
    name: 'DDoS Shield',
    description: 'Distributed denial-of-service attack protection',
    category: 'Protection',
    status: 'active',
    version: '3.0.1',
    last_updated: '2025-03-13T09:15:00Z',
    usage_count: 892,
    enabled: true,
    config: {
      rate_limit: '1000/min',
      auto_mitigation: true,
      whitelist_enabled: true,
    },
  },
  {
    id: '4',
    name: 'Phishing Detector',
    description: 'URL and email analysis for phishing detection',
    category: 'Detection',
    status: 'maintenance',
    version: '1.5.3',
    last_updated: '2025-03-10T14:20:00Z',
    usage_count: 456,
    enabled: false,
    config: {
      url_analysis: true,
      email_scanning: true,
      ml_confidence: 0.85,
    },
  },
  {
    id: '5',
    name: 'ReverseX',
    description: 'Binary analysis and reverse engineering toolkit',
    category: 'Analysis',
    status: 'inactive',
    version: '0.9.1',
    last_updated: '2025-02-28T11:45:00Z',
    usage_count: 123,
    enabled: false,
    config: {
      sandbox_enabled: true,
      static_analysis: true,
      dynamic_analysis: false,
    },
  },
];

const ModulesPage = () => {
  const [modules, setModules] = useState<SecurityModule[]>(mockModules);
  const [selectedModule, setSelectedModule] = useState<SecurityModule | null>(null);

  const toggleModule = (id: string) => {
    setModules(modules.map(module => 
      module.id === id 
        ? { ...module, enabled: !module.enabled, status: !module.enabled ? 'active' : 'inactive' as const }
        : module
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success bg-success/20';
      case 'inactive':
        return 'text-gray-400 bg-gray-400/20';
      case 'maintenance':
        return 'text-warning bg-warning/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'inactive':
        return <Package className="h-4 w-4" />;
      case 'maintenance':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Module Management</h1>
        <p className="text-gray-400">
          Configure and manage security modules across the platform.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Modules</p>
                <h3 className="text-3xl font-bold text-white mt-1">{modules.length}</h3>
              </div>
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <Package className="h-6 w-6 text-primary-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Active Modules</p>
                <h3 className="text-3xl font-bold text-success mt-1">
                  {modules.filter(m => m.status === 'active').length}
                </h3>
              </div>
              <div className="bg-success/20 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">In Maintenance</p>
                <h3 className="text-3xl font-bold text-warning mt-1">
                  {modules.filter(m => m.status === 'maintenance').length}
                </h3>
              </div>
              <div className="bg-warning/20 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Usage</p>
                <h3 className="text-3xl font-bold text-info mt-1">
                  {modules.reduce((sum, module) => sum + module.usage_count, 0).toLocaleString()}
                </h3>
              </div>
              <div className="bg-info/20 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Modules List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Security Modules</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className={`bg-dark-800 border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedModule?.id === module.id
                        ? 'border-primary-500'
                        : 'border-dark-600 hover:border-primary-500/50'
                    }`}
                    onClick={() => setSelectedModule(module)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="bg-primary-500/20 p-2 rounded-lg mr-3">
                          <Package className="h-5 w-5 text-primary-500" />
                        </div>
                        <div>
                          <h3 className="text-white font-medium">{module.name}</h3>
                          <p className="text-gray-400 text-sm">{module.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${getStatusColor(module.status)}`}>
                          {getStatusIcon(module.status)}
                          <span className="ml-1">{module.status.charAt(0).toUpperCase() + module.status.slice(1)}</span>
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleModule(module.id);
                          }}
                          className="text-gray-400 hover:text-primary-500"
                        >
                          {module.enabled ? (
                            <ToggleRight className="h-6 w-6 text-primary-500" />
                          ) : (
                            <ToggleLeft className="h-6 w-6" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-3">{module.description}</p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Version {module.version}</span>
                      <span>{module.usage_count.toLocaleString()} uses</span>
                      <span>Updated {new Date(module.last_updated).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Module Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Module Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedModule ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-white font-medium mb-2">{selectedModule.name}</h3>
                    <p className="text-gray-400 text-sm">{selectedModule.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Status</p>
                      <p className="text-white">{selectedModule.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Version</p>
                      <p className="text-white">{selectedModule.version}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Category</p>
                      <p className="text-white">{selectedModule.category}</p>
                    </div>
                    <div>
                      <p className="text-gray-400">Usage</p>
                      <p className="text-white">{selectedModule.usage_count.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-3">Configuration</h4>
                    <div className="bg-dark-700 p-4 rounded-lg">
                      <div className="space-y-3">
                        {Object.entries(selectedModule.config).map(([key, value]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span className="text-gray-400 text-sm">{key.replace(/_/g, ' ')}</span>
                            <span className="text-white text-sm font-mono">
                              {typeof value === 'boolean' ? (value ? 'true' : 'false') : value.toString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      fullWidth
                      leftIcon={<Settings className="h-4 w-4" />}
                    >
                      Configure Module
                    </Button>
                    <Button
                      variant="outline"
                      fullWidth
                      leftIcon={<Activity className="h-4 w-4" />}
                    >
                      View Logs
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-400">Select a module to view details</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModulesPage;
import { useState, useEffect } from 'react';
import { Heart, Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';

interface SecurityMetric {
  id: string;
  name: string;
  category: string;
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  trend: 'up' | 'down' | 'stable';
  description: string;
  lastChecked: string;
}

interface HealthScore {
  overall: number;
  categories: {
    network: number;
    endpoints: number;
    applications: number;
    data: number;
    identity: number;
  };
}

const mockMetrics: SecurityMetric[] = [
  {
    id: '1',
    name: 'Firewall Configuration',
    category: 'network',
    score: 95,
    status: 'healthy',
    trend: 'stable',
    description: 'Firewall rules are properly configured and up to date',
    lastChecked: new Date(Date.now() - 300000).toISOString(),
  },
  {
    id: '2',
    name: 'Endpoint Protection',
    category: 'endpoints',
    score: 78,
    status: 'warning',
    trend: 'down',
    description: '3 endpoints missing latest security updates',
    lastChecked: new Date(Date.now() - 600000).toISOString(),
  },
  {
    id: '3',
    name: 'Application Security',
    category: 'applications',
    score: 88,
    status: 'healthy',
    trend: 'up',
    description: 'All applications have security patches applied',
    lastChecked: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: '4',
    name: 'Data Encryption',
    category: 'data',
    score: 92,
    status: 'healthy',
    trend: 'stable',
    description: 'Data at rest and in transit properly encrypted',
    lastChecked: new Date(Date.now() - 1200000).toISOString(),
  },
  {
    id: '5',
    name: 'Identity Management',
    category: 'identity',
    score: 65,
    status: 'critical',
    trend: 'down',
    description: 'Multiple accounts with weak passwords detected',
    lastChecked: new Date(Date.now() - 1500000).toISOString(),
  },
];

const SecureHealthViewPage = () => {
  const [metrics, setMetrics] = useState<SecurityMetric[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    // Simulate loading health data
    const loadHealthData = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMetrics(mockMetrics);
      
      // Calculate health scores
      const categoryScores = {
        network: mockMetrics.filter(m => m.category === 'network').reduce((sum, m) => sum + m.score, 0) / mockMetrics.filter(m => m.category === 'network').length,
        endpoints: mockMetrics.filter(m => m.category === 'endpoints').reduce((sum, m) => sum + m.score, 0) / mockMetrics.filter(m => m.category === 'endpoints').length,
        applications: mockMetrics.filter(m => m.category === 'applications').reduce((sum, m) => sum + m.score, 0) / mockMetrics.filter(m => m.category === 'applications').length,
        data: mockMetrics.filter(m => m.category === 'data').reduce((sum, m) => sum + m.score, 0) / mockMetrics.filter(m => m.category === 'data').length,
        identity: mockMetrics.filter(m => m.category === 'identity').reduce((sum, m) => sum + m.score, 0) / mockMetrics.filter(m => m.category === 'identity').length,
      };
      
      const overall = Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / Object.values(categoryScores).length;
      
      setHealthScore({
        overall: Math.round(overall),
        categories: {
          network: Math.round(categoryScores.network),
          endpoints: Math.round(categoryScores.endpoints),
          applications: Math.round(categoryScores.applications),
          data: Math.round(categoryScores.data),
          identity: Math.round(categoryScores.identity),
        },
      });
      
      setIsLoading(false);
    };

    loadHealthData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-success bg-success/20';
      case 'warning':
        return 'text-warning bg-warning/20';
      case 'critical':
        return 'text-error bg-error/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 70) return 'text-warning';
    return 'text-error';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-error" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(m => m.category === selectedCategory);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-primary-500 font-medium">Loading security health...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Secure Health View</h1>
        <p className="text-gray-400">
          Comprehensive security posture assessment and health monitoring.
        </p>
      </div>

      {/* Overall Health Score */}
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-primary-500/20 p-4 rounded-full mr-6">
                <Heart className="h-8 w-8 text-primary-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Overall Security Health</h2>
                <p className="text-gray-400">Last updated: {new Date().toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-6xl font-bold ${getScoreColor(healthScore?.overall || 0)}`}>
                {healthScore?.overall || 0}
              </div>
              <p className="text-gray-400 text-sm">out of 100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {healthScore && Object.entries(healthScore.categories).map(([category, score]) => (
          <Card
            key={category}
            className={`cursor-pointer transition-all ${
              selectedCategory === category ? 'border-primary-500' : 'hover:border-primary-500/50'
            }`}
            onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
          >
            <CardContent className="p-6 text-center">
              <div className="bg-dark-700 p-3 rounded-lg mb-4 mx-auto w-fit">
                <Shield className="h-6 w-6 text-primary-500" />
              </div>
              <h3 className="text-white font-medium mb-2 capitalize">{category}</h3>
              <div className={`text-3xl font-bold ${getScoreColor(score)}`}>
                {score}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Security Metrics */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Security Metrics</CardTitle>
            <div className="flex space-x-2">
              <select
                className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-3 py-1.5 text-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="network">Network</option>
                <option value="endpoints">Endpoints</option>
                <option value="applications">Applications</option>
                <option value="data">Data</option>
                <option value="identity">Identity</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredMetrics.map((metric) => (
              <div
                key={metric.id}
                className="bg-dark-800 border border-dark-600 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    {metric.status === 'healthy' ? (
                      <CheckCircle className="h-5 w-5 text-success mr-3" />
                    ) : metric.status === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-warning mr-3" />
                    ) : (
                      <XCircle className="h-5 w-5 text-error mr-3" />
                    )}
                    <div>
                      <h3 className="text-white font-medium">{metric.name}</h3>
                      <p className="text-gray-400 text-sm capitalize">{metric.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      {getTrendIcon(metric.trend)}
                      <span className={`ml-2 text-2xl font-bold ${getScoreColor(metric.score)}`}>
                        {metric.score}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                      {metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-300 mb-2">{metric.description}</p>
                <p className="text-gray-400 text-xs">
                  Last checked: {new Date(metric.lastChecked).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {filteredMetrics.length === 0 && (
            <div className="text-center py-8">
              <Heart className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No metrics found</h3>
              <p className="text-gray-400">
                No security metrics match the selected category.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecureHealthViewPage;
import { useState } from 'react';
import { FileText, Download, Filter, RefreshCw, Calendar } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

interface Report {
  id: string;
  title: string;
  type: 'scan' | 'incident' | 'audit' | 'compliance';
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
  updated_at: string;
  size: string;
}

const mockReports: Report[] = [
  {
    id: '1',
    title: 'Monthly Security Assessment - March 2025',
    type: 'audit',
    status: 'completed',
    created_at: '2025-03-15T10:00:00Z',
    updated_at: '2025-03-15T12:30:00Z',
    size: '2.4 MB',
  },
  {
    id: '2',
    title: 'Malware Scan Results - System Wide',
    type: 'scan',
    status: 'completed',
    created_at: '2025-03-14T15:20:00Z',
    updated_at: '2025-03-14T16:45:00Z',
    size: '1.8 MB',
  },
  {
    id: '3',
    title: 'Security Incident Report - DDoS Attack',
    type: 'incident',
    status: 'completed',
    created_at: '2025-03-13T08:15:00Z',
    updated_at: '2025-03-13T09:30:00Z',
    size: '3.2 MB',
  },
  {
    id: '4',
    title: 'Compliance Check - ISO 27001',
    type: 'compliance',
    status: 'pending',
    created_at: '2025-03-12T14:00:00Z',
    updated_at: '2025-03-12T14:00:00Z',
    size: '1.5 MB',
  },
];

const ReportsPage = () => {
  const [reports] = useState<Report[]>(mockReports);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || report.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/20';
      case 'pending':
        return 'text-warning bg-warning/20';
      case 'failed':
        return 'text-error bg-error/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scan':
        return 'text-primary-500 bg-primary-500/20';
      case 'incident':
        return 'text-secondary-500 bg-secondary-500/20';
      case 'audit':
        return 'text-info bg-info/20';
      case 'compliance':
        return 'text-warning bg-warning/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Reports</h1>
        <p className="text-gray-400">
          Access and manage security reports, scans, and assessments.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Security Reports</CardTitle>
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
                Generate Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<FileText className="h-4 w-4" />}
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
                  <option value="scan">Scan</option>
                  <option value="incident">Incident</option>
                  <option value="audit">Audit</option>
                  <option value="compliance">Compliance</option>
                </select>
                <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              
              <div className="relative">
                <select
                  className="appearance-none bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2 pr-8"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
                <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-4">Report Name</th>
                  <th className="pb-4">Type</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Created</th>
                  <th className="pb-4">Size</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id} className="border-t border-dark-600">
                    <td className="py-4">
                      <div className="flex items-center">
                        <FileText className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-white">{report.title}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(report.type)}`}>
                        {report.type.charAt(0).toUpperCase() + report.type.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center text-gray-400">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-4 text-gray-400">
                      {report.size}
                    </td>
                    <td className="py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Download className="h-4 w-4" />}
                      >
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No reports found</h3>
              <p className="text-gray-400">
                No reports match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;
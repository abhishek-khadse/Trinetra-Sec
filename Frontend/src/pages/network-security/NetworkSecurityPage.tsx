import { useState } from 'react';
import { Network, Shield, Wifi, Terminal, FileText } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const NetworkSecurityPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const topics = [
    {
      id: 'overview',
      title: 'Network Security Overview',
      icon: Network,
      content: 'Introduction to network security concepts and architecture.',
    },
    {
      id: 'firewall',
      title: 'Firewall Configuration',
      icon: Shield,
      content: 'Best practices for firewall setup and management.',
    },
    {
      id: 'sniffing',
      title: 'Packet Analysis',
      icon: Terminal,
      content: 'Network traffic analysis and monitoring.',
    },
    {
      id: 'wifi',
      title: 'Wireless Security',
      icon: Wifi,
      content: 'Securing wireless networks and communications.',
    },
    {
      id: 'log-analysis',
      title: 'Log Analysis',
      icon: FileText,
      content: 'Network log analysis and threat detection.',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Network Security</h1>
        <p className="text-gray-400">
          Learn about network security, monitoring, and threat detection.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topics.map((topic) => {
          const Icon = topic.icon;
          return (
            <Card
              key={topic.id}
              className={`cursor-pointer transition-all ${
                activeTab === topic.id
                  ? 'border-primary-500 shadow-neon-blue'
                  : 'hover:border-primary-500/50'
              }`}
              onClick={() => setActiveTab(topic.id)}
            >
              <CardContent className="p-6">
                
                <div className="flex items-center mb-4">
                  <div className="bg-primary-500/20 p-3 rounded-lg">
                    <Icon className="h-6 w-6 text-primary-500" />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-white">
                    {topic.title}
                  </h3>
                </div>
                <p className="text-gray-400 mb-4">{topic.content}</p>
                <Button
                  variant={activeTab === topic.id ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full"
                >
                  {activeTab === topic.id ? 'Currently Viewing' : 'View Topic'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content area */}
      <Card>
        <CardHeader>
          <CardTitle>
            {topics.find((t) => t.id === activeTab)?.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-invert max-w-none">
            {/* This would be replaced with actual content */}
            <p>Content for {activeTab} goes here...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkSecurityPage;
import { useState } from 'react';
import { Book, Shield, Terminal, AlertTriangle, Code, CheckCircle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const WebSecurityPage = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const topics = [
    {
      id: 'overview',
      title: 'Web Security Overview',
      icon: Book,
      content: 'Learn about common web vulnerabilities and security best practices.',
    },
    {
      id: 'vulnerabilities',
      title: 'Common Vulnerabilities',
      icon: AlertTriangle,
      content: 'Explore XSS, CSRF, SQL Injection, and other critical web vulnerabilities.',
    },
    {
      id: 'misconfigurations',
      title: 'Security Misconfigurations',
      icon: Shield,
      content: 'Identify and fix common security misconfigurations in web applications.',
    },
    {
      id: 'headers',
      title: 'Security Headers',
      icon: Code,
      content: 'Implement and understand HTTP security headers.',
    },
    {
      id: 'checklist',
      title: 'Security Checklist',
      icon: CheckCircle,
      content: 'Step-by-step checklist for securing web applications.',
    },
    {
      id: 'tools',
      title: 'Security Tools',
      icon: Terminal,
      content: 'Essential tools for web security testing and monitoring.',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Web Security</h1>
        <p className="text-gray-400">
          Learn about web application security, vulnerabilities, and best practices.
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

export default WebSecurityPage;
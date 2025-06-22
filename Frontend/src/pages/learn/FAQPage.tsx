import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Search, Book } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

const mockFAQs: FAQ[] = [
  {
    id: '1',
    category: 'General',
    question: 'What is TrinetraSec and how does it work?',
    answer: 'TrinetraSec is a comprehensive cybersecurity platform that provides advanced threat detection, malware analysis, and security monitoring tools. It works by combining multiple security modules including file scanning, threat intelligence feeds, and real-time monitoring to protect your digital assets.',
    tags: ['platform', 'overview', 'features'],
  },
  {
    id: '2',
    category: 'File Scanner',
    question: 'What file types can I scan with the File Scanner?',
    answer: 'The File Scanner supports a wide range of file types including executables (.exe, .dll), documents (.pdf, .doc, .docx, .xls, .xlsx), scripts (.js, .py, .ps1), and archives (.zip, .rar, .7z). The scanner uses YARA rules and machine learning models to detect known and unknown threats.',
    tags: ['file-scanner', 'supported-formats', 'malware'],
  },
  {
    id: '3',
    category: 'Threat Feeds',
    question: 'How often are threat feeds updated?',
    answer: 'Threat feeds are updated in real-time from multiple sources including VirusTotal, PhishTank, and other threat intelligence providers. New indicators of compromise (IOCs) are added continuously, ensuring you have access to the latest threat information.',
    tags: ['threat-feeds', 'updates', 'real-time'],
  },
  {
    id: '4',
    category: 'Security',
    question: 'How secure is my data on TrinetraSec?',
    answer: 'We take data security very seriously. All data is encrypted in transit and at rest using industry-standard encryption. We follow SOC 2 compliance standards and implement zero-trust security principles. Your files are processed in isolated environments and are not stored permanently on our servers.',
    tags: ['security', 'encryption', 'privacy'],
  },
  {
    id: '5',
    category: 'API',
    question: 'Does TrinetraSec provide an API for integration?',
    answer: 'Yes, TrinetraSec offers a comprehensive REST API that allows you to integrate our security capabilities into your existing workflows. The API supports file scanning, threat intelligence queries, and real-time notifications. API documentation is available in the Docs section.',
    tags: ['api', 'integration', 'automation'],
  },
  {
    id: '6',
    category: 'Billing',
    question: 'What are the pricing plans available?',
    answer: 'TrinetraSec offers flexible pricing plans including a free tier for individual users, professional plans for small teams, and enterprise solutions for large organizations. Each plan includes different limits on scans, API calls, and advanced features. Contact our sales team for custom enterprise pricing.',
    tags: ['pricing', 'plans', 'billing'],
  },
  {
    id: '7',
    category: 'DDoS Protection',
    question: 'How does the DDoS Shield protect my infrastructure?',
    answer: 'DDoS Shield provides multi-layered protection against distributed denial-of-service attacks. It includes rate limiting, traffic analysis, IP reputation checking, and automatic mitigation responses. The system can handle attacks up to several Gbps and provides real-time monitoring and alerting.',
    tags: ['ddos', 'protection', 'infrastructure'],
  },
  {
    id: '8',
    category: 'Phishing Detection',
    question: 'How accurate is the phishing detection system?',
    answer: 'Our phishing detection system uses advanced machine learning algorithms and maintains a 99.5% accuracy rate. It analyzes URLs, email content, domain reputation, and visual similarity to known phishing sites. The system is continuously updated with new threat patterns.',
    tags: ['phishing', 'detection', 'accuracy'],
  },
];

const FAQPage = () => {
  const [faqs] = useState<FAQ[]>(mockFAQs);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-400">
          Find answers to common questions about TrinetraSec and cybersecurity.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search FAQs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          fullWidth
        />
        
        <select
          className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* FAQ Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map(category => (
          <Card
            key={category}
            className={`cursor-pointer transition-all ${
              selectedCategory === category ? 'border-primary-500' : 'hover:border-primary-500/50'
            }`}
            onClick={() => setSelectedCategory(selectedCategory === category ? 'all' : category)}
          >
            <CardContent className="p-4 text-center">
              <HelpCircle className="h-8 w-8 text-primary-500 mx-auto mb-2" />
              <h3 className="text-white font-medium mb-1">{category}</h3>
              <p className="text-gray-400 text-sm">
                {faqs.filter(faq => faq.category === category).length} questions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFAQs.map((faq) => (
          <Card key={faq.id}>
            <CardContent className="p-0">
              <button
                onClick={() => toggleFAQ(faq.id)}
                className="w-full text-left p-6 hover:bg-dark-700/50 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-primary-500 text-sm font-medium mr-2">
                        {faq.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-white">{faq.question}</h3>
                  </div>
                  <div className="ml-4">
                    {expandedFAQ === faq.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </button>
              
              {expandedFAQ === faq.id && (
                <div className="px-6 pb-6">
                  <div className="border-t border-dark-600 pt-4">
                    <p className="text-gray-300 leading-relaxed mb-4">{faq.answer}</p>
                    <div className="flex flex-wrap gap-2">
                      {faq.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-dark-700 text-gray-400 rounded text-xs"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFAQs.length === 0 && (
        <div className="text-center py-8">
          <HelpCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No FAQs found</h3>
          <p className="text-gray-400">
            No questions match your current search or filter criteria.
          </p>
        </div>
      )}

      {/* Contact Support */}
      <Card>
        <CardContent className="p-6 text-center">
          <Book className="h-12 w-12 text-primary-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Still have questions?</h3>
          <p className="text-gray-400 mb-4">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <div className="flex justify-center space-x-4">
            <a
              href="mailto:support@trinetrasec.com"
              className="text-primary-500 hover:text-primary-400 font-medium"
            >
              Contact Support
            </a>
            <span className="text-gray-600">•</span>
            <a
              href="/docs"
              className="text-primary-500 hover:text-primary-400 font-medium"
            >
              View Documentation
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQPage;
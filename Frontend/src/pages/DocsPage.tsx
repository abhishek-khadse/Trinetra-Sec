import { useState } from 'react';
import { Search, Book, Code, FileText, HelpCircle, ChevronRight } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Input from '../components/ui/Input';
import ReactMarkdown from 'react-markdown';

// Mock documentation data - in real app, this would be fetched from Supabase or MDX files
const docs = {
  'getting-started': {
    title: 'Getting Started',
    content: `
# Getting Started with TrinetraSec

Welcome to TrinetraSec, your comprehensive cybersecurity platform. This guide will help you get started with our suite of security tools.

## Quick Start

1. Create an account or sign in
2. Navigate to your dashboard
3. Start using our security modules:
   - File Scanner
   - ReverseX
   - DDoS Shield
   - Phishing Detector

## API Access

To access our API, you'll need to generate an API key from your profile settings. All API requests should include this key in the Authorization header.

\`\`\`typescript
const response = await fetch('https://api.trinetrasec.com/v1/scan', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY'
  }
});
\`\`\`

## Next Steps

- Read our [API Documentation](/docs/api)
- Join our [Community](/community)
- Check out our [Security Guides](/docs/guides)
    `,
  },
  'api-reference': {
    title: 'API Reference',
    content: `
# API Reference

## Authentication

All API endpoints require authentication using JWT tokens. You can obtain a token by authenticating through our authentication endpoints.

### Base URL

\`\`\`
https://api.trinetrasec.com/v1
\`\`\`

### Endpoints

#### File Scanner API

\`\`\`typescript
POST /scan/file
Content-Type: multipart/form-data

{
  file: File
}
\`\`\`

#### Threat Intelligence API

\`\`\`typescript
GET /threats
Authorization: Bearer <token>

Response:
{
  threats: Array<{
    id: string;
    type: string;
    severity: string;
    indicators: Array<string>;
    timestamp: string;
  }>
}
\`\`\`
    `,
  },
  'security-guides': {
    title: 'Security Guides',
    content: `
# Security Guides

## Best Practices

### File Analysis

When analyzing suspicious files:

1. Always use isolated environments
2. Enable real-time scanning
3. Monitor system changes
4. Document findings

### DDoS Protection

To maximize DDoS protection:

1. Configure rate limiting
2. Set up IP whitelisting
3. Enable anomaly detection
4. Monitor traffic patterns

### Phishing Prevention

Key steps in preventing phishing:

1. URL verification
2. SSL certificate checks
3. Content analysis
4. Domain age verification
    `,
  },
};

const DocsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDoc, setCurrentDoc] = useState('getting-started');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Documentation</h1>
        <p className="text-gray-400">
          Comprehensive guides, API references, and security documentation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1 space-y-6">
          <Input
            placeholder="Search documentation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />

          <Card>
            <CardContent className="p-4">
              <nav>
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setCurrentDoc('getting-started')}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                        currentDoc === 'getting-started'
                          ? 'bg-primary-500/20 text-primary-500'
                          : 'text-gray-300 hover:bg-dark-700'
                      }`}
                    >
                      <Book className="h-4 w-4 mr-2" />
                      Getting Started
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentDoc('api-reference')}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                        currentDoc === 'api-reference'
                          ? 'bg-primary-500/20 text-primary-500'
                          : 'text-gray-300 hover:bg-dark-700'
                      }`}
                    >
                      <Code className="h-4 w-4 mr-2" />
                      API Reference
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setCurrentDoc('security-guides')}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                        currentDoc === 'security-guides'
                          ? 'bg-primary-500/20 text-primary-500'
                          : 'text-gray-300 hover:bg-dark-700'
                      }`}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Security Guides
                    </button>
                  </li>
                  <li>
                    <button
                      className="w-full text-left px-3 py-2 rounded-md flex items-center text-gray-300 hover:bg-dark-700"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      FAQ
                    </button>
                  </li>
                </ul>
              </nav>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="text-white font-medium mb-2">Need Help?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Can't find what you're looking for? Our support team is here to help.
              </p>
              <a
                href="mailto:support@trinetrasec.com"
                className="text-primary-500 hover:text-primary-400 text-sm flex items-center"
              >
                Contact Support
                <ChevronRight className="h-4 w-4 ml-1" />
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>{docs[currentDoc as keyof typeof docs].title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>
                  {docs[currentDoc as keyof typeof docs].content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocsPage;
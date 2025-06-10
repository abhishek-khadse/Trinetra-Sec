import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, RefreshCw, Download, Trash2 } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  lastUpdated: string;
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    title: 'Malware Analysis Help',
    messages: [
      {
        id: '1',
        type: 'user',
        content: 'Can you help me analyze this suspicious file hash?',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: '2',
        type: 'assistant',
        content: 'I\'d be happy to help you analyze a suspicious file hash. Please provide the hash value and I can check it against known threat databases and provide analysis.',
        timestamp: new Date(Date.now() - 3500000).toISOString(),
      },
    ],
    lastUpdated: new Date(Date.now() - 3500000).toISOString(),
  },
];

const TrinetraGPTPage = () => {
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeConversation, setActiveConversation] = useState<string | null>(conversations[0]?.id || null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = conversations.find(c => c.id === activeConversation);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };

    // Add user message
    if (activeConversation) {
      setConversations(prev => prev.map(conv => 
        conv.id === activeConversation 
          ? { ...conv, messages: [...conv.messages, userMessage], lastUpdated: new Date().toISOString() }
          : conv
      ));
    } else {
      // Create new conversation
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        messages: [userMessage],
        lastUpdated: new Date().toISOString(),
      };
      setConversations(prev => [newConversation, ...prev]);
      setActiveConversation(newConversation.id);
    }

    setMessage('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateMockResponse(userMessage.content),
        timestamp: new Date().toISOString(),
      };

      setConversations(prev => prev.map(conv => 
        conv.id === (activeConversation || prev[0]?.id)
          ? { ...conv, messages: [...conv.messages, assistantMessage], lastUpdated: new Date().toISOString() }
          : conv
      ));
      setIsLoading(false);
    }, 1500);
  };

  const generateMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('malware') || lowerMessage.includes('virus')) {
      return 'I can help you with malware analysis. For file analysis, I recommend using our File Scanner module. You can upload suspicious files and I\'ll analyze them using YARA rules and machine learning models. Would you like me to guide you through the scanning process?';
    }
    
    if (lowerMessage.includes('phishing')) {
      return 'Phishing attacks are a serious threat. Our Phishing Detector can analyze URLs and emails for suspicious patterns. I can help you identify common phishing indicators like suspicious domains, misleading content, and social engineering tactics. What specific phishing concern do you have?';
    }
    
    if (lowerMessage.includes('ddos')) {
      return 'DDoS attacks can severely impact your infrastructure. Our DDoS Shield provides real-time protection and monitoring. I can help you understand attack patterns, configure rate limiting, and set up automated responses. Are you currently experiencing an attack?';
    }
    
    if (lowerMessage.includes('vulnerability') || lowerMessage.includes('cve')) {
      return 'Vulnerability management is crucial for security. I can help you understand CVE details, assess impact, and prioritize patching. Our threat feeds include the latest vulnerability information. What specific vulnerability are you concerned about?';
    }
    
    return 'I\'m TrinetraGPT, your cybersecurity assistant. I can help you with threat analysis, security best practices, incident response, and using our security modules. What specific security challenge can I help you with today?';
  };

  const handleNewConversation = () => {
    setActiveConversation(null);
    setMessage('');
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (activeConversation === conversationId) {
      setActiveConversation(conversations[0]?.id || null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">TrinetraGPT</h1>
        <p className="text-gray-400">
          Your AI-powered cybersecurity assistant for threat analysis and security guidance.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-200px)]">
        {/* Conversations Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Conversations</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNewConversation}
                >
                  New Chat
                </Button>
              </div>
            </CardHeader>
            <CardContent className="h-full overflow-y-auto">
              <div className="space-y-2">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      activeConversation === conversation.id
                        ? 'bg-primary-500/20 border border-primary-500'
                        : 'bg-dark-800 hover:bg-dark-700'
                    }`}
                    onClick={() => setActiveConversation(conversation.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {conversation.title}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          {new Date(conversation.lastUpdated).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConversation(conversation.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-primary-500" />
                  TrinetraGPT Assistant
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Clear
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
            
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {currentConversation?.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-4 rounded-lg ${
                        msg.type === 'user'
                          ? 'bg-primary-500 text-dark-800'
                          : 'bg-dark-700 text-white'
                      }`}
                    >
                      <div className="flex items-start">
                        {msg.type === 'assistant' && (
                          <Bot className="h-5 w-5 mr-2 mt-0.5 text-primary-500 flex-shrink-0" />
                        )}
                        {msg.type === 'user' && (
                          <User className="h-5 w-5 mr-2 mt-0.5 text-dark-800 flex-shrink-0" />
                        )}
                        <div>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-2 ${
                            msg.type === 'user' ? 'text-dark-600' : 'text-gray-400'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <Bot className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-white mb-2">Welcome to TrinetraGPT</h3>
                    <p className="text-gray-400">
                      I'm your cybersecurity assistant. Ask me about threats, vulnerabilities, or security best practices.
                    </p>
                  </div>
                )}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-dark-700 text-white p-4 rounded-lg">
                      <div className="flex items-center">
                        <Bot className="h-5 w-5 mr-2 text-primary-500" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>

            {/* Message Input */}
            <div className="p-4 border-t border-dark-600">
              <div className="flex space-x-2">
                <Input
                  placeholder="Ask me about cybersecurity..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  fullWidth
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Send
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TrinetraGPTPage;
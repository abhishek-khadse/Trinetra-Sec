import { useState } from 'react';
import { Book, Clock, User, ChevronRight, Filter, Search } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface CaseStudy {
  id: string;
  title: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  author: string;
  description: string;
  tags: string[];
  publishedDate: string;
  readTime: string;
}

const mockCaseStudies: CaseStudy[] = [
  {
    id: '1',
    title: 'The SolarWinds Supply Chain Attack',
    category: 'Advanced Persistent Threats',
    difficulty: 'advanced',
    duration: '45 min',
    author: 'Dr. Sarah Chen',
    description: 'A comprehensive analysis of the SolarWinds hack, examining how attackers compromised the software supply chain to infiltrate thousands of organizations.',
    tags: ['Supply Chain', 'APT', 'Nation State', 'SUNBURST'],
    publishedDate: '2024-03-15',
    readTime: '15 min read',
  },
  {
    id: '2',
    title: 'Ransomware Response: Colonial Pipeline',
    category: 'Incident Response',
    difficulty: 'intermediate',
    duration: '30 min',
    author: 'Mike Rodriguez',
    description: 'Learn from the Colonial Pipeline ransomware incident, including the attack timeline, response decisions, and lessons learned.',
    tags: ['Ransomware', 'Critical Infrastructure', 'DarkSide', 'Business Impact'],
    publishedDate: '2024-03-10',
    readTime: '12 min read',
  },
  {
    id: '3',
    title: 'Phishing Campaign Analysis: COVID-19 Themed Attacks',
    category: 'Social Engineering',
    difficulty: 'beginner',
    duration: '20 min',
    author: 'Jennifer Park',
    description: 'Examine how cybercriminals exploited the COVID-19 pandemic through sophisticated phishing campaigns targeting remote workers.',
    tags: ['Phishing', 'Social Engineering', 'COVID-19', 'Remote Work'],
    publishedDate: '2024-03-05',
    readTime: '8 min read',
  },
  {
    id: '4',
    title: 'Zero-Day Exploitation: Microsoft Exchange Server',
    category: 'Vulnerability Analysis',
    difficulty: 'advanced',
    duration: '60 min',
    author: 'Alex Thompson',
    description: 'Deep dive into the Microsoft Exchange Server zero-day vulnerabilities and how they were exploited by the HAFNIUM group.',
    tags: ['Zero-Day', 'Exchange Server', 'HAFNIUM', 'Web Shells'],
    publishedDate: '2024-02-28',
    readTime: '20 min read',
  },
];

const CaseStudiesPage = () => {
  const [caseStudies] = useState<CaseStudy[]>(mockCaseStudies);
  const [filteredStudies, setFilteredStudies] = useState<CaseStudy[]>(mockCaseStudies);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  const categories = Array.from(new Set(caseStudies.map(study => study.category)));

  const applyFilters = () => {
    let filtered = caseStudies;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(study =>
        study.title.toLowerCase().includes(term) ||
        study.description.toLowerCase().includes(term) ||
        study.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(study => study.category === categoryFilter);
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(study => study.difficulty === difficultyFilter);
    }

    setFilteredStudies(filtered);
  };

  React.useEffect(() => {
    applyFilters();
  }, [searchTerm, categoryFilter, difficultyFilter]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-success bg-success/20';
      case 'intermediate':
        return 'text-warning bg-warning/20';
      case 'advanced':
        return 'text-error bg-error/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Case Studies</h1>
        <p className="text-gray-400">
          Learn from real-world cybersecurity incidents and attack scenarios.
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="Search case studies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              fullWidth
            />
            
            <div className="flex gap-4">
              <div className="relative">
                <select
                  className="appearance-none bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2 pr-8"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              
              <div className="relative">
                <select
                  className="appearance-none bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2 pr-8"
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Case Studies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredStudies.map((study) => (
          <Card key={study.id} className="hover:border-primary-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{study.title}</h3>
                  <p className="text-gray-400 text-sm mb-2">{study.category}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(study.difficulty)}`}>
                  {study.difficulty.charAt(0).toUpperCase() + study.difficulty.slice(1)}
                </span>
              </div>
              
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">{study.description}</p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {study.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-dark-700 text-gray-300 rounded text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {study.tags.length > 3 && (
                  <span className="px-2 py-1 bg-dark-700 text-gray-300 rounded text-xs">
                    +{study.tags.length - 3} more
                  </span>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  {study.author}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {study.readTime}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">
                  Published: {new Date(study.publishedDate).toLocaleDateString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ChevronRight className="h-4 w-4" />}
                >
                  Read Study
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudies.length === 0 && (
        <div className="text-center py-8">
          <Book className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No case studies found</h3>
          <p className="text-gray-400">
            No case studies match your current filters. Try adjusting your search criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default CaseStudiesPage;
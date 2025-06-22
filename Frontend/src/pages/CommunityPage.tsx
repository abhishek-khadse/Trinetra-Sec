import { Github, Disc as Discord, Users, MessageSquare, ExternalLink, Mail } from 'lucide-react';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';

// Mock contributor data - in real app, fetch from Supabase or GitHub API
const contributors = [
  {
    username: 'alexcyber',
    avatar: 'https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=100',
    role: 'Core Team',
    contributions: 156,
  },
  {
    username: 'sarahsec',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=100',
    role: 'Contributor',
    contributions: 89,
  },
  {
    username: 'mikenet',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100',
    role: 'Contributor',
    contributions: 67,
  },
  {
    username: 'davidpen',
    avatar: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=100',
    role: 'Contributor',
    contributions: 45,
  },
];

// Mock blog posts - in real app, fetch from Supabase or CMS
const blogPosts = [
  {
    title: 'Understanding Modern DDoS Attack Vectors',
    excerpt: 'An in-depth analysis of emerging DDoS attack patterns and mitigation strategies...',
    author: 'Alex Cyber',
    date: '2025-03-15',
    readTime: '8 min read',
  },
  {
    title: 'Machine Learning in Malware Detection',
    excerpt: 'How we leverage ML models to improve detection accuracy and reduce false positives...',
    author: 'Sarah Sec',
    date: '2025-03-10',
    readTime: '12 min read',
  },
  {
    title: 'The Rise of Supply Chain Attacks',
    excerpt: 'Recent trends in software supply chain attacks and how to protect your organization...',
    author: 'Mike Net',
    date: '2025-03-05',
    readTime: '10 min read',
  },
];

const CommunityPage = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Community</h1>
        <p className="text-gray-400">
          Join our growing community of security researchers and developers.
        </p>
      </div>

      {/* Community Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-dark-700 hover:bg-dark-600 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <Github className="h-6 w-6 text-primary-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">GitHub</h3>
            <p className="text-gray-400 text-sm mb-4">
              Contribute to our open-source projects and help improve TrinetraSec.
            </p>
            <a
              href="https://github.com/trinetrasec"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-400 flex items-center text-sm"
            >
              View Repository
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </CardContent>
        </Card>

        <Card className="bg-dark-700 hover:bg-dark-600 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <Discord className="h-6 w-6 text-primary-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Discord</h3>
            <p className="text-gray-400 text-sm mb-4">
              Join our Discord server to discuss security and get help.
            </p>
            <a
              href="https://discord.gg/trinetrasec"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-400 flex items-center text-sm"
            >
              Join Server
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </CardContent>
        </Card>

        <Card className="bg-dark-700 hover:bg-dark-600 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <MessageSquare className="h-6 w-6 text-primary-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Forum</h3>
            <p className="text-gray-400 text-sm mb-4">
              Participate in discussions about cybersecurity and threat intel.
            </p>
            <a
              href="/forum"
              className="text-primary-500 hover:text-primary-400 flex items-center text-sm"
            >
              Browse Forums
              <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </CardContent>
        </Card>

        <Card className="bg-dark-700 hover:bg-dark-600 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <Mail className="h-6 w-6 text-primary-500" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Newsletter</h3>
            <p className="text-gray-400 text-sm mb-4">
              Subscribe to our newsletter for security updates and news.
            </p>
            <Button variant="outline" size="sm">
              Subscribe
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Contributors Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Contributors</h2>
              <p className="text-gray-400 text-sm mt-1">
                Meet the people who make TrinetraSec possible.
              </p>
            </div>
            <Button
              variant="outline"
              leftIcon={<Users className="h-4 w-4" />}
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contributors.map((contributor) => (
              <div
                key={contributor.username}
                className="bg-dark-800 rounded-lg p-4 flex items-center space-x-4"
              >
                <img
                  src={contributor.avatar}
                  alt={contributor.username}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <h3 className="text-white font-medium">{contributor.username}</h3>
                  <p className="text-gray-400 text-sm">{contributor.role}</p>
                  <p className="text-primary-500 text-xs mt-1">
                    {contributor.contributions} contributions
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Latest Blog Posts</h2>
              <p className="text-gray-400 text-sm mt-1">
                Security insights and updates from our team.
              </p>
            </div>
            <Button
              variant="outline"
              leftIcon={<MessageSquare className="h-4 w-4" />}
            >
              View All Posts
            </Button>
          </div>

          <div className="space-y-6">
            {blogPosts.map((post) => (
              <div
                key={post.title}
                className="bg-dark-800 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-white mb-2">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-500">
                    By {post.author} • {post.readTime}
                  </div>
                  <Button variant="ghost" size="sm">
                    Read More
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommunityPage;
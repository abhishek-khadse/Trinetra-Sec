import { useState } from 'react';
import { FileText, Plus, Search, Edit, Trash2, BookOpen, Tag } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

const mockNotes: Note[] = [
  {
    id: '1',
    title: 'SQL Injection Prevention',
    content: 'SQL injection is a code injection technique that might destroy your database. It is one of the most common web hacking techniques.\n\nPrevention methods:\n1. Use parameterized queries\n2. Input validation\n3. Escape all user input\n4. Use stored procedures\n5. Limit database permissions',
    category: 'Web Security',
    tags: ['sql', 'injection', 'prevention', 'database'],
    created_at: '2025-03-15T10:00:00Z',
    updated_at: '2025-03-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'OWASP Top 10 Summary',
    content: 'The OWASP Top 10 is a standard awareness document for developers and web application security.\n\n2021 Top 10:\n1. Broken Access Control\n2. Cryptographic Failures\n3. Injection\n4. Insecure Design\n5. Security Misconfiguration\n6. Vulnerable Components\n7. Authentication Failures\n8. Software Integrity Failures\n9. Logging Failures\n10. Server-Side Request Forgery',
    category: 'Web Security',
    tags: ['owasp', 'top10', 'vulnerabilities'],
    created_at: '2025-03-14T15:30:00Z',
    updated_at: '2025-03-14T15:30:00Z',
  },
  {
    id: '3',
    title: 'Network Security Fundamentals',
    content: 'Key concepts in network security:\n\n• Firewalls: Control network traffic\n• IDS/IPS: Detect and prevent intrusions\n• VPN: Secure remote connections\n• Network Segmentation: Isolate critical systems\n• Encryption: Protect data in transit\n• Access Control: Limit user permissions',
    category: 'Network Security',
    tags: ['network', 'firewall', 'vpn', 'encryption'],
    created_at: '2025-03-13T09:15:00Z',
    updated_at: '2025-03-13T09:15:00Z',
  },
];

const NotesPage = () => {
  const [notes, setNotes] = useState<Note[]>(mockNotes);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    category: 'Web Security',
    tags: '',
  });

  const categories = Array.from(new Set(notes.map(note => note.category)));

  const filteredNotes = notes.filter(note => {
    const matchesSearch = 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || note.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleCreateNote = () => {
    if (newNote.title && newNote.content) {
      const note: Note = {
        id: Date.now().toString(),
        title: newNote.title,
        content: newNote.content,
        category: newNote.category,
        tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      setNotes([note, ...notes]);
      setNewNote({ title: '', content: '', category: 'Web Security', tags: '' });
      setIsCreating(false);
    }
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNote({
      title: note.title,
      content: note.content,
      category: note.category,
      tags: note.tags.join(', '),
    });
    setIsCreating(true);
  };

  const handleUpdateNote = () => {
    if (editingNote && newNote.title && newNote.content) {
      const updatedNote: Note = {
        ...editingNote,
        title: newNote.title,
        content: newNote.content,
        category: newNote.category,
        tags: newNote.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        updated_at: new Date().toISOString(),
      };
      
      setNotes(notes.map(note => note.id === editingNote.id ? updatedNote : note));
      setNewNote({ title: '', content: '', category: 'Web Security', tags: '' });
      setIsCreating(false);
      setEditingNote(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Security Notes</h1>
        <p className="text-gray-400">
          Create and organize your cybersecurity learning notes and references.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Search notes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-4 w-4" />}
          fullWidth
        />
        
        <div className="flex gap-4">
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
          
          <Button
            onClick={() => setIsCreating(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            New Note
          </Button>
        </div>
      </div>

      {/* Create/Edit Note Modal */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingNote ? 'Edit Note' : 'Create New Note'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                label="Title"
                value={newNote.title}
                onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                placeholder="Enter note title..."
                fullWidth
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Category
                </label>
                <select
                  className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-full px-4 py-2"
                  value={newNote.category}
                  onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
                >
                  <option value="Web Security">Web Security</option>
                  <option value="Network Security">Network Security</option>
                  <option value="Mobile Security">Mobile Security</option>
                  <option value="Cloud Security">Cloud Security</option>
                  <option value="Malware Analysis">Malware Analysis</option>
                  <option value="Incident Response">Incident Response</option>
                </select>
              </div>
              
              <Input
                label="Tags (comma-separated)"
                value={newNote.tags}
                onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                placeholder="sql, injection, prevention..."
                fullWidth
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Content
                </label>
                <textarea
                  className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-full px-4 py-2 h-64 resize-none"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note content here..."
                />
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingNote(null);
                    setNewNote({ title: '', content: '', category: 'Web Security', tags: '' });
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={editingNote ? handleUpdateNote : handleCreateNote}>
                  {editingNote ? 'Update Note' : 'Create Note'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <Card key={note.id} className="hover:border-primary-500/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-primary-500 mr-2" />
                  <span className="text-gray-400 text-sm">{note.category}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditNote(note)}
                    className="text-gray-400 hover:text-primary-500"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-gray-400 hover:text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-white mb-3">{note.title}</h3>
              
              <p className="text-gray-300 text-sm mb-4 line-clamp-4">
                {note.content}
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {note.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-dark-700 text-gray-300 rounded text-xs flex items-center"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span className="px-2 py-1 bg-dark-700 text-gray-300 rounded text-xs">
                    +{note.tags.length - 3} more
                  </span>
                )}
              </div>
              
              <div className="text-xs text-gray-400">
                Updated: {new Date(note.updated_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredNotes.length === 0 && (
        <div className="text-center py-8">
          <FileText className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No notes found</h3>
          <p className="text-gray-400">
            {searchTerm || selectedCategory !== 'all' 
              ? 'No notes match your current filters.' 
              : 'Create your first security note to get started.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default NotesPage;
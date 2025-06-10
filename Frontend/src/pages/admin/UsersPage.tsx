import { useState } from 'react';
import { Users, Search, Filter, UserPlus, Edit, Trash2, Shield, Mail, Calendar } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  last_login: string | null;
  scan_count: number;
  avatar_url?: string;
}

const mockUsers: User[] = [
  {
    id: '1',
    username: 'john_doe',
    email: 'john.doe@example.com',
    role: 'admin',
    status: 'active',
    created_at: '2025-01-15T10:00:00Z',
    last_login: '2025-03-15T14:30:00Z',
    scan_count: 156,
  },
  {
    id: '2',
    username: 'sarah_smith',
    email: 'sarah.smith@company.com',
    role: 'user',
    status: 'active',
    created_at: '2025-02-20T09:15:00Z',
    last_login: '2025-03-14T16:45:00Z',
    scan_count: 89,
  },
  {
    id: '3',
    username: 'mike_wilson',
    email: 'mike.wilson@enterprise.com',
    role: 'moderator',
    status: 'active',
    created_at: '2025-01-10T11:30:00Z',
    last_login: '2025-03-13T08:20:00Z',
    scan_count: 234,
  },
  {
    id: '4',
    username: 'inactive_user',
    email: 'inactive@example.com',
    role: 'user',
    status: 'inactive',
    created_at: '2024-12-05T15:45:00Z',
    last_login: '2025-01-20T12:00:00Z',
    scan_count: 12,
  },
];

const UsersPage = () => {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreating, setIsCreating] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-error bg-error/20';
      case 'moderator':
        return 'text-warning bg-warning/20';
      case 'user':
        return 'text-info bg-info/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-success bg-success/20';
      case 'inactive':
        return 'text-warning bg-warning/20';
      case 'suspended':
        return 'text-error bg-error/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.filter(user => user.id !== id));
    }
  };

  const handleSuspendUser = (id: string) => {
    setUsers(users.map(user => 
      user.id === id 
        ? { ...user, status: user.status === 'suspended' ? 'active' : 'suspended' as const }
        : user
    ));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-gray-400">
          Manage user accounts, roles, and permissions across the platform.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Users</p>
                <h3 className="text-3xl font-bold text-white mt-1">{users.length}</h3>
              </div>
              <div className="bg-primary-500/20 p-3 rounded-lg">
                <Users className="h-6 w-6 text-primary-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <h3 className="text-3xl font-bold text-success mt-1">
                  {users.filter(u => u.status === 'active').length}
                </h3>
              </div>
              <div className="bg-success/20 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Admins</p>
                <h3 className="text-3xl font-bold text-error mt-1">
                  {users.filter(u => u.role === 'admin').length}
                </h3>
              </div>
              <div className="bg-error/20 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-error" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-sm">Total Scans</p>
                <h3 className="text-3xl font-bold text-info mt-1">
                  {users.reduce((sum, user) => sum + user.scan_count, 0)}
                </h3>
              </div>
              <div className="bg-info/20 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-info" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Users</CardTitle>
            <Button
              leftIcon={<UserPlus className="h-4 w-4" />}
              onClick={() => setIsCreating(true)}
            >
              Add User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              fullWidth
            />
            
            <div className="flex gap-4">
              <div className="relative">
                <select
                  className="appearance-none bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2 pr-8"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                  <option value="user">User</option>
                </select>
                <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
              
              <div className="relative">
                <select
                  className="appearance-none bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-4 py-2 pr-8"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
                <Filter className="h-4 w-4 text-gray-400 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-400 text-sm">
                  <th className="pb-4">User</th>
                  <th className="pb-4">Role</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Scans</th>
                  <th className="pb-4">Last Login</th>
                  <th className="pb-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-t border-dark-600">
                    <td className="py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-dark-600 border border-dark-500 flex items-center justify-center overflow-hidden mr-3">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Users className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.username}</p>
                          <p className="text-gray-400 text-sm flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-4 text-gray-300">{user.scan_count}</td>
                    <td className="py-4 text-gray-300">
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSuspendUser(user.id)}
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No users found</h3>
              <p className="text-gray-400">
                No users match your current filters.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UsersPage;
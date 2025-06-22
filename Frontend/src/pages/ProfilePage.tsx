import { useState } from 'react';
import { User, Key, LogOut, Mail, Camera } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/auth-context';

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    // In a real app, this would save to Supabase
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock update
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    
    // In a real app, this would update password in Supabase Auth
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Reset form
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setIsChangingPassword(false);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
        <p className="text-gray-400">
          Manage your account settings and security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-dark-600 border border-dark-500 flex items-center justify-center overflow-hidden relative group">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username || 'User'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-16 w-16 text-gray-400" />
                    )}
                    <div className="absolute inset-0 bg-dark-900/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Camera className="h-4 w-4" />}
                      >
                        Change
                      </Button>
                    </div>
                  </div>
                </div>

                {/* User Details */}
                <div className="flex-1 space-y-4">
                  {isEditing ? (
                    <>
                      <Input
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        leftIcon={<User className="h-4 w-4" />}
                      />
                      <Input
                        label="Email"
                        value={user?.email || ''}
                        disabled
                        leftIcon={<Mail className="h-4 w-4" />}
                      />
                      <div className="pt-2 flex space-x-2">
                        <Button
                          onClick={handleSaveProfile}
                          isLoading={isSaving}
                        >
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-gray-400 text-sm">Username</p>
                        <p className="text-white text-lg font-medium">{user?.username || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Email</p>
                        <p className="text-white text-lg">{user?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Role</p>
                        <p className="text-white">
                          <span className="px-2 py-1 bg-primary-500/20 text-primary-500 rounded-full text-xs font-medium">
                            {user?.role || 'User'}
                          </span>
                        </p>
                      </div>
                      <div className="pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsEditing(true)}
                        >
                          Edit Profile
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Settings */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-white font-medium mb-2 flex items-center">
                  <Key className="h-4 w-4 mr-2" />
                  Password
                </h3>
                {isChangingPassword ? (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <Input
                      label="Current Password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                    />
                    <Input
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <Input
                      label="Confirm New Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={passwordError || undefined}
                      required
                    />
                    <div className="flex space-x-2">
                      <Button type="submit">
                        Update Password
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsChangingPassword(false);
                          setPasswordError(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm mb-3">
                      Last changed: Never
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsChangingPassword(true)}
                    >
                      Change Password
                    </Button>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-dark-600">
                <h3 className="text-white font-medium mb-2 flex items-center">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  Sign out from all devices
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSignOut}
                >
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
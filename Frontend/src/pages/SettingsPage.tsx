import { useState } from 'react';
import { Settings, User, Bell, Shield, Database, Globe, Save } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useAuth } from '../context/auth-context';

const SettingsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      organizationName: 'TrinetraSec Corp',
      timezone: 'UTC',
      language: 'en',
      theme: 'dark',
    },
    notifications: {
      emailAlerts: true,
      pushNotifications: true,
      threatAlerts: true,
      systemUpdates: false,
      weeklyReports: true,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordExpiry: 90,
      loginAttempts: 5,
    },
    integrations: {
      siem: false,
      slack: false,
      teams: false,
      webhook: '',
    },
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: Globe },
  ];

  const handleSave = () => {
    // In a real app, this would save to Supabase
    console.log('Saving settings:', settings);
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">
          Configure your TrinetraSec platform preferences and security settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Settings Navigation */}
        <div>
          <Card>
            <CardContent className="p-4">
              <nav>
                <ul className="space-y-2">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <li key={tab.id}>
                        <button
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full text-left px-3 py-2 rounded-md flex items-center transition-colors ${
                            activeTab === tab.id
                              ? 'bg-primary-500/20 text-primary-500'
                              : 'text-gray-300 hover:bg-dark-700'
                          }`}
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {tab.label}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>
                {tabs.find(tab => tab.id === activeTab)?.label} Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <Input
                    label="Organization Name"
                    value={settings.general.organizationName}
                    onChange={(e) => updateSetting('general', 'organizationName', e.target.value)}
                    fullWidth
                  />
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Timezone
                    </label>
                    <select
                      className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-full px-4 py-2"
                      value={settings.general.timezone}
                      onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern Time</option>
                      <option value="PST">Pacific Time</option>
                      <option value="GMT">Greenwich Mean Time</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Language
                    </label>
                    <select
                      className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-full px-4 py-2"
                      value={settings.general.language}
                      onChange={(e) => updateSetting('general', 'language', e.target.value)}
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Theme
                    </label>
                    <select
                      className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-full px-4 py-2"
                      value={settings.general.theme}
                      onChange={(e) => updateSetting('general', 'theme', e.target.value)}
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  {Object.entries(settings.notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {key === 'emailAlerts' && 'Receive security alerts via email'}
                          {key === 'pushNotifications' && 'Browser push notifications'}
                          {key === 'threatAlerts' && 'Real-time threat notifications'}
                          {key === 'systemUpdates' && 'System maintenance notifications'}
                          {key === 'weeklyReports' && 'Weekly security summary reports'}
                        </p>
                      </div>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={value as boolean}
                          onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                          className="sr-only"
                          id={`notification-${key}`}
                        />
                        <label
                          htmlFor={`notification-${key}`}
                          className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                            value ? 'bg-primary-500' : 'bg-gray-600'
                          }`}
                        >
                          <span
                            className={`block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                              value ? 'transform translate-x-6' : ''
                            }`}
                          />
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Two-Factor Authentication</p>
                      <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.security.twoFactorAuth}
                        onChange={(e) => updateSetting('security', 'twoFactorAuth', e.target.checked)}
                        className="sr-only"
                        id="two-factor"
                      />
                      <label
                        htmlFor="two-factor"
                        className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                          settings.security.twoFactorAuth ? 'bg-primary-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                            settings.security.twoFactorAuth ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Session Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-full px-4 py-2"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Password Expiry (days)
                    </label>
                    <input
                      type="number"
                      className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-full px-4 py-2"
                      value={settings.security.passwordExpiry}
                      onChange={(e) => updateSetting('security', 'passwordExpiry', parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Max Login Attempts
                    </label>
                    <input
                      type="number"
                      className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-full px-4 py-2"
                      value={settings.security.loginAttempts}
                      onChange={(e) => updateSetting('security', 'loginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'integrations' && (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-white font-medium">External Integrations</h3>
                    
                    {Object.entries(settings.integrations).filter(([key]) => key !== 'webhook').map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between p-4 bg-dark-800 rounded-lg">
                        <div>
                          <p className="text-white font-medium capitalize">{key}</p>
                          <p className="text-gray-400 text-sm">
                            {key === 'siem' && 'Security Information and Event Management'}
                            {key === 'slack' && 'Slack workspace integration'}
                            {key === 'teams' && 'Microsoft Teams integration'}
                          </p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={value as boolean}
                            onChange={(e) => updateSetting('integrations', key, e.target.checked)}
                            className="sr-only"
                            id={`integration-${key}`}
                          />
                          <label
                            htmlFor={`integration-${key}`}
                            className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                              value ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                          >
                            <span
                              className={`block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                                value ? 'transform translate-x-6' : ''
                              }`}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Input
                    label="Webhook URL"
                    placeholder="https://your-webhook-url.com"
                    value={settings.integrations.webhook}
                    onChange={(e) => updateSetting('integrations', 'webhook', e.target.value)}
                    fullWidth
                  />
                </div>
              )}

              <div className="pt-6 border-t border-dark-600">
                <Button
                  onClick={handleSave}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
import { useState } from 'react';
import { Settings, Server, Database, Mail, Shield, Globe, Save, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('system');
  const [settings, setSettings] = useState({
    system: {
      platform_name: 'TrinetraSec',
      maintenance_mode: false,
      max_file_size: '100',
      session_timeout: '30',
      rate_limit: '1000',
      debug_mode: false,
    },
    database: {
      connection_pool_size: '20',
      query_timeout: '30',
      backup_enabled: true,
      backup_frequency: 'daily',
      retention_days: '30',
      auto_vacuum: true,
    },
    email: {
      smtp_host: 'smtp.trinetrasec.com',
      smtp_port: '587',
      smtp_username: 'noreply@trinetrasec.com',
      smtp_password: '',
      from_email: 'noreply@trinetrasec.com',
      from_name: 'TrinetraSec',
      tls_enabled: true,
    },
    security: {
      password_min_length: '8',
      password_require_special: true,
      password_require_numbers: true,
      password_require_uppercase: true,
      max_login_attempts: '5',
      lockout_duration: '15',
      two_factor_required: false,
      session_encryption: true,
    },
    api: {
      rate_limit_per_minute: '100',
      api_key_expiry_days: '365',
      cors_enabled: true,
      cors_origins: '*',
      webhook_timeout: '30',
      max_payload_size: '10',
    },
  });

  const tabs = [
    { id: 'system', label: 'System', icon: Server },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'api', label: 'API', icon: Globe },
  ];

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving admin settings:', settings);
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

  const handleTestConnection = (type: string) => {
    // Mock test connection
    console.log(`Testing ${type} connection...`);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Admin Settings</h1>
        <p className="text-gray-400">
          Configure system-wide settings and platform parameters.
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
              {activeTab === 'system' && (
                <div className="space-y-6">
                  <Input
                    label="Platform Name"
                    value={settings.system.platform_name}
                    onChange={(e) => updateSetting('system', 'platform_name', e.target.value)}
                    fullWidth
                  />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Maintenance Mode</p>
                      <p className="text-gray-400 text-sm">Enable to restrict access during maintenance</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.system.maintenance_mode}
                        onChange={(e) => updateSetting('system', 'maintenance_mode', e.target.checked)}
                        className="sr-only"
                        id="maintenance-mode"
                      />
                      <label
                        htmlFor="maintenance-mode"
                        className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                          settings.system.maintenance_mode ? 'bg-primary-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                            settings.system.maintenance_mode ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <Input
                    label="Max File Size (MB)"
                    type="number"
                    value={settings.system.max_file_size}
                    onChange={(e) => updateSetting('system', 'max_file_size', e.target.value)}
                    fullWidth
                  />
                  
                  <Input
                    label="Session Timeout (minutes)"
                    type="number"
                    value={settings.system.session_timeout}
                    onChange={(e) => updateSetting('system', 'session_timeout', e.target.value)}
                    fullWidth
                  />
                  
                  <Input
                    label="Rate Limit (requests/minute)"
                    type="number"
                    value={settings.system.rate_limit}
                    onChange={(e) => updateSetting('system', 'rate_limit', e.target.value)}
                    fullWidth
                  />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Debug Mode</p>
                      <p className="text-gray-400 text-sm">Enable detailed logging for troubleshooting</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.system.debug_mode}
                        onChange={(e) => updateSetting('system', 'debug_mode', e.target.checked)}
                        className="sr-only"
                        id="debug-mode"
                      />
                      <label
                        htmlFor="debug-mode"
                        className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                          settings.system.debug_mode ? 'bg-primary-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                            settings.system.debug_mode ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'database' && (
                <div className="space-y-6">
                  <Input
                    label="Connection Pool Size"
                    type="number"
                    value={settings.database.connection_pool_size}
                    onChange={(e) => updateSetting('database', 'connection_pool_size', e.target.value)}
                    fullWidth
                  />
                  
                  <Input
                    label="Query Timeout (seconds)"
                    type="number"
                    value={settings.database.query_timeout}
                    onChange={(e) => updateSetting('database', 'query_timeout', e.target.value)}
                    fullWidth
                  />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Backup Enabled</p>
                      <p className="text-gray-400 text-sm">Automatically backup database</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.database.backup_enabled}
                        onChange={(e) => updateSetting('database', 'backup_enabled', e.target.checked)}
                        className="sr-only"
                        id="backup-enabled"
                      />
                      <label
                        htmlFor="backup-enabled"
                        className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                          settings.database.backup_enabled ? 'bg-primary-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                            settings.database.backup_enabled ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Backup Frequency
                    </label>
                    <select
                      className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 w-full px-4 py-2"
                      value={settings.database.backup_frequency}
                      onChange={(e) => updateSetting('database', 'backup_frequency', e.target.value)}
                    >
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  
                  <Input
                    label="Retention Days"
                    type="number"
                    value={settings.database.retention_days}
                    onChange={(e) => updateSetting('database', 'retention_days', e.target.value)}
                    fullWidth
                  />
                  
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      leftIcon={<RefreshCw className="h-4 w-4" />}
                      onClick={() => handleTestConnection('database')}
                    >
                      Test Connection
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'email' && (
                <div className="space-y-6">
                  <Input
                    label="SMTP Host"
                    value={settings.email.smtp_host}
                    onChange={(e) => updateSetting('email', 'smtp_host', e.target.value)}
                    fullWidth
                  />
                  
                  <Input
                    label="SMTP Port"
                    type="number"
                    value={settings.email.smtp_port}
                    onChange={(e) => updateSetting('email', 'smtp_port', e.target.value)}
                    fullWidth
                  />
                  
                  <Input
                    label="SMTP Username"
                    value={settings.email.smtp_username}
                    onChange={(e) => updateSetting('email', 'smtp_username', e.target.value)}
                    fullWidth
                  />
                  
                  <Input
                    label="SMTP Password"
                    type="password"
                    value={settings.email.smtp_password}
                    onChange={(e) => updateSetting('email', 'smtp_password', e.target.value)}
                    fullWidth
                  />
                  
                  <Input
                    label="From Email"
                    type="email"
                    value={settings.email.from_email}
                    onChange={(e) => updateSetting('email', 'from_email', e.target.value)}
                    fullWidth
                  />
                  
                  <Input
                    label="From Name"
                    value={settings.email.from_name}
                    onChange={(e) => updateSetting('email', 'from_name', e.target.value)}
                    fullWidth
                  />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">TLS Enabled</p>
                      <p className="text-gray-400 text-sm">Use TLS encryption for SMTP</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.email.tls_enabled}
                        onChange={(e) => updateSetting('email', 'tls_enabled', e.target.checked)}
                        className="sr-only"
                        id="tls-enabled"
                      />
                      <label
                        htmlFor="tls-enabled"
                        className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                          settings.email.tls_enabled ? 'bg-primary-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                            settings.email.tls_enabled ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      leftIcon={<Mail className="h-4 w-4" />}
                      onClick={() => handleTestConnection('email')}
                    >
                      Send Test Email
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <Input
                    label="Password Minimum Length"
                    type="number"
                    value={settings.security.password_min_length}
                    onChange={(e) => updateSetting('security', 'password_min_length', e.target.value)}
                    fullWidth
                  />
                  
                  <div className="space-y-4">
                    <h3 className="text-white font-medium">Password Requirements</h3>
                    
                    {Object.entries({
                      password_require_special: 'Require Special Characters',
                      password_require_numbers: 'Require Numbers',
                      password_require_uppercase: 'Require Uppercase Letters',
                    }).map(([key, label]) => (
                      <div key={key} className="flex items-center justify-between">
                        <p className="text-gray-300">{label}</p>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={settings.security[key as keyof typeof settings.security] as boolean}
                            onChange={(e) => updateSetting('security', key, e.target.checked)}
                            className="sr-only"
                            id={key}
                          />
                          <label
                            htmlFor={key}
                            className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                              settings.security[key as keyof typeof settings.security] ? 'bg-primary-500' : 'bg-gray-600'
                            }`}
                          >
                            <span
                              className={`block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                                settings.security[key as keyof typeof settings.security] ? 'transform translate-x-6' : ''
                              }`}
                            />
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <Input
                    label="Max Login Attempts"
                    type="number"
                    value={settings.security.max_login_attempts}
                    onChange={(e) => updateSetting('security', 'max_login_attempts', e.target.value)}
                    fullWidth
                  />
                  
                  <Input
                    label="Lockout Duration (minutes)"
                    type="number"
                    value={settings.security.lockout_duration}
                    onChange={(e) => updateSetting('security', 'lockout_duration', e.target.value)}
                    fullWidth
                  />
                </div>
              )}

              {activeTab === 'api' && (
                <div className="space-y-6">
                  <Input
                    label="Rate Limit (per minute)"
                    type="number"
                    value={settings.api.rate_limit_per_minute}
                    onChange={(e) => updateSetting('api', 'rate_limit_per_minute', e.target.value)}
                    fullWidth
                  />
                  
                  <Input
                    label="API Key Expiry (days)"
                    type="number"
                    value={settings.api.api_key_expiry_days}
                    onChange={(e) => updateSetting('api', 'api_key_expiry_days', e.target.value)}
                    fullWidth
                  />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">CORS Enabled</p>
                      <p className="text-gray-400 text-sm">Allow cross-origin requests</p>
                    </div>
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={settings.api.cors_enabled}
                        onChange={(e) => updateSetting('api', 'cors_enabled', e.target.checked)}
                        className="sr-only"
                        id="cors-enabled"
                      />
                      <label
                        htmlFor="cors-enabled"
                        className={`block w-14 h-8 rounded-full transition-colors duration-200 ease-in-out cursor-pointer ${
                          settings.api.cors_enabled ? 'bg-primary-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`block w-6 h-6 mt-1 ml-1 bg-white rounded-full transition-transform duration-200 ease-in-out ${
                            settings.api.cors_enabled ? 'transform translate-x-6' : ''
                          }`}
                        />
                      </label>
                    </div>
                  </div>
                  
                  <Input
                    label="CORS Origins"
                    value={settings.api.cors_origins}
                    onChange={(e) => updateSetting('api', 'cors_origins', e.target.value)}
                    placeholder="https://example.com, https://app.example.com"
                    fullWidth
                  />
                  
                  <Input
                    label="Webhook Timeout (seconds)"
                    type="number"
                    value={settings.api.webhook_timeout}
                    onChange={(e) => updateSetting('api', 'webhook_timeout', e.target.value)}
                    fullWidth
                  />
                  
                  <Input
                    label="Max Payload Size (MB)"
                    type="number"
                    value={settings.api.max_payload_size}
                    onChange={(e) => updateSetting('api', 'max_payload_size', e.target.value)}
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

export default AdminSettingsPage;
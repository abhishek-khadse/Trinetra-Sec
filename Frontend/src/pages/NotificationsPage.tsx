import { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { formatDateTime } from '../lib/utils';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'error',
    title: 'Critical Vulnerability Detected',
    message: 'High-severity vulnerability found in application dependencies. Immediate action required.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    read: false,
  },
  {
    id: '2',
    type: 'warning',
    title: 'Unusual Traffic Pattern',
    message: 'Detected unusual network traffic from IP range 192.168.1.0/24.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    read: false,
  },
  {
    id: '3',
    type: 'success',
    title: 'Scan Completed',
    message: 'File scan completed successfully. No threats detected.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    read: true,
  },
  {
    id: '4',
    type: 'info',
    title: 'System Update Available',
    message: 'New security updates are available for installation.',
    timestamp: new Date(Date.now() - 86400000).toISOString(),
    read: true,
  },
];

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const handleDelete = (id: string) => {
    setNotifications(prev =>
      prev.filter(notif => notif.id !== id)
    );
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-error" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      default:
        return <Info className="h-5 w-5 text-info" />;
    }
  };

  const filteredNotifications = filter === 'all'
    ? notifications
    : notifications.filter(n => !n.read);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
        <p className="text-gray-400">
          Stay updated with security alerts and system notifications.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notifications
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="ml-2 bg-primary-500 text-dark-800 text-xs rounded-full px-2 py-1">
                  {notifications.filter(n => !n.read).length} new
                </span>
              )}
            </CardTitle>
            <div className="flex space-x-2">
              <select
                className="bg-dark-700 border border-dark-600 text-gray-200 rounded-md focus:border-primary-500 focus:ring-1 focus:ring-primary-500 px-3 py-1.5 text-sm"
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<RefreshCw className="h-4 w-4" />}
                isLoading={isLoading}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.some(n => !n.read) && (
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                  >
                    Mark all as read
                  </Button>
                </div>
              )}
              
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg ${
                    notification.read ? 'bg-dark-800' : 'bg-dark-700'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="mt-1">
                      {getIconForType(notification.type)}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-medium">
                          {notification.title}
                        </h3>
                        <span className="text-gray-400 text-sm">
                          {formatDateTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-300 mt-1">
                        {notification.message}
                      </p>
                      <div className="mt-3 flex justify-end space-x-2">
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(notification.id)}
                        >
                          <Trash2 className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">No notifications</h3>
              <p className="text-gray-400">
                You're all caught up! Check back later for new notifications.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPage;
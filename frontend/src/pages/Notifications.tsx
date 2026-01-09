import { useQuery, useMutation, useQueryClient } from 'react-query';
import api from '../api/axios';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: 'INFO' | 'WARNING' | 'ALERT';
}

export const Notifications = () => {
  const queryClient = useQueryClient();

  // Fetch Notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>('notifications', async () => {
    const response = await api.get('/notifications/');
    return response.data.results || response.data;
  });

  // Mark as Read
  const markAsReadMutation = useMutation(
    (id: number) => api.patch(`/notifications/${id}/`, { is_read: true }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('notifications');
      },
    }
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'ALERT': return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case 'WARNING': return <Info className="w-6 h-6 text-yellow-500" />;
      default: return <Bell className="w-6 h-6 text-blue-500" />;
    }
  };

  if (isLoading) return <div className="p-4">Chargement...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Notifications</h2>
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center p-8 bg-white rounded-lg shadow text-gray-500">
            Aucune notification
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`p-4 rounded-lg shadow flex items-start space-x-4 ${notif.is_read ? 'bg-gray-50' : 'bg-white border-l-4 border-blue-500'}`}
            >
              <div className="flex-shrink-0 mt-1">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h3 className={`font-semibold ${notif.is_read ? 'text-gray-700' : 'text-gray-900'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {new Date(notif.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 mt-1">{notif.message}</p>
              </div>
              {!notif.is_read && (
                <button
                  onClick={() => markAsReadMutation.mutate(notif.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                  title="Marquer comme lu"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

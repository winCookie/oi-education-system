import { useState, useEffect, useRef } from 'react';
import { Bell, Check, X, Info, UserPlus } from 'lucide-react';
import client from '../../api/client';
import { motion, AnimatePresence } from 'framer-motion';

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        client.get('/notifications'),
        client.get('/notifications/unread-count')
      ]);
      setNotifications(listRes.data);
      setUnreadCount(countRes.data.count);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRead = async (id: number) => {
    try {
      await client.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark as read');
    }
  };

  const handleBinding = async (requestId: number, action: 'accept' | 'reject', notificationId: number) => {
    try {
      await client.post(`/notifications/binding-request/${requestId}/${action}`);
      await handleRead(notificationId);
      // Refresh user info if needed or just notifications
      fetchNotifications();
    } catch (err: any) {
      alert(err.response?.data?.message || '操作失败');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-blue-600 transition-colors bg-gray-50 rounded-full"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-900">通知中心</h3>
              {unreadCount > 0 && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full">{unreadCount} 条未读</span>}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-400 space-y-2">
                  <Bell className="h-8 w-8 mx-auto opacity-20" />
                  <p className="text-sm">暂无新通知</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-gray-50 transition-colors ${n.isRead ? 'opacity-60' : 'bg-white hover:bg-blue-50/30'}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 p-1.5 rounded-lg shrink-0 ${n.type === 'binding_request' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                        {n.type === 'binding_request' ? <UserPlus className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-bold text-gray-900">{n.title}</p>
                        <p className="text-xs text-gray-500 leading-relaxed">{n.content}</p>
                        <p className="text-[10px] text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
                        
                        {!n.isRead && n.type === 'binding_request' && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleBinding(n.relatedId, 'accept', n.id)}
                              className="flex-1 flex items-center justify-center gap-1 bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded-lg hover:bg-blue-700 transition"
                            >
                              <Check className="h-3 w-3" /> 同意
                            </button>
                            <button
                              onClick={() => handleBinding(n.relatedId, 'reject', n.id)}
                              className="flex-1 flex items-center justify-center gap-1 bg-gray-100 text-gray-600 text-[10px] font-bold py-1.5 rounded-lg hover:bg-gray-200 transition"
                            >
                              <X className="h-3 w-3" /> 拒绝
                            </button>
                          </div>
                        )}
                        
                        {!n.isRead && n.type !== 'binding_request' && (
                          <button
                            onClick={() => handleRead(n.id)}
                            className="text-[10px] text-blue-600 hover:underline mt-2 font-bold"
                          >
                            标记为已读
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

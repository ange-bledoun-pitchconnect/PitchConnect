/**
 * ============================================================================
 * FILE 1: src/components/admin/AdminHeader.tsx
 * ============================================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Bell, Settings, LogOut, User, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export function AdminHeader() {
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.notifications?.filter((n: Notification) => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  return (
    <div className="flex items-center justify-end gap-4 px-6 py-4 bg-charcoal-800 border-b border-charcoal-700">
      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => {
            setShowNotifications(!showNotifications);
            setShowProfileMenu(false);
          }}
          className="relative p-2 text-white hover:text-gold-400 hover:bg-charcoal-700 rounded-lg transition-all"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 bg-charcoal-800 rounded-lg shadow-xl border border-charcoal-700 z-50 max-h-96 overflow-y-auto">
            <div className="px-4 py-3 border-b border-charcoal-700 flex items-center justify-between">
              <h3 className="text-white font-semibold">Notifications</h3>
              <button
                onClick={fetchNotifications}
                className="text-charcoal-400 hover:text-gold-400"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {notifications.length > 0 ? (
              <div className="divide-y divide-charcoal-700">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => markAsRead(notif.id)}
                    className={`px-4 py-3 cursor-pointer hover:bg-charcoal-700 transition-colors ${
                      !notif.read ? 'bg-charcoal-750' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-2 h-2 rounded-full mt-2 ${
                          notif.read ? 'bg-charcoal-600' : 'bg-gold-500'
                        }`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-white font-medium text-sm">{notif.title}</p>
                        <p className="text-charcoal-400 text-xs mt-1">{notif.message}</p>
                        <p className="text-charcoal-500 text-xs mt-1">
                          {new Date(notif.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-center">
                <Bell className="w-12 h-12 text-charcoal-600 mx-auto mb-3" />
                <p className="text-charcoal-400 text-sm">No notifications</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings */}
      <Link
        href="/dashboard/admin/settings"
        className="p-2 text-white hover:text-gold-400 hover:bg-charcoal-700 rounded-lg transition-all"
      >
        <Settings size={20} />
      </Link>

      {/* Profile Menu */}
      <div className="relative">
        <button
          onClick={() => {
            setShowProfileMenu(!showProfileMenu);
            setShowNotifications(false);
          }}
          className="flex items-center gap-2 p-2 text-white hover:text-gold-400 hover:bg-charcoal-700 rounded-lg transition-all"
        >
          <User size={20} />
          <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-orange-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
        </button>

        {/* Profile Dropdown */}
        {showProfileMenu && (
          <div className="absolute right-0 mt-2 w-56 bg-charcoal-800 rounded-lg shadow-xl border border-charcoal-700 py-2 z-50">
            <div className="px-4 py-3 border-b border-charcoal-700">
              <p className="text-white font-semibold">{session?.user?.name}</p>
              <p className="text-charcoal-400 text-sm">{session?.user?.email}</p>
              <span className="inline-block mt-2 px-2 py-1 bg-pink-900 text-pink-200 text-xs font-semibold rounded-full">
                SUPERADMIN
              </span>
            </div>

            <Link
              href="/dashboard/settings/profile"
              className="block px-4 py-2 text-white hover:bg-charcoal-700 text-sm transition-colors"
            >
              Profile Settings
            </Link>
            <Link
              href="/dashboard/settings/account"
              className="block px-4 py-2 text-white hover:bg-charcoal-700 text-sm transition-colors"
            >
              Account
            </Link>
            <Link
              href="/dashboard/admin/settings"
              className="block px-4 py-2 text-white hover:bg-charcoal-700 text-sm transition-colors"
            >
              Admin Settings
            </Link>

            <hr className="my-2 border-charcoal-700" />

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full text-left px-4 py-2 text-white hover:bg-red-950 text-sm flex items-center gap-2 transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

AdminHeader.displayName = 'AdminHeader';
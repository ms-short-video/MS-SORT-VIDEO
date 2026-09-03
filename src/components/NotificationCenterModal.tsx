import React, { useState } from 'react';
import { X, Bell, UserPlus, Heart, MessageCircle, CloudUpload, CheckCheck, Trash2 } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearNotifications,
  onNotificationClick,
}) => {
  const [filter, setFilter] = useState<'all' | 'follow' | 'like' | 'comment' | 'archive_sync'>('all');

  if (!isOpen) return null;

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'follow':
        return (
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <UserPlus className="w-4 h-4" />
          </div>
        );
      case 'like':
        return (
          <div className="p-2 rounded-xl bg-pink-500/20 text-pink-500 border border-pink-500/30">
            <Heart className="w-4 h-4 fill-pink-500" />
          </div>
        );
      case 'comment':
        return (
          <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <MessageCircle className="w-4 h-4" />
          </div>
        );
      case 'archive_sync':
        return (
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <CloudUpload className="w-4 h-4" />
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-white select-none">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-scale-up relative max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 rounded-xl bg-gradient-to-tr from-pink-600 to-indigo-600 text-white shadow-md">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>Notification Center</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 border border-pink-500/30">
                    {unreadCount} New
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">Live alerts for likes, comments, follows & archive sync</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'follow', label: '👤 Follows' },
              { id: 'like', label: '❤️ Likes' },
              { id: 'comment', label: '💬 Comments' },
              { id: 'archive_sync', label: '⚡ Sync' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                filter === tab.id
                  ? 'bg-pink-600 text-white border-pink-500 shadow-md shadow-pink-600/30'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Header */}
        {notifications.length > 0 && (
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Showing {filteredNotifications.length} notifications</span>
            <div className="flex items-center gap-3">
              <button
                onClick={onMarkAllAsRead}
                className="hover:text-pink-400 transition-colors flex items-center gap-1 font-semibold"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
              <button
                onClick={onClearNotifications}
                className="hover:text-red-400 transition-colors flex items-center gap-1 font-semibold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[50vh] pr-1 no-scrollbar">
          {filteredNotifications.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-400">No notifications found</p>
              <p className="text-[11px] text-slate-500 max-w-xs">
                When people like, comment, or follow your videos, alerts will appear here in real-time.
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onNotificationClick && onNotificationClick(notif)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
                  notif.isUnread
                    ? 'bg-slate-950 border-pink-500/40 shadow-sm shadow-pink-950/40'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Left Icon or Avatar */}
                <div className="relative">
                  <img
                    src={notif.avatar}
                    alt={notif.username}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700"
                  />
                  <div className="absolute -bottom-1 -right-1 scale-75">
                    {getNotificationIcon(notif.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col gap-0.5 min-w-0">
                  <p className="text-xs text-slate-200 leading-snug break-words">
                    {notif.text}
                  </p>
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {notif.timeAgo}
                  </span>
                </div>

                {/* Unread dot */}
                {notif.isUnread && (
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse mt-1" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  X,
  Bell,
  CheckCircle2,
  ExternalLink,
  Mail,
  MessageSquare,
  Trash2,
  Calendar,
  MapPin,
  Clock,
  Sparkles,
  Phone,
  Check
} from 'lucide-react';
import { AppNotification, NotificationChannel } from '../types';
import { markNotificationAsRead, markAllNotificationsAsRead, clearUserNotifications } from '../services/store';
import { sendRealWorldEmailViaFreeApi } from '../services/realNotificationService';
import { RealWorldNotificationModal } from './RealWorldNotificationModal';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  notifications: AppNotification[];
  onOpenGuideProfile?: (guideId: string) => void;
  onRefresh: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  notifications,
  onOpenGuideProfile,
  onRefresh
}) => {
  const [filterChannel, setFilterChannel] = useState<'ALL' | NotificationChannel>('ALL');
  const [isRealDispatchOpen, setIsRealDispatchOpen] = useState<boolean>(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);
  const [dispatchStatus, setDispatchStatus] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const userNotifications = notifications.filter(n => n.recipientId === userId);
  const unreadCount = userNotifications.filter(n => !n.isRead).length;

  const filtered = filterChannel === 'ALL'
    ? userNotifications
    : userNotifications.filter(n => n.channel === filterChannel);

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
    onRefresh();
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead(userId);
    onRefresh();
  };

  const handleClearAll = () => {
    if (confirm('Clear all notifications for this account?')) {
      clearUserNotifications(userId);
      onRefresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Notifications Center</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 px-2 py-0.2 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Dispatched WhatsApp, Gmail & In-App tour updates for {userName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRealDispatchOpen(true)}
              className="text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Dispatch to Real Phone Numbers & Emails"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Real-World Dispatcher</span>
            </button>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors"
                title="Mark all notifications as read"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <button
              onClick={() => setFilterChannel('ALL')}
              className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                filterChannel === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All ({userNotifications.length})
            </button>

            <button
              onClick={() => setFilterChannel('WHATSAPP')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                filterChannel === 'WHATSAPP'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>WhatsApp ({userNotifications.filter(n => n.channel === 'WHATSAPP').length})</span>
            </button>

            <button
              onClick={() => setFilterChannel('GMAIL')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                filterChannel === 'GMAIL'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-rose-500" />
              <span>Gmail ({userNotifications.filter(n => n.channel === 'GMAIL').length})</span>
            </button>

            <button
              onClick={() => setFilterChannel('IN_APP')}
              className={`px-3 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                filterChannel === 'IN_APP'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-slate-200'
              }`}
            >
              <Bell className="w-3.5 h-3.5 text-indigo-500" />
              <span>In-App ({userNotifications.filter(n => n.channel === 'IN_APP').length})</span>
            </button>
          </div>

          {userNotifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
              title="Clear all notifications"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-700">No Notifications in this Channel</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                When requests are created or accepted, notifications via WhatsApp, Gmail, and in-app will appear here.
              </p>
            </div>
          ) : (
            filtered.map(notif => (
              <div
                key={notif.id}
                className={`p-4 rounded-xl border transition-all ${
                  notif.isRead
                    ? 'bg-white border-slate-200'
                    : 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    {/* Channel Tag */}
                    <span
                      className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded uppercase flex items-center gap-1 ${
                        notif.channel === 'WHATSAPP'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : notif.channel === 'GMAIL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      }`}
                    >
                      {notif.channel === 'WHATSAPP' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                      {notif.channel === 'GMAIL' && <Mail className="w-3 h-3 text-rose-600" />}
                      {notif.channel === 'IN_APP' && <Bell className="w-3 h-3 text-indigo-600" />}
                      <span>{notif.channel}</span>
                    </span>

                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {!notif.isRead && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500" title="Unread" />
                    )}
                  </div>

                  {!notif.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notif.id)}
                      className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark Read</span>
                    </button>
                  )}
                </div>

                {/* Title */}
                <h4 className="text-xs font-bold text-slate-900 mb-1">
                  {notif.title}
                </h4>

                {/* Message Body */}
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans">
                  {notif.message}
                </p>

                {/* Tour Details Strip if present */}
                {notif.details && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600">
                    {notif.details.destinationCity && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-600" />
                        <span>{notif.details.destinationCity}</span>
                      </div>
                    )}
                    {notif.details.tourDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-indigo-600" />
                        <span>{notif.details.tourDate}</span>
                      </div>
                    )}
                    {notif.details.guidePhone && (
                      <div className="flex items-center gap-1 col-span-2 sm:col-span-1">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{notif.details.guidePhone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Links */}
                <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {notif.externalLink && (
                      <a
                        href={notif.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleMarkAsRead(notif.id)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors ${
                          notif.channel === 'WHATSAPP'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                            : notif.channel === 'GMAIL'
                            ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                            : 'bg-slate-900 hover:bg-slate-800 text-white shadow-2xs'
                        }`}
                      >
                        {notif.channel === 'WHATSAPP' && <span>Open WhatsApp Message</span>}
                        {notif.channel === 'GMAIL' && <span>Open in Gmail</span>}
                        {notif.channel === 'IN_APP' && <span>View Details</span>}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {/* Free Real-World FormSubmit Email Trigger on Gmail notifications */}
                    {notif.channel === 'GMAIL' && notif.recipientEmail && (
                      <button
                        type="button"
                        disabled={dispatchingId === notif.id}
                        onClick={async () => {
                          setDispatchingId(notif.id);
                          try {
                            const res = await sendRealWorldEmailViaFreeApi({
                              recipientEmail: notif.recipientEmail!,
                              recipientName: notif.recipientName,
                              subject: notif.title,
                              messageText: notif.message,
                              bookingRef: notif.referenceId,
                              details: notif.details
                            });
                            setDispatchStatus(prev => ({
                              ...prev,
                              [notif.id]: res.success
                                ? `✅ Dispatched to ${notif.recipientEmail} via Free API`
                                : `ℹ️ ${res.message}`
                            }));
                          } finally {
                            setDispatchingId(null);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors flex items-center gap-1 cursor-pointer disabled:bg-indigo-400"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>
                          {dispatchingId === notif.id
                            ? 'Sending...'
                            : dispatchStatus[notif.id]
                            ? 'Resend Free Email'
                            : 'Send Real Email (Free API)'}
                        </span>
                      </button>
                    )}

                    {onOpenGuideProfile && notif.details?.guideCode && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenGuideProfile(notif.details?.guideCode || '');
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>View Guide Portfolio</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    Ref: {notif.referenceId}
                  </span>
                </div>

                {/* Dispatch Status Badge if sent */}
                {dispatchStatus[notif.id] && (
                  <div className="mt-2 text-[11px] font-mono text-indigo-900 bg-indigo-50 border border-indigo-200 p-2 rounded-lg font-medium">
                    {dispatchStatus[notif.id]}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Real-time delivery integration with Gmail & WhatsApp APIs</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Real-World WhatsApp & Gmail Modal */}
      <RealWorldNotificationModal
        isOpen={isRealDispatchOpen}
        onClose={() => setIsRealDispatchOpen(false)}
      />
    </div>
  );
};

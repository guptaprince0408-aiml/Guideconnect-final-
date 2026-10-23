import React, { useState } from 'react';
import { X, Send, MessageSquare, ShieldCheck, User, Compass } from 'lucide-react';
import { Booking, Message } from '../types';
import { sendMessage } from '../services/store';

interface MessagingDrawerProps {
  booking: Booking | null;
  messages: Message[];
  currentUserRole: 'CLIENT' | 'GUIDE';
  currentUserId: string;
  currentUserName: string;
  isOpen: boolean;
  onClose: () => void;
  onMessageSent: () => void;
}

export const MessagingDrawer: React.FC<MessagingDrawerProps> = ({
  booking,
  messages,
  currentUserRole,
  currentUserId,
  currentUserName,
  isOpen,
  onClose,
  onMessageSent
}) => {
  if (!isOpen || !booking) return null;

  const [inputContent, setInputContent] = useState('');

  const bookingMessages = messages.filter(m => m.bookingId === booking.id);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputContent.trim()) return;

    sendMessage({
      bookingId: booking.id,
      senderId: currentUserId,
      senderRole: currentUserRole,
      senderName: currentUserName,
      content: inputContent.trim()
    });

    setInputContent('');
    onMessageSent();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Tour Conversation
              </h3>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Booking: {booking.id} · @{booking.guideUsername} & {booking.clientName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security & Access Notice */}
        <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Encrypted direct communication restricted to this tour reservation.</span>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {bookingMessages.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400 italic">
              No messages exchanged yet. Say hello and coordinate meetup details!
            </div>
          ) : (
            bookingMessages.map(msg => {
              const isMine = msg.senderRole === currentUserRole;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-400 mb-0.5 px-1 font-mono">
                    {msg.senderName} ({msg.senderRole}) · {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div
                    className={`max-w-[85%] px-3.5 py-2 rounded-xl text-xs leading-relaxed ${
                      isMine
                        ? 'bg-slate-900 text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Message Input Footer */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex items-center gap-2">
          <input
            type="text"
            required
            placeholder={`Message as ${currentUserName}...`}
            value={inputContent}
            onChange={e => setInputContent(e.target.value)}
            className="flex-1 text-xs px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

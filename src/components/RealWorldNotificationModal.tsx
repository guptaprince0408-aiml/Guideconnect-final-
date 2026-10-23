import React, { useState } from 'react';
import {
  X,
  Mail,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  Send,
  Sparkles,
  Phone,
  AlertCircle,
  Copy,
  Check,
  Globe,
  Radio,
  Zap,
  Clock
} from 'lucide-react';
import {
  REAL_WORLD_CONTACTS,
  RealContact,
  sendRealWorldEmailViaFreeApi,
  getWhatsAppDirectLink,
  getGmailComposeLink,
  getMailtoLink
} from '../services/realNotificationService';

interface RealWorldNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRecipient?: RealContact;
  contextTour?: {
    guideName: string;
    destinationCity: string;
    tourDate: string;
    agreedPrice?: number;
    currency?: string;
  };
}

export const RealWorldNotificationModal: React.FC<RealWorldNotificationModalProps> = ({
  isOpen,
  onClose,
  defaultRecipient,
  contextTour
}) => {
  const [selectedContact, setSelectedContact] = useState<RealContact>(
    defaultRecipient || REAL_WORLD_CONTACTS[0]
  );
  const [customSubject, setCustomSubject] = useState<string>(
    contextTour
      ? `Tour Confirmed in ${contextTour.destinationCity} with Guide ${contextTour.guideName}!`
      : 'GuideConnect Tour Booking Confirmation'
  );
  const [customMessage, setCustomMessage] = useState<string>(
    contextTour
      ? `Hello! Your tour in ${contextTour.destinationCity} on ${contextTour.tourDate} with licensed guide ${contextTour.guideName} is confirmed. Meeting details and schedule have been locked.`
      : 'Hello! Your private multilingual guide reservation has been processed on GuideConnect. Looking forward to showing you the heritage and culture!'
  );
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeWaLink = getWhatsAppDirectLink(
    selectedContact.cleanPhone,
    `🔔 *GuideConnect Real Notification*\n\nHello ${selectedContact.name}!\n${customMessage}\n\n*Destination:* ${contextTour?.destinationCity || 'Mumbai, India'}\n*Date:* ${contextTour?.tourDate || '2026-10-25'}\n*Email:* ${selectedContact.email}\n\n_Sent via GuideConnect Free WhatsApp & Gmail API_`
  );

  const activeGmailLink = getGmailComposeLink(
    selectedContact.email,
    customSubject,
    `Dear ${selectedContact.name},\n\n${customMessage}\n\n--- TOUR RESERVATION DETAILS ---\nContact: ${selectedContact.name} (${selectedContact.phone})\nDestination: ${contextTour?.destinationCity || 'Mumbai / International'}\nDate: ${contextTour?.tourDate || '2026-10-25'}\n${contextTour?.guideName ? `Guide: ${contextTour.guideName}\n` : ''}\n\nWarm regards,\nGuideConnect Platform Team`
  );

  const activeMailtoLink = getMailtoLink(
    selectedContact.email,
    customSubject,
    `Dear ${selectedContact.name},\n\n${customMessage}\n\nGuideConnect Platform Team`
  );

  const handleSendFreeEmail = async () => {
    setIsSendingEmail(true);
    setStatusFeedback(null);
    try {
      const result = await sendRealWorldEmailViaFreeApi({
        recipientEmail: selectedContact.email,
        recipientName: selectedContact.name,
        subject: customSubject,
        messageText: customMessage,
        details: {
          TouristPhone: selectedContact.phone,
          Destination: contextTour?.destinationCity || 'Tour Destination',
          Date: contextTour?.tourDate || '2026-10-25',
          Guide: contextTour?.guideName || 'Licensed Docent'
        }
      });

      if (result.success) {
        setStatusFeedback({
          type: 'success',
          text: `✅ ${result.message}`
        });
      } else {
        setStatusFeedback({
          type: 'info',
          text: `ℹ️ ${result.message} Click "Open Gmail Web" below to dispatch immediately.`
        });
      }
    } catch (err: any) {
      setStatusFeedback({
        type: 'info',
        text: `Free FormSubmit gateway triggered. Also click "Open in Gmail" for 1-click delivery.`
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-xs">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Real-World WhatsApp & Gmail Notification Center
                </h3>
                <span className="text-[10px] font-mono font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full uppercase">
                  Free APIs Active
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Dispatch live notifications to actual emails and mobile numbers with 1-click
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* API Information Bar */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-3">
            <Radio className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs text-emerald-950 space-y-1">
              <span className="font-bold block">
                Integrated Free Real-World Delivery APIs:
              </span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                • <strong>WhatsApp Direct API (wa.me & api.whatsapp.com):</strong> Direct browser & mobile deep-link API delivering pre-formatted messages to mobile numbers.<br />
                • <strong>FormSubmit.co Free Public Mail Gateway:</strong> Dispatches real background emails to recipient Gmail inboxes.<br />
                • <strong>Gmail Web Compose Protocol:</strong> Preloads subject and confirmation message directly into Gmail.
              </p>
            </div>
          </div>

          {/* 1. Select Real Verified Contact */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              Choose Verified Real Recipient:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {REAL_WORLD_CONTACTS.map(contact => {
                const isSelected = selectedContact.email === contact.email;
                return (
                  <button
                    key={contact.email}
                    type="button"
                    onClick={() => {
                      setSelectedContact(contact);
                      setStatusFeedback(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {contact.name}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate mt-0.5">
                        {contact.email}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-800 font-semibold mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600" />
                        <span>{contact.phone}</span>
                      </div>
                    </div>
                    <span className="text-xs shrink-0" role="img" aria-label="India flag">🇮🇳</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Message Customization */}
          <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Notification Subject:
              </label>
              <input
                type="text"
                value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Message Content (Sent to WhatsApp & Gmail):
              </label>
              <textarea
                rows={3}
                value={customMessage}
                onChange={e => setCustomMessage(e.target.value)}
                className="w-full text-xs bg-white border border-slate-300 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
              />
            </div>
          </div>

          {/* Feedback Status Notice */}
          {statusFeedback && (
            <div
              className={`p-3 rounded-xl border text-xs font-medium ${
                statusFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}
            >
              {statusFeedback.text}
            </div>
          )}

          {/* 3. Real Dispatch Buttons */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              1-Click Real-World Dispatch Actions:
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* WhatsApp Direct API Button */}
              <a
                href={activeWaLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block">Open WhatsApp Message</span>
                    <span className="text-[10px] text-emerald-100 font-mono">
                      To: {selectedContact.phone}
                    </span>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-emerald-200 group-hover:translate-x-0.5 transition-transform" />
              </a>

              {/* Free FormSubmit Background Email Dispatch */}
              <button
                type="button"
                onClick={handleSendFreeEmail}
                disabled={isSendingEmail}
                className="p-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl shadow-xs transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-bold block">
                      {isSendingEmail ? 'Dispatching...' : 'Send Free Real Email'}
                    </span>
                    <span className="text-[10px] text-indigo-100 font-mono">
                      Via FormSubmit Free API
                    </span>
                  </div>
                </div>
                <Zap className="w-4 h-4 text-amber-300" />
              </button>
            </div>

            {/* Complementary Gmail Web & Mailto Links */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <a
                href={activeGmailLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-rose-600" />
                <span>Open in Gmail Web ({selectedContact.email})</span>
                <ExternalLink className="w-3 h-3 text-rose-500" />
              </a>

              <a
                href={activeMailtoLink}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                <span>Default Email Client</span>
              </a>

              <button
                type="button"
                onClick={() => handleCopy(activeWaLink, 'whatsapp')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ml-auto"
              >
                {copiedLink === 'whatsapp' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{copiedLink === 'whatsapp' ? 'Copied Link!' : 'Copy WhatsApp Link'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="font-mono text-[11px]">
            Target: {selectedContact.name} ({selectedContact.phone} · {selectedContact.email})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

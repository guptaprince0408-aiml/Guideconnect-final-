import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  DollarSign,
  MessageSquare,
  ShieldAlert,
  Star,
  Users,
  AlertTriangle,
  Award,
  Plus,
  Trash2,
  Lock,
  TrendingUp,
  Mail,
  Phone,
  ExternalLink,
  Sparkles,
  Bell,
  Pencil,
  Camera
} from 'lucide-react';
import { GuideProfile, ClientRequest, RequestInvitation, Booking, NegotiationOffer, Review, AppNotification } from '../types';
import { atomicAcceptRequest, declineRequestInvitation, updateGuideAvailability, AcceptanceNotificationSummary, deleteGuideAccount } from '../services/store';
import { formatCurrency } from '../services/pricingEngine';
import { RatingTrendChart } from './RatingTrendChart';
import { MonthlyRatingLineChart } from './MonthlyRatingLineChart';
import { GuideProfileModal } from './GuideProfileModal';
import { EditGuideProfileModal } from './EditGuideProfileModal';

interface GuideDashboardProps {
  guide: GuideProfile;
  guides?: GuideProfile[];
  requests: ClientRequest[];
  invitations: RequestInvitation[];
  bookings: Booking[];
  offers: NegotiationOffer[];
  reviews: Review[];
  notifications?: AppNotification[];
  onSelectGuide?: (guide: GuideProfile) => void;
  onOpenNegotiation: (booking: Booking) => void;
  onOpenChat: (booking: Booking) => void;
  onRefresh: () => void;
}

export const GuideDashboard: React.FC<GuideDashboardProps> = ({
  guide,
  guides = [],
  requests,
  invitations,
  bookings,
  offers,
  reviews,
  notifications = [],
  onSelectGuide,
  onOpenNegotiation,
  onOpenChat,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'invitations' | 'bookings' | 'calendar' | 'ratings'>('invitations');
  const [showStatsGraph, setShowStatsGraph] = useState<boolean>(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastDispatchedNotification, setLastDispatchedNotification] = useState<AcceptanceNotificationSummary | null>(null);
  const [isPreviewPortfolioOpen, setIsPreviewPortfolioOpen] = useState<boolean>(false);
  const [isEditGuideModalOpen, setIsEditGuideModalOpen] = useState<boolean>(false);
  const [isDeleteGuideDialogOpen, setIsDeleteGuideDialogOpen] = useState<boolean>(false);

  const handleDeleteGuideAccount = () => {
    const res = deleteGuideAccount(guide.id);
    setIsDeleteGuideDialogOpen(false);
    onRefresh();
    if (res.nextGuideId && onSelectGuide && guides) {
      const nextG = guides.find(g => g.id === res.nextGuideId);
      if (nextG) onSelectGuide(nextG);
    }
  };

  // Calendar State for Guide Availability
  const [workingHours, setWorkingHours] = useState(guide.workingHours);
  const [blackoutDates, setBlackoutDates] = useState(guide.blackoutDates);
  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  const [newBlackoutReason, setNewBlackoutReason] = useState('');

  // Guide's pending invitations
  const guidePendingInvitations = invitations.filter(
    i => i.guideId === guide.id && i.status === 'PENDING'
  );

  // Map invitations to original client requests
  const pendingRequests = guidePendingInvitations
    .map(inv => requests.find(r => r.id === inv.requestId))
    .filter((r): r is ClientRequest => r !== undefined && r.status === 'OPEN');

  // Guide's confirmed bookings
  const guideBookings = bookings.filter(b => b.guideId === guide.id);
  const totalEarnings = guideBookings.reduce((sum, b) => sum + (b.agreedPrice || 0), 0);
  const guideReviews = reviews.filter(r => r.guideId === guide.id);

  const handleAccept = async (requestId: string) => {
    setActionError(null);
    setActionSuccess(null);
    setIsProcessing(true);

    try {
      const res = await atomicAcceptRequest(requestId, guide.id);
      if (!res.success) {
        setActionError(res.error || 'Failed to accept request');
      } else {
        if (res.dispatchedNotification) {
          setLastDispatchedNotification(res.dispatchedNotification);
          setActionSuccess(`Reservation secured! Booking ID: ${res.booking?.id}. Client ${res.dispatchedNotification.clientName} notified via WhatsApp & Gmail!`);
        } else {
          setActionSuccess(`Reservation successfully secured! Booking ID: ${res.booking?.id}.`);
        }
      }
      onRefresh();
    } catch (err: any) {
      setActionError(err.message || 'System error during acceptance');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = (requestId: string) => {
    if (confirm('Decline this invitation? The request will remain open for other qualified guides.')) {
      declineRequestInvitation(requestId, guide.id, 'Guide declined from dashboard.');
      onRefresh();
    }
  };

  const handleSaveAvailability = () => {
    updateGuideAvailability(guide.id, workingHours, blackoutDates);
    setActionSuccess('Working hours and blackout dates saved successfully.');
    onRefresh();
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleAddBlackoutDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlackoutDate) return;
    const updated = [...blackoutDates, { date: newBlackoutDate, reason: newBlackoutReason || 'Personal commitment' }];
    setBlackoutDates(updated);
    setNewBlackoutDate('');
    setNewBlackoutReason('');
  };

  const handleRemoveBlackoutDate = (idx: number) => {
    const updated = blackoutDates.filter((_, i) => i !== idx);
    setBlackoutDates(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Guide Identity Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div
            onClick={() => setIsEditGuideModalOpen(true)}
            className="relative shrink-0 group cursor-pointer"
            title="Click to change profile picture or edit guide details"
          >
            <img
              src={guide.profilePhoto}
              alt={guide.fullName}
              className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-sm group-hover:brightness-90 transition-all"
            />
            <span className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-0.5">
              <Camera className="w-4 h-4" />
              <span>Change</span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {guide.guideId}
              </span>
              <span className="text-xs font-bold text-emerald-700">
                @{guide.username}
              </span>
              {guide.isVerified ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Verified License</span>
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-600" />
                  <span>Pending Admin Review</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{guide.fullName}</h1>
              <button
                onClick={() => setIsEditGuideModalOpen(true)}
                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                title="Edit name, username, mobile, photo and information"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
              <span>{guide.country}</span>
              <span aria-hidden="true">·</span>
              <span>Rate: {guide.currency} {guide.baseHourlyRate}/hr</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => setActiveTab('ratings')}
                className="flex items-center text-amber-700 hover:text-amber-800 font-semibold cursor-pointer group"
                title="View Rating Trends Chart"
              >
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mr-0.5 group-hover:scale-110 transition-transform" />
                <span className="underline decoration-amber-300 underline-offset-2">
                  {guide.rating.toFixed(2)} ({guideReviews.length} reviews)
                </span>
                <span className="text-[10px] text-amber-600 ml-1 font-normal">· Chart ↗</span>
              </button>
              <span aria-hidden="true">·</span>
              <span>Languages: {guide.languages.map(l => l.language).join(', ')}</span>
            </div>
          </div>
        </div>

        {/* Financial & Rating Stats Badges & Public Profile Preview */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setIsEditGuideModalOpen(true)}
            className="bg-white hover:bg-slate-50 border border-slate-300 rounded-lg p-3 text-left transition-colors cursor-pointer flex flex-col justify-between shadow-2xs"
            title="Edit guide photo, rate, mobile no., and details"
          >
            <span className="text-[11px] text-slate-700 uppercase font-bold flex items-center gap-1">
              <Pencil className="w-3.5 h-3.5 text-emerald-600" />
              <span>Edit Details</span>
            </span>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-900 mt-1">
              <span>Edit Profile ✎</span>
            </div>
          </button>

          <button
            onClick={() => setIsPreviewPortfolioOpen(true)}
            className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg p-3 text-left transition-colors cursor-pointer flex flex-col justify-between"
            title="Preview how tourists view your full profile, mobile no, experience, and portfolio"
          >
            <span className="text-[11px] text-emerald-800 uppercase font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Public Profile</span>
            </span>
            <div className="flex items-center gap-1 text-xs font-bold font-mono text-emerald-950 mt-1">
              <span>View Portfolio ↗</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('ratings')}
            className="bg-amber-50/80 hover:bg-amber-100/90 border border-amber-200 rounded-lg p-3 text-right transition-colors cursor-pointer"
            title="View Client Rating Trend Chart"
          >
            <span className="text-[11px] text-amber-800 uppercase font-medium flex items-center justify-end gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
              <span>Rating Trends</span>
            </span>
            <div className="flex items-center justify-end gap-1 text-lg font-bold font-mono text-amber-950 mt-0.5">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{guide.rating.toFixed(2)}</span>
              <span className="text-xs text-amber-700 font-normal">({guideReviews.length})</span>
            </div>
          </button>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-right">
            <span className="text-[11px] text-slate-500 block uppercase font-medium">Agreed Tour Revenue</span>
            <span className="text-lg font-bold font-mono text-slate-900 mt-0.5 block">
              {guide.currency} {totalEarnings.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Statistics Section with Monthly Rating Line Chart */}
      <section className="mb-8 space-y-4">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono">
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <span className="text-[11px] text-slate-500 uppercase block font-sans font-medium">Average Rating</span>
            <div className="flex items-center gap-1.5 mt-1">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {guide.rating.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-sans">({guideReviews.length})</span>
            </div>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <span className="text-[11px] text-slate-500 uppercase block font-sans font-medium">Agreed Revenue</span>
            <span className="text-xl font-bold text-slate-900 tabular-nums mt-1 block">
              {guide.currency} {totalEarnings.toLocaleString()}
            </span>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <span className="text-[11px] text-slate-500 uppercase block font-sans font-medium">Confirmed Tours</span>
            <span className="text-xl font-bold text-emerald-800 tabular-nums mt-1 block">
              {guideBookings.length} bookings
            </span>
          </div>

          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs">
            <span className="text-[11px] text-slate-500 uppercase block font-sans font-medium">Pending Requests</span>
            <span className="text-xl font-bold text-amber-700 tabular-nums mt-1 block">
              {pendingRequests.length} invitations
            </span>
          </div>
        </div>

        {/* Monthly Rating History Line Chart using Recharts */}
        <MonthlyRatingLineChart guide={guide} reviews={reviews} />
      </section>

      {/* Action Banners */}
      {actionError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 shadow-sm">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold">Transaction Race Conflict / Error:</div>
            <div>{actionError}</div>
          </div>
        </div>
      )}

      {actionSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{actionSuccess}</span>
        </div>
      )}

      {/* Dispatched Notification Card with WhatsApp & Gmail Links */}
      {lastDispatchedNotification && (
        <div className="mb-6 p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border border-emerald-500/50 rounded-2xl text-white shadow-xl space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-sm font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Client Notified via WhatsApp & Gmail!</span>
              </h3>
            </div>
            <button
              onClick={() => setLastDispatchedNotification(null)}
              className="text-slate-400 hover:text-white p-1 text-xs"
            >
              ✕ Dismiss
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Automatic confirmation alerts were dispatched to <strong className="text-white">{lastDispatchedNotification.clientName}</strong> ({lastDispatchedNotification.clientPhone} / {lastDispatchedNotification.clientEmail}) with your contact phone ({lastDispatchedNotification.guidePhone}) and booking details.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800">
            <a
              href={lastDispatchedNotification.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 transition-transform hover:scale-102"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Client WhatsApp Alert</span>
            </a>

            <a
              href={lastDispatchedNotification.gmailUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-transform hover:scale-102"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Open Client Gmail Alert</span>
            </a>

            <button
              onClick={() => setLastDispatchedNotification(null)}
              className="px-3 py-2 text-xs text-slate-400 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* New Client Request Notification Alert */}
      {pendingRequests.length > 0 && activeTab !== 'invitations' && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
            <span>
              <strong>Client Request Notification:</strong> You have {pendingRequests.length} pending client tour invitation(s) matching your service area & language!
            </span>
          </div>
          <button
            onClick={() => setActiveTab('invitations')}
            className="px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            Review & Accept Request
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('invitations')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'invitations'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <span>Pending Invitations</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-mono">
            {pendingRequests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'bookings'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <span>Confirmed Bookings & Bargaining</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-mono">
            {guideBookings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ratings')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'ratings'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
          <span>Rating Trends & Analytics</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded font-mono">
            {guideReviews.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'calendar'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Working Hours & Calendar</span>
        </button>
      </div>

      {/* TAB 1: PENDING INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Matched Tour Opportunities
            </h2>
            <p className="text-xs text-slate-500">
              Filtered specifically to your service areas, dialect proficiency, and free time slots.
            </p>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 mb-1">No Pending Requests</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You have addressed all active invitations. New client requests matching your languages and working days will arrive here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingRequests.map(req => (
                <div
                  key={req.id}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                          {req.id}
                        </span>
                        <h3 className="text-base font-bold text-slate-900 mt-1.5">
                          {req.destinationCity} · {req.tourType} Tour
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Client Budget</span>
                        <span className="text-sm font-bold font-mono text-emerald-800">
                          {formatCurrency(req.approximateBudget, req.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Traveler:</span>
                        <span className="font-semibold text-slate-800">{req.clientName} ({req.clientNationality})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Date & Window:</span>
                        <span className="font-mono">{req.travelDate} ({req.startTime} - {req.endTime})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Required Dialect:</span>
                        <span className="font-semibold text-emerald-700">{req.preferredLanguage}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Group Size:</span>
                        <span>{req.numberOfTourists} tourists</span>
                      </div>
                      <div className="pt-1 border-t border-slate-200 text-slate-500">
                        <span className="font-medium text-slate-700">Meeting Point: </span>
                        {req.meetingLocation}
                      </div>
                    </div>

                    {req.specialInstructions && (
                      <p className="text-xs text-slate-500 italic mb-4">
                        "{req.specialInstructions}"
                      </p>
                    )}
                  </div>

                  {/* Accept / Decline Action Footer */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <button
                      onClick={() => handleDecline(req.id)}
                      disabled={isProcessing}
                      className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Decline
                    </button>

                    <button
                      onClick={() => handleAccept(req.id)}
                      disabled={isProcessing}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Accept & Reserve Slot</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONFIRMED BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Confirmed Reservations & Fee Negotiation
            </h2>
            <p className="text-xs text-slate-500">
              Reserved bookings locked in your calendar schedule.
            </p>
          </div>

          {guideBookings.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800 mb-1">No Bookings Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Once you accept a tour request, the reservation appears here. You can then negotiate the final fee and coordinate directly via text messaging.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {guideBookings.map(bk => {
                const bookingOffers = offers.filter(o => o.bookingId === bk.id);
                const hasAgreedFee = bk.negotiationStatus === 'AGREED' && bk.agreedPrice !== null;

                return (
                  <div
                    key={bk.id}
                    className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:border-slate-300 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            {bk.id}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 mt-1.5">
                            {bk.destinationCity} · {bk.tourType}
                          </h3>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          bk.bookingStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                          bk.bookingStatus === 'COMPLETED' ? 'bg-indigo-100 text-indigo-800' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {bk.bookingStatus}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 mb-4 bg-slate-50 p-3 rounded font-mono">
                        <div>Client: <span className="font-sans font-bold text-slate-800">{bk.clientName}</span></div>
                        <div>Date: {bk.travelDate} ({bk.startTime} - {bk.endTime})</div>
                        <div>Meeting Point: <span className="font-sans">{bk.meetingLocation}</span></div>
                        <div>Tourists: {bk.numberOfTourists} pax</div>
                      </div>

                      {/* Fee Agreement Strip */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-4 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Agreed Fee:</span>
                          {hasAgreedFee ? (
                            <span className="font-bold text-emerald-800 font-mono text-sm">
                              {formatCurrency(bk.agreedPrice!, bk.currency)} (Locked)
                            </span>
                          ) : (
                            <span className="text-amber-800 font-semibold font-mono">
                              Pending Negotiation ({bookingOffers.length} offers)
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => onOpenNegotiation(bk)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 rounded border border-slate-300 transition-colors flex items-center gap-1"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                          <span>{hasAgreedFee ? 'View Bargain History' : 'Bargain Fee'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                      <button
                        onClick={() => onOpenChat(bk)}
                        className="font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat with Tourist</span>
                      </button>

                      <span className="text-[11px] text-slate-500 font-mono">
                        Req ID: {bk.requestId}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CALENDAR & WORKING HOURS */}
      {activeTab === 'calendar' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-8">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
              Regular Working Schedule
            </h2>
            <p className="text-xs text-slate-500">
              The smart matching engine only matches your profile with requests occurring within your active schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {workingHours.map((wh, idx) => {
              const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
              return (
                <div key={wh.dayOfWeek} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{dayNames[wh.dayOfWeek]}</span>
                    <input
                      type="checkbox"
                      checked={wh.isActive}
                      onChange={e => {
                        const copy = [...workingHours];
                        copy[idx].isActive = e.target.checked;
                        setWorkingHours(copy);
                      }}
                      className="rounded text-emerald-600"
                    />
                  </div>

                  {wh.isActive ? (
                    <div className="flex items-center gap-1 font-mono">
                      <input
                        type="time"
                        value={wh.startTime}
                        onChange={e => {
                          const copy = [...workingHours];
                          copy[idx].startTime = e.target.value;
                          setWorkingHours(copy);
                        }}
                        className="w-1/2 p-1 border border-slate-300 rounded text-center"
                      />
                      <span>-</span>
                      <input
                        type="time"
                        value={wh.endTime}
                        onChange={e => {
                          const copy = [...workingHours];
                          copy[idx].endTime = e.target.value;
                          setWorkingHours(copy);
                        }}
                        className="w-1/2 p-1 border border-slate-300 rounded text-center"
                      />
                    </div>
                  ) : (
                    <span className="text-slate-400 italic block py-1">Off Duty</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Blackout Dates */}
          <div className="pt-6 border-t border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              Blackout Dates & Vacation Exceptions
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Mark individual calendar dates as unavailable for personal commitments or holidays.
            </p>

            <form onSubmit={handleAddBlackoutDate} className="flex flex-wrap items-center gap-3 mb-4">
              <input
                type="date"
                required
                value={newBlackoutDate}
                onChange={e => setNewBlackoutDate(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded font-mono"
              />
              <input
                type="text"
                placeholder="Reason (e.g. Family holiday)"
                value={newBlackoutReason}
                onChange={e => setNewBlackoutReason(e.target.value)}
                className="text-xs p-2 border border-slate-300 rounded flex-1 min-w-[200px]"
              />
              <button
                type="submit"
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                + Add Exception Date
              </button>
            </form>

            {blackoutDates.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No blackout dates added.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {blackoutDates.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 font-mono"
                  >
                    <span>{b.date} ({b.reason})</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlackoutDate(i)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSaveAvailability}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
            >
              Save Schedule & Calendar Changes
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: RATING TRENDS & ANALYTICS */}
      {activeTab === 'ratings' && (
        <RatingTrendChart guide={guide} reviews={reviews} />
      )}

      {/* =========================================================================
          VERY DOWNSIDE (BOTTOM): DANGER ZONE & GUIDE ACCOUNT DELETION
          ========================================================================= */}
      <div className="mt-14 pt-8 border-t border-slate-200">
        <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-rose-100 text-rose-700 rounded-xl shrink-0 mt-0.5">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-rose-950 uppercase tracking-wider">
                  Account Management · Danger Zone
                </h3>
                <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                  Permanent Action
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
                Permanently delete the guide account for <strong className="text-slate-900 font-semibold">{guide.fullName}</strong> ({guide.guideId} · @{guide.username}). 
                This will delist your portfolio, cancel pending invitations, and remove your docent profile from GuideConnect.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsEditGuideModalOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Guide Info</span>
            </button>

            <button
              onClick={() => setIsDeleteGuideDialogOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:shadow-md"
              title="Permanently delete this guide account"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Guide Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* Guide Public Portfolio Preview Modal */}
      <GuideProfileModal
        guide={guide}
        isOpen={isPreviewPortfolioOpen}
        onClose={() => setIsPreviewPortfolioOpen(false)}
        reviews={reviews}
      />

      {/* EDIT GUIDE PROFILE MODAL */}
      <EditGuideProfileModal
        isOpen={isEditGuideModalOpen}
        onClose={() => setIsEditGuideModalOpen(false)}
        guide={guide}
        onSaved={updated => {
          onRefresh();
          if (onSelectGuide) onSelectGuide(updated);
        }}
      />

      {/* DELETE GUIDE ACCOUNT CONFIRMATION MODAL */}
      {isDeleteGuideDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Delete Guide Account?
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-slate-800">{guide.fullName}</strong>'s guide account? 
                  Your public profile, rate cards, and tour portfolios will be permanently removed.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Guide Name:</span>
                  <span className="font-bold text-slate-900">{guide.fullName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Guide ID:</span>
                  <span className="font-mono font-bold text-slate-900">{guide.guideId}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Username:</span>
                  <span className="font-mono text-emerald-800 font-bold">@{guide.username}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mobile:</span>
                  <span className="font-mono text-slate-900">{guide.phone}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteGuideDialogOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel, Keep Account
                </button>
                <button
                  type="button"
                  onClick={handleDeleteGuideAccount}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Delete Account</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

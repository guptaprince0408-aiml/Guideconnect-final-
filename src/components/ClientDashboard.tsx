import React, { useState } from 'react';
import {
  Compass,
  Plus,
  Clock,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  DollarSign,
  MessageSquare,
  Star,
  AlertCircle,
  X,
  Languages,
  ArrowRight,
  Phone,
  Mail,
  ExternalLink,
  Briefcase,
  Sparkles,
  Eye,
  Bell,
  ShieldCheck,
  Award,
  UserPlus,
  Globe,
  Pencil,
  Trash2,
  AlertTriangle,
  Camera,
  Sliders,
  ArrowRightLeft
} from 'lucide-react';
import { ClientProfile, ClientRequest, Booking, GuideProfile, Review, NegotiationOffer, Message, AppNotification } from '../types';
import { createClientRequest, cancelClientRequest, completeBooking, submitReview, buildWhatsAppLink, buildGmailLink, deleteClientAccount } from '../services/store';
import { formatCurrency, calculateEstimatedPrice, convertCurrencyToINR, FX_RATES_TO_INR } from '../services/pricingEngine';
import { findEligibleGuides } from '../services/matchingEngine';
import { GuideProfileModal } from './GuideProfileModal';
import { EditClientProfileModal } from './EditClientProfileModal';
import { IndianClientPriceSlider } from './IndianClientPriceSlider';
import { RealWorldNotificationModal } from './RealWorldNotificationModal';
import { REAL_WORLD_CONTACTS, sendRealWorldEmailViaFreeApi, getWhatsAppDirectLink } from '../services/realNotificationService';

interface ClientDashboardProps {
  client: ClientProfile;
  clients?: ClientProfile[];
  requests: ClientRequest[];
  bookings: Booking[];
  guides: GuideProfile[];
  offers: NegotiationOffer[];
  reviews: Review[];
  notifications?: AppNotification[];
  onSelectClient?: (client: ClientProfile) => void;
  onOpenClientRegisterModal?: () => void;
  onOpenNegotiation: (booking: Booking) => void;
  onOpenChat: (booking: Booking) => void;
  onRefresh: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  client,
  clients = [],
  requests,
  bookings,
  guides,
  offers,
  reviews,
  notifications = [],
  onSelectClient,
  onOpenClientRegisterModal,
  onOpenNegotiation,
  onOpenChat,
  onRefresh
}) => {
  const [isCreatingRequest, setIsCreatingRequest] = useState<boolean>(false);
  const [reviewModalBooking, setReviewModalBooking] = useState<Booking | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [selectedGuideForProfile, setSelectedGuideForProfile] = useState<GuideProfile | null>(null);
  const [selectedBookingForGuideContext, setSelectedBookingForGuideContext] = useState<Booking | null>(null);
  const [activeClientTab, setActiveClientTab] = useState<'requests_bookings' | 'explore_guides' | 'notifications'>('requests_bookings');
  const [guideFilterCity, setGuideFilterCity] = useState<string>('ALL');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState<boolean>(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [showTopCurrencySlider, setShowTopCurrencySlider] = useState<boolean>(true);
  const [selectedSimulatorCountry, setSelectedSimulatorCountry] = useState<'France' | 'Italy' | 'Japan' | 'United Kingdom' | 'United States' | 'India'>('France');
  const [expandedCardSliderGuideId, setExpandedCardSliderGuideId] = useState<string | null>(null);
  const [expandedBookingSliderId, setExpandedBookingSliderId] = useState<string | null>(null);
  const [expandedRequestSliderId, setExpandedRequestSliderId] = useState<string | null>(null);
  const [isRealNotificationModalOpen, setIsRealNotificationModalOpen] = useState<boolean>(false);
  const [activeRealContactForModal, setActiveRealContactForModal] = useState<any>(null);

  const isClientFromIndia = client.nationality.toLowerCase().includes('india') ||
    client.preferredLanguage === 'Marathi' ||
    client.preferredLanguage === 'Hindi';

  const handleDeleteAccount = () => {
    const res = deleteClientAccount(client.id);
    setIsDeleteDialogOpen(false);
    onRefresh();
    if (res.nextClientId && onSelectClient) {
      const nextC = clients.find(c => c.id === res.nextClientId);
      if (nextC) onSelectClient(nextC);
    }
  };

  // Form State
  const [destinationCountry, setDestinationCountry] = useState<string>('India');
  const [destinationCity, setDestinationCity] = useState<string>('Mumbai');
  const [preferredLanguage, setPreferredLanguage] = useState<string>('English');
  const [travelDate, setTravelDate] = useState<string>('2026-10-22');
  const [startTime, setStartTime] = useState<string>('09:30');
  const [endTime, setEndTime] = useState<string>('13:30');
  const [durationHours, setDurationHours] = useState<number>(4);
  const [numberOfTourists, setNumberOfTourists] = useState<number>(2);
  const [tourType, setTourType] = useState<string>('Historical');
  const [preferredSpecialization, setPreferredSpecialization] = useState<string>('Heritage & Architecture');
  const [approximateBudget, setApproximateBudget] = useState<number>(3000);
  const [currency, setCurrency] = useState<string>('INR');
  const [meetingLocation, setMeetingLocation] = useState<string>('Gateway of India, Colaba');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [createdMatchCount, setCreatedMatchCount] = useState<number | null>(null);

  const clientRequests = requests.filter(r => r.clientId === client.id);
  const clientBookings = bookings.filter(b => b.clientId === client.id);
  const clientNotifications = (notifications || []).filter(n => n.recipientId === client.id);

  const handleRequestWithGuide = (g: GuideProfile) => {
    setDestinationCountry(g.country);
    setDestinationCity(g.serviceAreas[0] || 'Mumbai');
    setCurrency(g.currency);
    setApproximateBudget(g.baseHourlyRate * 4);
    setPreferredLanguage(g.languages[0]?.language || 'English');
    if (g.specializations[0]) setPreferredSpecialization(g.specializations[0]);
    setIsCreatingRequest(true);
  };

  // Auto calculate duration on time changes
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    recalcDuration(newStart, endTime);
  };
  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    recalcDuration(startTime, newEnd);
  };
  const recalcDuration = (start: string, end: string) => {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
    if (diff > 0) setDurationHours(Math.round(diff * 10) / 10);
  };

  const handleCountryChange = (country: string) => {
    setDestinationCountry(country);
    if (country === 'India') {
      setDestinationCity('Mumbai');
      setCurrency('INR');
      setApproximateBudget(2800);
      setMeetingLocation('Gateway of India, Colaba');
    } else if (country === 'Japan') {
      setDestinationCity('Kyoto');
      setCurrency('JPY');
      setApproximateBudget(16000);
      setMeetingLocation('Gion-Shijo Station, Exit 6');
    } else if (country === 'Italy') {
      setDestinationCity('Rome');
      setCurrency('EUR');
      setApproximateBudget(140);
      setMeetingLocation('Colosseum Metro Exit, Piazza del Colosseo');
    } else if (country === 'France') {
      setDestinationCity('Paris');
      setCurrency('EUR');
      setApproximateBudget(150);
      setMeetingLocation('Place des Abbesses Metro, Montmartre');
    }
  };

  const handleCreateRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Frontend validation
    if (startTime >= endTime) {
      setFormError('End time must be later than start time.');
      return;
    }

    try {
      const res = await createClientRequest({
        clientId: client.id,
        destinationCountry,
        destinationCity,
        preferredLanguage,
        travelDate,
        startTime,
        endTime,
        durationHours: Number(durationHours),
        numberOfTourists: Number(numberOfTourists),
        tourType,
        preferredSpecialization,
        approximateBudget: Number(approximateBudget),
        currency,
        meetingLocation,
        specialInstructions
      });

      if (!res.success) {
        setFormError(res.error || 'Failed to submit request');
        return;
      }

      setCreatedMatchCount(res.invitationsCount);
      onRefresh();
      setTimeout(() => {
        setIsCreatingRequest(false);
        setCreatedMatchCount(null);
      }, 1500);
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    }
  };

  const handleCancelRequest = (requestId: string) => {
    if (confirm('Are you sure you want to cancel this open request?')) {
      cancelClientRequest(requestId);
      onRefresh();
    }
  };

  const handleCompleteTour = (bookingId: string) => {
    completeBooking(bookingId);
    onRefresh();
  };

  const handleSubmitReviewForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalBooking) return;
    submitReview({
      bookingId: reviewModalBooking.id,
      clientId: client.id,
      clientName: client.fullName,
      clientNationality: client.nationality,
      guideId: reviewModalBooking.guideId,
      rating: reviewRating,
      comment: reviewComment
    });
    setReviewModalBooking(null);
    setReviewComment('');
    onRefresh();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Client Identity Header & Option Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div
            onClick={() => setIsEditProfileOpen(true)}
            className="relative shrink-0 group cursor-pointer"
            title="Click to change profile picture or edit tourist details"
          >
            <img
              src={client.profilePhoto}
              alt={client.fullName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-sm group-hover:brightness-90 transition-all"
            />
            <span className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-0.5">
              <Camera className="w-4 h-4" />
              <span>Change</span>
            </span>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-xs" title="Active Client">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
            </span>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                ID: {client.id}
              </span>
              <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-500" />
                <span>{client.nationality}</span>
              </span>
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded flex items-center gap-1">
                <Languages className="w-3 h-3 text-indigo-500" />
                <span>Dialect: {client.preferredLanguage}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {client.fullName}
              </h1>
              <button
                onClick={() => setIsEditProfileOpen(true)}
                className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                title="Edit name, phone number, photo & all details"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 mt-2">
              <span className="flex items-center gap-1 font-mono font-bold text-slate-800">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>{client.phone}</span>
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center gap-1 text-slate-500">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{client.email}</span>
              </span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <a
                href={buildWhatsAppLink(client.phone, `Hello ${client.fullName}! Message from GuideConnect platform.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 transition-colors"
                title="Send test WhatsApp to this tourist"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>WhatsApp Active</span>
              </a>
            </div>
          </div>
        </div>

        {/* Client Switcher & Registration Option Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-start xl:justify-end shrink-0 pt-4 xl:pt-0 border-t xl:border-t-0 border-slate-100">
          {/* Option Bar: Client Switcher + Add Button */}
          {clients.length > 0 && onSelectClient && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1.5 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pl-2 pr-1 hidden sm:inline">
                Tourist:
              </span>
              <select
                value={client.id}
                onChange={e => {
                  const targetClient = clients.find(c => c.id === e.target.value);
                  if (targetClient) onSelectClient(targetClient);
                }}
                className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[200px] truncate cursor-pointer shadow-2xs"
                title="Switch active client profile"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.preferredLanguage})
                  </option>
                ))}
              </select>

              {onOpenClientRegisterModal && (
                <button
                  onClick={onOpenClientRegisterModal}
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Register a new tourist profile (+)"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setIsEditProfileOpen(true)}
            className="px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Edit Tourist Profile, Photo, Mobile, Name & Info"
          >
            <Pencil className="w-3.5 h-3.5 text-slate-500" />
            <span>Edit Profile</span>
          </button>

          {onOpenClientRegisterModal && (
            <button
              onClick={onOpenClientRegisterModal}
              className="px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Open tourist registration form"
            >
              <UserPlus className="w-4 h-4 text-emerald-700" />
              <span>+ Register Tourist</span>
            </button>
          )}

          <button
            onClick={() => setIsCreatingRequest(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Create Tour Request</span>
          </button>
        </div>
      </div>

      {/* INDIAN TRAVELER DUAL-CURRENCY & PRICE SLIDER BANNER */}
      {isClientFromIndia && (
        <div className="mb-8 space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-emerald-500/10 border border-amber-200/90 rounded-2xl px-5 py-3.5 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <span className="text-xl" role="img" aria-label="India flag">🇮🇳</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    Indian Tourist Currency Feature
                  </span>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  See guide charges in both visiting country currency and Indian Rupees (INR) with live price slider
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Visiting Country:</span>
              <div className="flex flex-wrap gap-1">
                {[
                  { country: 'France', cur: 'EUR', flag: '🇫🇷' },
                  { country: 'Italy', cur: 'EUR', flag: '🇮🇹' },
                  { country: 'Japan', cur: 'JPY', flag: '🇯🇵' },
                  { country: 'United Kingdom', cur: 'GBP', flag: '🇬🇧' },
                  { country: 'United States', cur: 'USD', flag: '🇺🇸' },
                  { country: 'India', cur: 'INR', flag: '🇮🇳' },
                ].map(item => (
                  <button
                    key={item.country}
                    type="button"
                    onClick={() => setSelectedSimulatorCountry(item.country as any)}
                    className={`px-2 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1 ${
                      selectedSimulatorCountry === item.country
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <span>{item.flag}</span>
                    <span>{item.country}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  const matched = REAL_WORLD_CONTACTS.find(c => c.name.toLowerCase() === client.fullName.toLowerCase()) || REAL_WORLD_CONTACTS[0];
                  setActiveRealContactForModal(matched);
                  setIsRealNotificationModalOpen(true);
                }}
                className="px-3 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs cursor-pointer transition-colors flex items-center gap-1.5"
                title="Send test real-world notifications to WhatsApp and Gmail"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Test Real WhatsApp & Gmail APIs</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTopCurrencySlider(!showTopCurrencySlider)}
                className="px-3 py-1 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs cursor-pointer transition-colors"
              >
                {showTopCurrencySlider ? 'Collapse Slider' : 'Open Price Slider'}
              </button>
            </div>
          </div>

          {showTopCurrencySlider && (
            <IndianClientPriceSlider
              baseHourlyRate={
                selectedSimulatorCountry === 'France' ? 38 :
                selectedSimulatorCountry === 'Italy' ? 32 :
                selectedSimulatorCountry === 'Japan' ? 3800 :
                selectedSimulatorCountry === 'United Kingdom' ? 35 :
                selectedSimulatorCountry === 'United States' ? 45 : 650
              }
              visitingCurrency={
                selectedSimulatorCountry === 'France' || selectedSimulatorCountry === 'Italy' ? 'EUR' :
                selectedSimulatorCountry === 'Japan' ? 'JPY' :
                selectedSimulatorCountry === 'United Kingdom' ? 'GBP' :
                selectedSimulatorCountry === 'United States' ? 'USD' : 'INR'
              }
              visitingCountry={selectedSimulatorCountry}
              initialHours={4}
            />
          )}
        </div>
      )}

      {/* Client View Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-2 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveClientTab('requests_bookings')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              activeClientTab === 'requests_bookings'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>My Requests & Bookings</span>
            <span className="text-[10px] font-mono bg-white/20 px-1.5 py-0.2 rounded font-bold">
              {clientBookings.length} Active
            </span>
          </button>

          <button
            onClick={() => setActiveClientTab('explore_guides')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              activeClientTab === 'explore_guides'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Browse Verified Guides & Portfolios</span>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded font-bold">
              {guides.length} Guides
            </span>
          </button>

          <button
            onClick={() => setActiveClientTab('notifications')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer ${
              activeClientTab === 'notifications'
                ? 'bg-indigo-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-indigo-50 border border-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-indigo-500" />
            <span>WhatsApp & Gmail Alerts</span>
            {clientNotifications.length > 0 && (
              <span className="text-[10px] font-mono bg-indigo-100 text-indigo-900 px-1.5 py-0.2 rounded font-bold">
                {clientNotifications.length}
              </span>
            )}
          </button>
        </div>

        {/* Live Notification Indicator */}
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-emerald-50/70 border border-emerald-200/60 px-3 py-1.5 rounded-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-medium text-emerald-950">
            Guide Acceptance triggers instant WhatsApp & Gmail confirmation to Client
          </span>
        </div>
      </div>

      {/* TAB 1: REQUESTS & BOOKINGS */}
      {activeClientTab === 'requests_bookings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          {/* Left Column: Client Requests */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Your Guide Requests</h2>
                <p className="text-xs text-slate-500">Live requests matching against verified guides</p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">
                {clientRequests.length} Total
              </span>
            </div>

            {clientRequests.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <Compass className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 mb-3">No active guide requests found.</p>
                <button
                  onClick={() => setIsCreatingRequest(true)}
                  className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  + Create your first guide request
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {clientRequests.map(req => {
                  const evaluations = findEligibleGuides(guides, req, bookings);
                  const eligible = evaluations.filter(e => e.isEligible);
                  const matchedGuide = guides.find(
                    g => g.id === req.assignedGuideId || g.guideId === req.assignedGuideId || g.username === req.assignedGuideUsername
                  );

                  return (
                    <div
                      key={req.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-900">
                              {req.id}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                              req.status === 'OPEN' ? 'bg-amber-100 text-amber-800' :
                              req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {req.status}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-1">
                            {req.destinationCity}, {req.destinationCountry} · {req.tourType} Tour
                          </h3>
                        </div>
                        {isClientFromIndia && req.currency !== 'INR' ? (
                          <div className="text-right">
                            <span className="text-xs font-mono font-bold text-slate-700 block">
                              {formatCurrency(req.approximateBudget, req.currency)}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-amber-900 block">
                              ≈ ₹{convertCurrencyToINR(req.approximateBudget, req.currency).toLocaleString()} INR
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {formatCurrency(req.approximateBudget, req.currency)}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded font-mono">
                        <div>Date: {req.travelDate}</div>
                        <div>Time: {req.startTime} - {req.endTime} ({req.durationHours}h)</div>
                        <div>Language: {req.preferredLanguage}</div>
                        <div>Tourists: {req.numberOfTourists} pax</div>
                      </div>

                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                        <span className="font-semibold text-slate-700">Meeting: </span>
                        {req.meetingLocation}
                      </p>

                      {/* Indian Client Price Slider on Tour Request */}
                      {isClientFromIndia && (
                        <div className="mb-3">
                          <button
                            type="button"
                            onClick={() => setExpandedRequestSliderId(expandedRequestSliderId === req.id ? null : req.id)}
                            className="w-full text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg py-1 px-2.5 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-xs">🇮🇳</span>
                              <Sliders className="w-3 h-3 text-amber-700" />
                              <span>Live Price Slider ({req.currency} & ₹ INR)</span>
                            </span>
                            <span className="text-[10px] text-amber-800 underline font-semibold">
                              {expandedRequestSliderId === req.id ? 'Close' : 'Slide Hours'}
                            </span>
                          </button>

                          {expandedRequestSliderId === req.id && (
                            <div className="pt-2">
                              <IndianClientPriceSlider
                                guideName={req.assignedGuideUsername || 'Guide'}
                                baseHourlyRate={Math.round(req.approximateBudget / (req.durationHours || 4))}
                                visitingCurrency={req.currency}
                                visitingCountry={req.destinationCountry}
                                compact={true}
                                initialHours={req.durationHours || 4}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Status Specific Footer */}
                      {req.status === 'OPEN' && (
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-emerald-700 font-medium">
                            {eligible.length} Qualified Guides Receiving Notifications & Invitations
                          </span>
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            className="text-rose-600 hover:text-rose-800 font-semibold"
                          >
                            Cancel Request
                          </button>
                        </div>
                      )}

                      {req.status === 'ACCEPTED' && (
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-emerald-800 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reserved by @{req.assignedGuideUsername} ({req.assignedGuideId})</span>
                          </span>

                          <div className="flex items-center gap-2">
                            {matchedGuide && (
                              <button
                                onClick={() => setSelectedGuideForProfile(matchedGuide)}
                                className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded flex items-center gap-1 transition-colors"
                              >
                                <Sparkles className="w-3 h-3 text-amber-500" />
                                <span>Guide Info & Portfolio</span>
                              </button>
                            )}
                            <span className="font-mono text-slate-500 text-[11px]">
                              Booking: {req.bookingId}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Confirmed Bookings & Negotiation */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">Your Bookings & Contracts</h2>
                <p className="text-xs text-slate-500">Atomic reservations with chat, mobile contact, and bargaining</p>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">
                {clientBookings.length} Active
              </span>
            </div>

            {clientBookings.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600">No confirmed bookings yet.</p>
                <p className="text-xs text-slate-500 mt-1">
                  Once a qualified guide accepts your open request, the reservation appears here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {clientBookings.map(bk => {
                  const bookingOffers = offers.filter(o => o.bookingId === bk.id);
                  const hasAgreedFee = bk.negotiationStatus === 'AGREED' && bk.agreedPrice !== null;
                  const assignedGuide = guides.find(g => g.id === bk.guideId || g.guideId === bk.guideCode);

                  return (
                    <div
                      key={bk.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-900">
                              {bk.id}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                              bk.bookingStatus === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' :
                              bk.bookingStatus === 'COMPLETED' ? 'bg-indigo-100 text-indigo-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {bk.bookingStatus}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-900 mt-1">
                            {bk.destinationCity} · {bk.tourType}
                          </h3>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-emerald-800 block">
                            {bk.guideCode}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            @{bk.guideUsername}
                          </span>
                        </div>
                      </div>

                      {/* Guide Full Information Banner on Booking Card */}
                      {assignedGuide && (
                        <div className="p-3 bg-gradient-to-r from-emerald-50/70 via-slate-50 to-emerald-50/40 border border-emerald-200 rounded-xl mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={assignedGuide.profilePhoto}
                              alt={assignedGuide.fullName}
                              className="w-12 h-12 rounded-xl object-cover border border-emerald-500/50 shadow-2xs shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-900">{assignedGuide.fullName}</span>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span className="text-[10px] font-mono font-medium text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                                  {assignedGuide.guideId}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 mt-0.5">
                                <span className="flex items-center gap-1 text-slate-900 font-mono font-bold">
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  <span>{assignedGuide.phone}</span>
                                </span>
                                <span>·</span>
                                <span>{assignedGuide.yearsOfExperience} yrs exp</span>
                                <span>·</span>
                                <span className="text-amber-600 font-mono font-bold">{assignedGuide.rating.toFixed(2)}★</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
                            <a
                              href={buildWhatsAppLink(
                                assignedGuide.phone,
                                `Hi ${assignedGuide.fullName}! I am ${client.fullName}, tourist for confirmed booking ${bk.id} in ${bk.destinationCity} on ${bk.travelDate}.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg flex items-center gap-1 transition-colors"
                              title="Chat with guide on WhatsApp"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              <span>WhatsApp</span>
                            </a>

                            <a
                              href={`tel:${assignedGuide.phone.replace(/[^0-9+]/g, '')}`}
                              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                              title="Call guide phone"
                            >
                              <Phone className="w-3 h-3 text-slate-600" />
                              <span>Call</span>
                            </a>

                            <button
                              onClick={() => {
                                setSelectedGuideForProfile(assignedGuide);
                                setSelectedBookingForGuideContext(bk);
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                              title="View Guide's Name, Mobile No., Experience & Portfolio"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>View Full Portfolio</span>
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded font-mono">
                        <div>Date: {bk.travelDate}</div>
                        <div>Time: {bk.startTime} - {bk.endTime}</div>
                        <div>Meeting: {bk.meetingLocation}</div>
                        <div>Tourists: {bk.numberOfTourists} pax</div>
                      </div>

                      {/* Price & Negotiation Status Strip */}
                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 mb-4 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-500 block text-[11px]">Fee Agreement:</span>
                          {hasAgreedFee ? (
                            <div>
                              <span className="font-bold text-emerald-800 font-mono text-sm">
                                {formatCurrency(bk.agreedPrice!, bk.currency)} (Agreed)
                              </span>
                              {isClientFromIndia && bk.currency !== 'INR' && (
                                <span className="block text-[11px] font-bold text-amber-900 font-mono">
                                  ≈ ₹{convertCurrencyToINR(bk.agreedPrice!, bk.currency).toLocaleString()} INR (1 {bk.currency} ≈ ₹{FX_RATES_TO_INR[bk.currency] || 1})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-amber-800 font-semibold font-mono">
                              Negotiating ({bookingOffers.length} offers)
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => onOpenNegotiation(bk)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 rounded border border-slate-300 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                          <span>Bargain Fee</span>
                        </button>
                      </div>

                      {/* Indian Tourist Price Slider on Booking Card */}
                      {isClientFromIndia && assignedGuide && (
                        <div className="mb-4">
                          <button
                            type="button"
                            onClick={() => setExpandedBookingSliderId(expandedBookingSliderId === bk.id ? null : bk.id)}
                            className="w-full text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100/80 border border-amber-300 rounded-lg py-1.5 px-3 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-xs">🇮🇳</span>
                              <Sliders className="w-3.5 h-3.5 text-amber-700" />
                              <span>Live Price Slider ({bk.currency} & ₹ INR)</span>
                            </span>
                            <span className="text-[10px] text-amber-800 underline font-semibold">
                              {expandedBookingSliderId === bk.id ? 'Close Slider' : 'Slide Hours & Calculate'}
                            </span>
                          </button>

                          {expandedBookingSliderId === bk.id && (
                            <div className="pt-2">
                              <IndianClientPriceSlider
                                guideName={assignedGuide.fullName}
                                baseHourlyRate={assignedGuide.baseHourlyRate}
                                visitingCurrency={bk.currency}
                                visitingCountry={bk.destinationCity}
                                compact={true}
                                initialHours={bk.durationHours || 4}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions Row */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                        <button
                          onClick={() => onOpenChat(bk)}
                          className="font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat with Guide</span>
                        </button>

                        {bk.bookingStatus === 'CONFIRMED' && (
                          <button
                            onClick={() => handleCompleteTour(bk.id)}
                            className="px-3 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          >
                            Mark Tour Finished
                          </button>
                        )}

                        {bk.bookingStatus === 'COMPLETED' && !bk.reviewSubmitted && (
                          <button
                            onClick={() => setReviewModalBooking(bk)}
                            className="px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded flex items-center gap-1 transition-colors"
                          >
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>Leave Review</span>
                          </button>
                        )}

                        {bk.bookingStatus === 'COMPLETED' && bk.reviewSubmitted && (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Review Submitted</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: EXPLORE VERIFIED GUIDES & PORTFOLIOS */}
      {activeClientTab === 'explore_guides' && (
        <div className="space-y-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Explore Verified Multilingual Guides</h2>
              <p className="text-xs text-slate-500">
                View guides' verified credentials, mobile contact info, experience, and past tour portfolios
              </p>
            </div>

            {/* City Filters */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {['ALL', 'Mumbai', 'Pune', 'Kyoto', 'Rome', 'Paris'].map(city => (
                <button
                  key={city}
                  onClick={() => setGuideFilterCity(city)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    guideFilterCity === city
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {city === 'ALL' ? 'All Destinations' : city}
                </button>
              ))}
            </div>
          </div>

          {/* Guides Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides
              .filter(g => guideFilterCity === 'ALL' || g.serviceAreas.some(a => a.toLowerCase().includes(guideFilterCity.toLowerCase())) || g.country.toLowerCase().includes(guideFilterCity.toLowerCase()))
              .map(g => {
                const gReviews = reviews.filter(r => r.guideId === g.id);
                const featuredPortfolio = g.portfolio && g.portfolio[0];

                return (
                  <div
                    key={g.id}
                    className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Portfolio Photo Banner */}
                      <div className="h-40 w-full bg-slate-900 relative overflow-hidden">
                        <img
                          src={featuredPortfolio?.imageUrl || g.profilePhoto}
                          alt={g.fullName}
                          className="w-full h-full object-cover opacity-90"
                          onError={e => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />

                        <div className="absolute top-3 left-3 flex items-center gap-1 bg-black/60 backdrop-blur-xs text-white text-[11px] px-2.5 py-0.5 rounded-full font-mono">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          <span>{g.serviceAreas[0] || g.country}</span>
                        </div>

                        <div className="absolute top-3 right-3 bg-amber-400/90 text-slate-950 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                          <Star className="w-3 h-3 fill-slate-950 text-slate-950" />
                          <span>{g.rating.toFixed(2)}</span>
                          <span className="text-[10px] opacity-75">({gReviews.length || g.reviewCount})</span>
                        </div>

                        {/* Guide Avatar & Name Overlay */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                          <img
                            src={g.profilePhoto}
                            alt={g.fullName}
                            className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md shrink-0"
                          />
                          <div className="text-white min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-extrabold truncate">{g.fullName}</h3>
                              {g.isVerified && (
                                <span title="Verified Docent">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-300">
                              <span className="text-emerald-300 font-bold">{g.guideId}</span>
                              <span>·</span>
                              <span>@{g.username}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-4 space-y-3">
                        {/* Mobile Number & Direct Contact info */}
                        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Phone className="w-3.5 h-3.5 text-emerald-700" />
                            <span className="text-slate-500 font-medium">Mobile:</span>
                            <span className="font-mono font-bold text-slate-900">{g.phone}</span>
                          </div>

                          <a
                            href={buildWhatsAppLink(g.phone, `Hi ${g.fullName}! I saw your guide profile on GuideConnect.`)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline flex items-center gap-0.5"
                          >
                            <span>WhatsApp</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>

                        {/* Experience & Languages */}
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Experience:</span>
                            <span className="font-bold text-slate-800">{g.yearsOfExperience} Years Professional</span>
                          </div>

                          <div className="flex items-center justify-between">
                            <span className="text-slate-400 font-medium">Languages:</span>
                            <span className="font-medium text-slate-800 truncate max-w-[180px]">
                              {g.languages.map(l => l.language).join(', ')}
                            </span>
                          </div>

                          {isClientFromIndia ? (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-300/80 rounded-xl p-2.5 space-y-1.5 shadow-2xs">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600 font-medium">Visiting Currency ({g.currency}):</span>
                                <span className="font-mono font-bold text-slate-900">
                                  {formatCurrency(g.baseHourlyRate, g.currency)}/hr
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-xs pt-1 border-t border-amber-200">
                                <span className="text-amber-950 font-bold flex items-center gap-1">
                                  <span className="text-xs">🇮🇳</span>
                                  <span>Client Rate (₹ INR):</span>
                                </span>
                                <span className="font-mono font-black text-amber-900">
                                  ₹{convertCurrencyToINR(g.baseHourlyRate, g.currency).toLocaleString()}/hr
                                </span>
                              </div>

                              {/* Compact Slider Toggle */}
                              <button
                                type="button"
                                onClick={() => setExpandedCardSliderGuideId(expandedCardSliderGuideId === g.id ? null : g.id)}
                                className="w-full mt-1 text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-lg py-1 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Sliders className="w-3 h-3 text-emerald-600" />
                                <span>{expandedCardSliderGuideId === g.id ? 'Hide Price Slider' : `Slide Price in ₹ INR (${g.currency})`}</span>
                              </button>

                              {expandedCardSliderGuideId === g.id && (
                                <div className="pt-1.5">
                                  <IndianClientPriceSlider
                                    guideName={g.fullName}
                                    baseHourlyRate={g.baseHourlyRate}
                                    visitingCurrency={g.currency}
                                    visitingCountry={g.country}
                                    compact={true}
                                    initialHours={4}
                                  />
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-400 font-medium">Hourly Rate:</span>
                              <span className="font-mono font-bold text-emerald-800">
                                {formatCurrency(g.baseHourlyRate, g.currency)}/hr
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Featured Portfolio Preview */}
                        {featuredPortfolio && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              Featured Tour
                            </span>
                            <p className="text-xs font-semibold text-slate-900 truncate">
                              {featuredPortfolio.title}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {featuredPortfolio.description}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="p-4 pt-0 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedGuideForProfile(g)}
                        className="flex-1 px-3 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>View Portfolio</span>
                      </button>

                      <button
                        onClick={() => handleRequestWithGuide(g)}
                        className="flex-1 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-1 shadow-2xs"
                      >
                        <span>Book Guide</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: WHATSAPP & GMAIL NOTIFICATIONS LOG */}
      {activeClientTab === 'notifications' && (
        <div className="space-y-6 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">WhatsApp & Gmail Tour Notification Log</h2>
              <p className="text-xs text-slate-500">
                Official booking confirmations dispatched to {client.fullName} ({client.phone} / {client.email})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const matched = REAL_WORLD_CONTACTS.find(c => c.name.toLowerCase() === client.fullName.toLowerCase()) || REAL_WORLD_CONTACTS[0];
                  setActiveRealContactForModal(matched);
                  setIsRealNotificationModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Open Real-World Dispatcher</span>
              </button>
              <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                {clientNotifications.length} Dispatched Alerts
              </span>
            </div>
          </div>

          {/* Verified Real-World Contacts Dispatch Strip */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-400">
                    Verified Real Recipients
                  </span>
                  <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
                    Real WhatsApp & Gmail Enabled
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Send live real notifications directly to these verified tourist emails and WhatsApp mobile numbers:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
              {REAL_WORLD_CONTACTS.map(contact => (
                <div
                  key={contact.email}
                  className="bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl p-3 flex flex-col justify-between transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-white block">{contact.name}</span>
                      <span className="text-[11px] text-slate-300 block truncate">{contact.email}</span>
                      <span className="text-[10px] font-mono text-emerald-300 font-bold block">{contact.phone}</span>
                    </div>
                    <span className="text-xs" role="img" aria-label="India flag">🇮🇳</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <a
                      href={getWhatsAppDirectLink(contact.cleanPhone, `Hello ${contact.name}! 🔔 Your GuideConnect tour reservation has been processed with verified licensed guides.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1 px-2 text-[11px] font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg flex items-center justify-center gap-1 transition-colors"
                      title="Open WhatsApp message"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveRealContactForModal(contact);
                        setIsRealNotificationModalOpen(true);
                      }}
                      className="flex-1 py-1 px-2 text-[11px] font-bold bg-indigo-500/80 hover:bg-indigo-500 text-white rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer"
                      title="Send free email and view compose options"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Free Email</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {clientNotifications.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center">
              <Bell className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-slate-700">No Notifications Yet</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Once a guide accepts your tour request, automatic notification alerts are logged here with direct WhatsApp & Gmail links.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientNotifications.map(notif => (
                <div
                  key={notif.id}
                  className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold font-mono px-2.5 py-0.5 rounded uppercase flex items-center gap-1 ${
                        notif.channel === 'WHATSAPP'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : notif.channel === 'GMAIL'
                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                          : 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                      }`}>
                        {notif.channel === 'WHATSAPP' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                        {notif.channel === 'GMAIL' && <Mail className="w-3 h-3 text-rose-600" />}
                        <span>{notif.channel}</span>
                      </span>

                      <span className="text-xs font-mono text-slate-400">
                        {new Date(notif.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      Ref: {notif.referenceId}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">
                    {notif.title}
                  </h3>

                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-3 rounded-lg border border-slate-100 font-sans">
                    {notif.message}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-3">
                      {notif.externalLink && (
                        <a
                          href={notif.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-colors ${
                            notif.channel === 'WHATSAPP'
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-2xs'
                          }`}
                        >
                          {notif.channel === 'WHATSAPP' && <span>Open in WhatsApp Web / App</span>}
                          {notif.channel === 'GMAIL' && <span>Open in Gmail Compose</span>}
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}

                      {notif.details?.guideCode && (
                        <button
                          onClick={() => {
                            const gd = guides.find(g => g.guideId === notif.details?.guideCode || g.id === notif.details?.guideCode);
                            if (gd) setSelectedGuideForProfile(gd);
                          }}
                          className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span>View {notif.details?.guideName}'s Portfolio</span>
                        </button>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-500 font-mono">
                      Sent to: {notif.recipientPhone || notif.recipientEmail}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VERY DOWNSIDE (BOTTOM): DANGER ZONE & ACCOUNT DELETION
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
                Permanently delete the account for <strong className="text-slate-900 font-semibold">{client.fullName}</strong> ({client.id}). 
                This will delete profile photo, mobile details, cancel active tour requests, and remove this account from GuideConnect.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-500" />
              <span>Edit Account Info</span>
            </button>

            <button
              onClick={() => setIsDeleteDialogOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-sm flex items-center gap-2 cursor-pointer hover:shadow-md"
              title="Permanently delete this tourist account"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>
          </div>
        </div>
      </div>

      {/* CREATE REQUEST MODAL */}
      {isCreatingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-emerald-600" />
                  <span>Create Tour Request</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Broadcasts to eligible guides who match your language and schedule.
                </p>
              </div>
              <button
                onClick={() => setIsCreatingRequest(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequestSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {createdMatchCount !== null && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Request saved! Found {createdMatchCount} eligible guides who received invitations.</span>
                </div>
              )}

              {/* Destination Country & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Destination Country *</label>
                  <select
                    value={destinationCountry}
                    onChange={e => handleCountryChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="India">India</option>
                    <option value="Japan">Japan</option>
                    <option value="Italy">Italy</option>
                    <option value="France">France</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Destination City *</label>
                  <input
                    type="text"
                    required
                    value={destinationCity}
                    onChange={e => setDestinationCity(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Language & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Preferred Guide Language *</label>
                  <select
                    value={preferredLanguage}
                    onChange={e => setPreferredLanguage(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="English">English</option>
                    <option value="Hindi">Hindi (हिंदी)</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Japanese">Japanese</option>
                    <option value="Italian">Italian</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Travel Date *</label>
                  <input
                    type="date"
                    required
                    value={travelDate}
                    onChange={e => setTravelDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Time Interval & Tourists */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => handleStartTimeChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => handleEndTimeChange(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Number of Tourists *</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    required
                    value={numberOfTourists}
                    onChange={e => setNumberOfTourists(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              {/* Tour Type & Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Tour Type *</label>
                  <select
                    value={tourType}
                    onChange={e => setTourType(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  >
                    <option value="Historical">Historical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Food Tour">Food Tour</option>
                    <option value="Sightseeing">Sightseeing</option>
                    <option value="Custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Specialization Focus</label>
                  <input
                    type="text"
                    value={preferredSpecialization}
                    onChange={e => setPreferredSpecialization(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              {/* Budget & Meeting Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Approximate Budget ({currency}) *
                    </label>
                    {isClientFromIndia && currency !== 'INR' && (
                      <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                        ≈ ₹{convertCurrencyToINR(approximateBudget, currency).toLocaleString()} INR
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={approximateBudget}
                    onChange={e => setApproximateBudget(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded font-mono"
                  />
                  {isClientFromIndia && currency !== 'INR' && (
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>FX: 1 {currency} ≈ ₹{FX_RATES_TO_INR[currency] || 1} INR</span>
                      <span className="text-amber-900 font-bold">In INR: ₹{convertCurrencyToINR(approximateBudget, currency).toLocaleString()}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Meeting Location *</label>
                  <input
                    type="text"
                    required
                    value={meetingLocation}
                    onChange={e => setMeetingLocation(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>
              </div>

              {/* Indian Tourist Dual-Currency Price Slider inside Request Modal */}
              {isClientFromIndia && (
                <div className="bg-gradient-to-r from-amber-50/90 via-white to-emerald-50/90 border border-amber-300 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                    <span className="flex items-center gap-1.5">
                      <span className="text-sm">🇮🇳</span>
                      <span className="uppercase tracking-wider">Indian Tourist Live Price Slider</span>
                    </span>
                    <span className="font-mono text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded text-[10px]">
                      1 {currency} ≈ ₹{FX_RATES_TO_INR[currency] || 1} INR
                    </span>
                  </div>
                  <IndianClientPriceSlider
                    baseHourlyRate={Math.round(approximateBudget / (durationHours || 4)) || (currency === 'INR' ? 650 : 35)}
                    visitingCurrency={currency}
                    visitingCountry={destinationCountry}
                    compact={true}
                    initialHours={durationHours}
                    onDurationChange={(hrs, totalVisiting) => {
                      setDurationHours(hrs);
                      setApproximateBudget(totalVisiting);
                    }}
                  />
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Special Instructions / Needs</label>
                <textarea
                  rows={2}
                  value={specialInstructions}
                  onChange={e => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Traveling with elderly parents, need gentle walking pace..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreatingRequest(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <span>Submit Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REVIEW SUBMISSION MODAL */}
      {reviewModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md p-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Rate Your Tour Experience
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Guide: <span className="font-semibold text-slate-800">@{reviewModalBooking.guideUsername}</span> ({reviewModalBooking.guideCode})
            </p>

            <form onSubmit={handleSubmitReviewForm} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Star Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-amber-500"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= reviewRating ? 'fill-amber-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{reviewRating} Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Your Review</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details about guide punctuality, language fluency, local insights..."
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReviewModalBooking(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded"
                >
                  Submit Review
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Guide Full Information & Portfolio Modal */}
      <GuideProfileModal
        guide={selectedGuideForProfile}
        isOpen={!!selectedGuideForProfile}
        onClose={() => {
          setSelectedGuideForProfile(null);
          setSelectedBookingForGuideContext(null);
        }}
        bookingContext={selectedBookingForGuideContext}
        reviews={reviews}
        clientNationality={client.nationality}
        onStartChat={g => {
          if (selectedBookingForGuideContext) {
            onOpenChat(selectedBookingForGuideContext);
          }
        }}
      />

      {/* EDIT TOURIST PROFILE MODAL */}
      <EditClientProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        client={client}
        onSaved={updated => {
          onRefresh();
          if (onSelectClient) onSelectClient(updated);
        }}
      />

      {/* DELETE ACCOUNT CONFIRMATION MODAL */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  Delete Tourist Account?
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-slate-800">{client.fullName}</strong>'s account? 
                  All profile details, preferences, and active tour requests will be removed from GuideConnect.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-left text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Tourist Name:</span>
                  <span className="font-bold text-slate-900">{client.fullName}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Account ID:</span>
                  <span className="font-mono font-bold text-slate-900">{client.id}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Mobile:</span>
                  <span className="font-mono font-bold text-slate-900">{client.phone}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Email:</span>
                  <span className="font-mono text-slate-700">{client.email}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel, Keep Account
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
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

      {/* Real-World WhatsApp & Gmail Dispatch Modal */}
      <RealWorldNotificationModal
        isOpen={isRealNotificationModalOpen}
        onClose={() => setIsRealNotificationModalOpen(false)}
        defaultRecipient={activeRealContactForModal}
      />
    </div>
  );
};

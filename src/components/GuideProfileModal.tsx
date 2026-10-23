import React, { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Star,
  Award,
  Languages,
  CheckCircle2,
  ShieldCheck,
  Briefcase,
  Sparkles,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  ChevronRight,
  Compass
} from 'lucide-react';
import { GuideProfile, Booking, Review } from '../types';
import { buildWhatsAppLink, buildGmailLink } from '../services/store';
import { formatCurrency, convertCurrencyToINR, FX_RATES_TO_INR } from '../services/pricingEngine';
import { IndianClientPriceSlider } from './IndianClientPriceSlider';

interface GuideProfileModalProps {
  guide: GuideProfile | null;
  isOpen: boolean;
  onClose: () => void;
  bookingContext?: Booking | null;
  reviews?: Review[];
  clientNationality?: string;
  onStartChat?: (guide: GuideProfile) => void;
  onBookGuide?: (guide: GuideProfile) => void;
}

export const GuideProfileModal: React.FC<GuideProfileModalProps> = ({
  guide,
  isOpen,
  onClose,
  bookingContext,
  reviews = [],
  clientNationality = 'India',
  onStartChat,
  onBookGuide
}) => {
  const [activeTab, setActiveTab] = useState<'portfolio' | 'pricing_slider' | 'experience' | 'reviews' | 'contact'>('portfolio');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  if (!isOpen || !guide) return null;

  const guideReviews = reviews.filter(r => r.guideId === guide.id);
  const portfolioItems = guide.portfolio || [];

  const handleCopyPhone = () => {
    navigator.clipboard?.writeText(guide.phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard?.writeText(guide.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const waGreeting = `Hello ${guide.fullName}! I found your profile on GuideConnect (${guide.guideId}) and would like to inquire about booking a tour in ${guide.serviceAreas[0] || guide.country}.`;
  const waUrl = buildWhatsAppLink(guide.phone, waGreeting);
  const emailSubject = `Tour Inquiry via GuideConnect for ${guide.fullName} [${guide.guideId}]`;
  const emailBody = `Dear ${guide.fullName},\n\nI am contacting you through GuideConnect regarding private tour availability in ${guide.country}.\n\nPlease let me know your schedule.\n\nBest regards,`;
  const gmailUrl = buildGmailLink(guide.email, emailSubject, emailBody);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Cover Backdrop & Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 hover:bg-black/60 text-slate-200 hover:text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative shrink-0">
              <img
                src={guide.profilePhoto}
                alt={guide.fullName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-3 border-emerald-400/80 shadow-lg"
              />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-slate-900 rounded-full flex items-center justify-center" title="Online / Active Docent">
                <span className="w-2 h-2 bg-white rounded-full animate-ping" />
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2 py-0.5 rounded">
                  {guide.guideId}
                </span>
                <span className="text-xs font-semibold text-slate-300">
                  @{guide.username}
                </span>
                {guide.isVerified ? (
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Verified Licensed Docent</span>
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>Verification Under Review</span>
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {guide.fullName}
              </h2>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-2">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{guide.country} · {guide.serviceAreas.slice(0, 2).join(', ')}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1 text-amber-300 font-semibold font-mono">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{guide.rating.toFixed(2)}</span>
                  <span className="text-slate-400 font-normal">({guideReviews.length || guide.reviewCount} reviews)</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{guide.yearsOfExperience} Years Experience</span>
                </span>
              </div>
            </div>

            {/* Quick Action Buttons on Header */}
            <div className="flex flex-wrap sm:flex-col gap-2 shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.02]"
              >
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <span>WhatsApp Guide</span>
              </a>

              <a
                href={`tel:${guide.phone.replace(/[^0-9+]/g, '')}`}
                className="flex-1 sm:flex-none px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-medium text-xs rounded-xl flex items-center justify-center gap-2 border border-white/20 transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-300" />
                <span>Call Mobile</span>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Strip Banner */}
        <div className="bg-emerald-50 border-y border-emerald-200 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex flex-wrap items-center gap-5">
            {/* Mobile No. */}
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-slate-500 font-medium">Mobile No:</span>
              <span className="font-mono font-bold text-slate-900">{guide.phone}</span>
              <button
                onClick={handleCopyPhone}
                className="p-1 hover:bg-emerald-100 rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Copy Mobile Number"
              >
                {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-slate-500 font-medium">Email:</span>
              <span className="font-mono font-medium text-slate-900 truncate max-w-[200px]">{guide.email}</span>
              <button
                onClick={handleCopyEmail}
                className="p-1 hover:bg-emerald-100 rounded text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Copy Email"
              >
                {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {guide.currency !== 'INR' ? (
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
              <div className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-800">
                <span className="text-slate-400 mr-1">Visiting Rate:</span>
                <span className="font-bold">{formatCurrency(guide.baseHourlyRate, guide.currency)}/hr</span>
              </div>
              <div className="bg-gradient-to-r from-amber-100 to-orange-100 px-2.5 py-1 rounded-md border border-amber-300 text-amber-950 font-bold shadow-2xs flex items-center gap-1">
                <span>🇮🇳</span>
                <span className="text-amber-800 font-medium">In INR:</span>
                <span className="font-black">₹{convertCurrencyToINR(guide.baseHourlyRate, guide.currency).toLocaleString()}/hr</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-900 bg-white px-2.5 py-1 rounded-md border border-emerald-200">
              <span>Rate:</span>
              <span className="font-bold">{formatCurrency(guide.baseHourlyRate, guide.currency)}/hr</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 shrink-0 gap-6 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'portfolio'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Tour Portfolio ({portfolioItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pricing_slider')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'pricing_slider'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="text-xs">🇮🇳</span>
            <span>Price Slider (₹ INR & {guide.currency})</span>
          </button>

          <button
            onClick={() => setActiveTab('experience')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'experience'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Experience & Credentials</span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'reviews'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>Traveler Reviews ({guideReviews.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`py-3.5 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === 'contact'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Direct WhatsApp & Call</span>
          </button>
        </div>

        {/* Scrollable Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: TOUR PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Compass className="w-4 h-4 text-emerald-600" />
                  <span>Featured Past Tours & Excursion Portfolio</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Hand-crafted private walking itineraries and docent tours guided by @{guide.username}
                </p>
              </div>

              {portfolioItems.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-xl">
                  <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">No portfolio tours uploaded yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {portfolioItems.map(item => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
                    >
                      <div className="h-44 w-full bg-slate-100 relative overflow-hidden group">
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => {
                            // Fallback if local image not found
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=600&q=80';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                          <span className="flex items-center gap-1 font-mono font-medium bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                            <Clock className="w-3 h-3 text-emerald-400" />
                            <span>{item.duration}</span>
                          </span>
                          <span className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs text-[11px]">
                            <MapPin className="w-3 h-3 text-emerald-400" />
                            <span>{item.location}</span>
                          </span>
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-xs text-slate-600 mt-1 line-clamp-3 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Highlights Chips */}
                        {item.highlights && item.highlights.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              Tour Highlights
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {item.highlights.map((h, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono"
                                >
                                  ✓ {h}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRICING & LIVE DUAL-CURRENCY SLIDER */}
          {activeTab === 'pricing_slider' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl" role="img" aria-label="India flag">🇮🇳</span>
                  <div>
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                      Dual-Currency Price Calculator & Duration Slider
                    </h4>
                    <p className="text-xs text-amber-800">
                      Comparing charges in visiting country currency ({guide.currency}) vs. client home currency (Indian Rupee ₹ INR)
                    </p>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-2xs self-start sm:self-auto">
                  1 {guide.currency} ≈ ₹{FX_RATES_TO_INR[guide.currency] || 1} INR
                </div>
              </div>

              <IndianClientPriceSlider
                guideName={guide.fullName}
                baseHourlyRate={guide.baseHourlyRate}
                visitingCurrency={guide.currency}
                visitingCountry={guide.country}
                compact={false}
                initialHours={4}
              />
            </div>
          )}

          {/* TAB 3: EXPERIENCE & CREDENTIALS */}
          {activeTab === 'experience' && (
            <div className="space-y-6">
              {/* Bio & Story */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>About the Guide</span>
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {guide.bio}
                </p>
              </div>

              {/* Languages Spoken */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Languages className="w-4 h-4 text-emerald-600" />
                  <span>Languages & Fluency</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {guide.languages.map((l, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-slate-900">{l.language}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                        l.proficiency === 'NATIVE' ? 'bg-emerald-100 text-emerald-800' :
                        l.proficiency === 'FLUENT' ? 'bg-indigo-100 text-indigo-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {l.proficiency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Qualifications & Accreditations */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Official Accreditations & Licenses</span>
                </h4>
                <div className="space-y-2">
                  {guide.qualifications.map((q, i) => (
                    <div
                      key={i}
                      className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center gap-3 text-xs text-emerald-950 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tour Specializations */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Tour Specializations & Expertise</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {guide.specializations.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-lg font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Service Areas */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span>Service Areas & Covered Locations</span>
                </h4>
                <div className="flex flex-wrap gap-2">
                  {guide.serviceAreas.map((area, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-md font-mono"
                    >
                      📍 {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: REVIEWS & TESTIMONIALS */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* Summary Scorecard */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-400 flex flex-col items-center justify-center font-mono">
                    <span className="text-2xl font-black text-amber-700">{guide.rating.toFixed(1)}</span>
                    <span className="text-[10px] text-amber-600">/ 5.0</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(guide.rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs font-medium text-slate-600 mt-1">
                      Based on {guideReviews.length} traveler reviews on GuideConnect
                    </p>
                  </div>
                </div>

                <div className="text-xs text-slate-500 font-mono">
                  <span>100% Verified Bookings</span>
                </div>
              </div>

              {/* Reviews List */}
              {guideReviews.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-xl">
                  <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">No reviews recorded yet for this guide.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {guideReviews.map(r => (
                    <div
                      key={r.id}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{r.clientName}</span>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {r.clientNationality}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-amber-600 font-mono text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{r.rating.toFixed(1)}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 italic">
                        "{r.comment}"
                      </p>

                      <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                        <span>Tour Booking ID: {r.bookingId}</span>
                        <span>{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DIRECT WHATSAPP & CALL */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-700" />
                  <span>Direct Communication Channels</span>
                </h4>
                <p className="text-xs text-emerald-800">
                  Connect immediately with {guide.fullName} via WhatsApp, cellular phone, or direct Gmail email.
                </p>
              </div>

              {/* WhatsApp Card */}
              <div className="bg-white border border-emerald-300 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <h5 className="text-sm font-bold text-slate-900">WhatsApp Messenger</h5>
                  </div>
                  <p className="text-xs text-slate-600">
                    Send real-time instant messages, voice notes, and meeting location coordinates.
                  </p>
                  <p className="text-xs font-mono font-bold text-emerald-800 pt-1">
                    {guide.phone}
                  </p>
                </div>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open WhatsApp Web / App</span>
                </a>
              </div>

              {/* Direct Phone Call Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-indigo-600" />
                    <h5 className="text-sm font-bold text-slate-900">Direct Cellular Call</h5>
                  </div>
                  <p className="text-xs text-slate-600">
                    Reach out for urgent itinerary updates or flight arrival coordination.
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-900 pt-1">
                    {guide.phone}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPhone}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    {copiedPhone ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                  </button>

                  <a
                    href={`tel:${guide.phone.replace(/[^0-9+]/g, '')}`}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Now</span>
                  </a>
                </div>
              </div>

              {/* Gmail / Email Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-rose-600" />
                    <h5 className="text-sm font-bold text-slate-900">Gmail / Email Correspondence</h5>
                  </div>
                  <p className="text-xs text-slate-600">
                    Official itineraries, ticket attachments, and formal reservation queries.
                  </p>
                  <p className="text-xs font-mono font-bold text-slate-900 pt-1">
                    {guide.email}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyEmail}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>

                  <a
                    href={gmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs transition-colors whitespace-nowrap"
                  >
                    <Mail className="w-4 h-4" />
                    <span>Open in Gmail</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
            <span>Guide ID: <strong className="text-slate-800">{guide.guideId}</strong></span>
            <span>·</span>
            <span>@{guide.username}</span>
          </div>

          <div className="flex items-center gap-3">
            {onStartChat && bookingContext && (
              <button
                onClick={() => {
                  onClose();
                  onStartChat(guide);
                }}
                className="px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Tour Chat</span>
              </button>
            )}

            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <span>Chat on WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

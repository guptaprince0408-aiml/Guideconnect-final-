import React, { useState } from 'react';
import { X, DollarSign, Check, XCircle, Clock, ArrowRight, ShieldCheck, Lock, Sliders, ArrowRightLeft } from 'lucide-react';
import { Booking, NegotiationOffer, UserRole } from '../types';
import { submitNegotiationOffer, acceptNegotiationOffer, rejectNegotiationOffer } from '../services/store';
import { formatCurrency, convertCurrencyToINR, FX_RATES_TO_INR } from '../services/pricingEngine';

interface NegotiationModalProps {
  booking: Booking | null;
  offers: NegotiationOffer[];
  currentUserRole: 'CLIENT' | 'GUIDE';
  currentUserId: string;
  currentUserName: string;
  clientNationality?: string;
  isOpen: boolean;
  onClose: () => void;
  onOfferUpdated: () => void;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  booking,
  offers,
  currentUserRole,
  currentUserId,
  currentUserName,
  clientNationality = 'India',
  isOpen,
  onClose,
  onOfferUpdated
}) => {
  if (!isOpen || !booking) return null;

  const isClientFromIndia = (clientNationality || '').toLowerCase().includes('india') ||
    currentUserRole === 'CLIENT';
  const isForeign = booking.currency !== 'INR';
  const fxRate = FX_RATES_TO_INR[booking.currency.toUpperCase()] || 1;

  const [sliderDuration, setSliderDuration] = useState<number>(booking.durationHours || 4);
  const [showSlider, setShowSlider] = useState<boolean>(false);

  const bookingOffers = offers
    .filter(o => o.bookingId === booking.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const latestOffer = bookingOffers[bookingOffers.length - 1];
  const isAgreed = booking.negotiationStatus === 'AGREED' && booking.agreedPrice !== null;

  const [proposedAmount, setProposedAmount] = useState<number>(
    latestOffer ? latestOffer.proposedAmount : Math.round((booking.estimatedPriceMin + booking.estimatedPriceMax) / 2)
  );
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const canAcceptOrRejectLatest =
    latestOffer &&
    latestOffer.status === 'PENDING' &&
    latestOffer.senderRole !== currentUserRole &&
    !isAgreed;

  const handleProposeCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedAmount || proposedAmount <= 0) return;
    setIsSubmitting(true);
    try {
      submitNegotiationOffer({
        bookingId: booking.id,
        requestId: booking.requestId,
        senderRole: currentUserRole,
        senderId: currentUserId,
        senderName: currentUserName,
        proposedAmount: Number(proposedAmount),
        currency: booking.currency,
        note: note || undefined
      });
      setNote('');
      onOfferUpdated();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptLatest = () => {
    if (!latestOffer) return;
    acceptNegotiationOffer(latestOffer.id);
    onOfferUpdated();
  };

  const handleRejectLatest = () => {
    if (!latestOffer) return;
    rejectNegotiationOffer(latestOffer.id);
    onOfferUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <span>Transparent Price Bargaining</span>
            </h3>
            <div className="text-xs text-slate-500 mt-0.5">
              Booking: <span className="font-mono font-medium text-slate-800">{booking.id}</span> · {booking.destinationCity} ({booking.durationHours} hrs)
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Indicative Range Baseline */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-500 flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-700">Platform Indicative Rate Model:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                  {formatCurrency(booking.estimatedPriceMin, booking.currency)} – {formatCurrency(booking.estimatedPriceMax, booking.currency)}
                </span>
                {isClientFromIndia && isForeign && (
                  <span className="font-mono font-extrabold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300">
                    ≈ ₹{convertCurrencyToINR(booking.estimatedPriceMin, booking.currency).toLocaleString()} – ₹{convertCurrencyToINR(booking.estimatedPriceMax, booking.currency).toLocaleString()} INR
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Calculated based on {booking.destinationCity} base rates, {booking.durationHours}h tour duration, and {booking.numberOfTourists} travelers. Non-binding guide estimate.
            </p>

            {/* Indian Client Currency Converter & Slider Toggle */}
            {isClientFromIndia && isForeign && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] font-mono text-emerald-800 flex items-center gap-1 font-semibold">
                  <span>🇮🇳</span>
                  <span>FX: 1 {booking.currency} ≈ ₹{fxRate} INR</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowSlider(!showSlider)}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Sliders className="w-3 h-3 text-amber-700" />
                  <span>{showSlider ? 'Hide Slider' : 'Open Price Slider (₹ INR)'}</span>
                </button>
              </div>
            )}

            {/* Interactive Slider in Negotiation Modal */}
            {showSlider && isClientFromIndia && (
              <div className="bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/80 border border-amber-300 rounded-xl p-3.5 space-y-2 mt-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Adjust Tour Duration ({sliderDuration} Hours):</span>
                  </span>
                  <span className="font-mono text-xs font-black text-amber-900">
                    {sliderDuration}h = {formatCurrency(Math.round(sliderDuration * (proposedAmount / (booking.durationHours || 4))), booking.currency)} ≈ ₹{Math.round(sliderDuration * (proposedAmount / (booking.durationHours || 4)) * fxRate).toLocaleString()} INR
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={sliderDuration}
                  onChange={e => setSliderDuration(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>1 hr</span>
                  <span>4 hrs (Half Day)</span>
                  <span>8 hrs (Full Day)</span>
                  <span>10 hrs</span>
                </div>
              </div>
            )}
          </div>

          {/* Agreed Status Banner */}
          {isAgreed ? (
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-sm mb-1">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>
                  Final Fee Agreed & Locked: {formatCurrency(booking.agreedPrice!, booking.currency)}
                  {isClientFromIndia && isForeign && (
                    <span className="ml-2 font-mono text-xs text-amber-900 font-black">
                      (≈ ₹{convertCurrencyToINR(booking.agreedPrice!, booking.currency).toLocaleString()} INR)
                    </span>
                  )}
                </span>
              </div>
              <p className="text-xs text-emerald-700">
                Both tourist and guide consented to this amount. Changes require mutual re-negotiation.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Negotiation in progress. You are participating as <strong className="uppercase">{currentUserRole}</strong> ({currentUserName}).
              </span>
            </div>
          )}

          {/* Offer Timeline */}
          <div>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">
              Offer & Counteroffer History ({bookingOffers.length})
            </h4>

            {bookingOffers.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded text-center">
                No offers made yet. You can submit the initial proposed fee below.
              </p>
            ) : (
              <div className="space-y-3">
                {bookingOffers.map(offer => {
                  const isMine = offer.senderRole === currentUserRole;
                  return (
                    <div
                      key={offer.id}
                      className={`p-3.5 rounded-lg border text-xs ${
                        offer.status === 'ACCEPTED'
                          ? 'bg-emerald-50 border-emerald-300'
                          : offer.status === 'REJECTED'
                          ? 'bg-rose-50 border-rose-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-slate-800">
                          {offer.senderName} ({offer.senderRole})
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <div className="text-right">
                            <span className="font-bold text-slate-900 text-sm block">
                              {formatCurrency(offer.proposedAmount, offer.currency)}
                            </span>
                            {isClientFromIndia && isForeign && (
                              <span className="text-[10px] text-amber-900 font-bold block">
                                ≈ ₹{convertCurrencyToINR(offer.proposedAmount, offer.currency).toLocaleString()} INR
                              </span>
                            )}
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                            offer.status === 'ACCEPTED' ? 'bg-emerald-200 text-emerald-800' :
                            offer.status === 'REJECTED' ? 'bg-rose-200 text-rose-800' :
                            offer.status === 'SUPERSEDED' ? 'bg-slate-200 text-slate-600' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {offer.status}
                          </span>
                        </div>
                      </div>
                      {offer.note && (
                        <p className="text-slate-600 italic mt-1 bg-slate-50/80 p-1.5 rounded">
                          "{offer.note}"
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {new Date(offer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action on Latest Incoming Offer */}
          {canAcceptOrRejectLatest && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="text-xs font-semibold text-indigo-900 mb-1">
                Incoming Offer from {latestOffer.senderName}:
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-lg font-bold font-mono text-indigo-950">
                  {formatCurrency(latestOffer.proposedAmount, latestOffer.currency)}
                </span>
                {isClientFromIndia && isForeign && (
                  <span className="text-xs font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                    ≈ ₹{convertCurrencyToINR(latestOffer.proposedAmount, latestOffer.currency).toLocaleString()} INR
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleAcceptLatest}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Accept & Confirm {formatCurrency(latestOffer.proposedAmount, latestOffer.currency)}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRejectLatest}
                  className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          )}

          {/* Propose Counteroffer Form */}
          {!isAgreed && (
            <form onSubmit={handleProposeCounterOffer} className="pt-4 border-t border-slate-200">
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider mb-2">
                {bookingOffers.length === 0 ? 'Propose Initial Fee' : 'Make a Counteroffer'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs text-slate-600 font-medium">Proposed Amount ({booking.currency})</label>
                    {isClientFromIndia && isForeign && (
                      <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        ≈ ₹{convertCurrencyToINR(proposedAmount, booking.currency).toLocaleString()} INR
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={proposedAmount}
                    onChange={e => setProposedAmount(Number(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Optional Note / Justification</label>
                  <input
                    type="text"
                    placeholder="e.g. Includes heritage museum pass"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Submit Offer</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, UserPlus, Sparkles, CheckCircle2, Phone, Mail, Globe, Languages, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { registerClient } from '../services/store';
import { ClientProfile } from '../types';

interface ClientRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistered: (newClient: ClientProfile) => void;
}

const PRESET_AVATARS = [
  { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 5', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 6', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80' },
];

export const ClientRegistrationModal: React.FC<ClientRegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistered
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [nationality, setNationality] = useState('India');
  const [preferredLanguage, setPreferredLanguage] = useState('Marathi');
  const [selectedPhoto, setSelectedPhoto] = useState(PRESET_AVATARS[0].url);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [useCustomPhoto, setUseCustomPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!fullName.trim() || fullName.trim().length < 2) {
        throw new Error('Please enter a valid full name.');
      }
      if (!email.trim() || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      if (!phone.trim() || phone.trim().length < 8) {
        throw new Error('Please enter a valid mobile number for WhatsApp & booking updates.');
      }

      const photoToUse = useCustomPhoto && customPhotoUrl.trim()
        ? customPhotoUrl.trim()
        : selectedPhoto;

      const res = await registerClient({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        nationality: nationality.trim(),
        preferredLanguage: preferredLanguage.trim(),
        profilePhoto: photoToUse
      });

      if (!res.success || !res.client) {
        throw new Error(res.error || 'Failed to register client profile.');
      }

      onRegistered(res.client);
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>New Tourist Registration</span>
                <span className="text-[10px] font-mono uppercase bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Client Mode
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Create a tourist profile to book verified docents, bargain fees, and receive WhatsApp/Gmail updates.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Profile Avatar Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Choose Profile Photo
            </label>
            <div className="flex items-center gap-3">
              <img
                src={useCustomPhoto && customPhotoUrl.trim() ? customPhotoUrl.trim() : selectedPhoto}
                alt="Selected Avatar"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-sm shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                }}
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {PRESET_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedPhoto(av.url);
                        setUseCustomPhoto(false);
                      }}
                      className={`relative w-9 h-9 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        !useCustomPhoto && selectedPhoto === av.url
                          ? 'border-emerald-600 scale-105 shadow-xs ring-2 ring-emerald-500/30'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomPhoto}
                      onChange={(e) => setUseCustomPhoto(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Custom Image URL</span>
                  </label>
                  {useCustomPhoto && (
                    <input
                      type="url"
                      value={customPhotoUrl}
                      onChange={(e) => setCustomPhotoUrl(e.target.value)}
                      placeholder="https://example.com/photo.jpg"
                      className="flex-1 text-xs px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Tushar Chavan"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tushar.chavan@outlook.com"
                  className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5" />
              </div>
            </div>

            {/* Mobile / WhatsApp Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number (WhatsApp Enabled) *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98201 55421"
                  className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-3.5" />
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">Used for instant tour acceptance WhatsApp and call links.</p>
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nationality / Country *
              </label>
              <div className="relative">
                <select
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="India">India</option>
                  <option value="Canada">Canada</option>
                  <option value="France">France</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="Japan">Japan</option>
                  <option value="Australia">Australia</option>
                  <option value="Italy">Italy</option>
                  <option value="Spain">Spain</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Switzerland">Switzerland</option>
                </select>
                <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Preferred Language */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Tour Dialect / Language *
              </label>
              <div className="relative">
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="Marathi">Marathi (मराठी) - Maharashtra Heritage & Culture</option>
                  <option value="Hindi">Hindi (हिंदी) - Pan-India</option>
                  <option value="English">English - Global</option>
                  <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="Italian">Italian (Italiano)</option>
                  <option value="Spanish">Spanish (Español)</option>
                </select>
                <Languages className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-3.5 pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Guides speaking this dialect will receive high-priority smart invitations when you post a request.
              </p>
            </div>
          </div>

          {/* Quick preset examples pill */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-500 text-[11px] font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Fill Samples:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { name: 'Tushar Chavan', lang: 'Marathi', email: 'tushar.chavan@outlook.com', phone: '+91 98201 55421' },
                { name: 'Prince Gupta', lang: 'Hindi', email: 'guptaprince0408@gmail.com', phone: '+91 99302 89412' },
                { name: 'Prachi Bhere', lang: 'Marathi', email: 'prachi.bhere@gmail.com', phone: '+91 98224 67019' },
              ].map((sample, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setFullName(sample.name);
                    setEmail(sample.email);
                    setPhone(sample.phone);
                    setPreferredLanguage(sample.lang);
                    setNationality('India');
                  }}
                  className="px-2 py-0.5 bg-white hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 rounded text-[11px] font-medium text-slate-700 transition-colors cursor-pointer"
                >
                  {sample.name} ({sample.lang})
                </button>
              ))}
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Profile...' : 'Complete Registration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

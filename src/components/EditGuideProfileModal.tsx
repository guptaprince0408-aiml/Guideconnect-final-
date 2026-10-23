import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Phone, Mail, Globe, AlertCircle, Image as ImageIcon, Upload, Camera, DollarSign, Award, MapPin } from 'lucide-react';
import { updateGuideProfile } from '../services/store';
import { GuideProfile } from '../types';

interface EditGuideProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  guide: GuideProfile;
  onSaved: (updatedGuide: GuideProfile) => void;
}

const PRESET_GUIDE_AVATARS = [
  { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 5', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { label: 'Prince Gupta', url: '/assets/aistudio/WhatsApp_Image_2026-10-21_at_12.59.24_ff55a0e1.jpeg' }
];

export const EditGuideProfileModal: React.FC<EditGuideProfileModalProps> = ({
  isOpen,
  onClose,
  guide,
  onSaved
}) => {
  const [fullName, setFullName] = useState(guide.fullName);
  const [username, setUsername] = useState(guide.username);
  const [email, setEmail] = useState(guide.email);
  const [phone, setPhone] = useState(guide.phone);
  const [bio, setBio] = useState(guide.bio);
  const [profilePhoto, setProfilePhoto] = useState(guide.profilePhoto);
  const [baseHourlyRate, setBaseHourlyRate] = useState(guide.baseHourlyRate);
  const [currency, setCurrency] = useState(guide.currency);
  const [serviceAreas, setServiceAreas] = useState(guide.serviceAreas.join(', '));
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (guide) {
      setFullName(guide.fullName);
      setUsername(guide.username);
      setEmail(guide.email);
      setPhone(guide.phone);
      setBio(guide.bio);
      setProfilePhoto(guide.profilePhoto);
      setBaseHourlyRate(guide.baseHourlyRate);
      setCurrency(guide.currency);
      setServiceAreas(guide.serviceAreas.join(', '));
      setCustomPhotoUrl('');
      setUseCustomUrl(false);
      setError(null);
      setSuccessMsg(null);
    }
  }, [guide]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, WEBP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setProfilePhoto(dataUrl);
        setUseCustomUrl(false);
        setError(null);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (!fullName.trim() || fullName.trim().length < 2) {
        throw new Error('Full name must be at least 2 characters.');
      }
      if (!email.trim() || !email.includes('@')) {
        throw new Error('Please enter a valid email address.');
      }
      if (!phone.trim() || phone.trim().length < 6) {
        throw new Error('Please enter a valid mobile number for WhatsApp & client direct contact.');
      }

      const finalPhoto = useCustomUrl && customPhotoUrl.trim() ? customPhotoUrl.trim() : profilePhoto;
      const parsedAreas = serviceAreas.split(',').map(s => s.trim()).filter(Boolean);

      const updated = updateGuideProfile(guide.id, {
        fullName: fullName.trim(),
        username: username.trim().replace(/^@/, ''),
        email: email.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        profilePhoto: finalPhoto,
        baseHourlyRate: Number(baseHourlyRate) || 500,
        currency: currency.trim() || 'INR',
        serviceAreas: parsedAreas.length > 0 ? parsedAreas : guide.serviceAreas
      });

      setSuccessMsg('Guide profile updated successfully!');
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to update guide profile.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Camera className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Edit Guide Profile & Docent Information
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Guide ID: {guide.guideId} · @{guide.username}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Profile Picture Change Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Profile Photo / Headshot
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={useCustomUrl && customPhotoUrl.trim() ? customPhotoUrl.trim() : profilePhoto}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_GUIDE_AVATARS[0].url;
                  }}
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                  <Camera className="w-3 h-3" />
                </span>
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Upload New Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setUseCustomUrl(!useCustomUrl)}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{useCustomUrl ? 'Hide URL Box' : 'Enter Image URL'}</span>
                  </button>
                </div>

                {useCustomUrl && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="url"
                      value={customPhotoUrl}
                      onChange={(e) => setCustomPhotoUrl(e.target.value)}
                      placeholder="Paste image URL (https://...)"
                      className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customPhotoUrl.trim()) setProfilePhoto(customPhotoUrl.trim());
                      }}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shrink-0 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {PRESET_GUIDE_AVATARS.map((av, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setProfilePhoto(av.url);
                        setUseCustomUrl(false);
                      }}
                      className={`relative w-8 h-8 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        profilePhoto === av.url && !useCustomUrl
                          ? 'border-emerald-600 scale-105 shadow-xs ring-2 ring-emerald-500/30'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                      title={av.label}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Username (@handle) *
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 text-slate-400 font-bold text-xs">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full text-xs pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-bold"
                />
              </div>
            </div>

            {/* Mobile & Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number (WhatsApp) *
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2.5" />
              </div>
            </div>

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
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Hourly Rate & Currency */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Hourly Rate *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min={100}
                  value={baseHourlyRate}
                  onChange={(e) => setBaseHourlyRate(Number(e.target.value))}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white font-mono"
                />
                <DollarSign className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Currency *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white cursor-pointer font-bold"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            {/* Service Areas */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Areas / Cities (comma separated) *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={serviceAreas}
                  onChange={(e) => setServiceAreas(e.target.value)}
                  placeholder="e.g. Mumbai, Pune, South Mumbai, Fort"
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Bio / Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Bio & Tour Specialization *
              </label>
              <textarea
                rows={3}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Action Buttons */}
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
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Guide Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Phone, Mail, Globe, Languages, AlertCircle, Image as ImageIcon, Upload, Camera } from 'lucide-react';
import { updateClientProfile } from '../services/store';
import { ClientProfile } from '../types';

interface EditClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  client: ClientProfile;
  onSaved: (updatedClient: ClientProfile) => void;
}

const PRESET_AVATARS = [
  { label: 'Prince Gupta', url: '/assets/aistudio/WhatsApp_Image_2026-10-21_at_12.59.24_ff55a0e1.jpeg' },
  { label: 'Avatar 1', url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 3', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 4', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 5', url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 6', url: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80' },
  { label: 'Avatar 7', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' }
];

export const EditClientProfileModal: React.FC<EditClientProfileModalProps> = ({
  isOpen,
  onClose,
  client,
  onSaved
}) => {
  const [fullName, setFullName] = useState(client.fullName);
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone);
  const [nationality, setNationality] = useState(client.nationality);
  const [preferredLanguage, setPreferredLanguage] = useState(client.preferredLanguage);
  const [profilePhoto, setProfilePhoto] = useState(client.profilePhoto);
  const [customPhotoUrl, setCustomPhotoUrl] = useState('');
  const [useCustomUrl, setUseCustomUrl] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state if active client changes
  useEffect(() => {
    if (client) {
      setFullName(client.fullName);
      setEmail(client.email);
      setPhone(client.phone);
      setNationality(client.nationality);
      setPreferredLanguage(client.preferredLanguage);
      setProfilePhoto(client.profilePhoto);
      setCustomPhotoUrl('');
      setUseCustomUrl(false);
      setError(null);
      setSuccessMsg(null);
    }
  }, [client]);

  if (!isOpen) return null;

  // Handle local file upload
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

  const handleApplyCustomUrl = () => {
    if (customPhotoUrl.trim()) {
      setProfilePhoto(customPhotoUrl.trim());
      setError(null);
    }
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
        throw new Error('Please enter a valid mobile number for WhatsApp & booking alerts.');
      }

      const finalPhoto = useCustomUrl && customPhotoUrl.trim() ? customPhotoUrl.trim() : profilePhoto;

      const updated = updateClientProfile(client.id, {
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        nationality: nationality.trim(),
        preferredLanguage: preferredLanguage.trim(),
        profilePhoto: finalPhoto
      });

      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => {
        onSaved(updated);
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
              <Camera className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Edit Profile & Account Information
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Account ID: {client.id} · Active Profile
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
              Profile Picture / Avatar
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={useCustomUrl && customPhotoUrl.trim() ? customPhotoUrl.trim() : profilePhoto}
                  alt={fullName}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_AVATARS[0].url;
                  }}
                />
                <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-full shadow-xs">
                  <Camera className="w-3 h-3" />
                </span>
              </div>

              <div className="flex-1 w-full space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {/* File Upload Button */}
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
                      onClick={handleApplyCustomUrl}
                      className="px-2.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shrink-0 cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Preset Avatars Row */}
                <div>
                  <span className="text-[11px] text-slate-500 block mb-1">Or choose a preset portrait:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {PRESET_AVATARS.map((av, idx) => (
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
          </div>

          {/* Form Fields: Full Name & Email */}
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
                placeholder="e.g. Prince Gupta"
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-semibold"
              />
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
                  placeholder="e.g. guptaprince0408@gmail.com"
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            {/* Mobile / WhatsApp Number */}
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
                  placeholder="+91 99302 89412"
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-bold"
                />
                <Phone className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2.5" />
              </div>
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
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
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
                </select>
                <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {/* Preferred Language */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Dialect / Language *
              </label>
              <div className="relative">
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all appearance-none cursor-pointer"
                >
                  <option value="Marathi">Marathi (मराठी) - Maharashtra Heritage</option>
                  <option value="Hindi">Hindi (हिंदी) - Pan-India</option>
                  <option value="English">English - Global</option>
                  <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="Italian">Italian (Italiano)</option>
                  <option value="Spanish">Spanish (Español)</option>
                </select>
                <Languages className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-2.5 pointer-events-none" />
              </div>
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
              <span>{isSubmitting ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

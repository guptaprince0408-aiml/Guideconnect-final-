import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle, Award } from 'lucide-react';
import { registerGuide } from '../services/store';

interface GuideRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextSequence: number;
  onRegistered: () => void;
}

export const GuideRegistrationModal: React.FC<GuideRegistrationModalProps> = ({
  isOpen,
  onClose,
  nextSequence,
  onRegistered
}) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('India');
  const [serviceArea, setServiceArea] = useState('Mumbai, South Mumbai');
  const [primaryLanguage, setPrimaryLanguage] = useState('English');
  const [proficiency, setProficiency] = useState<'NATIVE' | 'FLUENT' | 'CONVERSATIONAL'>('FLUENT');
  const [secondaryLanguage, setSecondaryLanguage] = useState('French');
  const [secondaryProficiency, setSecondaryProficiency] = useState<'NATIVE' | 'FLUENT' | 'CONVERSATIONAL'>('CONVERSATIONAL');
  const [yearsOfExperience, setYearsOfExperience] = useState(5);
  const [baseHourlyRate, setBaseHourlyRate] = useState(700);
  const [currency, setCurrency] = useState('INR');
  const [specializations, setSpecializations] = useState('Historical, Food Tour');
  const [bio, setBio] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const previewGuideId = `GC-G-${nextSequence}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const langs = [
        { language: primaryLanguage, proficiency },
        ...(secondaryLanguage ? [{ language: secondaryLanguage, proficiency: secondaryProficiency }] : [])
      ];

      const res = await registerGuide({
        username,
        fullName,
        email,
        phone,
        country,
        serviceAreas: serviceArea.split(',').map(s => s.trim()).filter(Boolean),
        languages: langs,
        yearsOfExperience: Number(yearsOfExperience),
        baseHourlyRate: Number(baseHourlyRate),
        currency,
        specializations: specializations.split(',').map(s => s.trim()).filter(Boolean),
        qualifications: ['Tourism Guide Certification #REG-' + Math.floor(1000 + Math.random() * 9000)],
        bio: bio || 'Professional local guide with deep knowledge of local history and culture.'
      });

      if (!res.success) {
        setError(res.error || 'Failed to register guide');
        setIsSubmitting(false);
        return;
      }

      onRegistered();
      onClose();
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              <span>Guide Registration & Identity Allocation</span>
            </h3>
            <p className="text-xs text-slate-500">
              System allocates a permanent unique Guide ID and validates your chosen username.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Guide ID Preview & Chosen Username Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-lg">
            <div>
              <label className="block text-xs font-semibold text-emerald-900 mb-1">
                Allocated Guide ID (System-Generated)
              </label>
              <div className="text-sm font-mono font-bold text-emerald-800 bg-white px-3 py-2 rounded border border-emerald-300">
                {previewGuideId}
              </div>
              <span className="text-[11px] text-emerald-700 block mt-1">
                Permanent system identifier with database uniqueness constraint.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1">
                Chosen Username <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-400">@</span>
                <input
                  type="text"
                  required
                  placeholder="e.g. mumbai_explorer"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full text-xs pl-7 pr-3 py-2 bg-white border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Personalized public profile handle. Must be unique.
              </span>
            </div>
          </div>

          {/* Full Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Vikram Sharma"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="vikram@guideconnect.travel"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Phone & Country */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone (with Country Code) *</label>
              <input
                type="tel"
                required
                placeholder="+91 98200 11223"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Country *</label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="India">India</option>
                <option value="Japan">Japan</option>
                <option value="Italy">Italy</option>
                <option value="France">France</option>
                <option value="Spain">Spain</option>
              </select>
            </div>
          </div>

          {/* Service Areas */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Service Areas / Destinations (Comma separated) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Mumbai, South Mumbai, Fort, Marine Drive"
              value={serviceArea}
              onChange={e => setServiceArea(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Languages Spoken */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Primary Language *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="English"
                  value={primaryLanguage}
                  onChange={e => setPrimaryLanguage(e.target.value)}
                  className="w-2/3 text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <select
                  value={proficiency}
                  onChange={e => setProficiency(e.target.value as any)}
                  className="w-1/3 text-xs px-2 py-2 border border-slate-300 rounded focus:outline-none"
                >
                  <option value="NATIVE">Native</option>
                  <option value="FLUENT">Fluent</option>
                  <option value="CONVERSATIONAL">Conversational</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Secondary Language (Optional)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. French, German, Japanese"
                  value={secondaryLanguage}
                  onChange={e => setSecondaryLanguage(e.target.value)}
                  className="w-2/3 text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <select
                  value={secondaryProficiency}
                  onChange={e => setSecondaryProficiency(e.target.value as any)}
                  className="w-1/3 text-xs px-2 py-2 border border-slate-300 rounded focus:outline-none"
                >
                  <option value="NATIVE">Native</option>
                  <option value="FLUENT">Fluent</option>
                  <option value="CONVERSATIONAL">Conversational</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rates & Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Experience (Years) *</label>
              <input
                type="number"
                min="0"
                max="50"
                required
                value={yearsOfExperience}
                onChange={e => setYearsOfExperience(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Base Hourly Rate *</label>
              <input
                type="number"
                min="1"
                required
                value={baseHourlyRate}
                onChange={e => setBaseHourlyRate(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Currency *</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Professional Bio</label>
            <textarea
              rows={2}
              placeholder="Brief description of your expertise, tour style, and background..."
              value={bio}
              onChange={e => setBio(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-sm transition-colors"
            >
              {isSubmitting ? 'Registering...' : 'Register as Guide'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

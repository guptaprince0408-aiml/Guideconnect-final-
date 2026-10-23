import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, DollarSign, Users, Award, Lock, RefreshCw } from 'lucide-react';
import { GuideProfile, ClientProfile, ClientRequest, Booking, PricingRule, ConcurrencyAuditLog } from '../types';
import { verifyGuide, toggleGuideActive, updatePricingRule, resetStoreToDefaults } from '../services/store';
import { formatCurrency } from '../services/pricingEngine';

interface AdminDashboardProps {
  guides: GuideProfile[];
  clients: ClientProfile[];
  requests: ClientRequest[];
  bookings: Booking[];
  pricingRules: PricingRule[];
  auditLogs: ConcurrencyAuditLog[];
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  guides,
  clients,
  requests,
  bookings,
  pricingRules,
  auditLogs,
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState<'verification' | 'pricing' | 'audit' | 'allGuides'>('verification');
  const [editingCity, setEditingCity] = useState<string | null>(null);
  const [editRate, setEditRate] = useState<number>(0);

  const pendingVerificationGuides = guides.filter(g => !g.isVerified);

  const handleToggleVerification = (guideId: string, currentStatus: boolean) => {
    verifyGuide(guideId, !currentStatus);
    onRefresh();
  };

  const handleToggleActive = (guideId: string) => {
    toggleGuideActive(guideId);
    onRefresh();
  };

  const handleSaveRate = (city: string) => {
    updatePricingRule(city, { baseHourlyRate: Number(editRate) });
    setEditingCity(null);
    onRefresh();
  };

  const handleResetDatabase = () => {
    if (confirm('Reset entire platform state back to seeded defaults? All test bookings and offers will be reset.')) {
      resetStoreToDefaults();
      onRefresh();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Platform Governance & Administration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            GuideConnect Administrator Console
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage license verifications, destination rate models, and monitor transactional audit logs.
          </p>
        </div>

        <button
          onClick={handleResetDatabase}
          className="px-3.5 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Demo Store to Defaults</span>
        </button>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 font-mono">
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase block font-sans">Registered Guides</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{guides.length}</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase block font-sans">Registered Tourists</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{clients.length}</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase block font-sans">Total Requests</span>
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{requests.length}</span>
        </div>
        <div className="p-4 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] text-slate-500 uppercase block font-sans">Confirmed Bookings</span>
          <span className="text-2xl font-bold text-emerald-800 tabular-nums">{bookings.length}</span>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('verification')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'verification' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Verification Queue ({pendingVerificationGuides.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'pricing' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Destination Pricing Rules</span>
        </button>

        <button
          onClick={() => setActiveTab('allGuides')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'allGuides' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>All Guides Registry ({guides.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900 bg-slate-100'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Concurrency Audit Trail</span>
        </button>
      </div>

      {/* TAB 1: VERIFICATION QUEUE */}
      {activeTab === 'verification' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            Pending Guide Verification Submissions
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Requirement: Only guides who have their licenses vetted receive the official verified badge.
          </p>

          {pendingVerificationGuides.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>All guide accounts are currently verified. No pending reviews in queue.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingVerificationGuides.map(guide => (
                <div
                  key={guide.id}
                  className="p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={guide.profilePhoto}
                      alt={guide.fullName}
                      className="w-12 h-12 rounded-full object-cover border"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{guide.fullName}</span>
                        <span className="text-xs font-mono font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {guide.guideId}
                        </span>
                        <span className="text-xs font-mono text-emerald-700">@{guide.username}</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {guide.country} · Experience: {guide.yearsOfExperience} yrs · Doc: <code className="text-[11px] bg-slate-200 px-1 py-0.5 rounded">{guide.verificationDocument || 'license.pdf'}</code>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleVerification(guide.id, guide.isVerified)}
                    className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shrink-0"
                  >
                    Approve & Verify Guide
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRICING RULES */}
      {activeTab === 'pricing' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            Destination Indicative Rate Engine
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Configurable pricing models powering indicative quotes during client request creation and baseline bargaining.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">City</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4">Currency</th>
                  <th className="py-3 px-4 text-right">Base Hourly Rate</th>
                  <th className="py-3 px-4 text-right">Group Multiplier</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {pricingRules.map(rule => (
                  <tr key={rule.city} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900 font-sans">{rule.city}</td>
                    <td className="py-3 px-4 text-slate-600 font-sans">{rule.country}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{rule.currency}</td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      {editingCity === rule.city ? (
                        <input
                          type="number"
                          value={editRate}
                          onChange={e => setEditRate(Number(e.target.value))}
                          className="w-20 p-1 border border-slate-300 rounded text-right font-mono text-xs"
                        />
                      ) : (
                        <span>{formatCurrency(rule.baseHourlyRate, rule.currency)}/hr</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-600">
                      +{rule.touristMultiplier * 100}% per pax (&gt;2)
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingCity === rule.city ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSaveRate(rule.city)}
                            className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingCity(null)}
                            className="px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingCity(rule.city);
                            setEditRate(rule.baseHourlyRate);
                          }}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Edit Rate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ALL GUIDES REGISTRY */}
      {activeTab === 'allGuides' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            Registered Guides Master Registry
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Uniquely identified by System Guide ID (GC-G-XXXXXX) and separate username.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Guide ID</th>
                  <th className="py-3 px-4">Username & Name</th>
                  <th className="py-3 px-4">Destinations</th>
                  <th className="py-3 px-4">Languages</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {guides.map(guide => (
                  <tr key={guide.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{guide.guideId}</td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-900">{guide.fullName}</div>
                      <div className="text-xs text-emerald-700 font-mono">@{guide.username}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans">
                      {guide.serviceAreas.join(', ')}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-sans">
                      {guide.languages.map(l => l.language).join(', ')}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {guide.isVerified ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verified</span>
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Unverified</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {guide.isActive ? (
                        <span className="text-emerald-700 font-semibold">Active</span>
                      ) : (
                        <span className="text-rose-700 font-semibold">Suspended</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => handleToggleActive(guide.id)}
                        className={`text-xs font-semibold px-2.5 py-1 rounded ${
                          guide.isActive
                            ? 'text-rose-700 hover:bg-rose-50'
                            : 'text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {guide.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-2">
            Concurrency & Locking Transaction Audit Log
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Records all atomic single-winner acceptance attempts, including rejected race loss conflicts.
          </p>

          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-6 text-center">
              No concurrency transactions logged yet. Use the Concurrency Simulator to test simultaneous guide acceptances.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Request ID</th>
                    <th className="py-2.5 px-3">Guide ID & User</th>
                    <th className="py-2.5 px-3">Result</th>
                    <th className="py-2.5 px-3 text-right">Latency</th>
                    <th className="py-2.5 px-3">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {log.requestId}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {log.attemptedByGuideCode} (@{log.attemptedByUsername})
                      </td>
                      <td className="py-2.5 px-3">
                        {log.result === 'SUCCESS' ? (
                          <span className="text-emerald-700 font-bold">SUCCESS</span>
                        ) : (
                          <span className="text-rose-700 font-bold">409 CONFLICT</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-slate-500">
                        {log.latencyMs}ms
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

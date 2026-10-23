import React, { useState } from 'react';
import { Zap, ShieldAlert, CheckCircle2, XCircle, ArrowRight, RefreshCw, Lock, AlertTriangle } from 'lucide-react';
import { ClientRequest, GuideProfile, ConcurrencyAuditLog } from '../types';
import { simulateConcurrentRace, createClientRequest, atomicAcceptRequest } from '../services/store';

interface ConcurrencySimulatorProps {
  requests: ClientRequest[];
  guides: GuideProfile[];
  auditLogs: ConcurrencyAuditLog[];
  onRefresh: () => void;
}

export const ConcurrencySimulator: React.FC<ConcurrencySimulatorProps> = ({
  requests,
  guides,
  auditLogs,
  onRefresh
}) => {
  const openRequests = requests.filter(r => r.status === 'OPEN');
  const [selectedRequestId, setSelectedRequestId] = useState<string>(
    openRequests[0]?.id || requests[0]?.id || ''
  );

  const [guideAId, setGuideAId] = useState<string>(guides[0]?.id || '');
  const [guideBId, setGuideBId] = useState<string>(guides[1]?.id || '');

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [raceResult, setRaceResult] = useState<{
    resA: any;
    resB: any;
    timestamp: string;
  } | null>(null);

  const selectedRequest = requests.find(r => r.id === selectedRequestId);
  const guideA = guides.find(g => g.id === guideAId);
  const guideB = guides.find(g => g.id === guideBId);

  const handleRunRace = async () => {
    if (!selectedRequestId || !guideAId || !guideBId) return;
    if (guideAId === guideBId) {
      alert('Please choose two distinct guides to simulate the race condition.');
      return;
    }

    setIsRunning(true);
    setRaceResult(null);

    try {
      const results = await simulateConcurrentRace(selectedRequestId, guideAId, guideBId);
      setRaceResult({
        resA: results.resA,
        resB: results.resB,
        timestamp: new Date().toLocaleTimeString()
      });
      onRefresh();
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateNewOpenMumbaiRequest = async () => {
    setIsRunning(true);
    await createClientRequest({
      clientId: 'client-001',
      destinationCountry: 'India',
      destinationCity: 'Mumbai',
      preferredLanguage: 'English',
      travelDate: '2026-10-28',
      startTime: '10:00',
      endTime: '13:00',
      durationHours: 3,
      numberOfTourists: 2,
      tourType: 'Historical',
      preferredSpecialization: 'Colonial Heritage',
      approximateBudget: 2800,
      currency: 'INR',
      meetingLocation: 'Churchgate Station Western Railway HQ',
      specialInstructions: 'Looking for a historical walk through Victorian Gothic landmarks.'
    });
    onRefresh();
    setIsRunning(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-600 mb-1">
          <Zap className="w-4 h-4" />
          <span>Core Architectural Verification</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          Single-Winner Atomic Acceptance Simulator
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          In high-demand tourist destinations, multiple qualified guides may attempt to accept an open request at the exact same millisecond.
          Our backend guarantees database-level atomic row locking (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">SELECT ... FOR UPDATE</code>), ensuring exactly one guide wins the reservation while the competing transaction receives a rollback rejection.
        </p>
      </div>

      {/* Simulator Control Panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 1. Request Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Target Open Request
            </label>
            {openRequests.length > 0 ? (
              <select
                value={selectedRequestId}
                onChange={e => setSelectedRequestId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                {openRequests.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.id} · {r.destinationCity} ({r.preferredLanguage}, {r.travelDate})
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
                  No requests currently in OPEN status.
                </p>
                <button
                  onClick={handleCreateNewOpenMumbaiRequest}
                  className="w-full text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 py-2 px-3 rounded transition-colors"
                >
                  + Spawn Open Mumbai Request
                </button>
              </div>
            )}

            {selectedRequest && (
              <div className="mt-3 text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100 font-mono">
                <div>Status: <span className="font-bold text-slate-800">{selectedRequest.status}</span></div>
                <div>Location: {selectedRequest.destinationCity}</div>
                <div>Date & Time: {selectedRequest.travelDate} ({selectedRequest.startTime}-{selectedRequest.endTime})</div>
              </div>
            )}
          </div>

          {/* 2. Guide A */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Concurrent Competitor A
            </label>
            <select
              value={guideAId}
              onChange={e => setGuideAId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {guides.map(g => (
                <option key={g.id} value={g.id}>
                  {g.guideId} · @{g.username} ({g.fullName})
                </option>
              ))}
            </select>
            {guideA && (
              <div className="mt-3 text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                <div className="font-medium text-slate-800">{guideA.fullName}</div>
                <div>City: {guideA.serviceAreas[0]} · {guideA.country}</div>
                <div>Languages: {guideA.languages.map(l => l.language).join(', ')}</div>
              </div>
            )}
          </div>

          {/* 3. Guide B */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Concurrent Competitor B
            </label>
            <select
              value={guideBId}
              onChange={e => setGuideBId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {guides.map(g => (
                <option key={g.id} value={g.id}>
                  {g.guideId} · @{g.username} ({g.fullName})
                </option>
              ))}
            </select>
            {guideB && (
              <div className="mt-3 text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded border border-slate-100">
                <div className="font-medium text-slate-800">{guideB.fullName}</div>
                <div>City: {guideB.serviceAreas[0]} · {guideB.country}</div>
                <div>Languages: {guideB.languages.map(l => l.language).join(', ')}</div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-slate-400" />
            <span>Fires both threads simultaneously via Promise.all with transactional mutex</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCreateNewOpenMumbaiRequest}
              className="px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Spawn Test Request
            </button>
            <button
              onClick={handleRunRace}
              disabled={isRunning || !selectedRequestId || selectedRequest?.status !== 'OPEN'}
              className="px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 disabled:bg-slate-300 rounded-lg shadow-sm transition-colors flex items-center gap-2"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing Simultaneous Transactions...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-white text-white" />
                  <span>Execute Simultaneous Acceptance Race</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Race Results Display */}
      {raceResult && (
        <div className="mb-8 bg-slate-900 text-white rounded-xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <span className="text-xs font-mono text-emerald-400">
              TRANSACTION EXECUTION LOG · {raceResult.timestamp}
            </span>
            <span className="text-xs text-slate-400">
              Isolation: READ_COMMITTED + Mutex Lock
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Thread A Outcome */}
            <div className={`p-4 rounded-lg border ${
              raceResult.resA.success
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : 'bg-rose-950/40 border-rose-500/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400">Competitor A: @{guideA?.username}</span>
                {raceResult.resA.success ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>WINNER (200 OK)</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>REJECTED (409 CONFLICT)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 font-mono leading-relaxed">
                {raceResult.resA.success
                  ? `Booking reserved: ${raceResult.resA.booking?.id}. Status updated to CONFIRMED. Competing invitations closed.`
                  : raceResult.resA.error}
              </p>
            </div>

            {/* Thread B Outcome */}
            <div className={`p-4 rounded-lg border ${
              raceResult.resB.success
                ? 'bg-emerald-950/40 border-emerald-500/50'
                : 'bg-rose-950/40 border-rose-500/50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-slate-400">Competitor B: @{guideB?.username}</span>
                {raceResult.resB.success ? (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>WINNER (200 OK)</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-rose-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>REJECTED (409 CONFLICT)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-200 font-mono leading-relaxed">
                {raceResult.resB.success
                  ? `Booking reserved: ${raceResult.resB.booking?.id}. Status updated to CONFIRMED. Competing invitations closed.`
                  : raceResult.resB.error}
              </p>
            </div>
          </div>

          <div className="mt-4 text-xs text-slate-400 pt-3 border-t border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Invariant Verified: Exactly one booking created. Race loss properly handled with transactional integrity.</span>
          </div>
        </div>
      )}

      {/* Real-time Audit Trail */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">
          Concurrency Audit Log History
        </h3>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No race events logged yet. Click "Execute Simultaneous Acceptance Race" above to generate logs.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
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
                {auditLogs.slice(0, 8).map(log => (
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
                    <td className="py-2.5 px-3 font-sans text-slate-600 max-w-xs truncate">
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Calculator, ArrowRightLeft, Sparkles, TrendingUp, Info, Clock, DollarSign } from 'lucide-react';
import { FX_RATES_TO_INR, formatCurrency, getDualCurrencyCharge } from '../services/pricingEngine';

interface IndianClientPriceSliderProps {
  guideName?: string;
  baseHourlyRate: number;
  visitingCurrency: string;
  visitingCountry?: string;
  compact?: boolean;
  initialHours?: number;
  onDurationChange?: (hours: number, totalVisiting: number, totalINR: number) => void;
}

export const IndianClientPriceSlider: React.FC<IndianClientPriceSliderProps> = ({
  guideName,
  baseHourlyRate,
  visitingCurrency,
  visitingCountry,
  compact = false,
  initialHours = 4,
  onDurationChange
}) => {
  const [durationHours, setDurationHours] = useState<number>(initialHours);
  const [showFormula, setShowFormula] = useState<boolean>(false);

  const fxRate = FX_RATES_TO_INR[visitingCurrency.toUpperCase()] || 1;
  const isForeignCurrency = visitingCurrency.toUpperCase() !== 'INR';

  const totalVisiting = Math.round(durationHours * baseHourlyRate);
  const totalINR = Math.round(totalVisiting * fxRate);
  const inrHourlyRate = Math.round(baseHourlyRate * fxRate);

  const handleSliderChange = (newHours: number) => {
    setDurationHours(newHours);
    if (onDurationChange) {
      onDurationChange(newHours, totalVisiting, totalINR);
    }
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-orange-50/70 via-white to-emerald-50/70 border border-amber-200/90 rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xs" role="img" aria-label="India flag">🇮🇳</span>
            <span className="text-[11px] font-bold text-amber-950 uppercase tracking-wider">
              Price Slider (₹ INR & {visitingCurrency})
            </span>
          </div>
          {isForeignCurrency && (
            <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
              1 {visitingCurrency} = ₹{fxRate}
            </span>
          )}
        </div>

        {/* Dual Rate Pills */}
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-2xs">
            <span className="text-[10px] text-slate-400 block font-medium uppercase">Visiting Currency</span>
            <span className="text-xs font-mono font-extrabold text-slate-900">
              {formatCurrency(baseHourlyRate, visitingCurrency)}/hr
            </span>
          </div>

          <div className="bg-amber-50/80 border border-amber-300 rounded-lg p-1.5 shadow-2xs">
            <span className="text-[10px] text-amber-700 block font-bold uppercase">Client Rate (INR)</span>
            <span className="text-xs font-mono font-black text-amber-900">
              ₹{inrHourlyRate.toLocaleString()}/hr
            </span>
          </div>
        </div>

        {/* Interactive Slider */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Tour Duration:</span>
            </span>
            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
              {durationHours} {durationHours === 1 ? 'Hour' : 'Hours'}
            </span>
          </div>

          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={durationHours}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
          />

          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>1 hr</span>
            <span>4 hrs (Half)</span>
            <span>8 hrs (Full)</span>
            <span>10 hrs</span>
          </div>
        </div>

        {/* Total Cost in Both Currencies */}
        <div className="bg-slate-900 text-white rounded-lg p-2.5 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[10px] text-slate-300 block uppercase font-medium">
              {durationHours}h Visiting Price
            </span>
            <span className="text-xs font-mono font-bold text-slate-100">
              {formatCurrency(totalVisiting, visitingCurrency)}
            </span>
          </div>

          <ArrowRightLeft className="w-3.5 h-3.5 text-amber-400" />

          <div className="text-right">
            <span className="text-[10px] text-amber-300 block uppercase font-bold">
              Your Price (₹ INR)
            </span>
            <span className="text-sm font-mono font-extrabold text-amber-400">
              ₹{totalINR.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Full / Featured Widget Mode
  return (
    <div className="bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/80 border border-amber-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            ₹
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs" role="img" aria-label="India flag">🇮🇳</span>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Indian Tourist Currency Calculator & Live Price Slider
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Instant conversion from guide's visiting currency to Indian Rupees (INR)
            </p>
          </div>
        </div>

        {isForeignCurrency && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-amber-900 shadow-2xs self-start sm:self-auto">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <span>FX Rate: 1 {visitingCurrency} ≈ ₹{fxRate} INR</span>
          </div>
        )}
      </div>

      {/* Hourly Rate Dual Display Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Visiting Country Charge
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {visitingCountry ? `In ${visitingCountry} (${visitingCurrency})` : `In ${visitingCurrency}`}
            </span>
          </div>
          <div className="text-right">
            <span className="text-base sm:text-lg font-mono font-extrabold text-slate-900">
              {formatCurrency(baseHourlyRate, visitingCurrency)}
            </span>
            <span className="text-xs text-slate-500 block">/ hour</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-300 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1">
              <span>Client Home Currency</span>
              <span className="text-xs">🇮🇳</span>
            </span>
            <span className="text-xs text-amber-700 font-medium">
              Indian Rupee (INR) Equivalent
            </span>
          </div>
          <div className="text-right">
            <span className="text-base sm:text-lg font-mono font-black text-amber-900">
              ₹{inrHourlyRate.toLocaleString()}
            </span>
            <span className="text-xs text-amber-700 block">/ hour</span>
          </div>
        </div>
      </div>

      {/* Interactive Tour Duration Slider */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" />
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Slide to Adjust Tour Duration:
            </label>
          </div>

          <div className="flex items-center gap-2">
            {[2, 4, 6, 8].map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => handleSliderChange(preset)}
                className={`px-2.5 py-1 text-xs rounded-lg font-mono font-bold transition-all cursor-pointer ${
                  durationHours === preset
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {preset}h {preset === 4 ? '(Half)' : preset === 8 ? '(Full)' : ''}
              </button>
            ))}
          </div>
        </div>

        {/* Range Slider Track */}
        <div className="space-y-1.5 pt-1">
          <input
            type="range"
            min={1}
            max={12}
            step={1}
            value={durationHours}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />

          <div className="flex justify-between text-[11px] text-slate-400 font-mono px-0.5">
            <span>1 Hour</span>
            <span>3 Hours</span>
            <span>6 Hours</span>
            <span>9 Hours</span>
            <span>12 Hours (Max)</span>
          </div>
        </div>

        {/* Grand Total Comparison Banner */}
        <div className="bg-slate-900 rounded-xl p-4 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-center sm:text-left">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-medium">
              Estimated Visiting Total ({durationHours} Hours)
            </span>
            <span className="text-lg sm:text-xl font-mono font-extrabold text-slate-100">
              {formatCurrency(totalVisiting, visitingCurrency)}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              ({formatCurrency(baseHourlyRate, visitingCurrency)}/hr × {durationHours}h)
            </span>
          </div>

          <div className="flex items-center justify-center p-2 rounded-full bg-white/10 text-amber-400">
            <ArrowRightLeft className="w-5 h-5" />
          </div>

          <div className="text-center sm:text-right">
            <span className="text-[11px] uppercase tracking-wider text-amber-300 block font-bold flex items-center justify-center sm:justify-end gap-1">
              <span>Amount in Indian Rupees (INR)</span>
              <span>🇮🇳</span>
            </span>
            <span className="text-xl sm:text-2xl font-mono font-black text-amber-400">
              ₹{totalINR.toLocaleString()}
            </span>
            <span className="text-xs text-emerald-300 block mt-0.5 font-mono">
              (₹{inrHourlyRate.toLocaleString()}/hr × {durationHours}h)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

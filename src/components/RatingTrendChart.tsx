import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { Star, TrendingUp, Award, Calendar, MessageSquare, Filter } from 'lucide-react';
import { GuideProfile, Review } from '../types';

interface RatingTrendChartProps {
  guide: GuideProfile;
  reviews: Review[];
}

interface ChartPoint {
  id: string;
  rawDate: string;
  formattedDate: string;
  rating: number;
  cumulativeAvg: number;
  clientName: string;
  clientNationality: string;
  comment: string;
  bookingId: string;
}

export const RatingTrendChart: React.FC<RatingTrendChartProps> = ({ guide, reviews }) => {
  const [timeRange, setTimeRange] = useState<'all' | '6m' | '3m'>('all');

  // Filter and process reviews for this specific guide
  const guideReviews = useMemo(() => {
    return reviews
      .filter(r => r.guideId === guide.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [reviews, guide.id]);

  // Compute chart points with running cumulative average
  const chartData: ChartPoint[] = useMemo(() => {
    let runningSum = 0;
    return guideReviews.map((r, index) => {
      runningSum += r.rating;
      const cumulativeAvg = Math.round((runningSum / (index + 1)) * 100) / 100;
      const dateObj = new Date(r.createdAt);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      return {
        id: r.id,
        rawDate: r.createdAt,
        formattedDate,
        rating: Number(r.rating.toFixed(1)),
        cumulativeAvg,
        clientName: r.clientName,
        clientNationality: r.clientNationality,
        comment: r.comment,
        bookingId: r.bookingId
      };
    });
  }, [guideReviews]);

  // Filter by selected timeRange
  const filteredData = useMemo(() => {
    if (chartData.length === 0) return [];
    if (timeRange === 'all') return chartData;

    const now = new Date().getTime();
    const monthsLimit = timeRange === '3m' ? 3 : 6;
    const cutoffTime = now - monthsLimit * 30 * 24 * 60 * 60 * 1000;

    const filtered = chartData.filter(d => new Date(d.rawDate).getTime() >= cutoffTime);
    return filtered.length > 0 ? filtered : chartData; // Fallback to all if cutoff yields none
  }, [chartData, timeRange]);

  // Summary Metrics
  const totalCount = guideReviews.length;
  const currentAvg = totalCount > 0 ? guide.rating : 5.0;
  const fiveStarCount = guideReviews.filter(r => r.rating >= 4.9).length;
  const fiveStarRatio = totalCount > 0 ? Math.round((fiveStarCount / totalCount) * 100) : 100;

  // Recent momentum: compare last 2 vs previous
  const momentum = useMemo(() => {
    if (chartData.length < 3) return null;
    const lastPoint = chartData[chartData.length - 1].cumulativeAvg;
    const prevPoint = chartData[chartData.length - 3].cumulativeAvg;
    const diff = Math.round((lastPoint - prevPoint) * 100) / 100;
    return diff;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Client Rating Trend Over Time</h3>
            <p className="text-xs text-slate-500 font-mono">Guide: {guide.guideId} · @{guide.username}</p>
          </div>
        </div>
        <div className="text-center py-12">
          <Star className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-700 mb-1">No Reviews Logged Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once international tourists complete bookings with you, their ratings will chart your trajectory and performance trends here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Client Rating Trend Over Time
            </h3>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {guide.guideId}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporal trajectory of verified tour ratings and cumulative rolling average for @{guide.username}
          </p>
        </div>

        {/* Time range interactive filter */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              timeRange === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All History
          </button>
          <button
            onClick={() => setTimeRange('6m')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              timeRange === '6m'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 6 Months
          </button>
          <button
            onClick={() => setTimeRange('3m')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              timeRange === '3m'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] text-slate-500 block uppercase font-medium">All-Time Average</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {currentAvg.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 5.0</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] text-slate-500 block uppercase font-medium">Verified Reviews</span>
          <div className="flex items-center gap-1.5 mt-1">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {totalCount}
            </span>
            <span className="text-xs text-slate-500">tours</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] text-slate-500 block uppercase font-medium">5-Star Ratio</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xl font-bold font-mono text-emerald-700 tabular-nums">
              {fiveStarRatio}%
            </span>
            <span className="text-xs text-slate-400">({fiveStarCount}/{totalCount})</span>
          </div>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg">
          <span className="text-[11px] text-slate-500 block uppercase font-medium">Recent Momentum</span>
          <div className="flex items-center gap-1.5 mt-1">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span className="text-xl font-bold font-mono text-slate-900 tabular-nums">
              {momentum !== null && momentum > 0 ? `+${momentum.toFixed(2)}` : momentum !== null ? `${momentum.toFixed(2)}` : 'Stable'}
            </span>
            <span className="text-[10px] text-slate-400">rolling</span>
          </div>
        </div>
      </div>

      {/* Recharts Canvas */}
      <div className="w-full h-72 sm:h-80 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={filteredData}
            margin={{ top: 15, right: 15, left: -10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

            <XAxis
              dataKey="formattedDate"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />

            <YAxis
              domain={[4.0, 5.0]}
              ticks={[4.0, 4.2, 4.4, 4.6, 4.8, 5.0]}
              tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'monospace' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              tickFormatter={(val: number) => val.toFixed(1)}
            />

            {/* Overall guide average reference line */}
            <ReferenceLine
              y={currentAvg}
              stroke="#059669"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Avg: ${currentAvg.toFixed(2)}★`,
                position: 'right',
                fill: '#059669',
                fontSize: 10,
                fontFamily: 'monospace'
              }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data: ChartPoint = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3.5 rounded-lg shadow-xl border border-slate-700 text-xs max-w-xs space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 text-slate-300 font-mono text-[11px]">
                        <span>{data.formattedDate}</span>
                        <span>{data.bookingId}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">
                          {data.clientName} ({data.clientNationality})
                        </span>
                        <span className="font-mono font-bold text-amber-400">
                          {data.rating.toFixed(1)} ★
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Cumulative Average: <span className="text-emerald-400 font-bold">{data.cumulativeAvg.toFixed(2)} ★</span>
                      </div>
                      {data.comment && (
                        <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800 line-clamp-3">
                          "{data.comment}"
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Smooth cumulative area under curve */}
            <Area
              type="monotone"
              dataKey="cumulativeAvg"
              stroke="#059669"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#ratingGradient)"
              name="Cumulative Average"
            />

            {/* Discrete tour ratings dots */}
            <Line
              type="monotone"
              dataKey="rating"
              stroke="#d97706"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#d97706', stroke: '#ffffff', strokeWidth: 2 }}
              name="Tour Rating"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & Annotations */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-emerald-600 inline-block" />
            <span className="font-medium text-slate-700">Cumulative Rolling Average</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-white inline-block" />
            <span className="font-medium text-slate-700">Individual Tour Rating</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t border-dashed border-emerald-600 inline-block" />
            <span className="font-medium text-slate-700">Overall Benchmark Line</span>
          </div>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Showing {filteredData.length} of {totalCount} reviews
        </span>
      </div>

      {/* Recent Client Reviews Feed */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Latest Client Feedback Feed
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {guideReviews.slice(-4).reverse().map(rev => (
            <div
              key={rev.id}
              className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">
                    {rev.clientName} ({rev.clientNationality})
                  </span>
                  <div className="flex items-center text-amber-500 font-mono font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 mr-0.5" />
                    <span>{rev.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-slate-600 italic line-clamp-2 leading-relaxed">
                  "{rev.comment}"
                </p>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-2 pt-1 border-t border-slate-200/60">
                <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                <span>Booking: {rev.bookingId}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

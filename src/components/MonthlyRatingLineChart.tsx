import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend
} from 'recharts';
import { Star, TrendingUp, Calendar, Info } from 'lucide-react';
import { GuideProfile, Review } from '../types';

interface MonthlyRatingLineChartProps {
  guide: GuideProfile;
  reviews: Review[];
}

interface MonthlyDataPoint {
  monthKey: string;
  monthLabel: string;
  avgRating: number;
  reviewCount: number;
  cumulativeAvg: number;
}

export const MonthlyRatingLineChart: React.FC<MonthlyRatingLineChartProps> = ({
  guide,
  reviews
}) => {
  // Aggregate existing reviews array by month for this specific guide
  const monthlyData: MonthlyDataPoint[] = useMemo(() => {
    const guideReviews = reviews
      .filter(r => r.guideId === guide.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    if (guideReviews.length === 0) return [];

    const groupedByMonth: Record<
      string,
      { ratings: number[]; count: number; date: Date }
    > = {};

    guideReviews.forEach(r => {
      const d = new Date(r.createdAt);
      // Format YYYY-MM
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!groupedByMonth[key]) {
        groupedByMonth[key] = { ratings: [], count: 0, date: d };
      }
      groupedByMonth[key].ratings.push(r.rating);
      groupedByMonth[key].count += 1;
    });

    const sortedKeys = Object.keys(groupedByMonth).sort();
    let cumulativeSum = 0;
    let cumulativeCount = 0;

    return sortedKeys.map(k => {
      const group = groupedByMonth[k];
      const monthSum = group.ratings.reduce((acc, val) => acc + val, 0);
      const monthlyAvg = Math.round((monthSum / group.ratings.length) * 100) / 100;

      cumulativeSum += monthSum;
      cumulativeCount += group.ratings.length;
      const cumAvg = Math.round((cumulativeSum / cumulativeCount) * 100) / 100;

      const monthLabel = group.date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });

      return {
        monthKey: k,
        monthLabel,
        avgRating: monthlyAvg,
        reviewCount: group.count,
        cumulativeAvg: cumAvg
      };
    });
  }, [reviews, guide.id]);

  const totalReviews = useMemo(() => {
    return reviews.filter(r => r.guideId === guide.id).length;
  }, [reviews, guide.id]);

  const benchmarkAvg = guide.rating || 5.0;

  if (monthlyData.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-xs">
        <Star className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h4 className="text-xs font-bold text-slate-700">No Monthly Review Data Available</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          As tourists review completed bookings with @{guide.username}, their monthly ratings will be aggregated here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Monthly Average Rating History
            </h3>
            <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
              {guide.guideId}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Aggregated monthly client evaluation trajectory for @{guide.username} ({totalReviews} total reviews)
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Monthly Avg</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-0.5 bg-amber-500 inline-block" />
            <span>Cumulative Trend</span>
          </div>
        </div>
      </div>

      {/* Line Chart */}
      <div className="w-full h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={monthlyData}
            margin={{ top: 10, right: 20, left: -15, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="monthLabel"
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

            {/* Benchmark Average Line */}
            <ReferenceLine
              y={benchmarkAvg}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: `Lifetime ${benchmarkAvg.toFixed(2)}★`,
                position: 'right',
                fill: '#64748b',
                fontSize: 10,
                fontFamily: 'monospace'
              }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt: MonthlyDataPoint = payload[0].payload;
                  return (
                    <div className="bg-slate-900 text-white p-3 rounded-lg shadow-xl border border-slate-700 text-xs font-mono space-y-1">
                      <div className="text-[11px] font-bold text-slate-300 border-b border-slate-800 pb-1">
                        {pt.monthLabel}
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400 font-sans">Monthly Avg:</span>
                        <span className="font-bold text-emerald-400">{pt.avgRating.toFixed(2)} ★</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-400 font-sans">Tour Reviews:</span>
                        <span className="font-bold text-slate-200">{pt.reviewCount} {pt.reviewCount === 1 ? 'tour' : 'tours'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 border-t border-slate-800 pt-1">
                        <span className="text-slate-400 font-sans">Rolling Avg:</span>
                        <span className="font-bold text-amber-400">{pt.cumulativeAvg.toFixed(2)} ★</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Monthly Average Line */}
            <Line
              type="monotone"
              dataKey="avgRating"
              name="Monthly Average"
              stroke="#059669"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#059669', stroke: '#ffffff', strokeWidth: 1.5 }}
              activeDot={{ r: 6, fill: '#047857', stroke: '#ffffff', strokeWidth: 2 }}
            />

            {/* Cumulative Rolling Trend Line */}
            <Line
              type="monotone"
              dataKey="cumulativeAvg"
              name="Rolling Cumulative"
              stroke="#d97706"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Summary Badges */}
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
        <span className="text-slate-400 font-medium text-[11px]">Monthly Averages:</span>
        {monthlyData.map(d => (
          <div
            key={d.monthKey}
            className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[11px] font-mono"
          >
            <span className="text-slate-600">{d.monthLabel}:</span>
            <span className="font-bold text-emerald-800">{d.avgRating.toFixed(1)}★</span>
            <span className="text-slate-400 text-[10px]">({d.reviewCount})</span>
          </div>
        ))}
      </div>
    </div>
  );
};

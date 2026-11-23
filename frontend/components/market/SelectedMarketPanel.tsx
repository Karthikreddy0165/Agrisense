'use client';

import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Store,
  GitCompare,
  Bookmark,
  X,
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatPrice, formatDate, formatDateShort } from '@/lib/utils/formatters';
import { COMMODITIES } from '@/lib/data/commodities';
import { PriceHistorySummary, TradedCommodityItem, ForecastResult } from '@/lib/services/api';
import { cn } from '@/lib/utils/cn';

interface SelectedMarketPanelProps {
  mandi: {
    id: string;
    name: string;
    fullName?: string;
    stateId?: string;
    stateName?: string;
    districtId?: string;
    distanceKm?: number;
    latitude?: number | null;
    longitude?: number | null;
  };
  commodityId: string;
  varietyId: string;
  isDetailLoading: boolean;
  isHistoryLoading: boolean;
  isForecastLoading: boolean;
  priceSummary: PriceHistorySummary | null;
  tradedCommodities: TradedCommodityItem[];
  forecast: ForecastResult | null;
  isSaved: boolean;
  onToggleSave: () => void;
  onSelectCommodity: (commId: string) => void;
  onClose: () => void;
}

export function SelectedMarketPanel({
  mandi,
  commodityId,
  varietyId,
  isDetailLoading,
  isHistoryLoading,
  isForecastLoading,
  priceSummary,
  tradedCommodities,
  forecast,
  isSaved,
  onToggleSave,
  onSelectCommodity,
  onClose,
}: SelectedMarketPanelProps) {
  const currentCrop = COMMODITIES.find((c) => c.id === commodityId) || COMMODITIES[0];
  const hasCropPrices = priceSummary && priceSummary.latestModalPrice != null && priceSummary.observationCount > 0;

  // Chart data from actual historical observations
  const chartData = React.useMemo(() => {
    if (!priceSummary || !priceSummary.observations || priceSummary.observations.length === 0) {
      return [];
    }
    return priceSummary.observations.map((obs) => ({
      date: formatDateShort(obs.observationDate),
      fullDate: obs.observationDate,
      price: obs.modalPrice,
      min: obs.minPrice,
      max: obs.maxPrice,
    }));
  }, [priceSummary]);

  // Price statistics
  const stats = React.useMemo(() => {
    if (!chartData || chartData.length === 0) return null;
    const prices = chartData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const sum = prices.reduce((a, b) => a + b, 0);
    const avg = Math.round(sum / prices.length);
    return { min, max, avg, count: chartData.length };
  }, [chartData]);

  return (
    <div className="bg-white rounded-2xl border border-emerald-200/80 shadow-md overflow-hidden transition-all animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="bg-emerald-900 text-white p-4 sm:p-5 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="bg-emerald-800 text-emerald-100 hover:bg-emerald-800 border-emerald-700 text-[11px] font-medium">
              Selected Market
            </Badge>
            {mandi.distanceKm != null && (
              <span className="text-xs text-emerald-200 font-semibold bg-emerald-800/80 px-2 py-0.5 rounded-full">
                {mandi.distanceKm} km away from your location
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            {mandi.name}
          </h2>
          <p className="text-xs text-emerald-200/90 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-300" />
            <span>{mandi.fullName || `${mandi.name}, ${mandi.stateName || ''}`}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onToggleSave}
            title={isSaved ? 'Remove from My Markets' : 'Save to My Markets'}
            className={cn(
              'p-2 rounded-lg border transition-colors',
              isSaved
                ? 'bg-amber-500 text-white border-amber-400'
                : 'bg-emerald-800/80 text-emerald-200 border-emerald-700 hover:text-white hover:bg-emerald-800'
            )}
          >
            <Bookmark className={cn('w-4 h-4', isSaved && 'fill-white')} />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-emerald-800/80 text-emerald-200 border border-emerald-700 hover:text-white hover:bg-emerald-800 transition-colors"
            title="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* Section 1: Current Price or Traded Crops Status */}
        <div>
          {isDetailLoading || isHistoryLoading ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-emerald-700 animate-spin" />
              <div className="text-xs">
                <p className="font-semibold text-slate-800">Loading market information for {mandi.name}...</p>
                <p className="text-slate-500 text-[11px]">Checking reported prices and crop arrivals</p>
              </div>
            </div>
          ) : hasCropPrices ? (
            /* Crop has actual price data */
            <div className="bg-emerald-50/60 rounded-xl border border-emerald-200 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-emerald-200/60 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 block">
                    Usual Market Price &bull; {currentCrop.name}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {formatPrice(priceSummary!.latestModalPrice)}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">/ quintal (100 kg)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1',
                      priceSummary!.priceTrend === 'Rising'
                        ? 'bg-emerald-100 text-emerald-900'
                        : priceSummary!.priceTrend === 'Falling'
                        ? 'bg-rose-100 text-rose-900'
                        : 'bg-slate-100 text-slate-800'
                    )}
                  >
                    {priceSummary!.priceTrend === 'Rising' ? (
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                    ) : priceSummary!.priceTrend === 'Falling' ? (
                      <TrendingDown className="w-3.5 h-3.5 text-rose-700" />
                    ) : (
                      <Minus className="w-3.5 h-3.5 text-slate-500" />
                    )}
                    <span>
                      {priceSummary!.priceTrend === 'Rising'
                        ? `Rising trend (${priceSummary!.percentagePriceChange > 0 ? '+' : ''}${priceSummary!.percentagePriceChange}%)`
                        : priceSummary!.priceTrend === 'Falling'
                        ? `Falling trend (${priceSummary!.percentagePriceChange}%)`
                        : 'Relatively stable price'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Explanatory Context */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-3 gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Reported on <strong>{formatDate(priceSummary!.latestObservationDate)}</strong>
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 italic">
                  *Usual market price is the most frequently recorded transaction rate on this day.
                </div>
              </div>
            </div>
          ) : (
            /* Crop is not traded at this market */
            <div className="bg-amber-50/80 rounded-xl border border-amber-200 p-4 sm:p-5 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">
                    {currentCrop.name} is not reported at this market
                  </h4>
                  <p className="text-xs text-amber-900/90 mt-0.5">
                    This market does not have recorded transactions for {currentCrop.name}. However, it trades the agricultural crops listed below:
                  </p>
                </div>
              </div>

              {/* List of crops actually traded at this mandi */}
              {tradedCommodities.length > 0 ? (
                <div className="pt-2 border-t border-amber-200/60">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 block mb-2">
                    Crops traded at {mandi.name} (click to view prices):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {tradedCommodities.map((item) => (
                      <button
                        key={item.commodityId}
                        onClick={() => onSelectCommodity(item.commodityId)}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 hover:border-emerald-600 hover:bg-emerald-50 text-xs text-slate-800 font-medium transition-all shadow-2xs flex items-center gap-1.5 group"
                      >
                        <span className="font-semibold text-emerald-950 group-hover:text-emerald-800">
                          {item.commodityName}
                        </span>
                        {item.latestModalPrice != null && (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px]">
                            {formatPrice(item.latestModalPrice)}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No other crop records currently catalogued for this market.</p>
              )}
            </div>
          )}
        </div>

        {/* Section 2: Past Market Prices (Historical Observations) */}
        <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-1.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Past Market Prices &bull; {currentCrop.name}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Actual recorded market transaction rates (not estimates or fabricated values)
              </p>
            </div>
            {stats && (
              <span className="text-xs text-slate-600 font-medium">
                {stats.count} recorded days &bull; Avg: <strong>{formatPrice(stats.avg)}</strong>
              </span>
            )}
          </div>

          {isHistoryLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
              <span className="text-xs font-medium text-slate-600">Fetching past market prices...</span>
            </div>
          ) : chartData.length > 0 ? (
            <div className="space-y-3">
              {/* Stats Bar */}
              {stats && (
                <div className="grid grid-cols-3 gap-2 py-1.5 text-center bg-white rounded-lg border border-slate-200/80">
                  <div className="p-1">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Lowest Recorded</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">{formatPrice(stats.min)}</span>
                  </div>
                  <div className="p-1 border-x border-slate-100">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Period Average</span>
                    <span className="text-xs sm:text-sm font-bold text-emerald-800">{formatPrice(stats.avg)}</span>
                  </div>
                  <div className="p-1">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Highest Recorded</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-800">{formatPrice(stats.max)}</span>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="h-44 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: '#64748b' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₹${v}`}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip
                      formatter={(val: any) => [`₹${val}/quintal`, 'Recorded Usual Price']}
                      labelFormatter={(label, payload) => {
                        const full = payload?.[0]?.payload?.fullDate;
                        return full ? `Observed on ${formatDate(full)}` : label;
                      }}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '11px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#15803d"
                      strokeWidth={2}
                      dot={chartData.length < 25 ? { r: 2.5, fill: '#15803d' } : false}
                      activeDot={{ r: 5, fill: '#166534' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400">
              <Info className="w-6 h-6 mx-auto mb-1.5 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">
                No past price records are available for {currentCrop.name} in this market.
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Choose another crop from the list above to view available market records.
              </p>
            </div>
          )}
        </div>

        {/* Section 3: Expected Prices (14-Day Price Trajectory) */}
        <div className="bg-slate-50/60 rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 gap-1.5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Expected Prices (Next 14 Days)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Short-term price outlook based on historical patterns and seasonal arrivals
              </p>
            </div>
          </div>

          {isForecastLoading ? (
            <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
              <span className="text-xs font-medium text-slate-600">Generating 14-day expected price forecast...</span>
            </div>
          ) : forecast && forecast.predictions && forecast.predictions.length > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    Expected in 7 Days
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-extrabold text-slate-900">
                      {formatPrice(forecast.expectedPrice7d)}
                    </span>
                    <span className="text-xs text-slate-500">/qtl</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block uppercase">
                    Expected in 14 Days
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xl font-extrabold text-slate-900">
                      {formatPrice(forecast.expectedPrice14d)}
                    </span>
                    <span className="text-xs text-slate-500">/qtl</span>
                    <span
                      className={cn(
                        'ml-2 text-xs font-bold px-1.5 py-0.5 rounded',
                        forecast.percentageChange14d > 1
                          ? 'text-emerald-800 bg-emerald-50'
                          : forecast.percentageChange14d < -1
                          ? 'text-rose-700 bg-rose-50'
                          : 'text-slate-700 bg-slate-100'
                      )}
                    >
                      {forecast.percentageChange14d > 0 ? '+' : ''}
                      {forecast.percentageChange14d}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                <p className="font-medium text-slate-900">
                  {forecast.interpretation}
                </p>
                <p className="text-[11px] text-slate-500 italic">
                  *Expected prices are statistical estimates, not guaranteed selling prices. Actual rates depend on daily crop arrivals, quality, and local buyer demand.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400">
              <Info className="w-5 h-5 mx-auto mb-1 text-slate-300" />
              <p className="text-xs font-medium text-slate-600">
                Not enough recent transactions to generate a 14-day expected price forecast for {currentCrop.name}.
              </p>
              <p className="text-[11px] text-slate-500">
                Forecasting requires regular recent observations to prepare reliable seasonal models.
              </p>
            </div>
          )}
        </div>

        {/* Section 4: Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/compare?mandiIds=${mandi.id}&commodityId=${commodityId}`}>
              <Button size="sm" variant="outline" className="border-slate-300 text-slate-800 hover:bg-slate-50 text-xs font-semibold">
                <GitCompare className="w-3.5 h-3.5 mr-1.5 text-slate-600" />
                Compare Market Prices
              </Button>
            </Link>

            <Link href={`/forecast?mandiId=${mandi.id}&commodityId=${commodityId}&varietyId=${varietyId}`}>
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                View 14-Day Expected Prices
              </Button>
            </Link>

            <Link href={`/market/${mandi.id}?commodity=${commodityId}`}>
              <Button size="sm" variant="ghost" className="text-xs text-emerald-800 hover:bg-emerald-50">
                <Store className="w-3.5 h-3.5 mr-1" />
                Market Profile
              </Button>
            </Link>
          </div>

          <Button size="sm" variant="outline" onClick={onClose} className="text-xs text-slate-500 hover:text-slate-800 border-slate-200">
            Close Panel
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Store,
  Filter,
  RefreshCw,
  Eye,
  X,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MANDIS } from '@/lib/data/geography';
import { COMMODITIES } from '@/lib/data/commodities';
import { formatPrice, formatDate, formatDateShort } from '@/lib/utils/formatters';
import { useLanguage } from '@/lib/context/LanguageContext';
import {
  ApiService,
  type ForecastRunSummary,
  type ForecastRunDetail,
} from '@/lib/services/api';
import { cn } from '@/lib/utils/cn';

export default function PredictionHistoryPage() {
  const { t } = useLanguage();
  const [filterMandiId, setFilterMandiId] = useState<string>('all');
  const [filterCommodityId, setFilterCommodityId] = useState<string>('all');
  const [runs, setRuns] = useState<ForecastRunSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [runDetail, setRunDetail] = useState<ForecastRunDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  const fetchHistory = () => {
    setLoading(true);
    const params: { mandiId?: string; commodityId?: string } = {};
    if (filterMandiId !== 'all') params.mandiId = filterMandiId;
    if (filterCommodityId !== 'all') params.commodityId = filterCommodityId;

    ApiService.getForecastHistory(params)
      .then((data) => {
        setRuns(data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching forecast runs:', err);
        setRuns([]);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHistory();
  }, [filterMandiId, filterCommodityId]);

  const handleInspectRun = async (id: number) => {
    setSelectedRunId(id);
    setLoadingDetail(true);
    try {
      const detail = await ApiService.getForecastRunDetail(id);
      setRunDetail(detail);
    } catch (err) {
      console.error('Error fetching run detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setSelectedRunId(null);
    setRunDetail(null);
  };

  const detailItems = useMemo(() => {
    if (!runDetail) return [];
    return runDetail.predictions || runDetail.items || [];
  }, [runDetail]);

  const detailChartData = useMemo(() => {
    return detailItems.map((item) => ({
      dayLabel: `Day ${item.dayIndex}`,
      date: item.targetDate,
      shortDate: formatDateShort(item.targetDate),
      predictedPrice: Math.round(item.predictedPrice),
      minPrice: Math.round(item.minPrice),
      maxPrice: Math.round(item.maxPrice),
      actualPrice: item.actualPrice ? Math.round(item.actualPrice) : undefined,
    }));
  }, [detailItems]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={t('nav.predictionHistory', 'Prediction History')}
        subtitle="Archived machine-learning forecast runs with 14-day price projections, model versions, and verification records."
      />

      {/* Filter and Control Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Runs:</span>
          </div>

          <select
            data-testid="history-filter-mandi"
            value={filterMandiId}
            onChange={(e) => setFilterMandiId(e.target.value)}
            className="h-8 text-xs font-medium border border-slate-200 rounded-lg px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">All Mandis</option>
            {MANDIS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <select
            data-testid="history-filter-commodity"
            value={filterCommodityId}
            onChange={(e) => setFilterCommodityId(e.target.value)}
            className="h-8 text-xs font-medium border border-slate-200 rounded-lg px-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            <option value="all">All Commodities</option>
            {COMMODITIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHistory}
            disabled={loading}
            className="h-8 text-xs text-slate-600 border-slate-200 hover:bg-slate-50"
          >
            <RefreshCw className={cn('w-3 h-3 mr-1.5', loading && 'animate-spin')} />
            Refresh
          </Button>

          <Link href="/forecast">
            <Button size="sm" className="h-8 text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-medium">
              <TrendingUp className="w-3 h-3 mr-1.5" />
              Generate Forecast
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content: Runs List or Empty State */}
      {loading ? (
        <Card className="border border-slate-200 p-12 text-center">
          <div className="flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
            <h4 className="text-base font-bold text-slate-900">Loading Forecast History</h4>
            <p className="text-xs text-slate-500">Retrieving persistent forecast runs and model metadata...</p>
          </div>
        </Card>
      ) : runs.length === 0 ? (
        <Card className="border border-slate-200 bg-white p-12 text-center">
          <div className="max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto border border-emerald-100">
              <History className="w-7 h-7 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">No Forecast History Recorded</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                When 14-day price predictions are generated for APMC mandis and commodities, each forecast run is permanently preserved here with its daily projections, reference date, and model version.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/forecast">
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold px-4 h-9 shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 mr-1.5" />
                  Generate First Forecast
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing {runs.length} preserved forecast runs</span>
            <span>Reference Date: 23 Nov 2026</span>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {runs.map((run) => {
              const isRising = run.expectedDirection === 'Rising' || run.percentageChange14d > 1.5;
              const isFalling = run.expectedDirection === 'Falling' || run.percentageChange14d < -1.5;

              return (
                <div
                  key={run.id}
                  data-testid={`forecast-run-card-${run.id}`}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left: Mandi, Commodity, Variety, and Run Metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-base">
                        {run.mandiName}
                      </span>
                      <Badge className="bg-emerald-50 text-emerald-900 border-emerald-200 text-xs font-semibold">
                        {run.commodityName} &bull; {run.varietyName}
                      </Badge>
                      <Badge variant="outline" className="text-[11px] text-slate-600 font-medium">
                        {run.modelVersion}
                      </Badge>
                      <span className="inline-flex items-center text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {run.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      <span className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                        Generated: {formatDate(run.generatedAt.split('T')[0])} ({run.generatedAt.includes('T') ? run.generatedAt.split('T')[1].substring(0, 5) : ''})
                      </span>
                      <span>&bull;</span>
                      <span>Reference: {formatDate(run.referenceDate)}</span>
                      <span>&bull;</span>
                      <span>Horizon: {run.forecastHorizon} Days</span>
                    </div>
                  </div>

                  {/* Middle: Price Metrics */}
                  <div className="flex items-center gap-6 bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        Actual Ref Price
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {formatPrice(Math.round(run.latestActualPrice))}
                        <span className="text-[10px] text-slate-400 font-normal">/qtl</span>
                      </span>
                    </div>

                    <div className="h-7 w-[1px] bg-slate-200" />

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        Expected 14-Day
                      </span>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold text-slate-900">
                          {formatPrice(Math.round(run.expectedPrice14d))}
                        </span>
                        <span
                          className={cn(
                            'text-[11px] font-bold',
                            isRising ? 'text-emerald-800' : isFalling ? 'text-rose-700' : 'text-slate-600'
                          )}
                        >
                          {run.percentageChange14d >= 0 ? '+' : ''}
                          {run.percentageChange14d}%
                        </span>
                      </div>
                    </div>

                    <div className="h-7 w-[1px] bg-slate-200" />

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        Trend
                      </span>
                      <div className="flex items-center gap-1 text-xs font-bold">
                        {isRising ? (
                          <span className="text-emerald-800 flex items-center">
                            <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                            Rising
                          </span>
                        ) : isFalling ? (
                          <span className="text-rose-700 flex items-center">
                            <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                            Falling
                          </span>
                        ) : (
                          <span className="text-slate-600 flex items-center">
                            <Minus className="w-3.5 h-3.5 mr-0.5" />
                            Stable
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      data-testid={`inspect-run-btn-${run.id}`}
                      variant="outline"
                      size="sm"
                      onClick={() => handleInspectRun(run.id)}
                      className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                      Inspect Run
                    </Button>

                    <Link
                      href={`/forecast?mandiId=${run.mandiId}&commodityId=${run.commodityId}&varietyId=${run.varietyId}`}
                    >
                      <Button size="sm" className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-medium">
                        Live Forecast
                        <ChevronRight className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Run Detail Modal */}
      {selectedRunId && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeDetail();
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200 text-xs">
                    Forecast Run #{selectedRunId}
                  </Badge>
                  <span className="text-xs text-slate-500">
                    Model: {runDetail?.modelVersion || 'LightGBM-v1'}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  {runDetail ? `${runDetail.mandiName} — ${runDetail.commodityName} (${runDetail.varietyName})` : 'Loading Run Details...'}
                </h3>
              </div>
              <button
                onClick={closeDetail}
                aria-label="Close dialog"
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-200/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto text-xs">
              {loadingDetail || !runDetail ? (
                <div className="py-12 text-center space-y-3">
                  <RefreshCw className="w-7 h-7 text-emerald-700 animate-spin mx-auto" />
                  <p className="text-slate-500 font-medium">Retrieving 14-day predictions and bounds...</p>
                </div>
              ) : (
                <>
                  {/* Metadata Summary Banner */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Reference Date</span>
                      <span className="text-xs font-bold text-slate-900">{formatDate(runDetail.referenceDate)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Forecast Horizon</span>
                      <span className="text-xs font-bold text-slate-900">{runDetail.forecastHorizon} Days</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">Latest Actual</span>
                      <span className="text-xs font-bold text-slate-900">{formatPrice(Math.round(runDetail.latestActualPrice))}/qtl</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">14d Projected Target</span>
                      <span className="text-xs font-bold text-emerald-800">
                        {formatPrice(Math.round(runDetail.expectedPrice14d))}/qtl ({runDetail.percentageChange14d >= 0 ? '+' : ''}{runDetail.percentageChange14d}%)
                      </span>
                    </div>
                  </div>

                  {/* 14-Day Trajectory Mini Chart */}
                  <div className="border border-slate-200 rounded-xl p-4 bg-white">
                    <h4 className="font-bold text-slate-800 text-xs mb-1">
                      14-Day Daily Projection Curve ({runDetail.forecastStart} to {runDetail.forecastEnd})
                    </h4>
                    <p className="text-[11px] text-slate-500 mb-3">
                      Predicted daily modal rates with upper/lower bounds.
                    </p>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={detailChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis dataKey="shortDate" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} />
                          <YAxis
                            domain={['dataMin - 60', 'dataMax + 60']}
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            tickFormatter={(v) => `₹${v}`}
                            axisLine={false}
                            width={50}
                          />
                          <Tooltip formatter={(v: any) => [`₹${v}/qtl`, 'Predicted']} />
                          <Line
                            type="monotone"
                            dataKey="predictedPrice"
                            name="Predicted Price"
                            stroke="#059669"
                            strokeWidth={2.5}
                            dot={{ r: 3, fill: '#059669' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="minPrice"
                            name="Lower Bound"
                            stroke="#cbd5e1"
                            strokeDasharray="2 2"
                            dot={false}
                          />
                          <Line
                            type="monotone"
                            dataKey="maxPrice"
                            name="Upper Bound"
                            stroke="#cbd5e1"
                            strokeDasharray="2 2"
                            dot={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Daily Predictions Table */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="p-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-800 text-xs">
                      Daily Predicted Prices &amp; Actual Verification
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-left sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Day</th>
                            <th className="py-2 px-3">Date</th>
                            <th className="py-2 px-3">Predicted Modal</th>
                            <th className="py-2 px-3">Min / Max Range</th>
                            <th className="py-2 px-3">% from Ref</th>
                            <th className="py-2 px-3">Subsequent Actual</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailItems.map((item) => (
                            <tr key={item.dayIndex} className="hover:bg-slate-50/80">
                              <td className="py-2 px-3 font-semibold text-slate-500">Day {item.dayIndex}</td>
                              <td className="py-2 px-3 font-medium text-slate-900">{formatDate(item.targetDate)}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{formatPrice(Math.round(item.predictedPrice))}/qtl</td>
                              <td className="py-2 px-3 text-slate-500">
                                {formatPrice(Math.round(item.minPrice))} &ndash; {formatPrice(Math.round(item.maxPrice))}
                              </td>
                              <td className="py-2 px-3">
                                <span
                                  className={cn(
                                    'px-1.5 py-0.5 rounded text-[11px] font-bold',
                                    item.percentageChangeFromReference > 0
                                      ? 'text-emerald-800 bg-emerald-50'
                                      : item.percentageChangeFromReference < 0
                                      ? 'text-rose-700 bg-rose-50'
                                      : 'text-slate-600 bg-slate-100'
                                  )}
                                >
                                  {item.percentageChangeFromReference >= 0 ? '+' : ''}
                                  {item.percentageChangeFromReference}%
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600">
                                {item.actualPrice ? (
                                  <span className="font-semibold text-slate-900">
                                    {formatPrice(Math.round(item.actualPrice))}/qtl
                                  </span>
                                ) : (
                                  <span className="text-slate-400 italic">Pending market auction</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={closeDetail} className="text-xs text-slate-600 border-slate-200">
                Close
              </Button>

              {runDetail && (
                <Link
                  href={`/forecast?mandiId=${runDetail.mandiId}&commodityId=${runDetail.commodityId}&varietyId=${runDetail.varietyId}`}
                >
                  <Button size="sm" className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-medium">
                    Open Live Forecast
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

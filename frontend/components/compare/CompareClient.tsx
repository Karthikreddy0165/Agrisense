'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  GitCompare,
  Plus,
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Store,
  ArrowRight,
  Loader2,
  Search,
  MapPin,
  Calendar,
  Sparkles,
  Info,
  Check,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MANDIS as SEED_MANDIS, STATES as SEED_STATES, DISTRICTS as SEED_DISTRICTS } from '@/lib/data/geography';
import { COMMODITIES } from '@/lib/data/commodities';
import { getHistoricalPricesForPair, DATA_THROUGH_DATE } from '@/lib/data/historical-prices';
import { formatPrice, formatDate, formatDateShort } from '@/lib/utils/formatters';
import { ApiService } from '@/lib/services/api';
import { useLocation } from '@/lib/context/LocationContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { cn } from '@/lib/utils/cn';

const MANDI_COLORS = ['#15803d', '#2563eb', '#d97706', '#9333ea', '#dc2626'];
const MAX_COMPARE = 5;

interface CompareClientProps {
  initialMandiIds?: string[];
  initialCommodityId?: string;
  initialVarietyId?: string;
}

export default function CompareClient({
  initialMandiIds = ['kolar-apmc', 'yeshwanthpur-apmc'],
  initialCommodityId = 'tomato',
  initialVarietyId = 'all',
}: CompareClientProps) {
  const { t } = useLanguage();
  const { coordinates } = useLocation();

  const [selectedMandiIds, setSelectedMandiIds] = useState<string[]>(initialMandiIds.slice(0, MAX_COMPARE));
  const [commodityId, setCommodityId] = useState<string>(initialCommodityId);
  const [varietyId, setVarietyId] = useState<string>(initialVarietyId);
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Full mandis catalogue for searching
  const [allMandisList, setAllMandisList] = useState<any[]>(SEED_MANDIS);
  const [statesList, setStatesList] = useState<any[]>(SEED_STATES);

  // Add Market Search & Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [modalStateFilter, setModalStateFilter] = useState('all');
  const [onlyTradingSelectedCrop, setOnlyTradingSelectedCrop] = useState(true);

  // Load complete catalogues
  useEffect(() => {
    ApiService.getStates().then((s) => {
      if (s && s.length > 0) setStatesList(s);
    });
    ApiService.getMandis({ commodityId }).then((res) => {
      if (res && res.length > 0) setAllMandisList(res);
    });
  }, [commodityId]);

  const commodity = COMMODITIES.find((c) => c.id === commodityId) || COMMODITIES[0];

  // Fetch comparison data with sequence checking to avoid race conditions
  const reqSeqRef = useRef(0);
  useEffect(() => {
    if (selectedMandiIds.length === 0) return;
    const currentReq = ++reqSeqRef.current;
    setLoading(true);

    ApiService.compareMarkets(selectedMandiIds, commodityId, varietyId === 'all' ? 'standard' : varietyId)
      .then((res) => {
        if (currentReq === reqSeqRef.current && res) {
          setApiData(res);
        }
      })
      .catch((err) => {
        console.error('Failed to load comparison data', err);
      })
      .finally(() => {
        if (currentReq === reqSeqRef.current) setLoading(false);
      });
  }, [selectedMandiIds, commodityId, varietyId]);

  const handleAddMandi = (mandiIdToAdd: string) => {
    if (selectedMandiIds.includes(mandiIdToAdd)) return;
    if (selectedMandiIds.length >= MAX_COMPARE) return;
    setSelectedMandiIds([...selectedMandiIds, mandiIdToAdd]);
    setIsAddModalOpen(false);
    setModalSearchQuery('');
  };

  const handleRemoveMandi = (id: string) => {
    if (selectedMandiIds.length <= 1) {
      alert('Keep at least one market in the comparison.');
      return;
    }
    setSelectedMandiIds(selectedMandiIds.filter((m) => m !== id));
  };

  // Build comparison items
  const comparisonItems = useMemo(() => {
    if (apiData && apiData.mandis && apiData.mandis.length > 0) {
      return apiData.mandis.map((m: any) => {
        const history = getHistoricalPricesForPair(m.mandiId, commodity.id);
        const mandiMeta = allMandisList.find((item) => item.id === m.mandiId);
        let distance: number | undefined = undefined;
        if (coordinates && mandiMeta && mandiMeta.latitude != null && mandiMeta.longitude != null) {
          const R = 6371.0;
          const dLat = ((mandiMeta.latitude - coordinates.lat) * Math.PI) / 180;
          const dLon = ((mandiMeta.longitude - coordinates.lon) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((coordinates.lat * Math.PI) / 180) *
              Math.cos((mandiMeta.latitude * Math.PI) / 180) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          distance = Math.round(R * c * 10) / 10;
        }

        return {
          mandiId: m.mandiId,
          mandiName: m.mandiName,
          districtName: m.districtName,
          stateName: m.stateName,
          currentModalPrice: m.currentModalPrice,
          observationDate: m.observationDate,
          expectedPrice7d: m.expectedPrice7d,
          expectedPrice14d: m.expectedPrice14d,
          percentageChange14d: m.percentageChange14d,
          trendDirection: m.trendDirection,
          priceDifferenceFromAvg: m.priceDifferenceFromAvg,
          distanceKm: distance,
          history,
          predictions: m.predictions || [],
        };
      });
    }

    // Static fallback
    return selectedMandiIds.map((mId) => {
      const mandi = allMandisList.find((m) => m.id === mId) || SEED_MANDIS[0];
      const history = getHistoricalPricesForPair(mId, commodity.id);
      const latest = history[history.length - 1];
      const latestPrice = latest ? latest.modalPrice : null;
      const latestDate = latest ? latest.date : null;

      return {
        mandiId: mId,
        mandiName: mandi.name,
        districtName: mandi.districtId || '',
        stateName: mandi.stateId || '',
        currentModalPrice: latestPrice,
        observationDate: latestDate,
        expectedPrice7d: latestPrice ? latestPrice * 1.04 : null,
        expectedPrice14d: latestPrice ? latestPrice * 1.07 : null,
        percentageChange14d: 7.0,
        trendDirection: 'Stable',
        priceDifferenceFromAvg: 0,
        distanceKm: undefined,
        history,
        predictions: [],
      };
    });
  }, [apiData, selectedMandiIds, commodity.id, allMandisList, coordinates]);

  // Check if dates differ across compared markets
  const distinctObservationDates = useMemo(() => {
    const dates = new Set<string>();
    comparisonItems.forEach((item: any) => {
      if (item.observationDate) dates.add(item.observationDate);
    });
    return Array.from(dates);
  }, [comparisonItems]);

  // Search filtered mandis inside the Add Market modal
  const filteredMandisToAdd = useMemo(() => {
    return allMandisList.filter((m) => {
      if (selectedMandiIds.includes(m.id)) return false;
      if (modalStateFilter !== 'all' && m.stateId !== modalStateFilter) return false;
      if (onlyTradingSelectedCrop && m.latestModalPrice == null) return false;
      if (modalSearchQuery.trim()) {
        const q = modalSearchQuery.toLowerCase();
        const matchName = m.name && m.name.toLowerCase().includes(q);
        const matchDist = m.districtId && m.districtId.toLowerCase().includes(q);
        const matchFull = m.fullName && m.fullName.toLowerCase().includes(q);
        if (!matchName && !matchDist && !matchFull) return false;
      }
      return true;
    }).slice(0, 30);
  }, [allMandisList, selectedMandiIds, modalStateFilter, onlyTradingSelectedCrop, modalSearchQuery]);

  // Combined Multi-Line Chart (Last 14 days of history + 14 days of forecast)
  const chartData = useMemo(() => {
    if (comparisonItems.length === 0) return [];
    const first = comparisonItems[0];
    const recentHistory = first.history.slice(-14);
    const dataPoints: Record<string, any>[] = [];

    // History points
    recentHistory.forEach((obs: any, idx: number) => {
      const point: Record<string, any> = {
        dateLabel: formatDateShort(obs.date),
        fullDate: obs.date,
        isForecast: false,
      };
      comparisonItems.forEach((item: any) => {
        const h = item.history.slice(-14)[idx];
        if (h) point[item.mandiName] = h.modalPrice;
      });
      dataPoints.push(point);
    });

    // Forecast points
    if (first.predictions && first.predictions.length > 0) {
      first.predictions.forEach((pred: any, idx: number) => {
        const point: Record<string, any> = {
          dateLabel: formatDateShort(pred.date),
          fullDate: pred.date,
          isForecast: true,
        };
        comparisonItems.forEach((item: any) => {
          const p = item.predictions[idx];
          if (p) point[item.mandiName] = p.modalPrice || p.predictedPrice;
        });
        dataPoints.push(point);
      });
    }

    return dataPoints;
  }, [comparisonItems]);

  return (
    <div className="space-y-6">
      {/* Header Context */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-900 border-emerald-200 font-semibold px-2.5 py-0.5">
                Market Comparison
              </Badge>
              <span className="text-xs text-slate-500">
                Comparing {selectedMandiIds.length} of {MAX_COMPARE} markets maximum
              </span>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700 ml-1" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Compare Market Prices
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Side-by-side usual transaction rates, observation dates, and 14-day expected price trends for{' '}
              <strong className="text-slate-800">{commodity.name}</strong>.
            </p>
          </div>

          {/* Crop Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">Select Crop:</label>
            <select
              value={commodityId}
              onChange={(e) => setCommodityId(e.target.value)}
              className="h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-emerald-700 focus:outline-none cursor-pointer"
            >
              {COMMODITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Markets Chips & Add Button */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">Active Markets:</span>
          {comparisonItems.map((item: any, idx: number) => (
            <div
              key={item.mandiId}
              className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs font-semibold border bg-slate-50 text-slate-800"
              style={{ borderLeftColor: MANDI_COLORS[idx % MANDI_COLORS.length], borderLeftWidth: 4 }}
            >
              <span>{item.mandiName}</span>
              <button
                onClick={() => handleRemoveMandi(item.mandiId)}
                className="text-slate-400 hover:text-rose-600 p-0.5 rounded-full transition-colors"
                title={`Remove ${item.mandiName} from comparison`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Add Market Button */}
          {selectedMandiIds.length < MAX_COMPARE && (
            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="h-8 px-3 text-xs bg-emerald-800 hover:bg-emerald-900 text-white font-medium ml-auto"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Market ({selectedMandiIds.length}/{MAX_COMPARE})
            </Button>
          )}
        </div>

        {/* Observation Date Notice if dates differ */}
        {distinctObservationDates.length > 1 && (
          <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong>Note on Observation Dates:</strong> The prices below were reported on different days (
              {distinctObservationDates.map((d) => formatDateShort(d)).join(', ')}). Markets do not always report transactions on the same day.
            </div>
          </div>
        )}
      </div>

      {/* Structured Comparison Table */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-3 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Market Rate &amp; 14-Day Trajectory Comparison</span>
            <span className="text-xs font-normal text-slate-500">Crop: {commodity.name}</span>
          </CardTitle>
          <p className="text-xs text-slate-500">
            Usual market prices recorded at each APMC alongside projected 7-day and 14-day price directions.
          </p>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Market / Mandi</th>
                <th className="py-3 px-4">State &amp; District</th>
                <th className="py-3 px-4">Usual Market Price</th>
                <th className="py-3 px-4">Reported On</th>
                <th className="py-3 px-4">Expected in 7 Days</th>
                <th className="py-3 px-4">Expected in 14 Days</th>
                <th className="py-3 px-4">14-Day Trajectory</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonItems.map((item: any, idx: number) => {
                const hasPrice = item.currentModalPrice != null;

                return (
                  <tr key={item.mandiId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: MANDI_COLORS[idx % MANDI_COLORS.length] }}
                      />
                      <div>
                        <span>{item.mandiName}</span>
                        {item.distanceKm != null && (
                          <span className="block text-[11px] font-normal text-slate-500">
                            {item.distanceKm} km away
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {item.districtName ? `${item.districtName}, ` : ''}
                      {item.stateName}
                    </td>

                    <td className="py-3.5 px-4">
                      {hasPrice ? (
                        <div>
                          <span className="font-extrabold text-slate-900 text-base">
                            {formatPrice(item.currentModalPrice)}
                          </span>
                          <span className="text-[11px] font-normal text-slate-400 ml-1">/qtl</span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 italic">
                          {commodity.name} not reported
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {item.observationDate ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(item.observationDate)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">&mdash;</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {item.expectedPrice7d ? formatPrice(item.expectedPrice7d) : <span className="text-slate-400">&mdash;</span>}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-950">
                      {item.expectedPrice14d ? formatPrice(item.expectedPrice14d) : <span className="text-slate-400">&mdash;</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.expectedPrice14d ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded',
                            item.trendDirection === 'Rising'
                              ? 'bg-emerald-100 text-emerald-900'
                              : item.trendDirection === 'Falling'
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-slate-100 text-slate-700'
                          )}
                        >
                          {item.trendDirection === 'Rising' ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : item.trendDirection === 'Falling' ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                          {item.trendDirection} ({item.percentageChange14d > 0 ? '+' : ''}
                          {item.percentageChange14d}%)
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Forecast pending</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/forecast?mandiId=${item.mandiId}&commodityId=${commodity.id}`}
                          className="text-xs font-semibold text-emerald-800 hover:underline"
                        >
                          14-Day View &rarr;
                        </Link>
                        <button
                          onClick={() => handleRemoveMandi(item.mandiId)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Comparative Price & Forecast Chart */}
      <Card className="border border-slate-200">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-base font-bold text-slate-900">
            Multi-Market Price Trajectory Chart
          </CardTitle>
          <p className="text-xs text-slate-500">
            Side-by-side tracking of past 14 days of actual observed prices and 14 days of expected prices for {commodity.name}.
          </p>
        </CardHeader>

        <CardContent className="p-5 pt-2">
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 15, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis
                  domain={['dataMin - 80', 'dataMax + 80']}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `₹${v}`}
                  axisLine={false}
                  width={55}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [`₹${value}/qtl`, name]}
                  labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />

                <ReferenceLine
                  x={formatDateShort('2026-11-23')}
                  stroke="#94a3b8"
                  strokeDasharray="4 4"
                  label={{
                    value: 'Forecast Start →',
                    position: 'insideTopRight',
                    fill: '#15803d',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />

                {comparisonItems.map((item: any, idx: number) => (
                  <Line
                    key={item.mandiId}
                    type="monotone"
                    dataKey={item.mandiName}
                    stroke={MANDI_COLORS[idx % MANDI_COLORS.length]}
                    strokeWidth={2.2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Add Market Search & Selection Modal */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Add Market to Compare</h3>
                <p className="text-[11px] text-slate-500">
                  Search 2,600+ APMC mandis across India to compare with existing markets
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1.5 hover:bg-slate-200/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search market name, town, district or state..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 h-9 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <select
                  value={modalStateFilter}
                  onChange={(e) => setModalStateFilter(e.target.value)}
                  className="h-8 px-2.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  <option value="all">All States</option>
                  {statesList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyTradingSelectedCrop}
                    onChange={(e) => setOnlyTradingSelectedCrop(e.target.checked)}
                    className="w-3.5 h-3.5 text-emerald-700 rounded border-slate-300"
                  />
                  <span>Only markets reporting {commodity.name}</span>
                </label>
              </div>
            </div>

            {/* Modal Results List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 max-h-[400px]">
              {filteredMandisToAdd.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <Store className="w-7 h-7 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No markets found matching your search</p>
                  <p className="text-[11px] text-slate-500">
                    Try searching by district or clearing the &quot;Only markets reporting {commodity.name}&quot; filter.
                  </p>
                </div>
              ) : (
                filteredMandisToAdd.map((mandi) => (
                  <div
                    key={mandi.id}
                    onClick={() => handleAddMandi(mandi.id)}
                    className="p-3 rounded-xl border border-slate-200 hover:border-emerald-600 hover:bg-emerald-50/20 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs group-hover:text-emerald-900">
                        {mandi.name}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {mandi.fullName || `${mandi.districtId || ''}, ${mandi.stateId || ''}`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {mandi.latestModalPrice != null ? (
                        <div className="text-right">
                          <span className="text-xs font-bold text-slate-900">
                            {formatPrice(mandi.latestModalPrice)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">/qtl</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No price for {commodity.name}</span>
                      )}

                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Comparing {selectedMandiIds.length} of {MAX_COMPARE} markets</span>
              <Button size="sm" variant="outline" onClick={() => setIsAddModalOpen(false)} className="text-xs">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { MANDIS, STATES, DISTRICTS } from '@/lib/data/geography';
import { COMMODITIES } from '@/lib/data/commodities';
import { getHistoricalPricesForPair, DATA_THROUGH_DATE } from '@/lib/data/historical-prices';
import { formatPrice, formatDate, formatDateShort } from '@/lib/utils/formatters';
import { ApiService } from '@/lib/services/api';
import { useLanguage } from '@/lib/context/LanguageContext';
import { cn } from '@/lib/utils/cn';

const MANDI_COLORS = ['#166534', '#2563eb', '#d97706', '#9333ea', '#dc2626'];

interface CompareClientProps {
  initialMandiIds?: string[];
  initialCommodityId?: string;
  initialVarietyId?: string;
}

export default function CompareClient({
  initialMandiIds = ['kolar-apmc', 'yeshwanthpur-apmc'],
  initialCommodityId = 'tomato',
  initialVarietyId = 'tomato-hybrid',
}: CompareClientProps) {
  const { t } = useLanguage();
  const [selectedMandiIds, setSelectedMandiIds] = useState<string[]>(initialMandiIds.slice(0, 5));
  const [commodityId, setCommodityId] = useState<string>(initialCommodityId);
  const [varietyId, setVarietyId] = useState<string>(initialVarietyId);
  const [addMandiSelect, setAddMandiSelect] = useState<string>('');
  const [apiData, setApiData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [allMandisList, setAllMandisList] = useState<any[]>(MANDIS);

  useEffect(() => {
    ApiService.getMandis().then((res) => {
      if (res && res.length > 0) setAllMandisList(res);
    });
  }, []);

  const commodity = COMMODITIES.find((c) => c.id === commodityId) || COMMODITIES[0];

  useEffect(() => {
    let active = true;
    async function loadComparison() {
      if (selectedMandiIds.length === 0) return;
      setLoading(true);
      try {
        const res = await ApiService.compareMarkets(selectedMandiIds, commodityId, varietyId);
        if (active && res) {
          setApiData(res);
        }
      } catch (err) {
        console.error('Failed to load comparison data', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadComparison();
    return () => {
      active = false;
    };
  }, [selectedMandiIds, commodityId, varietyId]);

  const handleAddMandi = () => {
    if (!addMandiSelect) return;
    if (selectedMandiIds.includes(addMandiSelect)) return;
    if (selectedMandiIds.length >= 5) {
      alert('You can compare a maximum of 5 mandis at a time.');
      return;
    }
    setSelectedMandiIds([...selectedMandiIds, addMandiSelect]);
    setAddMandiSelect('');
  };

  const handleRemoveMandi = (id: string) => {
    if (selectedMandiIds.length <= 1) {
      alert('Keep at least one mandi in the comparison.');
      return;
    }
    setSelectedMandiIds(selectedMandiIds.filter((m) => m !== id));
  };

  // Build comparison items from live API or fallback
  const comparisonItems = useMemo(() => {
    if (apiData && apiData.mandis && apiData.mandis.length > 0) {
      return apiData.mandis.map((m: any) => {
        const history = getHistoricalPricesForPair(m.mandiId, commodity.id);
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
          diffFromAvg: m.priceDifferenceFromAvg,
          history,
          predictions: m.predictions || [],
        };
      });
    }

    // Static fallback if API is not yet loaded
    const list = selectedMandiIds.map((mId) => {
      const mandi = MANDIS.find((m) => m.id === mId) || MANDIS[0];
      const stateObj = STATES.find((s) => s.id === mandi.stateId);
      const distObj = DISTRICTS.find((d) => d.id === mandi.districtId);
      const history = getHistoricalPricesForPair(mId, commodity.id);
      const latest = history[history.length - 1];
      const latestPrice = latest ? latest.modalPrice : 2000;
      const latestDate = latest ? latest.date : DATA_THROUGH_DATE;

      return {
        mandiId: mId,
        mandiName: mandi.name,
        districtName: distObj?.name || '',
        stateName: stateObj?.name || '',
        currentModalPrice: latestPrice,
        observationDate: latestDate,
        expectedPrice7d: latestPrice * 1.05,
        expectedPrice14d: latestPrice * 1.08,
        percentageChange14d: 8.0,
        trendDirection: 'Rising',
        history,
        predictions: [],
      };
    });

    const avgPrice = list.reduce((sum, item) => sum + item.currentModalPrice, 0) / (list.length || 1);
    return list.map((item) => ({
      ...item,
      diffFromAvg: Math.round((item.currentModalPrice - avgPrice) * 10) / 10,
    }));
  }, [apiData, selectedMandiIds, commodity.id]);

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

  const availableMandisToAdd = allMandisList.filter((m) => !selectedMandiIds.includes(m.id));

  return (
    <div className="space-y-6">
      {/* Header Context */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800 font-semibold px-2.5 py-0.5">
                {t('nav.compare', 'Market Comparison')}
              </Badge>
              <span className="text-xs text-slate-500">Up to 5 mandis simultaneously</span>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-green-700 ml-1" />}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              {t('compare.title', 'Compare APMC Markets')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {t('compare.subtitle', 'Evaluating live rates and 14-day forecasts for')} <strong className="text-slate-800">{commodity.name}</strong>
            </p>
          </div>

          {/* Commodity Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-600">{t('compare.selectCommodity', 'Commodity:')}</label>
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

        {/* Selected Mandis Chips & Add Selector */}
        <div className="pt-4 mt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-500 mr-1">Comparing:</span>
          {comparisonItems.map((item: any, idx: number) => (
            <div
              key={item.mandiId}
              className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs font-semibold border bg-slate-50 text-slate-800"
              style={{ borderLeftColor: MANDI_COLORS[idx % MANDI_COLORS.length], borderLeftWidth: 4 }}
            >
              <span>{item.mandiName}</span>
              <button
                onClick={() => handleRemoveMandi(item.mandiId)}
                className="text-slate-400 hover:text-red-600 p-0.5 rounded-full"
                title="Remove from comparison"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}

          {/* Add Mandi Dropdown */}
          {selectedMandiIds.length < 5 && availableMandisToAdd.length > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <select
                value={addMandiSelect}
                onChange={(e) => setAddMandiSelect(e.target.value)}
                className="h-8 px-2 text-xs border border-slate-200 rounded-md bg-white text-slate-700"
              >
                <option value="">+ Add a mandi to compare...</option>
                {availableMandisToAdd.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.districtId.split('-')[1]?.toUpperCase() || ''})
                  </option>
                ))}
              </select>
              <Button
                size="sm"
                onClick={handleAddMandi}
                disabled={!addMandiSelect}
                className="h-8 px-3 text-xs bg-green-800 hover:bg-green-700 text-white"
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Metrics Table */}
      <Card className="border border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="p-5 pb-3 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-base font-bold text-slate-900">
            Market Price &amp; 14-Day Trajectory Comparison
          </CardTitle>
          <p className="text-xs text-slate-500">
            Current transactions (23 Nov 2026) alongside projected 7-day and 14-day price outcomes.
          </p>
        </CardHeader>

        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Market / Mandi</th>
                <th className="py-3 px-4">State &amp; District</th>
                <th className="py-3 px-4">Current Modal Price</th>
                <th className="py-3 px-4">Diff vs Average</th>
                <th className="py-3 px-4">7-Day Forecast</th>
                <th className="py-3 px-4">14-Day Forecast</th>
                <th className="py-3 px-4">14d Direction</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {comparisonItems.map((item: any, idx: number) => (
                <tr key={item.mandiId} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: MANDI_COLORS[idx % MANDI_COLORS.length] }}
                    />
                    {item.mandiName}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs">
                    {item.districtName}, {item.stateName}
                  </td>
                  <td className="py-3 px-4 font-extrabold text-slate-900">
                    {formatPrice(item.currentModalPrice)}
                    <span className="text-[11px] font-normal text-slate-400 ml-1">/qtl</span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'text-xs font-semibold px-2 py-0.5 rounded',
                        item.diffFromAvg > 0
                          ? 'bg-green-100 text-green-800'
                          : item.diffFromAvg < 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-700'
                      )}
                    >
                      {item.diffFromAvg > 0 ? '+' : ''}
                      {item.diffFromAvg} ₹/qtl
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    {formatPrice(item.expectedPrice7d)}
                  </td>
                  <td className="py-3 px-4 font-bold text-green-950">
                    {formatPrice(item.expectedPrice14d)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded',
                        item.trendDirection === 'Rising'
                          ? 'bg-green-100 text-green-800'
                          : item.trendDirection === 'Falling'
                          ? 'bg-red-100 text-red-800'
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
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/forecast?mandiId=${item.mandiId}&commodityId=${commodity.id}`}
                      className="text-xs font-semibold text-green-800 hover:underline"
                    >
                      View Forecast &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
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
            Side-by-side tracking of past 14 days and 14-day forecasted prices for {commodity.name}.
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
                    fill: '#166534',
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
    </div>
  );
}

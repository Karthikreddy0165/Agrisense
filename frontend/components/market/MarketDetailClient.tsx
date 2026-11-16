'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Store,
  MapPin,
  TrendingUp,
  GitCompare,
  Bookmark,
  Calendar,
  Layers,
  BarChart3,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MANDIS, STATES, DISTRICTS } from '@/lib/data/geography';
import { COMMODITIES } from '@/lib/data/commodities';
import { getHistoricalPricesForPair, DATA_THROUGH_DATE } from '@/lib/data/historical-prices';
import { useSavedMarkets } from '@/lib/hooks/useSavedMarkets';
import { formatPrice, formatDate, formatDateShort } from '@/lib/utils/formatters';
import { ApiService } from '@/lib/services/api';
import { useLanguage } from '@/lib/context/LanguageContext';
import { cn } from '@/lib/utils/cn';

interface MarketDetailClientProps {
  initialMandiId?: string;
  initialCommodityId?: string;
}

export default function MarketDetailClient({
  initialMandiId = 'kolar-apmc',
  initialCommodityId = 'tomato',
}: MarketDetailClientProps) {
  const { t } = useLanguage();
  const [mandiId, setMandiId] = useState<string>(initialMandiId);
  const [commodityId, setCommodityId] = useState<string>(initialCommodityId);
  const [timeframeDays, setTimeframeDays] = useState<7 | 30 | 90>(30);
  const [varietyId, setVarietyId] = useState<string>('standard');
  const [liveHistory, setLiveHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const { isSaved, toggle } = useSavedMarkets();

  const [mandiDetails, setMandiDetails] = useState<any>(
    () => MANDIS.find((m) => m.id === mandiId) || { id: mandiId, name: mandiId, stateId: '', districtId: '', fullName: mandiId }
  );

  useEffect(() => {
    ApiService.getMandi(mandiId).then((m) => {
      if (m) setMandiDetails(m);
    });
  }, [mandiId]);

  const mandi = mandiDetails;
  const stateObj = STATES.find((s) => s.id === mandi.stateId) || { id: mandi.stateId, name: mandi.stateId };
  const distObj = DISTRICTS.find((d) => d.id === mandi.districtId) || { id: mandi.districtId, name: mandi.districtId };
  const commodity = COMMODITIES.find((c) => c.id === commodityId) || COMMODITIES[0];

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const summary = await ApiService.getPriceHistorySummary(mandi.id, commodity.id, varietyId, timeframeDays);
        if (active && summary && summary.observations) {
          // If variety is specific, filter or use summary observations
          const obs = summary.observations.filter(
            (o) => !varietyId || varietyId === 'standard' || o.varietyId === varietyId || o.varietyId === 'standard'
          );
          setLiveHistory(obs.length > 0 ? obs : summary.observations);
        }
      } catch (err) {
        console.error('Error loading historical prices', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [mandi.id, commodity.id, varietyId, timeframeDays]);

  const historicalObservations = useMemo(() => {
    if (liveHistory && liveHistory.length > 0) {
      return liveHistory.slice(-timeframeDays);
    }
    const raw = getHistoricalPricesForPair(mandi.id, commodity.id);
    return raw.slice(-timeframeDays);
  }, [liveHistory, mandi.id, commodity.id, timeframeDays]);

  const latestObs = historicalObservations[historicalObservations.length - 1];
  const prevObs = historicalObservations[historicalObservations.length - 2];

  const modalPrice = latestObs ? latestObs.modalPrice : 1850;
  const minPrice = latestObs ? latestObs.minPrice : 1650;
  const maxPrice = latestObs ? latestObs.maxPrice : 2050;
  const arrivals = latestObs?.arrivals || 85.0;
  const obsDate = latestObs ? (latestObs.observationDate || latestObs.date) : DATA_THROUGH_DATE;

  const pctChange =
    latestObs && prevObs
      ? Math.round(((latestObs.modalPrice - prevObs.modalPrice) / prevObs.modalPrice) * 1000) / 10
      : 0;
  const absChange =
    latestObs && prevObs
      ? Math.round((latestObs.modalPrice - prevObs.modalPrice) * 100) / 100
      : 0;

  const chartData = useMemo(() => {
    return historicalObservations.map((obs) => {
      const d = obs.observationDate || obs.date;
      return {
        dateLabel: formatDateShort(d),
        fullDate: d,
        modalPrice: obs.modalPrice,
        minPrice: obs.minPrice,
        maxPrice: obs.maxPrice,
        arrivals: obs.arrivals || Math.round((obs.modalPrice / 40.0 + 30) * 10) / 10,
      };
    });
  }, [historicalObservations]);

  const saved = isSaved(mandi.id, commodity.id);

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-green-100 text-green-900 border-green-200 font-semibold px-2.5 py-0.5">
                APMC Market Profile
              </Badge>
              <span className="text-xs text-slate-500 flex items-center">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {distObj?.name}, {stateObj?.name}
              </span>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-green-700 ml-1" />}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {mandi.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {mandi.fullName || mandi.name}
              {mandi.latitude != null && mandi.longitude != null
                ? ` • Coordinates: ${mandi.latitude.toFixed(4)}°N, ${mandi.longitude.toFixed(4)}°E`
                : ' • Coordinates Pending'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => toggle(mandi.id, commodity.id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors',
                saved
                  ? 'bg-green-50 text-green-800 border-green-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              )}
            >
              <Bookmark className="w-3.5 h-3.5" fill={saved ? '#166534' : 'none'} />
              {saved ? t('btn.saved', 'Saved Market') : t('btn.save', 'Save Market')}
            </button>

            <Link href={`/compare?mandiIds=${mandi.id}&commodityId=${commodity.id}&varietyId=${varietyId}`}>
              <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 h-9">
                <GitCompare className="w-3.5 h-3.5 mr-1 text-slate-600" />
                {t('btn.compare', 'Compare')}
              </Button>
            </Link>

            <Link href={`/forecast?mandiId=${mandi.id}&commodityId=${commodity.id}&varietyId=${varietyId}`}>
              <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold h-9">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />
                {t('btn.viewForecast', '14-Day Forecast')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Commodity and Variety Switchers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5 mt-5 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Mandi</label>
            <select
              value={mandiId}
              onChange={(e) => setMandiId(e.target.value)}
              className="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
            >
              {MANDIS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.districtId.split('-')[1]?.toUpperCase() || ''})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Commodity</label>
            <select
              value={commodityId}
              onChange={(e) => setCommodityId(e.target.value)}
              className="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
            >
              {COMMODITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Variety</label>
            <select
              value={varietyId}
              onChange={(e) => setVarietyId(e.target.value)}
              className="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
            >
              <option value="standard">Standard / All Varieties</option>
              {commodity.varieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Current Price Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Modal Price */}
        <Card className="border border-green-200 bg-green-50/30">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-green-900 block uppercase tracking-wider">
              {t('price.modal', 'Modal Price')}
            </span>
            <div className="flex items-baseline mt-1">
              <span className="text-2xl sm:text-3xl font-extrabold text-green-950">
                {formatPrice(modalPrice)}
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">{t('price.perQtl', '/quintal')}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center">
              Obs: {formatDate(obsDate)}
              {pctChange !== 0 && (
                <span
                  className={cn(
                    'ml-1.5 font-semibold',
                    pctChange > 0 ? 'text-green-700' : 'text-red-600'
                  )}
                >
                  {pctChange > 0 ? '+' : ''}{pctChange}%
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Min Price */}
        <Card className="border border-slate-200">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              {t('price.min', 'Minimum Price')}
            </span>
            <div className="flex items-baseline mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {formatPrice(minPrice)}
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">{t('price.perQtl', '/quintal')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Lowest recorded bid today</p>
          </CardContent>
        </Card>

        {/* Max Price */}
        <Card className="border border-slate-200">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              {t('price.max', 'Maximum Price')}
            </span>
            <div className="flex items-baseline mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {formatPrice(maxPrice)}
              </span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">{t('price.perQtl', '/quintal')}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Top grade quality price</p>
          </CardContent>
        </Card>

        {/* Arrivals */}
        <Card className="border border-slate-200">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              {t('price.arrivals', 'Daily Arrivals')}
            </span>
            <div className="flex items-baseline mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{arrivals}</span>
              <span className="text-xs text-slate-500 ml-1.5 font-medium">Tonnes</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Market yard supply volume</p>
          </CardContent>
        </Card>
      </div>

      {/* Historical Trends & Arrivals Chart */}
      <Card className="border border-slate-200">
        <CardHeader className="p-5 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Historical Price Trends ({timeframeDays} Days)
              </CardTitle>
              <p className="text-xs text-slate-500">
                Daily actual modal price and arrival volumes recorded at {mandi.name}
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
              {[7, 30, 90].map((days) => (
                <button
                  key={days}
                  onClick={() => setTimeframeDays(days as any)}
                  className={cn(
                    'px-3 py-1 rounded-md text-xs font-semibold transition-colors',
                    timeframeDays === days
                      ? 'bg-white text-green-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                >
                  {days} Days
                </button>
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-5 pt-2">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} />
                <YAxis
                  yAxisId="price"
                  domain={['dataMin - 80', 'dataMax + 80']}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `₹${v}`}
                  axisLine={false}
                  width={55}
                />
                <YAxis
                  yAxisId="arrivals"
                  orientation="right"
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  tickFormatter={(v) => `${v}t`}
                  axisLine={false}
                  width={35}
                />
                <Tooltip
                  formatter={(value: any, name: any) => {
                    if (name === 'Modal Price' || name === 'Min Price' || name === 'Max Price') {
                      return [`₹${value}/qtl`, name];
                    }
                    return [`${value} Tonnes`, name];
                  }}
                  labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar
                  yAxisId="arrivals"
                  dataKey="arrivals"
                  name="Arrivals (Tonnes)"
                  fill="#e2e8f0"
                  radius={[3, 3, 0, 0]}
                  barSize={12}
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="modalPrice"
                  name="Modal Price"
                  stroke="#166534"
                  strokeWidth={2.5}
                  dot={timeframeDays <= 14}
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="minPrice"
                  name="Min Price"
                  stroke="#94a3b8"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
                <Line
                  yAxisId="price"
                  type="monotone"
                  dataKey="maxPrice"
                  name="Max Price"
                  stroke="#cbd5e1"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Actual Market Observations Table */}
      <Card className="border border-slate-200">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                APMC Market Price Records (Recent Observations)
              </CardTitle>
              <p className="text-xs text-slate-500">
                Official modal, minimum, maximum prices and volume arrivals reported by {mandi.name}
              </p>
            </div>
            <Badge variant="outline" className="text-xs font-semibold text-slate-600">
              Unit: ₹/quintal
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold text-left">
                <tr>
                  <th className="py-2.5 px-4">Observation Date</th>
                  <th className="py-2.5 px-4">Commodity & Variety</th>
                  <th className="py-2.5 px-4">Modal Price (₹/qtl)</th>
                  <th className="py-2.5 px-4">Min Price (₹/qtl)</th>
                  <th className="py-2.5 px-4">Max Price (₹/qtl)</th>
                  <th className="py-2.5 px-4">Arrivals (MT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {historicalObservations.slice(-15).reverse().map((obs, idx) => {
                  const d = obs.observationDate || obs.date;
                  return (
                    <tr key={`${d}-${idx}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-slate-900">{formatDate(d)}</td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {commodity.name} &bull; <span className="capitalize">{obs.varietyId || varietyId}</span>
                      </td>
                      <td className="py-2.5 px-4 font-bold text-slate-900">
                        {formatPrice(Math.round(obs.modalPrice))}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">{formatPrice(Math.round(obs.minPrice))}</td>
                      <td className="py-2.5 px-4 text-slate-600">{formatPrice(Math.round(obs.maxPrice))}</td>
                      <td className="py-2.5 px-4 text-slate-700 font-medium">
                        {obs.arrivals ? `${obs.arrivals} t` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

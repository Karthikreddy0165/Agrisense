'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  AlertTriangle,
  Info,
  Bookmark,
  GitCompare,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Store,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
  Area,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MANDIS, STATES, DISTRICTS } from '@/lib/data/geography';
import { COMMODITIES } from '@/lib/data/commodities';
import { ApiService, type ForecastResult, type PredictionItem } from '@/lib/services/api';
import { useSavedMarkets } from '@/lib/hooks/useSavedMarkets';
import { useLanguage } from '@/lib/context/LanguageContext';
import { formatPrice, formatDate, formatDateShort } from '@/lib/utils/formatters';
import { cn } from '@/lib/utils/cn';

interface ForecastClientProps {
  initialMandiId?: string;
  initialCommodityId?: string;
  initialVarietyId?: string;
}

export default function ForecastClient({
  initialMandiId = 'kolar-apmc',
  initialCommodityId = 'tomato',
  initialVarietyId = 'tomato-hybrid',
}: ForecastClientProps) {
  const { t } = useLanguage();
  const [mandiId, setMandiId] = useState<string>(initialMandiId);
  const [commodityId, setCommodityId] = useState<string>(initialCommodityId);
  const [varietyId, setVarietyId] = useState<string>(initialVarietyId);
  const [horizonDays, setHorizonDays] = useState<7 | 14>(14);

  const [forecastData, setForecastData] = useState<ForecastResult | null>(null);
  const [historicalPrices, setHistoricalPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch forecast and historical prices when mandi, commodity, or variety changes
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      ApiService.getForecast(mandiId, commodityId, varietyId),
      ApiService.getPriceHistorySummary(mandiId, commodityId, varietyId, 90),
    ])
      .then(([forecastRes, historyRes]) => {
        if (!isCancelled) {
          setForecastData(forecastRes);
          const obsList = historyRes?.observations || [];
          setHistoricalPrices(obsList.length > 0 ? obsList : []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load forecast data:', err);
          setError(t('forecast.error'));
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [mandiId, commodityId, varietyId, t]);

  const predictions = useMemo(() => {
    if (!forecastData || !forecastData.predictions) return [];
    return forecastData.predictions.slice(0, horizonDays);
  }, [forecastData, horizonDays]);

  const latestActualObs = historicalPrices[historicalPrices.length - 1];
  const refPrice = forecastData?.latestActualPrice || (latestActualObs ? latestActualObs.modalPrice : 2000);

  // Summary Metrics
  const pred7 = forecastData?.expectedPrice7d || (predictions[6]?.modalPrice ?? refPrice);
  const pred14 = forecastData?.expectedPrice14d || (predictions[13]?.modalPrice ?? refPrice);
  const targetEndPrice = horizonDays === 7 ? pred7 : pred14;
  const pctChange = Math.round(((targetEndPrice - refPrice) / refPrice) * 1000) / 10;

  let expectedDirection: 'Rising' | 'Falling' | 'Relatively Stable' = 'Relatively Stable';
  if (pctChange > 2.0) expectedDirection = 'Rising';
  else if (pctChange < -2.0) expectedDirection = 'Falling';

  const expectedMin =
    predictions.length > 0
      ? Math.min(...predictions.map((p: any) => p.minPrice))
      : refPrice * 0.92;
  const expectedMax =
    predictions.length > 0
      ? Math.max(...predictions.map((p: any) => p.maxPrice))
      : refPrice * 1.08;

  // Chart data: 30 days history + 14 days forecast with continuous bridge on 23 Nov
  const chartData = useMemo(() => {
    const recentHistory = historicalPrices.slice(-30);
    const historyPoints = recentHistory.map((h, idx) => {
      const isLastActual = idx === recentHistory.length - 1;
      const d = h.observationDate || h.date;
      return {
        date: d,
        dateLabel: formatDateShort(d),
        actualPrice: h.modalPrice,
        // Bridge point on reference date so forecast line connects continuously
        forecastPrice: isLastActual ? h.modalPrice : undefined,
      };
    });

    const forecastPoints = predictions.map((p: any) => ({
      date: p.date,
      dateLabel: formatDateShort(p.date),
      actualPrice: undefined,
      forecastPrice: p.modalPrice,
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
    }));

    return [...historyPoints, ...forecastPoints];
  }, [historicalPrices, predictions]);

  const saved = isSaved(mandi.id, commodity.id);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Context */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-green-800 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                14-Day Horizon
              </span>
              <span className="text-xs text-slate-500">
                {stateObj?.name} &bull; {distObj?.name}
              </span>
              <Badge variant="secondary" className="text-xs">
                {forecastData?.modelVersion || 'LightGBM-v1'}
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
              {mandi.name} &mdash; {commodity.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('forecast.refDate')} &bull; {t('forecast.period')}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => toggle(mandi.id, commodity.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors',
                saved
                  ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              )}
            >
              <Bookmark className={cn('w-4 h-4', saved && 'fill-amber-500 text-amber-500')} />
              <span>{saved ? t('btn.saved') : t('btn.save')}</span>
            </button>

            <Link href={`/market/${mandi.id}?commodity=${commodity.id}&variety=${varietyId}`}>
              <Button variant="outline" size="sm" className="text-xs">
                <Store className="w-3.5 h-3.5 mr-1" />
                {t('btn.viewMarket')}
              </Button>
            </Link>

            <Link href={`/compare?commodityId=${commodity.id}&varietyId=${varietyId}&mandiIds=${mandi.id}`}>
              <Button variant="outline" size="sm" className="text-xs">
                <GitCompare className="w-3.5 h-3.5 mr-1" />
                {t('btn.compare')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Selection Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-5 mt-5 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Mandi</label>
            <select
              value={mandiId}
              onChange={(e) => setMandiId(e.target.value)}
              className="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
            >
              {MANDIS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({STATES.find((s) => s.id === m.stateId)?.name || m.stateId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('filter.commodity')}</label>
            <select
              data-testid="forecast-commodity-select"
              value={commodityId}
              onChange={(e) => {
                const newComm = e.target.value;
                setCommodityId(newComm);
                const commObj = COMMODITIES.find((c) => c.id === newComm);
                setVarietyId(commObj && commObj.varieties.length > 0 ? commObj.varieties[0].id : 'standard');
              }}
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">{t('filter.variety')}</label>
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

      {/* Loading Skeleton */}
      {loading && (
        <Card className="p-8 text-center border border-slate-200">
          <div className="flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-green-700 animate-spin" />
            <h4 className="text-base font-bold text-slate-900">{t('forecast.loading')}</h4>
            <p className="text-xs text-slate-500">
              Evaluating 69 features across historical lags and calendar seasonality...
            </p>
          </div>
        </Card>
      )}

      {/* Error / Unavailable Alert */}
      {!loading && error && (
        <Card className="border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-bold text-red-900 text-sm">Forecast Unavailable</h4>
              <p className="text-xs text-red-700 mt-1">{error}</p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setVarietyId(varietyId)}
                className="mt-3 text-xs bg-white text-red-800 border-red-300"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                {t('forecast.retry')}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Forecast Content when Loaded */}
      {!loading && !error && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* Ref Price */}
            <Card className="border border-slate-200">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Reference (23 Nov)
                </span>
                <div className="flex items-baseline mt-1">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">{formatPrice(refPrice)}</span>
                  <span className="text-[11px] text-slate-500 ml-1">/qtl</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Latest actual observation</p>
              </CardContent>
            </Card>

            {/* Expected Price 7 Days */}
            <Card className="border border-slate-200">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  {t('forecast.expected7d')}
                </span>
                <div className="flex items-baseline mt-1">
                  <span className="text-xl sm:text-2xl font-bold text-slate-900">{formatPrice(pred7)}</span>
                  <span className="text-[11px] text-slate-500 ml-1">/qtl</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Mid-horizon estimate</p>
              </CardContent>
            </Card>

            {/* Expected Price 14 Days */}
            <Card className="border border-green-200 bg-green-50/40">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold text-green-900 uppercase tracking-wider block">
                  {t('forecast.expected14d')}
                </span>
                <div className="flex items-baseline mt-1">
                  <span className="text-xl sm:text-2xl font-extrabold text-green-950">
                    {formatPrice(pred14)}
                  </span>
                  <span className="text-[11px] text-slate-500 ml-1">/qtl</span>
                </div>
                <p className="text-[11px] text-green-700 mt-0.5 font-medium">14-day target estimate</p>
              </CardContent>
            </Card>

            {/* Expected Direction */}
            <Card className="border border-slate-200">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  {t('forecast.direction')}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {expectedDirection === 'Rising' ? (
                    <TrendingUp className="w-5 h-5 text-green-700" />
                  ) : expectedDirection === 'Falling' ? (
                    <TrendingDown className="w-5 h-5 text-red-600" />
                  ) : (
                    <Minus className="w-5 h-5 text-slate-500" />
                  )}
                  <span
                    className={cn(
                      'text-base font-bold',
                      expectedDirection === 'Rising'
                        ? 'text-green-800'
                        : expectedDirection === 'Falling'
                        ? 'text-red-700'
                        : 'text-slate-800'
                    )}
                  >
                    {expectedDirection === 'Rising'
                      ? t('price.trend.rising')
                      : expectedDirection === 'Falling'
                      ? t('price.trend.falling')
                      : t('price.trend.stable')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  {pctChange > 0 ? '+' : ''}{pctChange}% over 14d
                </p>
              </CardContent>
            </Card>

            {/* Expected Range */}
            <Card className="border border-slate-200 col-span-2 lg:col-span-1">
              <CardContent className="p-4">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  {t('forecast.range')}
                </span>
                <div className="flex items-baseline mt-1">
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatPrice(Math.round(expectedMin))} &ndash; {formatPrice(Math.round(expectedMax))}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">Min &ndash; Max confidence band</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Historical + Forecast Combined Chart */}
          <Card className="border border-slate-200">
            <CardHeader className="p-5 pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    {t('forecast.actualVsForecast')}
                  </CardTitle>
                  <p className="text-xs text-slate-500">
                    Solid blue: actual recorded transactions &bull; Dashed violet: LightGBM 14-day projection
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs text-slate-600 border-slate-200">
                    {t('forecast.separator')}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-5 pt-2">
              <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 15, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                    />
                    {/* Dynamic YAxis bounds so curvature is visually prominent, avoiding flat-line illusion */}
                    <YAxis
                      domain={['dataMin - 80', 'dataMax + 80']}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      tickFormatter={(v) => `₹${Math.round(v)}`}
                      axisLine={false}
                      width={65}
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [`₹${Math.round(value)}/quintal`, name]}
                      labelStyle={{ fontWeight: 600, color: '#0f172a' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />

                    {/* Transition marker at reference date */}
                    <ReferenceLine
                      x={formatDateShort('2026-11-23')}
                      stroke="#16a34a"
                      strokeDasharray="4 4"
                      strokeWidth={2}
                      label={{
                        value: 'Forecast Start (24 Nov) →',
                        position: 'insideTopRight',
                        fill: '#15803d',
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    />

                    {/* Historical Actual Line */}
                    <Line
                      type="monotone"
                      dataKey="actualPrice"
                      name="Historical Actual Price"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={false}
                      connectNulls={false}
                    />

                    {/* Forecast Line */}
                    <Line
                      type="monotone"
                      dataKey="forecastPrice"
                      name="14-Day Expected Price"
                      stroke="#7c3aed"
                      strokeWidth={2.8}
                      strokeDasharray="6 3"
                      dot={{ r: 3.5, fill: '#7c3aed' }}
                      connectNulls={true}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 p-3.5 bg-slate-50 rounded-lg border border-slate-100 flex items-start gap-2 text-xs text-slate-600">
                <Info className="w-4 h-4 text-green-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Forecast Interpretation:</strong> {forecastData?.interpretation || 'Prices are projected based on historical lags and rolling volatility.'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Day-by-Day Table */}
          <Card className="border border-slate-200">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                {t('forecast.tableTitle')} (24 Nov &ndash; 07 Dec 2026)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-y border-slate-200 text-slate-600 font-semibold text-left">
                    <tr>
                      <th className="py-2.5 px-4">Day</th>
                      <th className="py-2.5 px-4">Date</th>
                      <th className="py-2.5 px-4">Expected Modal</th>
                      <th className="py-2.5 px-4">Expected Min</th>
                      <th className="py-2.5 px-4">Expected Max</th>
                      <th className="py-2.5 px-4">% Change from 23 Nov</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {predictions.map((p: any, idx: number) => {
                      const change = p.percentageChangeFromReference;
                      const isUp = change > 0;
                      return (
                        <tr key={p.date} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-4 font-semibold text-slate-500">Day {idx + 1}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-900">{formatDate(p.date)}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">
                            {formatPrice(Math.round(p.modalPrice))}
                            <span className="text-[10px] text-slate-400 font-normal">/qtl</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600">{formatPrice(Math.round(p.minPrice))}</td>
                          <td className="py-2.5 px-4 text-slate-600">{formatPrice(Math.round(p.maxPrice))}</td>
                          <td className="py-2.5 px-4">
                            <span
                              className={cn(
                                'px-2 py-0.5 rounded font-bold text-[11px]',
                                isUp
                                  ? 'text-emerald-800 bg-emerald-50'
                                  : change < 0
                                  ? 'text-rose-700 bg-rose-50'
                                  : 'text-slate-600 bg-slate-100'
                              )}
                            >
                              {change >= 0 ? '+' : ''}
                              {change.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Machine Learning Advisory Notice */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 flex items-start gap-3 text-xs text-slate-600">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-800">
                Machine Learning Forecasting Model Notice
              </span>
              <p className="leading-relaxed">
                Predictions are generated by the LightGBM price intelligence engine using historical APMC daily auction records, seasonal volume patterns, and regional price lags. These are advisory estimates intended to assist agricultural planning and market comparison. Actual auction prices may vary depending on local arrivals, weather conditions, produce grade, and spot trading volume.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

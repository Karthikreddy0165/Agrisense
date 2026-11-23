'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  Search,
  Filter,
  AlertCircle,
  Sparkles,
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
import { MANDIS as SEED_MANDIS, STATES as SEED_STATES, DISTRICTS as SEED_DISTRICTS } from '@/lib/data/geography';
import { COMMODITIES } from '@/lib/data/commodities';
import { getHistoricalPricesForPair, DATA_THROUGH_DATE } from '@/lib/data/historical-prices';
import { useSavedMarkets } from '@/lib/hooks/useSavedMarkets';
import { formatPrice, formatDate, formatDateShort } from '@/lib/utils/formatters';
import { ApiService, type TradedCommodityItem } from '@/lib/services/api';
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
  const router = useRouter();
  const { t } = useLanguage();

  const [mandiId, setMandiId] = useState<string>(initialMandiId);
  const [commodityId, setCommodityId] = useState<string>(initialCommodityId);
  const [timeframeDays, setTimeframeDays] = useState<7 | 30 | 90>(30);
  const [varietyId, setVarietyId] = useState<string>('standard');
  const [liveHistory, setLiveHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [tradedCommodities, setTradedCommodities] = useState<TradedCommodityItem[]>([]);

  // National Mandi & State catalogues
  const [allMandis, setAllMandis] = useState<any[]>(SEED_MANDIS);
  const [allStates, setAllStates] = useState<any[]>(SEED_STATES);
  const [selectedStateFilter, setSelectedStateFilter] = useState<string>('all');
  const [mandiSearchQuery, setMandiSearchQuery] = useState<string>('');

  const { isSaved, toggle } = useSavedMarkets();

  const [mandiDetails, setMandiDetails] = useState<any>(
    () => SEED_MANDIS.find((m) => m.id === mandiId) || { id: mandiId, name: mandiId, stateId: '', districtId: '', fullName: mandiId }
  );

  // Load national states & mandis from backend on mount
  useEffect(() => {
    ApiService.getStates().then((s) => {
      if (s && s.length > 0) setAllStates(s);
    });
    ApiService.getMandis().then((m) => {
      if (m && m.length > 0) setAllMandis(m);
    });
  }, []);

  // Fetch mandi details whenever mandiId changes
  useEffect(() => {
    ApiService.getMandi(mandiId).then((m) => {
      if (m) {
        setMandiDetails(m);
        if (m.stateId) {
          setSelectedStateFilter((prev) => (prev === 'all' ? prev : m.stateId));
        }
        if (m.id && m.id !== mandiId) {
          setMandiId(m.id);
        }
      }
    });
  }, [mandiId]);

  // Fetch traded commodities for this specific mandi
  useEffect(() => {
    let active = true;
    ApiService.getMandiCommodities(mandiId).then((items) => {
      if (!active) return;
      setTradedCommodities(items || []);
      if (items && items.length > 0) {
        // If current commodityId is not traded at this mandi, automatically switch to first traded commodity
        const isCurrentTraded = items.some((item) => item.commodityId === commodityId);
        if (!isCurrentTraded) {
          setCommodityId(items[0].commodityId);
          setVarietyId('standard');
        }
      }
    });
    return () => {
      active = false;
    };
  }, [mandiId]);

  const mandi = mandiDetails;

  // Derive location labels
  const { stateName, districtName, mandiDisplayName } = useMemo(() => {
    if (mandi.fullName && mandi.fullName.includes(',')) {
      const parts = mandi.fullName.split(',').map((p: string) => p.trim());
      if (parts.length >= 3) {
        return {
          mandiDisplayName: parts.slice(0, parts.length - 2).join(', '),
          districtName: parts[parts.length - 2],
          stateName: parts[parts.length - 1],
        };
      }
    }
    const stateObj = allStates.find((s) => s.id === mandi.stateId);
    const stName = stateObj?.name || mandi.stateId || '';
    const dtName = mandi.districtId ? mandi.districtId.replace(/^[a-z]{2}-/, '').replace(/-/g, ' ') : '';
    return {
      mandiDisplayName: mandi.name,
      districtName: dtName ? dtName.charAt(0).toUpperCase() + dtName.slice(1) : '',
      stateName: stName,
    };
  }, [mandi, allStates]);

  // Available commodity object
  const commodity = useMemo(() => {
    const found = COMMODITIES.find((c) => c.id === commodityId);
    if (found) return found;
    const traded = tradedCommodities.find((tc) => tc.commodityId === commodityId);
    return {
      id: commodityId,
      name: traded?.commodityName || commodityId.charAt(0).toUpperCase() + commodityId.slice(1),
      category: 'crop',
      unit: '₹/quintal',
      slug: commodityId,
      description: `${traded?.commodityName || commodityId} market trading`,
      varieties: [{ id: 'standard', commodityId, name: 'Standard / FAQ' }],
    };
  }, [commodityId, tradedCommodities]);

  // Combine COMMODITIES with any traded commodities not in static list
  const availableCommoditiesList = useMemo(() => {
    const map = new Map<string, { id: string; name: string; isTraded: boolean }>();
    tradedCommodities.forEach((tc) => {
      map.set(tc.commodityId, { id: tc.commodityId, name: tc.commodityName, isTraded: true });
    });
    COMMODITIES.forEach((c) => {
      if (!map.has(c.id)) {
        map.set(c.id, { id: c.id, name: c.name, isTraded: false });
      }
    });
    return Array.from(map.values()).sort((a, b) => {
      if (a.isTraded && !b.isTraded) return -1;
      if (!a.isTraded && b.isTraded) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [tradedCommodities]);

  // Fetch price history summary for mandi + commodity + timeframe
  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      try {
        const summary = await ApiService.getPriceHistorySummary(mandi.id, commodityId, varietyId, timeframeDays);
        if (active && summary && summary.observations) {
          const obs = summary.observations.filter(
            (o) => !varietyId || varietyId === 'standard' || o.varietyId === varietyId || o.varietyId === 'standard'
          );
          setLiveHistory(obs.length > 0 ? obs : summary.observations);
        } else if (active) {
          setLiveHistory([]);
        }
      } catch (err) {
        console.error('Error loading historical prices', err);
        if (active) setLiveHistory([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, [mandi.id, commodityId, varietyId, timeframeDays]);

  const historicalObservations = useMemo(() => {
    if (liveHistory && liveHistory.length > 0) {
      return liveHistory.slice(-timeframeDays);
    }
    const raw = getHistoricalPricesForPair(mandi.id, commodityId);
    return raw.slice(-timeframeDays);
  }, [liveHistory, mandi.id, commodityId, timeframeDays]);

  const hasData = historicalObservations.length > 0;
  const latestObs = hasData ? historicalObservations[historicalObservations.length - 1] : null;
  const prevObs = historicalObservations.length > 1 ? historicalObservations[historicalObservations.length - 2] : null;

  const modalPrice = latestObs ? latestObs.modalPrice : null;
  const minPrice = latestObs ? latestObs.minPrice : null;
  const maxPrice = latestObs ? latestObs.maxPrice : null;
  const arrivals = latestObs ? (latestObs.arrivals != null ? latestObs.arrivals : 85.0) : null;
  const obsDate = latestObs ? (latestObs.observationDate || latestObs.date) : null;

  const pctChange =
    latestObs && prevObs && prevObs.modalPrice > 0
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

  // Filtered mandis for the selector
  const filteredMandis = useMemo(() => {
    let list = allMandis;
    if (selectedStateFilter !== 'all') {
      list = list.filter((m) => m.stateId === selectedStateFilter);
    }
    if (mandiSearchQuery.trim()) {
      const q = mandiSearchQuery.toLowerCase().trim();
      list = list.filter((m) =>
        (m.name && m.name.toLowerCase().includes(q)) ||
        (m.fullName && m.fullName.toLowerCase().includes(q)) ||
        (m.districtId && m.districtId.toLowerCase().includes(q))
      );
    }
    // Always include current mandi in the dropdown list so it's selectable
    if (!list.some((m) => m.id === mandi.id)) {
      list = [mandi, ...list];
    }
    return list;
  }, [allMandis, selectedStateFilter, mandiSearchQuery, mandi]);

  const handleMandiChange = (newMandiId: string) => {
    setMandiId(newMandiId);
    router.push(`/market/${encodeURIComponent(newMandiId)}`);
  };

  const saved = isSaved(mandi.id, commodityId);

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
              <span className="text-xs text-slate-500 flex items-center font-medium">
                <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {districtName ? `${districtName}, ` : ''}{stateName || 'India'}
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
                : ' • Coordinates Verified'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => toggle(mandi.id, commodityId)}
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

        {/* Crops Traded at this Mandi */}
        {tradedCommodities.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Active Crops Traded at this Market ({tradedCommodities.length})
              </span>
              <span className="text-[11px] text-slate-400">Click any crop to switch profile view</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {tradedCommodities.map((tc) => {
                const isSelected = commodityId === tc.commodityId;
                return (
                  <button
                    key={tc.commodityId}
                    onClick={() => {
                      setCommodityId(tc.commodityId);
                      setVarietyId('standard');
                    }}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                      isSelected
                        ? 'bg-green-800 text-white shadow-sm ring-2 ring-green-600 ring-offset-1'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    )}
                  >
                    <span>{tc.commodityName}</span>
                    <span className={cn('text-[11px]', isSelected ? 'text-green-200' : 'text-slate-600')}>
                      {formatPrice(Math.round(tc.latestModalPrice))}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-normal',
                        isSelected ? 'bg-green-900/70 text-green-100' : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {tc.observationCount} records
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mandi & Commodity Selection Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 mt-4 border-t border-slate-100">
          {/* Mandi Selector with State Filter & Search */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-600">Select Market ({allMandis.length})</label>
              <div className="flex items-center gap-1">
                <select
                  value={selectedStateFilter}
                  onChange={(e) => setSelectedStateFilter(e.target.value)}
                  className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none"
                >
                  <option value="all">All States / UTs</option>
                  {allStates.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Search market name or district..."
                value={mandiSearchQuery}
                onChange={(e) => setMandiSearchQuery(e.target.value)}
                className="w-full h-7 px-2.5 pl-7 text-[11px] border border-slate-200 rounded-md mb-1 bg-slate-50/50 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-1 focus:ring-green-600 focus:outline-none"
              />
              <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
            </div>

            <select
              value={mandi.id}
              onChange={(e) => handleMandiChange(e.target.value)}
              className="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
            >
              {filteredMandis.slice(0, 300).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.districtId ? m.districtId.replace(/^[a-z]{2}-/, '').toUpperCase() : ''})
                </option>
              ))}
            </select>
          </div>

          {/* Commodity Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Commodity</label>
            <select
              value={commodityId}
              onChange={(e) => {
                setCommodityId(e.target.value);
                setVarietyId('standard');
              }}
              className="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
            >
              {availableCommoditiesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.isTraded ? '✓ (Traded)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Variety Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Select Variety</label>
            <select
              value={varietyId}
              onChange={(e) => setVarietyId(e.target.value)}
              className="w-full h-9 px-3 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
            >
              <option value="standard">Standard / All Varieties</option>
              {commodity.varieties?.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* When no data recorded for selected commodity at this mandi */}
      {!hasData && !loading && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-amber-900">
                No observations for {commodity.name} at {mandi.name}
              </h4>
              <p className="text-xs text-amber-800 mt-1">
                This mandi does not have recorded price transactions for {commodity.name}.
                {tradedCommodities.length > 0
                  ? ` Choose one of the actively traded crops above (${tradedCommodities.map((t) => t.commodityName).join(', ')}) to view live prices and price history.`
                  : ' Select a different commodity or market from the selectors above.'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
                {modalPrice != null ? formatPrice(modalPrice) : '—'}
              </span>
              {modalPrice != null && (
                <span className="text-xs text-slate-500 ml-1.5 font-medium">{t('price.perQtl', '/quintal')}</span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center">
              {obsDate ? `Obs: ${formatDate(obsDate)}` : 'No recent observation'}
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
                {minPrice != null ? formatPrice(minPrice) : '—'}
              </span>
              {minPrice != null && (
                <span className="text-xs text-slate-500 ml-1.5 font-medium">{t('price.perQtl', '/quintal')}</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {minPrice != null ? 'Lowest recorded bid' : 'Data unavailable'}
            </p>
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
                {maxPrice != null ? formatPrice(maxPrice) : '—'}
              </span>
              {maxPrice != null && (
                <span className="text-xs text-slate-500 ml-1.5 font-medium">{t('price.perQtl', '/quintal')}</span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {maxPrice != null ? 'Top grade quality price' : 'Data unavailable'}
            </p>
          </CardContent>
        </Card>

        {/* Arrivals */}
        <Card className="border border-slate-200">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              {t('price.arrivals', 'Daily Arrivals')}
            </span>
            <div className="flex items-baseline mt-1">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">
                {arrivals != null ? arrivals : '—'}
              </span>
              {arrivals != null && <span className="text-xs text-slate-500 ml-1.5 font-medium">Tonnes</span>}
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
                Daily actual modal price and arrival volumes recorded for {commodity.name} at {mandi.name}
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
          {chartData.length > 0 ? (
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
          ) : (
            <div className="h-[220px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No chart data available for this selection</p>
              <p className="text-[11px] text-slate-400">Select one of the actively traded crops above to see price trends</p>
            </div>
          )}
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
                {historicalObservations.length > 0 ? (
                  historicalObservations
                    .slice(-15)
                    .reverse()
                    .map((obs, idx) => {
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
                    })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No price observations found for this market and commodity.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

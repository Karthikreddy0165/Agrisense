'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Search,
  Filter,
  ArrowUpDown,
  Navigation,
  TrendingUp,
  Store,
  Bookmark,
  Map as MapIcon,
  List as ListIcon,
  Check,
  X,
  AlertCircle,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InteractiveMandiMap } from '@/components/map/InteractiveMandiMap';
import { STATES as SEED_STATES, DISTRICTS as SEED_DISTRICTS, MANDIS as SEED_MANDIS } from '@/lib/data/geography';
import { COMMODITIES } from '@/lib/data/commodities';
import { getHistoricalPricesForPair, DATA_THROUGH_DATE } from '@/lib/data/historical-prices';
import { useSavedMarkets } from '@/lib/hooks/useSavedMarkets';
import { useLocation } from '@/lib/context/LocationContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { formatPrice, formatDate } from '@/lib/utils/formatters';
import { ApiService } from '@/lib/services/api';
import { cn } from '@/lib/utils/cn';

const RADIUS_OPTIONS = [10, 25, 50, 100];
const PAGE_SIZE = 30;

export default function NearbyMandisPage() {
  const { t } = useLanguage();
  const {
    coordinates,
    locationLabel,
    status: locationStatus,
    stateId: locationStateId,
    detectLocation,
  } = useLocation();

  const [statesList, setStatesList] = useState<any[]>(SEED_STATES);
  const [allMandis, setAllMandis] = useState<any[]>(SEED_MANDIS);
  const [loadingMandis, setLoadingMandis] = useState(false);

  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<string>('tomato');
  const [selectedVariety, setSelectedVariety] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'distance' | 'price-desc' | 'price-asc'>('distance');
  const [selectedMandiId, setSelectedMandiId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  const { isSaved, toggle } = useSavedMarkets();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 1. Fetch complete States from API
  useEffect(() => {
    ApiService.getStates().then((s) => {
      if (s && s.length > 0) setStatesList(s);
    });
  }, []);

  // 2. Fetch mandis with live prices from API
  useEffect(() => {
    setLoadingMandis(true);
    ApiService.getMandis({ commodityId: selectedCommodity })
      .then((mandis) => {
        if (mandis && mandis.length > 0) {
          setAllMandis(mandis);
        }
      })
      .finally(() => setLoadingMandis(false));
  }, [selectedCommodity]);

  // When location is detected, set initial radius filter
  useEffect(() => {
    if (coordinates && selectedRadius === null) {
      setSelectedRadius(100);
    }
  }, [coordinates, selectedRadius]);

  // Sync scroll when marker is clicked on map
  const handleSelectMandiFromMap = (id: string) => {
    setSelectedMandiId(id);
    const element = cardRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // State lookup map for speed
  const stateLookup = useMemo(() => {
    const map = new Map<string, string>();
    statesList.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [statesList]);

  // Calculate distance & live prices for all mandis
  const mandisWithCalculations = useMemo(() => {
    return allMandis.map((mandi) => {
      let distance: number | undefined = undefined;
      if (coordinates && mandi.latitude != null && mandi.longitude != null) {
        const R = 6371.0;
        const dLat = ((mandi.latitude - coordinates.lat) * Math.PI) / 180;
        const dLon = ((mandi.longitude - coordinates.lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((coordinates.lat * Math.PI) / 180) *
            Math.cos((mandi.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = Math.round(R * c * 10) / 10;
      }

      const stName = stateLookup.get(mandi.stateId) || mandi.stateId;

      return {
        ...mandi,
        distanceKm: distance != null ? distance : mandi.distanceKm,
        latestPrice: mandi.latestModalPrice != null ? mandi.latestModalPrice : null,
        observationDate: mandi.observationDate || null,
        trendDirection: mandi.trendDirection || 'Stable',
        stateName: stName,
        hasCoords: mandi.latitude != null && mandi.longitude != null,
      };
    });
  }, [allMandis, coordinates, stateLookup]);

  // Filter & Sort
  const filteredMandis = useMemo(() => {
    let result = [...mandisWithCalculations];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.fullName && m.fullName.toLowerCase().includes(q)) ||
          (m.districtId && m.districtId.toLowerCase().includes(q)) ||
          (m.stateName && m.stateName.toLowerCase().includes(q))
      );
    }

    // State filter
    if (selectedState !== 'all') {
      result = result.filter((m) => m.stateId === selectedState);
    }

    // Distance radius filter
    if (selectedRadius != null && coordinates) {
      result = result.filter((m) => m.distanceKm != null && m.distanceKm <= selectedRadius);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        return a.name.localeCompare(b.name);
      }
      if (sortBy === 'price-desc') {
        return (b.latestPrice ?? -1) - (a.latestPrice ?? -1);
      }
      if (sortBy === 'price-asc') {
        return (a.latestPrice ?? 999999) - (b.latestPrice ?? 999999);
      }
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [mandisWithCalculations, searchQuery, selectedState, selectedRadius, coordinates, sortBy]);

  // Reset pagination visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedState, selectedRadius, selectedCommodity, sortBy]);

  const displayedMandis = useMemo(() => {
    return filteredMandis.slice(0, visibleCount);
  }, [filteredMandis, visibleCount]);

  const mapMandis = useMemo(() => {
    return filteredMandis
      .filter((m) => m.hasCoords)
      .map((m) => ({
        id: m.id,
        name: m.name,
        latitude: m.latitude!,
        longitude: m.longitude!,
        distanceKm: m.distanceKm,
        latestPrice: m.latestPrice,
        trendDirection: m.trendDirection,
      }));
  }, [filteredMandis]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedState !== 'all' ||
    (selectedRadius != null && coordinates != null);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedState('all');
    setSelectedRadius(null);
    setSortBy('distance');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('nav.nearby')}</h1>
            <p className="text-xs text-slate-500 mt-1">
              {locationStatus === 'DETECTED'
                ? `${t('loc.detected')}: ${locationLabel}`
                : locationStatus === 'MANUAL'
                ? `${t('loc.manual')}: ${locationLabel}`
                : locationStatus === 'DENIED'
                ? t('loc.denied')
                : t('loc.allIndia')} &bull; Showing {filteredMandis.length} of {allMandis.length} mandis across {statesList.length} States
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => detectLocation()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-800 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-green-700" />
              <span>{t('loc.useLocation')}</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder={t('filter.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-green-700 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Commodity Selector */}
          <div>
            <select
              data-testid="commodity-filter-select"
              value={selectedCommodity}
              onChange={(e) => setSelectedCommodity(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 font-medium focus:ring-2 focus:ring-green-700 focus:outline-none"
            >
              {COMMODITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* State Filter */}
          <div>
            <select
              data-testid="state-filter-select"
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 font-medium focus:ring-2 focus:ring-green-700 focus:outline-none"
            >
              <option value="all">All States ({allMandis.length} Mandis)</option>
              {statesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sorting */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 font-medium focus:ring-2 focus:ring-green-700 focus:outline-none"
            >
              <option value="distance">{t('filter.nearest')}</option>
              <option value="price-desc">{t('filter.priceHigh')}</option>
              <option value="price-asc">{t('filter.priceLow')}</option>
            </select>
          </div>
        </div>

        {/* Radius Pills & Filter Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1">{t('filter.radius')}:</span>
            <button
              onClick={() => setSelectedRadius(null)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                selectedRadius === null
                  ? 'bg-green-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              All India
            </button>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRadius(r)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                  selectedRadius === r
                    ? 'bg-green-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                &le; {r} km
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-slate-600 h-7 px-2.5"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              {t('btn.clearFilters')}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile View Toggle */}
      <div className="lg:hidden flex items-center justify-center p-1 bg-slate-200 rounded-lg max-w-xs mx-auto">
        <button
          onClick={() => setMobileView('list')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all',
            mobileView === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          )}
        >
          <ListIcon className="w-3.5 h-3.5" />
          <span>List View</span>
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all',
            mobileView === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          )}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Map View ({mapMandis.length} mapped)</span>
        </button>
      </div>

      {/* Main Dual Pane: Map + List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Map */}
        <div
          className={cn(
            'lg:col-span-6 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm sticky top-20 h-[560px]',
            mobileView === 'list' && 'hidden lg:block'
          )}
        >
          <InteractiveMandiMap
            mandis={mapMandis}
            selectedMandiId={selectedMandiId}
            onSelectMandi={handleSelectMandiFromMap}
            userLocation={coordinates}
          />
        </div>

        {/* Mandis List */}
        <div
          className={cn(
            'lg:col-span-6 space-y-3.5 max-h-[700px] overflow-y-auto pr-1',
            mobileView === 'map' && 'hidden lg:block'
          )}
        >
          {filteredMandis.length === 0 ? (
            <Card className="p-8 text-center border-dashed border-2 border-slate-300">
              <div className="flex flex-col items-center justify-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-400" />
                <h3 className="font-bold text-slate-900 text-sm">No Mandis Match Your Filter</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Try expanding your distance radius or clearing the state and search filters.
                </p>
                <Button size="sm" onClick={clearAllFilters} className="mt-3 text-xs bg-green-700 text-white">
                  {t('btn.clearFilters')}
                </Button>
              </div>
            </Card>
          ) : (
            <>
              {displayedMandis.map((mandi) => {
                const isCurrentSelected = selectedMandiId === mandi.id;
                const saved = isSaved(mandi.id, selectedCommodity);

                return (
                  <div
                    key={mandi.id}
                    ref={(el) => {
                      cardRefs.current[mandi.id] = el;
                    }}
                    onClick={() => {
                      setSelectedMandiId(mandi.id);
                    }}
                    className={cn(
                      'bg-white rounded-xl border p-4 transition-all cursor-pointer',
                      isCurrentSelected
                        ? 'border-green-600 ring-2 ring-green-600/20 shadow-md bg-green-50/20'
                        : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">{mandi.name}</h3>
                          {mandi.distanceKm != null ? (
                            <Badge variant="secondary" className="text-[11px] bg-slate-100 text-slate-700">
                              {mandi.distanceKm} km away
                            </Badge>
                          ) : !mandi.hasCoords ? (
                            <Badge variant="outline" className="text-[10px] text-amber-700 bg-amber-50 border-amber-200">
                              Coordinates Pending
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {mandi.fullName || `${mandi.name}, ${mandi.stateName}`}
                        </p>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggle(mandi.id, selectedCommodity);
                        }}
                        className={cn(
                          'p-1.5 rounded-md border transition-colors',
                          saved
                            ? 'bg-amber-50 text-amber-600 border-amber-200'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-slate-600'
                        )}
                        title="Bookmark market"
                      >
                        <Bookmark className={cn('w-4 h-4', saved && 'fill-amber-500 text-amber-500')} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
                      <div>
                        <span className="text-[11px] text-slate-500 block uppercase font-semibold">
                          Modal Price ({COMMODITIES.find((c) => c.id === selectedCommodity)?.name})
                        </span>
                        <div className="flex items-baseline mt-0.5">
                          {mandi.latestPrice != null ? (
                            <>
                              <span className="text-lg font-bold text-slate-900">
                                {formatPrice(mandi.latestPrice)}
                              </span>
                              <span className="text-xs text-slate-500 ml-1">/qtl</span>
                            </>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">
                              {t('price.unavailable')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block uppercase font-semibold">Trend</span>
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 mt-0.5 rounded text-[11px] font-bold',
                            mandi.trendDirection === 'Rising'
                              ? 'text-emerald-800 bg-emerald-50'
                              : mandi.trendDirection === 'Falling'
                              ? 'text-rose-700 bg-rose-50'
                              : 'text-slate-600 bg-slate-100'
                          )}
                        >
                          {mandi.trendDirection === 'Rising'
                            ? t('price.trend.rising')
                            : mandi.trendDirection === 'Falling'
                            ? t('price.trend.falling')
                            : t('price.trend.stable')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                      <Link
                        href={`/market/${mandi.id}?commodity=${selectedCommodity}`}
                        className="flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="sm" className="w-full text-xs text-slate-700 h-8">
                          <Store className="w-3.5 h-3.5 mr-1" />
                          {t('btn.viewMarket')}
                        </Button>
                      </Link>

                      <Link
                        href={`/forecast?mandiId=${mandi.id}&commodityId=${selectedCommodity}`}
                        className="flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button size="sm" className="w-full text-xs bg-green-700 hover:bg-green-800 text-white h-8">
                          <TrendingUp className="w-3.5 h-3.5 mr-1" />
                          {t('btn.viewForecast')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}

              {visibleCount < filteredMandis.length && (
                <div className="pt-2 pb-4 text-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                    className="text-xs text-slate-700 px-6 py-2 border-slate-300 hover:bg-slate-50"
                  >
                    <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
                    Load More Mandis ({filteredMandis.length - visibleCount} remaining)
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

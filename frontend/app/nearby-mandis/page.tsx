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
  Sparkles,
  GitCompare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InteractiveMandiMap } from '@/components/map/InteractiveMandiMap';
import { STATES as SEED_STATES, DISTRICTS as SEED_DISTRICTS, MANDIS as SEED_MANDIS } from '@/lib/data/geography';
import { COMMODITIES } from '@/lib/data/commodities';
import { useSavedMarkets } from '@/lib/hooks/useSavedMarkets';
import { useLocation } from '@/lib/context/LocationContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { formatPrice, formatDateShort } from '@/lib/utils/formatters';
import { ApiService, PriceHistorySummary, TradedCommodityItem, ForecastResult } from '@/lib/services/api';
import { SelectedMarketPanel } from '@/components/market/SelectedMarketPanel';
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
    setManualLocation,
    openPicker,
  } = useLocation();

  const [statesList, setStatesList] = useState<any[]>(SEED_STATES);
  const [allMandis, setAllMandis] = useState<any[]>(SEED_MANDIS);
  const [loadingMandis, setLoadingMandis] = useState(false);

  const [selectedRadius, setSelectedRadius] = useState<number | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<string>('tomato');
  const [selectedVariety, setSelectedVariety] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyTradingCrop, setOnlyTradingCrop] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'distance' | 'price-desc' | 'price-asc'>('distance');
  const [selectedMandiId, setSelectedMandiId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'map'>('list');
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Detail panel synchronized state
  const [selectedMandiDetail, setSelectedMandiDetail] = useState<any | null>(null);
  const [mandiPriceSummary, setMandiPriceSummary] = useState<PriceHistorySummary | null>(null);
  const [mandiTradedCommodities, setMandiTradedCommodities] = useState<TradedCommodityItem[]>([]);
  const [mandiForecast, setMandiForecast] = useState<ForecastResult | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isForecastLoading, setIsForecastLoading] = useState(false);
  const reqSequenceRef = useRef(0);
  const currentCrop = useMemo(() => COMMODITIES.find((c) => c.id === selectedCommodity) || COMMODITIES[0], [selectedCommodity]);

  const { isSaved, toggle } = useSavedMarkets();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Synchronize detailed mandi intelligence whenever selected mandi, commodity or variety changes
  useEffect(() => {
    if (!selectedMandiId) {
      setSelectedMandiDetail(null);
      setMandiPriceSummary(null);
      setMandiTradedCommodities([]);
      setMandiForecast(null);
      return;
    }

    const currentReq = ++reqSequenceRef.current;
    const mandiObj = allMandis.find((m) => m.id === selectedMandiId);
    if (mandiObj) {
      setSelectedMandiDetail(mandiObj);
    } else {
      setSelectedMandiDetail({ id: selectedMandiId, name: selectedMandiId });
      ApiService.getMandi(selectedMandiId).then((m) => {
        if (m && currentReq === reqSequenceRef.current) {
          setSelectedMandiDetail(m);
        }
      });
    }

    setIsDetailLoading(true);
    setIsHistoryLoading(true);
    setIsForecastLoading(true);

    // 1. Fetch traded commodities
    ApiService.getMandiCommodities(selectedMandiId)
      .then((comms) => {
        if (currentReq === reqSequenceRef.current) {
          setMandiTradedCommodities(comms || []);
        }
      })
      .finally(() => {
        if (currentReq === reqSequenceRef.current) {
          setIsDetailLoading(false);
        }
      });

    // 2. Fetch price summary
    ApiService.getPriceHistorySummary(
      selectedMandiId,
      selectedCommodity,
      selectedVariety === 'all' ? undefined : selectedVariety,
      90
    )
      .then((summary) => {
        if (currentReq === reqSequenceRef.current) {
          setMandiPriceSummary(summary || null);
        }
      })
      .finally(() => {
        if (currentReq === reqSequenceRef.current) {
          setIsHistoryLoading(false);
        }
      });

    // 3. Fetch forecast
    ApiService.getForecast(
      selectedMandiId,
      selectedCommodity,
      selectedVariety === 'all' ? undefined : selectedVariety
    )
      .then((fc) => {
        if (currentReq === reqSequenceRef.current) {
          setMandiForecast(fc || null);
        }
      })
      .finally(() => {
        if (currentReq === reqSequenceRef.current) {
          setIsForecastLoading(false);
        }
      });
  }, [selectedMandiId, selectedCommodity, selectedVariety, allMandis]);

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

  // Synchronize initial state with saved location state if present or URL query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sParam = params.get('stateId');
      const mParam = params.get('mandiId');
      const cParam = params.get('commodityId') || params.get('commodity');
      const vParam = params.get('varietyId') || params.get('variety');
      if (sParam) {
        setSelectedState(sParam);
        if (selectedRadius === null) setSelectedRadius(100);
      }
      if (cParam) {
        setSelectedCommodity(cParam);
      }
      if (vParam) {
        setSelectedVariety(vParam);
      }
      if (mParam) {
        setSelectedMandiId(mParam);
      }
    }
  }, []);

  useEffect(() => {
    if (locationStateId && selectedState === 'all') {
      setSelectedState(locationStateId);
    }
  }, [locationStateId]);

  // Effective reference coordinates (User GPS/Manual coords or State reference mandi)
  const effectiveCoords = useMemo(() => {
    if (coordinates && coordinates.lat != null && coordinates.lon != null) {
      return coordinates;
    }
    const targetState = selectedState !== 'all' ? selectedState : locationStateId;
    if (targetState) {
      const stateMandi = allMandis.find(
        (m) => m.stateId === targetState && m.latitude != null && m.longitude != null
      );
      if (stateMandi && stateMandi.latitude != null && stateMandi.longitude != null) {
        return { lat: stateMandi.latitude, lon: stateMandi.longitude };
      }
    }
    return null;
  }, [coordinates, selectedState, locationStateId, allMandis]);

  // When location or reference is available and radius hasn't been chosen yet, focus locally
  useEffect(() => {
    if (effectiveCoords && selectedRadius === null) {
      setSelectedRadius(100);
    }
  }, [effectiveCoords, selectedRadius]);

  // Sync scroll when marker is clicked on map
  const handleSelectMandiFromMap = (id: string) => {
    setSelectedMandiId(id);
    const element = cardRefs.current[id];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  // State lookup map for quick label matching
  const stateLookup = useMemo(() => {
    const map = new Map<string, string>();
    statesList.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [statesList]);

  // Calculate distance & live prices for all mandis
  const mandisWithCalculations = useMemo(() => {
    const refCoords = effectiveCoords;
    return allMandis.map((mandi) => {
      let distance: number | undefined = undefined;
      if (refCoords && mandi.latitude != null && mandi.longitude != null) {
        const R = 6371.0;
        const dLat = ((mandi.latitude - refCoords.lat) * Math.PI) / 180;
        const dLon = ((mandi.longitude - refCoords.lon) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((refCoords.lat * Math.PI) / 180) *
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
  }, [allMandis, effectiveCoords, stateLookup]);

  // Filter & Sort
  const filteredMandis = useMemo(() => {
    let result = [...mandisWithCalculations];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.fullName && m.fullName.toLowerCase().includes(q)) ||
          (m.districtId && m.districtId.toLowerCase().includes(q)) ||
          (m.stateName && m.stateName.toLowerCase().includes(q))
      );
    }

    // State filter
    if (selectedState !== 'all') {
      result = result.filter((m) => m.stateId === selectedState);
    }

    // Distance radius filter (enabled when reference coords available)
    if (selectedRadius != null && effectiveCoords) {
      result = result.filter((m) => m.distanceKm != null && m.distanceKm <= selectedRadius);
    }

    // Only markets with active prices for selected crop
    if (onlyTradingCrop) {
      result = result.filter((m) => m.latestPrice != null);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'distance') {
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        // If distances are pending, show mandis with active price observations first
        if (a.latestPrice != null && b.latestPrice == null) return -1;
        if (a.latestPrice == null && b.latestPrice != null) return 1;
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
  }, [mandisWithCalculations, searchQuery, selectedState, selectedRadius, effectiveCoords, onlyTradingCrop, sortBy]);

  // Auto-select first mandi if none selected so screen never feels empty or broken
  useEffect(() => {
    if (!selectedMandiId && filteredMandis.length > 0) {
      setSelectedMandiId(filteredMandis[0].id);
    }
  }, [filteredMandis, selectedMandiId]);

  // Reset pagination visible count when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, selectedState, selectedRadius, selectedCommodity, onlyTradingCrop, sortBy]);

  const displayedMandis = useMemo(() => {
    return filteredMandis.slice(0, visibleCount);
  }, [filteredMandis, visibleCount]);

  // High performance map markers list (capped in all-India view to keep map at 60fps)
  const mapMandis = useMemo(() => {
    let list = filteredMandis.filter((m) => m.hasCoords);
    if (selectedRadius === null && selectedState === 'all' && !searchQuery.trim()) {
      list = list.slice(0, 150);
    }
    return list.map((m) => ({
      id: m.id,
      name: m.name,
      latitude: m.latitude!,
      longitude: m.longitude!,
      distanceKm: m.distanceKm,
      latestPrice: m.latestPrice,
      trendDirection: m.trendDirection,
    }));
  }, [filteredMandis, selectedRadius, selectedState, searchQuery]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedState !== 'all' ||
    onlyTradingCrop ||
    (selectedRadius != null && effectiveCoords != null);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedState('all');
    setSelectedRadius(null);
    setOnlyTradingCrop(false);
    setSortBy('distance');
  };

  const handleStateFilterChange = (val: string) => {
    setSelectedState(val);
    if (val !== 'all') {
      const stateMandi = allMandis.find((m) => m.stateId === val && m.latitude != null && m.longitude != null);
      const coords = stateMandi ? { lat: stateMandi.latitude!, lon: stateMandi.longitude! } : undefined;
      const stName = stateLookup.get(val) || val;
      const label = stateMandi ? `${stateMandi.name}, ${stName}` : stName;
      setManualLocation(val, stateMandi?.districtId, stateMandi?.id, coords, label);
      if (selectedRadius === null) {
        setSelectedRadius(100);
      }
    }
  };

  const handleRadiusClick = (r: number | null) => {
    setSelectedRadius(r);
    if (r !== null && !effectiveCoords) {
      openPicker();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Context Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t('nav.nearby', 'Market Explorer')}</h1>
            <p className="text-xs text-slate-500 mt-1">
              {locationStatus === 'DETECTED'
                ? `${t('loc.detected')}: ${locationLabel}`
                : locationStatus === 'MANUAL'
                ? `${t('loc.manual')}: ${locationLabel}`
                : locationStatus === 'DENIED'
                ? t('loc.denied')
                : t('loc.allIndia', 'All India Overview')}{' '}
              &bull; Showing {filteredMandis.length} of {allMandis.length} mandis across {statesList.length} States
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openPicker()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-800 border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-slate-600" />
              <span>{locationStatus === 'MANUAL' || locationStatus === 'DETECTED' ? 'Change Location' : 'Set Location'}</span>
            </button>
            <button
              onClick={() => detectLocation()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-800 border border-green-200 rounded-lg text-xs font-semibold hover:bg-green-100 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5 text-green-700" />
              <span>{t('loc.useLocation', 'Detect GPS')}</span>
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
              placeholder={t('filter.search', 'Search market, district or state…')}
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
              onChange={(e) => handleStateFilterChange(e.target.value)}
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
              <option value="distance">{t('filter.nearest', 'Nearest Distance')}</option>
              <option value="price-desc">{t('filter.priceHigh', 'Price: High to Low')}</option>
              <option value="price-asc">{t('filter.priceLow', 'Price: Low to High')}</option>
            </select>
          </div>
        </div>

        {/* Radius Pills & Filter Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 mr-1">{t('filter.radius', 'Distance Radius')}:</span>
            <button
              onClick={() => handleRadiusClick(null)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
                selectedRadius === null
                  ? 'bg-green-800 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              {selectedState !== 'all' ? `Entire State (${stateLookup.get(selectedState) || 'State'})` : 'All India'}
            </button>
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => handleRadiusClick(r)}
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

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 transition-colors">
              <input
                type="checkbox"
                checked={onlyTradingCrop}
                onChange={(e) => setOnlyTradingCrop(e.target.checked)}
                className="w-3.5 h-3.5 text-emerald-700 rounded border-slate-300 focus:ring-emerald-600 cursor-pointer"
              />
              <span>Only markets reporting {COMMODITIES.find((c) => c.id === selectedCommodity)?.name || 'crop'}</span>
            </label>
          </div>

          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-slate-600 h-7 px-2.5"
            >
              <X className="w-3.5 h-3.5 mr-1" />
              {t('btn.clearFilters', 'Clear Filters')}
            </Button>
          )}
        </div>

        {/* Informative prompt if user selected a radius without an active location */}
        {selectedRadius !== null && !effectiveCoords && (
          <div className="mt-3 p-2.5 px-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Select a state or your market location to calculate distances for &le; {selectedRadius} km range.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openPicker()}
                className="px-2.5 py-1 bg-green-700 hover:bg-green-800 text-white font-semibold rounded text-[11px] transition-colors shadow-sm"
              >
                Set Location
              </button>
              <button
                onClick={() => detectLocation()}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded text-[11px] transition-colors shadow-sm"
              >
                Detect GPS
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Selected Market Live Intelligence Panel */}
      {selectedMandiDetail && (
        <div id="selected-market-intelligence" className="scroll-mt-20">
          <SelectedMarketPanel
            mandi={selectedMandiDetail}
            commodityId={selectedCommodity}
            varietyId={selectedVariety}
            isDetailLoading={isDetailLoading}
            isHistoryLoading={isHistoryLoading}
            isForecastLoading={isForecastLoading}
            priceSummary={mandiPriceSummary}
            tradedCommodities={mandiTradedCommodities}
            forecast={mandiForecast}
            isSaved={isSaved(selectedMandiDetail.id, selectedCommodity)}
            onToggleSave={() => toggle(selectedMandiDetail.id, selectedCommodity)}
            onSelectCommodity={(cId) => setSelectedCommodity(cId)}
            onClose={() => setSelectedMandiId(null)}
          />
        </div>
      )}

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
          <span>List View ({filteredMandis.length})</span>
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all',
            mobileView === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
          )}
        >
          <MapIcon className="w-3.5 h-3.5" />
          <span>Map View ({mapMandis.length})</span>
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
            userLocation={effectiveCoords}
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
                  {selectedRadius != null
                    ? `No mandis found within ≤ ${selectedRadius} km. Try expanding to 50 km or 100 km.`
                    : 'Try expanding your distance radius or clearing the search filter.'}
                </p>
                <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
                  {selectedRadius != null && selectedRadius < 50 && (
                    <Button size="sm" variant="outline" onClick={() => setSelectedRadius(50)} className="text-xs text-slate-700">
                      Expand to &le; 50 km
                    </Button>
                  )}
                  {selectedRadius != null && selectedRadius < 100 && (
                    <Button size="sm" variant="outline" onClick={() => setSelectedRadius(100)} className="text-xs text-slate-700">
                      Expand to &le; 100 km
                    </Button>
                  )}
                  {selectedRadius != null && (
                    <Button size="sm" variant="outline" onClick={() => setSelectedRadius(null)} className="text-xs text-slate-700">
                      View {selectedState !== 'all' ? 'Entire State' : 'All India'}
                    </Button>
                  )}
                  <Button size="sm" onClick={clearAllFilters} className="text-xs bg-green-700 text-white">
                    {t('btn.clearFilters', 'Reset All Filters')}
                  </Button>
                </div>
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
                    data-mandi-card="true"
                    ref={(el) => {
                      cardRefs.current[mandi.id] = el;
                    }}
                    onClick={() => {
                      setSelectedMandiId(mandi.id);
                    }}
                    className={cn(
                      'bg-white rounded-xl border p-4 transition-all cursor-pointer',
                      isCurrentSelected
                        ? 'border-emerald-600 ring-2 ring-emerald-600/30 shadow-md bg-emerald-50/15'
                        : 'border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-slate-900 text-base">{mandi.name}</h3>
                          {isCurrentSelected && (
                            <Badge className="bg-emerald-800 text-white text-[10px] px-2 py-0">
                              Selected
                            </Badge>
                          )}
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
                          Usual Price ({COMMODITIES.find((c) => c.id === selectedCommodity)?.name})
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
                              {currentCrop.name} not reported
                            </span>
                          )}
                        </div>
                        {mandi.observationDate && mandi.latestPrice != null && (
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Observed on {formatDateShort(mandi.observationDate)}
                          </span>
                        )}
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
                            ? 'Rising trend'
                            : mandi.trendDirection === 'Falling'
                            ? 'Falling trend'
                            : 'Stable price'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-100">
                      <Button
                        variant={isCurrentSelected ? 'default' : 'outline'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMandiId(mandi.id);
                          const el = document.getElementById('selected-market-intelligence');
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className={cn(
                          'flex-1 text-xs h-8',
                          isCurrentSelected ? 'bg-emerald-800 text-white hover:bg-emerald-900' : 'text-slate-700'
                        )}
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1" />
                        {isCurrentSelected ? 'Viewing Live Details' : 'Select Market'}
                      </Button>

                      <Link
                        href={`/compare?mandiIds=${mandi.id}&commodityId=${selectedCommodity}`}
                        className="shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="outline" size="sm" className="text-xs text-slate-700 h-8 px-2.5" title="Compare this market">
                          <GitCompare className="w-3.5 h-3.5" />
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

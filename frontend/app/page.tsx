'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  TrendingUp,
  GitCompare,
  ArrowRight,
  Sprout,
  Compass,
  Store,
  Bookmark,
  Calendar,
  AlertCircle,
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { STATES as SEED_STATES, DISTRICTS as SEED_DISTRICTS, MANDIS as SEED_MANDIS } from '@/lib/data/geography';
import { COMMODITIES } from '@/lib/data/commodities';
import { formatPrice } from '@/lib/utils/formatters';
import { useLocation } from '@/lib/context/LocationContext';
import { useLanguage } from '@/lib/context/LanguageContext';
import { ApiService } from '@/lib/services/api';

export default function HomePage() {
  const router = useRouter();
  const {
    coordinates,
    locationLabel,
    status,
    stateId,
    districtId,
    mandiId,
    detectLocation,
    setManualLocation,
    openPicker,
  } = useLocation();
  const { t } = useLanguage();
  const [detecting, setDetecting] = useState(false);

  const [statesList, setStatesList] = useState<any[]>(SEED_STATES);
  const [districtsList, setDistrictsList] = useState<any[]>([]);
  const [mandisList, setMandisList] = useState<any[]>([]);

  // Location & crop selector state
  const [selectedState, setSelectedState] = useState('ka');
  const [selectedDistrict, setSelectedDistrict] = useState('ka-kolar');
  const [selectedMandi, setSelectedMandi] = useState('kolar-apmc');
  const [selectedCommodity, setSelectedCommodity] = useState('tomato');
  const [selectedVariety, setSelectedVariety] = useState('tomato-hybrid');

  // Load dynamic states on mount
  useEffect(() => {
    ApiService.getStates().then((s) => {
      if (s && s.length > 0) setStatesList(s);
    });
  }, []);

  // Synchronize with detected or manually chosen location in LocationContext
  useEffect(() => {
    if (stateId) {
      setSelectedState(stateId);
      if (districtId) {
        setSelectedDistrict(districtId);
      }
      if (mandiId) {
        setSelectedMandi(mandiId);
      }
    } else if (mandiId) {
      setSelectedMandi(mandiId);
    }
  }, [mandiId, stateId, districtId]);

  useEffect(() => {
    if (selectedState) {
      ApiService.getDistricts(selectedState).then((dists) => {
        if (dists && dists.length > 0) {
          setDistrictsList(dists);
          if (!dists.some((d) => d.id === selectedDistrict)) {
            setSelectedDistrict(dists[0].id);
          }
        }
      });
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedDistrict) {
      ApiService.getMandis({ districtId: selectedDistrict }).then((mands) => {
        if (mands && mands.length > 0) {
          setMandisList(mands);
          if (!mands.some((m) => m.id === selectedMandi)) {
            setSelectedMandi(mands[0].id);
          }
        }
      });
    }
  }, [selectedDistrict]);

  const filteredDistricts = districtsList.length > 0
    ? districtsList
    : SEED_DISTRICTS.filter((d) => d.stateId === selectedState);

  const filteredMandis = mandisList.length > 0
    ? mandisList
    : SEED_MANDIS.filter((m) => m.districtId === selectedDistrict);

  const currentComm = COMMODITIES.find((c) => c.id === selectedCommodity);
  const varieties = currentComm ? currentComm.varieties : [];

  const handleStateChange = (newStatId: string) => {
    setSelectedState(newStatId);
    ApiService.getDistricts(newStatId).then((dists) => {
      if (dists && dists.length > 0) {
        setDistrictsList(dists);
        const firstDist = dists[0].id;
        setSelectedDistrict(firstDist);
        ApiService.getMandis({ districtId: firstDist }).then((mands) => {
          if (mands && mands.length > 0) {
            setMandisList(mands);
            const firstMandi = mands[0];
            setSelectedMandi(firstMandi.id);
            const coords = firstMandi.latitude != null && firstMandi.longitude != null
              ? { lat: firstMandi.latitude, lon: firstMandi.longitude }
              : undefined;
            const stateObj = statesList.find((s) => s.id === newStatId);
            const label = `${firstMandi.name}, ${stateObj?.name || newStatId}`;
            setManualLocation(newStatId, firstDist, firstMandi.id, coords, label);
          } else {
            setManualLocation(newStatId, firstDist);
          }
        });
      } else {
        setManualLocation(newStatId);
      }
    });
  };

  const handleDistrictChange = (distId: string) => {
    setSelectedDistrict(distId);
    ApiService.getMandis({ districtId: distId }).then((mands) => {
      if (mands && mands.length > 0) {
        setMandisList(mands);
        const firstMandi = mands[0];
        setSelectedMandi(firstMandi.id);
        const coords = firstMandi.latitude != null && firstMandi.longitude != null
          ? { lat: firstMandi.latitude, lon: firstMandi.longitude }
          : undefined;
        const stateObj = statesList.find((s) => s.id === selectedState);
        const label = `${firstMandi.name}, ${stateObj?.name || selectedState}`;
        setManualLocation(selectedState, distId, firstMandi.id, coords, label);
      } else {
        setManualLocation(selectedState, distId);
      }
    });
  };

  const handleMandiChange = (mId: string) => {
    setSelectedMandi(mId);
    const chosen = filteredMandis.find((m) => m.id === mId);
    const coords = chosen?.latitude != null && chosen?.longitude != null
      ? { lat: chosen.latitude, lon: chosen.longitude }
      : undefined;
    const stateObj = statesList.find((s) => s.id === selectedState);
    const label = chosen ? `${chosen.name}, ${stateObj?.name || selectedState}` : undefined;
    setManualLocation(selectedState, selectedDistrict, mId, coords, label);
  };

  const handleCommodityChange = (commId: string) => {
    setSelectedCommodity(commId);
    const comm = COMMODITIES.find((c) => c.id === commId);
    if (comm && comm.varieties.length > 0) {
      setSelectedVariety(comm.varieties[0].id);
    }
  };

  const handleUseMyLocation = async () => {
    setDetecting(true);
    try {
      await detectLocation();
    } finally {
      setDetecting(false);
    }
  };

  const handleGoToForecast = () => {
    router.push(`/forecast?mandiId=${selectedMandi}&commodityId=${selectedCommodity}&varietyId=${selectedVariety}`);
  };

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-green-900 to-green-950 text-white p-6 sm:p-10 shadow-lg">
        <div className="relative z-10 max-w-3xl space-y-4">
          <Badge className="bg-green-700/80 hover:bg-green-700 text-green-100 border-green-600/50 px-3 py-1 text-xs">
            {t('brand.title', 'AgriForecasting')} &bull; {t('brand.subtitle', 'Mandi Price Intelligence')}
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Which crop do you want to check?
          </h1>
          <p className="text-base sm:text-lg text-green-100/90 leading-relaxed font-normal">
            Discover nearby APMC markets, track real market prices, and explore 14 days of expected prices before selling your produce.
          </p>

          {/* Quick Crop Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-green-200 font-medium mr-1">Popular crops:</span>
            {COMMODITIES.slice(0, 6).map((c) => (
              <button
                key={c.id}
                onClick={() => handleCommodityChange(c.id)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                  selectedCommodity === c.id
                    ? 'bg-white text-green-950 font-bold shadow-sm'
                    : 'bg-green-800/80 hover:bg-green-800 text-green-100 border border-green-700/60'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <Link href={`/nearby-mandis?stateId=${selectedState}&districtId=${selectedDistrict}&mandiId=${selectedMandi}&commodityId=${selectedCommodity}`}>
              <Button className="bg-white text-green-900 hover:bg-green-50 font-semibold px-5 shadow">
                <Compass className="w-4 h-4 mr-2 text-green-700" />
                Find Nearby Markets
              </Button>
            </Link>
            <Button
              onClick={handleGoToForecast}
              variant="outline"
              className="border-green-400 text-white bg-green-900/40 hover:bg-green-800 font-semibold"
            >
              <TrendingUp className="w-4 h-4 mr-2 text-green-300" />
              Check 14-Day Expected Prices
            </Button>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <Sprout className="w-96 h-96 text-white" />
        </div>
      </section>

      {/* 3-Step Selection Box */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span>Check Market Prices &amp; 14-Day Outlook</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Follow 3 simple steps: <strong>(1) Pick your crop</strong> &rarr; <strong>(2) Choose your market</strong> &rarr; <strong>(3) See prices &amp; expected trends</strong>
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleUseMyLocation}
            className="self-start sm:self-auto border-green-300 text-green-800 hover:bg-green-50"
          >
            {detecting ? (
              <span className="w-3.5 h-3.5 border-2 border-green-700 border-t-transparent rounded-full animate-spin mr-1.5" />
            ) : (
              <Navigation className="w-3.5 h-3.5 mr-1.5 text-green-700" />
            )}
            {detecting
              ? t('loc.detecting', 'Detecting location…')
              : t('loc.useLocation', 'Use my location')}
          </Button>
        </div>

        {/* Status indicator if detected */}
        {status === 'DETECTED' && mandiId && (
          <div className="p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-900 flex items-center justify-between">
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 text-green-700 mr-1.5" />
              Nearest detected APMC: <strong>{filteredMandis.find((m: any) => m.id === mandiId)?.name || mandiId}</strong>
            </span>
            <span className="text-slate-500 text-[11px]">GPS Detected</span>
          </div>
        )}

        {/* 3 Steps Container */}
        <div className="space-y-6">
          {/* Step 1: Pick Crop */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-800 text-white text-xs font-bold">1</span>
              <span className="text-sm font-bold text-slate-900">Step 1: Pick your crop</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Crop Name</label>
                <select
                  data-testid="home-commodity-select"
                  value={selectedCommodity}
                  onChange={(e) => handleCommodityChange(e.target.value)}
                  className="w-full h-10 px-3 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
                >
                  {COMMODITIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Crop Variety</label>
                <select
                  data-testid="home-variety-select"
                  value={selectedVariety}
                  onChange={(e) => setSelectedVariety(e.target.value)}
                  className="w-full h-10 px-3 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
                >
                  {varieties.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Choose Market */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-800 text-white text-xs font-bold">2</span>
              <span className="text-sm font-bold text-slate-900">Step 2: Choose your market</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('filter.state', 'State')}</label>
                <select
                  data-testid="home-state-select"
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full h-10 px-3 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
                >
                  {statesList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('filter.district', 'District')}</label>
                <select
                  data-testid="home-district-select"
                  value={selectedDistrict}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full h-10 px-3 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
                >
                  {filteredDistricts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('nav.market', 'Mandi')}</label>
                <select
                  data-testid="home-mandi-select"
                  value={selectedMandi}
                  onChange={(e) => handleMandiChange(e.target.value)}
                  className="w-full h-10 px-3 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
                >
                  {filteredMandis.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 3: Explore Prices */}
          <div className="p-4 rounded-xl bg-green-50/50 border border-green-200 space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-green-800 text-white text-xs font-bold">3</span>
              <span className="text-sm font-bold text-slate-900">Step 3: See current prices, trends &amp; 14-day expected prices</span>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button onClick={handleGoToForecast} className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm">
                <TrendingUp className="w-4 h-4 mr-2" />
                View 14-Day Expected Prices
              </Button>

              <Link href={`/nearby-mandis?stateId=${selectedState}&districtId=${selectedDistrict}&mandiId=${selectedMandi}&commodityId=${selectedCommodity}`}>
                <Button variant="outline" className="border-emerald-600 text-emerald-800 bg-white hover:bg-emerald-50">
                  <Compass className="w-4 h-4 mr-2 text-emerald-700" />
                  Find Nearby Markets for {currentComm?.name}
                </Button>
              </Link>

              <Link href={`/compare?mandiIds=${selectedMandi}&commodityId=${selectedCommodity}&varietyId=${selectedVariety}`}>
                <Button variant="ghost" className="text-slate-700 hover:bg-slate-100">
                  <GitCompare className="w-4 h-4 mr-2 text-slate-600" />
                  Compare With Other Markets
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Market Highlights */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Usual Market Price Highlights</h2>
            <p className="text-xs text-slate-500">Real recorded prices across major agricultural hubs as of 23 Nov 2026</p>
          </div>
          <Link href={`/nearby-mandis?stateId=${selectedState}`} className="text-xs font-semibold text-green-800 hover:underline flex items-center">
            Find Nearby Markets <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Highlight 1 */}
          <Card className="border border-slate-200 hover:border-green-300 transition-all shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="default" className="bg-green-100 text-green-800 text-[11px] mb-1.5">
                    Rising Trend &uarr;
                  </Badge>
                  <h3 className="font-bold text-slate-900 text-base">Tomato — Kolar APMC</h3>
                  <p className="text-xs text-slate-500">Kolar District, Karnataka</p>
                </div>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs text-slate-500 block">Usual Market Price</span>
                  <span className="text-2xl font-extrabold text-slate-900">₹1,908</span>
                  <span className="text-xs text-slate-500 ml-1">/quintal</span>
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                  +14.3% (7d)
                </span>
              </div>
              <Link href="/forecast?mandiId=kolar-apmc&commodityId=tomato" className="block pt-2">
                <span className="text-xs font-semibold text-green-800 hover:underline flex items-center">
                  Explore 14-Day Expected Prices &rarr;
                </span>
              </Link>
            </CardContent>
          </Card>

          {/* Highlight 2 */}
          <Card className="border border-slate-200 hover:border-green-300 transition-all shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="default" className="bg-green-100 text-green-800 text-[11px] mb-1.5">
                    High Demand &uarr;
                  </Badge>
                  <h3 className="font-bold text-slate-900 text-base">Wheat — Karnal APMC</h3>
                  <p className="text-xs text-slate-500">Karnal District, Haryana</p>
                </div>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs text-slate-500 block">Usual Market Price</span>
                  <span className="text-2xl font-extrabold text-slate-900">₹2,385</span>
                  <span className="text-xs text-slate-500 ml-1">/quintal</span>
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                  +5.4% (7d)
                </span>
              </div>
              <Link href="/forecast?mandiId=karnal-apmc&commodityId=wheat" className="block pt-2">
                <span className="text-xs font-semibold text-green-800 hover:underline flex items-center">
                  Explore 14-Day Expected Prices &rarr;
                </span>
              </Link>
            </CardContent>
          </Card>

          {/* Highlight 3 */}
          <Card className="border border-slate-200 hover:border-green-300 transition-all shadow-sm">
            <CardContent className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-[11px] mb-1.5">
                    Stable Range
                  </Badge>
                  <h3 className="font-bold text-slate-900 text-base">Onion — Lasalgaon APMC</h3>
                  <p className="text-xs text-slate-500">Nashik District, Maharashtra</p>
                </div>
              </div>
              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <span className="text-xs text-slate-500 block">Usual Market Price</span>
                  <span className="text-2xl font-extrabold text-slate-900">₹2,240</span>
                  <span className="text-xs text-slate-500 ml-1">/quintal</span>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded">
                  +3.2% (7d)
                </span>
              </div>
              <Link href="/forecast?mandiId=lasalgaon-apmc&commodityId=onion" className="block pt-2">
                <span className="text-xs font-semibold text-green-800 hover:underline flex items-center">
                  Explore 14-Day Expected Prices &rarr;
                </span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Helps The Farmer */}
      <section className="bg-slate-100/70 border border-slate-200 rounded-2xl p-6 sm:p-8">
        <h2 className="text-lg font-bold text-slate-900 mb-6">How AgriForecasting Helps Farmers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-green-800 text-white flex items-center justify-center font-bold text-sm">
              1
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Find Nearby Markets</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Locate APMC markets within 10 km to 100 km of your farm. See which markets are actively reporting prices for your crop today.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-green-800 text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Understand Real Market Prices</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review daily usual market prices and actual transaction movements over the past 90 days to negotiate confidently.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-green-800 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Plan with Expected Prices</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Check 14-day expected price trends and compare multiple markets side-by-side to choose the best date and market to sell.
            </p>
          </div>
        </div>
      </section>

      {/* Truthfulness note */}
      <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Demonstration Release:</strong> Market observations and forecasts displayed are generated for evaluation and prototype testing using a curated Indian mandi dataset with fixed reference date <strong>23 November 2026</strong>. Always verify prices with your local APMC commission agents before dispatching produce.
        </p>
      </div>
    </div>
  );
}

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
  const { coordinates, locationLabel, status, stateId, districtId, mandiId, detectLocation } = useLocation();
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
    if (mandiId) {
      setSelectedMandi(mandiId);
      const m = SEED_MANDIS.find((item) => item.id === mandiId);
      if (m) {
        setSelectedState(m.stateId);
        setSelectedDistrict(m.districtId);
      }
    } else if (stateId) {
      setSelectedState(stateId);
      if (districtId) {
        setSelectedDistrict(districtId);
      }
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
        setSelectedDistrict(dists[0].id);
        ApiService.getMandis({ districtId: dists[0].id }).then((mands) => {
          if (mands && mands.length > 0) {
            setMandisList(mands);
            setSelectedMandi(mands[0].id);
          }
        });
      }
    });
  };

  const handleDistrictChange = (distId: string) => {
    setSelectedDistrict(distId);
    ApiService.getMandis({ districtId: distId }).then((mands) => {
      if (mands && mands.length > 0) {
        setMandisList(mands);
        setSelectedMandi(mands[0].id);
      }
    });
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
            {t('hero.title', 'Know your market prices before you sell.')}
          </h1>
          <p className="text-base sm:text-lg text-green-100/90 leading-relaxed font-normal">
            {t('hero.subtitle', 'Discover nearby mandis, understand market trends and explore the next 14 days of expected prices to choose the best market for your harvest.')}
          </p>

          {/* Quick Actions Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link href="/nearby-mandis">
              <Button className="bg-white text-green-900 hover:bg-green-50 font-semibold px-5 shadow">
                <Compass className="w-4 h-4 mr-2 text-green-700" />
                {t('btn.exploreNearby', 'Explore Nearby Mandis')}
              </Button>
            </Link>
            <Link href="/forecast">
              <Button variant="outline" className="border-green-400 text-white bg-green-900/40 hover:bg-green-800">
                <TrendingUp className="w-4 h-4 mr-2 text-green-300" />
                {t('btn.viewForecast', '14-Day Forecast')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 opacity-10 pointer-events-none">
          <Sprout className="w-96 h-96 text-white" />
        </div>
      </section>

      {/* Location & Crop Discovery Box */}
      <section className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-100 gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Explore Market &amp; Crop Prices</h2>
            <p className="text-sm text-slate-500">
              Select your location and commodity to view current rates and 14-day forecasts.
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
          <div className="mt-3 p-2.5 bg-green-50 border border-green-200 rounded-lg text-xs text-green-900 flex items-center justify-between">
            <span className="flex items-center">
              <CheckCircle2 className="w-4 h-4 text-green-700 mr-1.5" />
              Nearest detected APMC: <strong>{SEED_MANDIS.find((m: any) => m.id === mandiId)?.name}</strong>
            </span>
            <span className="text-slate-500 text-[11px]">GPS Detected</span>
          </div>
        )}

        {/* Form Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-6">
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
              onChange={(e) => setSelectedMandi(e.target.value)}
              className="w-full h-10 px-3 text-sm font-medium border border-slate-200 rounded-lg bg-white text-slate-800 focus:ring-2 focus:ring-green-700 focus:outline-none"
            >
              {filteredMandis.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('filter.commodity', 'Commodity')}</label>
            <select
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
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">{t('filter.variety', 'Variety')}</label>
            <select
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

        {/* Submit Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-6 mt-4 border-t border-slate-100">
          <Button onClick={handleGoToForecast} className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold shadow-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t('btn.viewForecast', 'View 14-Day Price Forecast')}
          </Button>

          <Link href={`/market/${selectedMandi}?commodity=${selectedCommodity}&variety=${selectedVariety}`}>
            <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
              <Store className="w-4 h-4 mr-2 text-slate-600" />
              {t('btn.viewMarket', 'View Market Profile')}
            </Button>
          </Link>

          <Link href={`/compare?mandiIds=${selectedMandi}&commodityId=${selectedCommodity}&varietyId=${selectedVariety}`}>
            <Button variant="ghost" className="text-emerald-800 hover:bg-emerald-50">
              <GitCompare className="w-4 h-4 mr-2" />
              {t('btn.compare', 'Compare With Other Mandis')}
            </Button>
          </Link>
        </div>
      </section>

      {/* Market Highlights */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Market Price Highlights</h2>
            <p className="text-xs text-slate-500">Representative prices across major agricultural hubs as of 23 Nov 2026</p>
          </div>
          <Link href="/nearby-mandis" className="text-xs font-semibold text-green-800 hover:underline flex items-center">
            {t('nav.marketExplorer', 'View All Mandis')} <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
                  <span className="text-2xl font-extrabold text-slate-900">₹1,908</span>
                  <span className="text-xs text-slate-500 ml-1">/quintal</span>
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                  +14.3% (7d)
                </span>
              </div>
              <Link href="/forecast?mandiId=kolar-apmc&commodityId=tomato" className="block pt-2">
                <span className="text-xs font-semibold text-green-800 hover:underline flex items-center">
                  Explore 14-Day Forecast &rarr;
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
                  <span className="text-2xl font-extrabold text-slate-900">₹2,385</span>
                  <span className="text-xs text-slate-500 ml-1">/quintal</span>
                </div>
                <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded">
                  +5.4% (7d)
                </span>
              </div>
              <Link href="/forecast?mandiId=karnal-apmc&commodityId=wheat" className="block pt-2">
                <span className="text-xs font-semibold text-green-800 hover:underline flex items-center">
                  Explore 14-Day Forecast &rarr;
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
                  <span className="text-2xl font-extrabold text-slate-900">₹2,240</span>
                  <span className="text-xs text-slate-500 ml-1">/quintal</span>
                </div>
                <span className="text-xs font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded">
                  +3.2% (7d)
                </span>
              </div>
              <Link href="/forecast?mandiId=lasalgaon-apmc&commodityId=onion" className="block pt-2">
                <span className="text-xs font-semibold text-green-800 hover:underline flex items-center">
                  Explore 14-Day Forecast &rarr;
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
            <h3 className="font-semibold text-slate-900 text-base">Discover Local Mandis</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Find APMC markets within 10 km to 100 km of your farm. See which markets are open and accepting your crop today.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-green-800 text-white flex items-center justify-center font-bold text-sm">
              2
            </div>
            <h3 className="font-semibold text-slate-900 text-base">Understand Price Trends</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review daily modal, minimum, and maximum prices alongside market arrival volumes over the past 90 days.
            </p>
          </div>

          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-green-800 text-white flex items-center justify-center font-bold text-sm">
              3
            </div>
            <h3 className="font-semibold text-slate-900 text-base">14-Day Price Forecasts</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Plan your harvest and transport timing with 14-day machine-learning price forecasts and compare multiple markets side-by-side.
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

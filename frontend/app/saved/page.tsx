'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  TrendingUp,
  Store,
  GitCompare,
  Trash2,
  MapPin,
  ExternalLink,
  Sparkles,
  Info,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useSavedMarkets } from '@/lib/hooks/useSavedMarkets';
import { getMandiByIdSync, getStateByIdSync, getDistrictByIdSync } from '@/lib/services/geography.service';
import { getCommodityByIdSync } from '@/lib/services/commodity.service';
import { getHistoricalPricesForPair } from '@/lib/data/historical-prices';
import { formatPrice, formatDate } from '@/lib/utils/formatters';
import { calculatePercentageChange, getPriceDirection } from '@/lib/utils/price-utils';
import { useLanguage } from '@/lib/context/LanguageContext';
import { cn } from '@/lib/utils/cn';

export default function SavedMarketsPage() {
  const { t } = useLanguage();
  const { savedMarkets, remove } = useSavedMarkets();
  const [removedAlert, setRemovedAlert] = useState<string | null>(null);

  const handleRemove = (mandiId: string, commodityId: string, name: string) => {
    remove(mandiId, commodityId);
    setRemovedAlert(`Removed ${name} from saved markets.`);
    setTimeout(() => setRemovedAlert(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title={t('saved.title', 'Saved Markets & Watchlist')}
        subtitle={t('saved.subtitle', 'Track your frequent mandis and favourite commodity prices without signing in.')}
      />

      {removedAlert && (
        <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-sm flex items-center justify-between">
          <span>{removedAlert}</span>
          <button onClick={() => setRemovedAlert(null)} className="text-amber-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {savedMarkets.length === 0 ? (
        <EmptyState
          icon={<Bookmark className="w-8 h-8 text-slate-400" />}
          title={t('saved.emptyTitle', 'No saved markets yet')}
          description={t('saved.emptyDesc', 'Bookmark your favourite APMC mandis and crops to monitor price shifts with a single tap.')}
          action={
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              <Link href="/nearby-mandis">
                <Button className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs">
                  <MapPin className="w-4 h-4 mr-1.5" />
                  {t('btn.exploreNearby', 'Explore Nearby Mandis')}
                </Button>
              </Link>
              <Link href="/forecast">
                <Button variant="outline" className="border-slate-200 text-xs">
                  <TrendingUp className="w-4 h-4 mr-1.5 text-emerald-700" />
                  {t('btn.viewForecast', '14-Day Forecast')}
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savedMarkets.map(({ mandiId, commodityId, savedAt }) => {
            const mandi = getMandiByIdSync(mandiId);
            const commodity = getCommodityByIdSync(commodityId);
            const state = mandi ? getStateByIdSync(mandi.stateId) : null;
            const district = mandi ? getDistrictByIdSync(mandi.districtId) : null;
            const history = getHistoricalPricesForPair(mandiId, commodityId);
            const latest = history[history.length - 1];
            const previous = history[history.length - 2];
            const pct =
              latest && previous
                ? calculatePercentageChange(latest.modalPrice, previous.modalPrice)
                : null;
            const dir =
              pct != null
                ? getPriceDirection(latest!.modalPrice, previous!.modalPrice)
                : 'neutral';

            const displayName = mandi ? mandi.name : mandiId;

            return (
              <Card
                key={`${mandiId}-${commodityId}`}
                className="relative overflow-hidden border border-slate-200 hover:shadow-md transition-shadow bg-white"
              >
                <div className="h-1.5 bg-green-600 w-full" />
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">
                        {displayName}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {district?.name || 'District'}, {state?.name || 'State'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(mandiId, commodityId, displayName)}
                      className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
                      title="Remove from saved markets"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 font-medium">
                      {commodity?.name ?? commodityId}
                    </Badge>
                    <span className="text-[11px] text-slate-400">
                      Saved {savedAt ? new Date(savedAt).toLocaleDateString() : 'recently'}
                    </span>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3.5 mb-4 border border-slate-100">
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-xs text-slate-500 block uppercase tracking-wider font-semibold">
                          Latest Modal Price
                        </span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-2xl font-black text-slate-900">
                            {latest ? formatPrice(latest.modalPrice) : '₹—'}
                          </span>
                          <span className="text-xs font-normal text-slate-500">/ quintal</span>
                        </div>
                      </div>
                      {pct != null && (
                        <div
                          className={cn(
                            'text-xs font-bold px-2 py-1 rounded-md flex items-center gap-0.5',
                            dir === 'up'
                              ? 'text-green-800 bg-green-100'
                              : dir === 'down'
                              ? 'text-rose-700 bg-rose-100'
                              : 'text-slate-600 bg-slate-200'
                          )}
                        >
                          {pct >= 0 ? '+' : ''}
                          {pct.toFixed(1)}%
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                      <span>As of {latest ? formatDate(latest.date) : '23 Nov 2026'}</span>
                      {latest?.arrivalsTonnes && (
                        <span>Arrivals: {latest.arrivalsTonnes} T</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <Link
                      href={`/market/${mandiId}?commodity=${commodityId}`}
                      className="w-full"
                    >
                      <Button variant="outline" size="sm" className="w-full text-xs text-slate-700">
                        <Store className="w-3.5 h-3.5 mr-1" />
                        Market
                      </Button>
                    </Link>
                    <Link
                      href={`/forecast?mandi=${mandiId}&commodity=${commodityId}`}
                      className="w-full"
                    >
                      <Button size="sm" className="w-full text-xs bg-green-700 hover:bg-green-800 text-white">
                        <TrendingUp className="w-3.5 h-3.5 mr-1" />
                        14-Day Forecast
                      </Button>
                    </Link>
                  </div>

                  <Link
                    href={`/compare?commodity=${commodityId}&mandis=${mandiId}`}
                    className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-green-800 py-1 transition-colors"
                  >
                    <GitCompare className="w-3.5 h-3.5" />
                    <span>Compare with neighboring mandis</span>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Farmer Advice Card */}
      <Card className="bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 border border-green-200 mt-8">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-green-700 text-white shadow-sm mt-0.5">
              <Sparkles className="w-5 h-5 text-green-200" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-base">Farmer Price Tip: Comparing Before Selling</h4>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                Prices for the same crop can vary significantly between mandis just 30–50 km apart. Use the{' '}
                <Link href="/compare" className="text-green-800 font-semibold underline underline-offset-2">
                  Compare Markets
                </Link>{' '}
                tool to evaluate whether traveling to a neighboring district APMC yields higher net earnings after diesel and transport costs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
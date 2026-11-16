import { Suspense } from 'react';
import MarketDetailClient from '@/components/market/MarketDetailClient';

export default function MarketPage({
  searchParams,
}: {
  searchParams?: Promise<{ mandiId?: string; commodity?: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading market profile...</div>}>
      <MarketPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function MarketPageContent({
  searchParams,
}: {
  searchParams?: Promise<{ mandiId?: string; commodity?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const mandiId = sp.mandiId || 'kolar-apmc';
  const commodityId = sp.commodity || 'tomato';

  return <MarketDetailClient initialMandiId={mandiId} initialCommodityId={commodityId} />;
}

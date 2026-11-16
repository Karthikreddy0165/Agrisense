import { Suspense } from 'react';
import MarketDetailClient from '@/components/market/MarketDetailClient';

export default function MandiDynamicPage({
  params,
  searchParams,
}: {
  params: Promise<{ mandiId: string }>;
  searchParams?: Promise<{ commodity?: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading market profile...</div>}>
      <MandiDynamicPageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function MandiDynamicPageContent({
  params,
  searchParams,
}: {
  params: Promise<{ mandiId: string }>;
  searchParams?: Promise<{ commodity?: string }>;
}) {
  const p = await params;
  const sp = searchParams ? await searchParams : {};
  const mandiId = p.mandiId || 'kolar-apmc';
  const commodityId = sp.commodity || 'tomato';

  return <MarketDetailClient initialMandiId={mandiId} initialCommodityId={commodityId} />;
}

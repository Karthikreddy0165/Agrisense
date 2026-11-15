import { Suspense } from 'react';
import ForecastClient from '@/components/forecast/ForecastClient';

export default function ForecastPage({
  searchParams,
}: {
  searchParams?: Promise<{ mandiId?: string; commodityId?: string; varietyId?: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading forecast...</div>}>
      <ForecastPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ForecastPageContent({
  searchParams,
}: {
  searchParams?: Promise<{ mandiId?: string; commodityId?: string; varietyId?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  const mandiId = sp.mandiId || 'kolar-apmc';
  const commodityId = sp.commodityId || 'tomato';
  const varietyId = sp.varietyId || 'tomato-hybrid';

  return (
    <ForecastClient
      initialMandiId={mandiId}
      initialCommodityId={commodityId}
      initialVarietyId={varietyId}
    />
  );
}

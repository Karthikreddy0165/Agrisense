import { Suspense } from 'react';
import CompareClient from '@/components/compare/CompareClient';

export default function ComparePage({
  searchParams,
}: {
  searchParams?: Promise<{ mandiIds?: string | string[]; commodityId?: string; varietyId?: string }>;
}) {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-400">Loading market comparison...</div>}>
      <ComparePageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ComparePageContent({
  searchParams,
}: {
  searchParams?: Promise<{ mandiIds?: string | string[]; commodityId?: string; varietyId?: string }>;
}) {
  const sp = searchParams ? await searchParams : {};
  let ids: string[] = ['kolar-apmc', 'yeshwanthpur-apmc'];
  if (sp.mandiIds) {
    ids = Array.isArray(sp.mandiIds) ? sp.mandiIds : sp.mandiIds.split(',');
  }
  const commId = sp.commodityId || 'tomato';
  const varId = sp.varietyId || 'tomato-hybrid';

  return (
    <CompareClient
      initialMandiIds={ids}
      initialCommodityId={commId}
      initialVarietyId={varId}
    />
  );
}

'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils/formatters';
import { getMandiByIdSync } from '@/lib/services/geography.service';
import { getCommodityByIdSync } from '@/lib/services/commodity.service';
import type { PredictionHistoryEntry } from '@/lib/types/history.types';
import { Badge } from '@/components/ui/badge';

interface RecentActivityProps {
  entries: PredictionHistoryEntry[];
}

export function RecentActivity({ entries }: RecentActivityProps) {
  if (entries.length === 0) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
        <Clock className="w-4 h-4" />
        No recent forecast activity
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {entries.slice(0, 5).map((entry) => {
        const mandi = getMandiByIdSync(entry.mandiId);
        const commodity = getCommodityByIdSync(entry.commodityId);
        return (
          <Link
            key={entry.id}
            href={`/forecasts/${entry.mandiId}/${entry.commodityId}`}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-600 text-xs font-bold shrink-0">
              {commodity?.name.slice(0, 2).toUpperCase() ?? 'NA'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">
                {commodity?.name ?? entry.commodityId} — {mandi?.name ?? entry.mandiId}
              </p>
              <p className="text-xs text-slate-400">{formatDateTime(entry.requestedAt)}</p>
            </div>
            <Badge variant="violet">{entry.horizon}d</Badge>
          </Link>
        );
      })}
    </div>
  );
}

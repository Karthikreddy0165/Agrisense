'use client';

import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { PriceTrend } from '@/components/ui/price-trend';
import { getPriceDirection } from '@/lib/utils/price-utils';
import { cn } from '@/lib/utils/cn';

interface MetricCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon?: ReactNode;
  trend?: { current: number; previous: number };
  highlight?: boolean;
}

export function MetricCard({ label, value, subValue, icon, trend, highlight }: MetricCardProps) {
  const direction = trend ? getPriceDirection(trend.current, trend.previous) : null;

  return (
    <Card className={cn(highlight && 'border-green-200 bg-green-50/40')}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-1 truncate">{value}</p>
            {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
            {direction && (
              <div className="mt-2">
                <PriceTrend
                  direction={direction}
                  value={`${direction === 'up' ? '+' : ''}₹${Math.abs(trend!.current - trend!.previous).toLocaleString('en-IN')}`}
                  size="sm"
                />
              </div>
            )}
          </div>
          {icon && (
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 text-slate-500 ml-3 shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

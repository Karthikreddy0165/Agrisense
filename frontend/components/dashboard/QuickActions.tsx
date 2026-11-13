'use client';

import Link from 'next/link';
import { TrendingUp, Map, History, Bookmark, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ACTIONS = [
  {
    label: 'Explore Markets',
    description: 'Browse mandis across India',
    href: '/market-explorer',
    icon: Map,
  },
  {
    label: 'View Forecasts',
    description: 'See 14-day price predictions',
    href: '/forecasts',
    icon: TrendingUp,
  },
  {
    label: 'Prediction History',
    description: 'Review past forecast requests',
    href: '/prediction-history',
    icon: History,
  },
  {
    label: 'Saved Markets',
    description: 'Your tracked combinations',
    href: '/saved-markets',
    icon: Bookmark,
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ACTIONS.map(({ label, description, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-3 p-3.5 rounded-lg border border-slate-200 bg-white hover:border-green-200 hover:bg-green-50/40 transition-colors group"
        >
          <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-green-100 group-hover:text-green-700 transition-colors shrink-0">
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800">{label}</p>
            <p className="text-xs text-slate-500">{description}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-green-600 transition-colors" />
        </Link>
      ))}
    </div>
  );
}

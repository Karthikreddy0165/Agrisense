'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  TrendingUp,
  History,
  Bookmark,
  Settings,
  Sprout,
  GitCompare,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/context/LanguageContext';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: '/', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { href: '/nearby-mandis', label: t('nav.marketExplorer', 'Find Nearby Markets'), icon: Compass },
    { href: '/forecast', label: t('nav.forecast', 'Expected Prices (14-Day)'), icon: TrendingUp },
    { href: '/compare', label: t('nav.compare', 'Compare Market Prices'), icon: GitCompare },
    { href: '/prediction-history', label: t('nav.predictionHistory', 'Previous Forecasts'), icon: History },
    { href: '/saved', label: t('nav.saved', 'My Saved Markets'), icon: Bookmark },
    { href: '/settings', label: t('nav.settings', 'Settings'), icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 min-h-screen bg-white border-r border-slate-200 fixed top-0 left-0 z-30">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-green-800 text-white shadow-sm">
          <Sprout className="w-5 h-5 text-green-300" />
        </div>
        <div>
          <span className="block text-base font-bold text-slate-900 tracking-tight leading-tight">
            {t('brand.title')}
          </span>
          <span className="block text-[11px] text-green-800 font-medium">
            {t('brand.subtitle')}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            href === '/'
              ? pathname === '/'
              : pathname === href || pathname.startsWith(href + '/');

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-green-800 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn('w-4.5 h-4.5 shrink-0', active ? 'text-green-300' : 'text-slate-400')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom info */}
      <div className="p-4 m-3 rounded-xl bg-slate-50 border border-slate-200/80">
        <p className="text-xs font-semibold text-slate-800">14-Day Horizon</p>
        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
          Ref: 23 Nov 2026<br />
          Valid: 24 Nov – 7 Dec 2026
        </p>
      </div>
    </aside>
  );
}

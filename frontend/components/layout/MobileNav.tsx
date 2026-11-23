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
  GitCompare,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useLanguage } from '@/lib/context/LanguageContext';

export function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  const NAV_ITEMS = [
    { href: '/', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard },
    { href: '/nearby-mandis', label: t('nav.marketExplorer', 'Markets'), icon: Compass },
    { href: '/forecast', label: t('nav.forecast', 'Expected'), icon: TrendingUp },
    { href: '/compare', label: t('nav.compare', 'Compare'), icon: GitCompare },
    { href: '/prediction-history', label: t('nav.predictionHistory', 'Previous'), icon: History },
    { href: '/saved', label: t('nav.saved', 'Saved'), icon: Bookmark },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg pb-safe">
      <div className="flex items-center justify-around h-16">
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
                'flex flex-col items-center justify-center flex-1 py-1 text-[11px] font-medium transition-colors',
                active ? 'text-green-800 font-semibold' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', active ? 'text-green-800' : 'text-slate-400')} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

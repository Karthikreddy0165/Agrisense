import { Suspense } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { TopHeader } from './TopHeader';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Suspense fallback={<div className="hidden lg:block w-64 min-h-screen bg-white border-r border-slate-200" />}>
        <Sidebar />
      </Suspense>

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        <TopHeader />
        <main className="flex-1 px-4 py-6 lg:px-8 pb-24 lg:pb-12 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <Suspense fallback={null}>
          <MobileNav />
        </Suspense>
      </div>
    </div>
  );
}

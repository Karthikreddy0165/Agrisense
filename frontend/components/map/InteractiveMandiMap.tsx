'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

interface MapMandi {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  latestPrice?: number | null;
  distanceKm?: number;
}

interface InteractiveMandiMapProps {
  mandis: MapMandi[];
  selectedMandiId?: string | null;
  userLocation?: { lat: number; lon: number } | null;
  onSelectMandi?: (mandiId: string) => void;
  className?: string;
}

const DynamicMandiMap = dynamic(() => import('./MandiMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] bg-slate-100 rounded-xl flex items-center justify-center p-6 text-slate-400">
      <div className="flex flex-col items-center gap-2">
        <div className="w-6 h-6 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium text-slate-500">Loading interactive mandi map...</span>
      </div>
    </div>
  ),
});

export function InteractiveMandiMap(props: InteractiveMandiMapProps) {
  return <DynamicMandiMap {...props} />;
}

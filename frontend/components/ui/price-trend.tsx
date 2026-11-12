import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { PriceDirection } from '@/lib/utils/price-utils';

interface PriceTrendProps {
  direction: PriceDirection;
  value?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export function PriceTrend({ direction, value, className, size = 'md' }: PriceTrendProps) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  if (direction === 'up') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-green-600 font-medium', textSize, className)}>
        <TrendingUp className={iconSize} />
        {value}
      </span>
    );
  }
  if (direction === 'down') {
    return (
      <span className={cn('inline-flex items-center gap-1 text-red-600 font-medium', textSize, className)}>
        <TrendingDown className={iconSize} />
        {value}
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center gap-1 text-slate-500 font-medium', textSize, className)}>
      <Minus className={iconSize} />
      {value}
    </span>
  );
}

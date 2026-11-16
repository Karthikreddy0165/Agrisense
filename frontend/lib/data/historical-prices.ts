import type { PriceObservation } from '../types/price.types';
import { seededRandom, addDays } from '../utils/price-utils';
import { MANDIS } from './geography';
import { COMMODITIES } from './commodities';

// Central fixed reference date: 23 November 2026
export const DATA_THROUGH_DATE = '2026-11-23';
export const HISTORY_DAYS = 90;

function getStartDate(): string {
  const date = new Date(DATA_THROUGH_DATE + 'T00:00:00');
  date.setDate(date.getDate() - HISTORY_DAYS + 1);
  return date.toISOString().split('T')[0];
}

export const DATA_START_DATE = getStartDate();

const BASE_PRICES: Record<string, number> = {
  tomato: 1850,
  onion: 2150,
  potato: 1250,
  wheat: 2350,
  rice: 3200,
  chilli: 14500,
  soybean: 4650,
  cotton: 6400,
  mustard: 5350,
  maize: 1880,
};

function generatePriceSeries(mandiId: string, commodityId: string): PriceObservation[] {
  const seedStr = `${mandiId}:${commodityId}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
  }
  const rand = seededRandom(Math.abs(seed));

  const basePrice = BASE_PRICES[commodityId] || 2000;
  const observations: PriceObservation[] = [];
  let price = basePrice + (rand() - 0.5) * (basePrice * 0.15);

  for (let i = 0; i < HISTORY_DAYS; i++) {
    const date = addDays(DATA_START_DATE, i);
    // occasional market holiday
    if (rand() < 0.1) continue;

    const change = (rand() - 0.49) * (basePrice * 0.02);
    price = Math.max(100, price + change);
    const modal = Math.round(price);
    const spread = Math.round(price * 0.08);

    observations.push({
      mandiId,
      commodityId,
      date,
      minPrice: Math.max(100, modal - spread),
      maxPrice: modal + spread,
      modalPrice: modal,
    });
  }

  // Ensure reference date 2026-11-23 has an observation
  const last = observations[observations.length - 1];
  if (!last || last.date !== DATA_THROUGH_DATE) {
    const modal = Math.round(price);
    const spread = Math.round(price * 0.08);
    observations.push({
      mandiId,
      commodityId,
      date: DATA_THROUGH_DATE,
      minPrice: Math.max(100, modal - spread),
      maxPrice: modal + spread,
      modalPrice: modal,
    });
  }

  return observations;
}

const _generated: Map<string, PriceObservation[]> = new Map();

for (const mandi of MANDIS) {
  for (const comm of COMMODITIES) {
    const key = `${mandi.id}:${comm.id}`;
    _generated.set(key, generatePriceSeries(mandi.id, comm.id));
  }
}

export function getHistoricalPricesForPair(mandiId: string, commodityId: string): PriceObservation[] {
  const key = `${mandiId}:${commodityId}`;
  return _generated.get(key) ?? [];
}

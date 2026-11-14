import { getHistoricalPricesForPair } from '../data/historical-prices';
import type { PriceObservation } from '../types/price.types';

export async function getHistoricalPrices(
  mandiId: string,
  commodityId: string
): Promise<PriceObservation[]> {
  return getHistoricalPricesForPair(mandiId, commodityId);
}

export async function getLatestPrice(
  mandiId: string,
  commodityId: string
): Promise<PriceObservation | null> {
  const obs = getHistoricalPricesForPair(mandiId, commodityId);
  if (obs.length === 0) return null;
  return obs[obs.length - 1];
}

export async function getPreviousPrice(
  mandiId: string,
  commodityId: string
): Promise<PriceObservation | null> {
  const obs = getHistoricalPricesForPair(mandiId, commodityId);
  if (obs.length < 2) return null;
  return obs[obs.length - 2];
}

export function getLatestPriceSync(mandiId: string, commodityId: string): PriceObservation | null {
  const obs = getHistoricalPricesForPair(mandiId, commodityId);
  return obs.length > 0 ? obs[obs.length - 1] : null;
}

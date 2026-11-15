import { getForecastForPair, getAvailableHorizonsForPair } from '../data/forecasts';
import type { ForecastRecord, ForecastHorizon } from '../types/forecast.types';

export async function getForecast(
  mandiId: string,
  commodityId: string,
  horizon: ForecastHorizon
): Promise<ForecastRecord | null> {
  return getForecastForPair(mandiId, commodityId, horizon);
}

export async function getAvailableHorizons(
  mandiId: string,
  commodityId: string
): Promise<ForecastHorizon[]> {
  return getAvailableHorizonsForPair(mandiId, commodityId);
}

export function getForecastSync(
  mandiId: string,
  commodityId: string,
  horizon: ForecastHorizon
): ForecastRecord | null {
  return getForecastForPair(mandiId, commodityId, horizon);
}

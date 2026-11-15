import type { ForecastRecord, ForecastPrediction } from '../types/forecast.types';
import { seededRandom, addDays } from '../utils/price-utils';
import { getHistoricalPricesForPair, DATA_THROUGH_DATE } from './historical-prices';
import { MANDIS } from './geography';
import { COMMODITIES } from './commodities';

const MODEL_NAME = 'LightGBM-AgriPrice-v1';
const MODEL_VERSION = '1.0.0';
const GENERATED_AT = '2026-11-23T18:00:00+05:30';

function generateForecastPredictions(
  mandiId: string,
  commodityId: string,
  horizon: 7 | 14,
  lastPrice: number
): ForecastPrediction[] {
  const seedStr = `forecast:${horizon}:${mandiId}:${commodityId}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) & 0xffffffff;
  }
  const rand = seededRandom(Math.abs(seed));

  const predictions: ForecastPrediction[] = [];
  let price = lastPrice;
  const volatility = lastPrice * 0.02;

  // Day 1 is 2026-11-24 up to Day 14 is 2026-12-07
  for (let i = 1; i <= horizon; i++) {
    const date = addDays(DATA_THROUGH_DATE, i);
    const change = (rand() - 0.48) * volatility * 2;
    price = Math.max(lastPrice * 0.5, price + change);
    const predicted = Math.round(price);
    const bandWidth = Math.round(lastPrice * (0.04 + i * 0.003));
    predictions.push({
      date,
      predictedPrice: predicted,
      lowerBound: Math.max(100, predicted - bandWidth),
      upperBound: predicted + bandWidth,
    });
  }
  return predictions;
}

const _forecasts: Map<string, { f7: ForecastRecord; f14: ForecastRecord }> = new Map();

for (const mandi of MANDIS) {
  for (const comm of COMMODITIES) {
    const history = getHistoricalPricesForPair(mandi.id, comm.id);
    const lastObs = history[history.length - 1];
    if (!lastObs) continue;
    const lastPrice = lastObs.modalPrice;

    const baseId = `${mandi.id}--${comm.id}`;
    const f7: ForecastRecord = {
      id: `${baseId}--7d`,
      mandiId: mandi.id,
      commodityId: comm.id,
      generatedAt: GENERATED_AT,
      dataThrough: DATA_THROUGH_DATE,
      horizon: 7,
      modelName: MODEL_NAME,
      modelVersion: MODEL_VERSION,
      status: 'active',
      predictions: generateForecastPredictions(mandi.id, comm.id, 7, lastPrice),
    };
    const f14: ForecastRecord = {
      id: `${baseId}--14d`,
      mandiId: mandi.id,
      commodityId: comm.id,
      generatedAt: GENERATED_AT,
      dataThrough: DATA_THROUGH_DATE,
      horizon: 14,
      modelName: MODEL_NAME,
      modelVersion: MODEL_VERSION,
      status: 'active',
      predictions: generateForecastPredictions(mandi.id, comm.id, 14, lastPrice),
    };
    _forecasts.set(baseId, { f7, f14 });
  }
}

export function getForecastForPair(
  mandiId: string,
  commodityId: string,
  horizon: 7 | 14 = 14
): ForecastRecord | null {
  const key = `${mandiId}--${commodityId}`;
  const entry = _forecasts.get(key);
  if (!entry) return null;
  return horizon === 7 ? entry.f7 : entry.f14;
}

export function getAvailableHorizonsForPair(mandiId: string, commodityId: string): (7 | 14)[] {
  return [7, 14];
}

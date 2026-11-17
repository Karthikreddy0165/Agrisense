import type { ForecastHorizon } from './forecast.types';

export type HistoryStatus = 'completed' | 'pending' | 'failed';

export interface PredictionHistoryEntry {
  id: string;
  requestedAt: string; // ISO datetime
  mandiId: string;
  commodityId: string;
  horizon: ForecastHorizon;
  modelVersion: string;
  status: HistoryStatus;
  forecastId: string;
}

export interface SavedMarket {
  mandiId: string;
  commodityId: string;
  savedAt: string; // ISO datetime
}

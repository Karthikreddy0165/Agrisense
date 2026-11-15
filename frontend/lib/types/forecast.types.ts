export interface ForecastPrediction {
  date: string; // ISO YYYY-MM-DD
  predictedPrice: number;
  lowerBound: number;
  upperBound: number;
}

export type ForecastHorizon = 7 | 14;
export type ForecastStatus = 'active' | 'archived';

export interface ForecastRecord {
  id: string;
  mandiId: string;
  commodityId: string;
  generatedAt: string; // ISO datetime
  dataThrough: string; // last historical date used
  horizon: ForecastHorizon;
  modelName: string;
  modelVersion: string;
  status: ForecastStatus;
  predictions: ForecastPrediction[];
}

import type { PredictionHistoryEntry } from '../types/history.types';

// Seed prediction history entries — these are shown as examples on first load
// before the user interacts with the app
export const SEED_PREDICTION_HISTORY: PredictionHistoryEntry[] = [
  {
    id: 'hist-001',
    requestedAt: '2025-11-15T22:30:00+05:30',
    mandiId: 'lasalgaon-apmc',
    commodityId: 'onion',
    horizon: 14,
    modelVersion: '2.1.4',
    status: 'completed',
    forecastId: 'lasalgaon-apmc--onion--14d',
  },
  {
    id: 'hist-002',
    requestedAt: '2025-11-15T21:15:00+05:30',
    mandiId: 'guntur-apmc',
    commodityId: 'chilli',
    horizon: 14,
    modelVersion: '2.1.4',
    status: 'completed',
    forecastId: 'guntur-apmc--chilli--14d',
  },
  {
    id: 'hist-003',
    requestedAt: '2025-11-14T18:00:00+05:30',
    mandiId: 'pune-apmc',
    commodityId: 'tomato',
    horizon: 7,
    modelVersion: '2.1.4',
    status: 'completed',
    forecastId: 'pune-apmc--tomato--7d',
  },
  {
    id: 'hist-004',
    requestedAt: '2025-11-14T10:30:00+05:30',
    mandiId: 'indore-apmc',
    commodityId: 'soybean',
    horizon: 14,
    modelVersion: '2.1.4',
    status: 'completed',
    forecastId: 'indore-apmc--soybean--14d',
  },
  {
    id: 'hist-005',
    requestedAt: '2025-11-13T16:45:00+05:30',
    mandiId: 'amritsar-mandi',
    commodityId: 'wheat',
    horizon: 14,
    modelVersion: '2.1.3',
    status: 'completed',
    forecastId: 'amritsar-mandi--wheat--14d',
  },
];

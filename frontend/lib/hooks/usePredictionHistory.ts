'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PredictionHistoryEntry } from '../types/history.types';
import type { ForecastHorizon } from '../types/forecast.types';
import {
  getPredictionHistory,
  addPredictionHistory,
  clearPredictionHistory,
} from '../services/history.service';

export function usePredictionHistory() {
  const [history, setHistory] = useState<PredictionHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(getPredictionHistory());
  }, []);

  const addEntry = useCallback(
    (entry: Omit<PredictionHistoryEntry, 'id' | 'requestedAt'>) => {
      addPredictionHistory(entry);
      setHistory(getPredictionHistory());
    },
    []
  );

  const clear = useCallback(() => {
    clearPredictionHistory();
    setHistory([]);
  }, []);

  const recordForecastView = useCallback(
    (mandiId: string, commodityId: string, horizon: ForecastHorizon, modelVersion: string, forecastId: string) => {
      addPredictionHistory({
        mandiId,
        commodityId,
        horizon,
        modelVersion,
        status: 'completed',
        forecastId,
      });
      setHistory(getPredictionHistory());
    },
    []
  );

  return { history, addEntry, clear, recordForecastView };
}

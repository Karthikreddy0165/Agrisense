'use client';

import type { PredictionHistoryEntry } from '../types/history.types';
import { SEED_PREDICTION_HISTORY } from '../data/prediction-history';

const STORAGE_KEY = 'agri_prediction_history';

function readFromStorage(): PredictionHistoryEntry[] {
  if (typeof window === 'undefined') return SEED_PREDICTION_HISTORY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed on first use
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PREDICTION_HISTORY));
      return SEED_PREDICTION_HISTORY;
    }
    return JSON.parse(raw) as PredictionHistoryEntry[];
  } catch {
    return SEED_PREDICTION_HISTORY;
  }
}

function writeToStorage(entries: PredictionHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function getPredictionHistory(): PredictionHistoryEntry[] {
  return readFromStorage().sort(
    (a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );
}

export function addPredictionHistory(
  entry: Omit<PredictionHistoryEntry, 'id' | 'requestedAt'>
): PredictionHistoryEntry {
  const existing = readFromStorage();
  const newEntry: PredictionHistoryEntry = {
    ...entry,
    id: `hist-${Date.now()}`,
    requestedAt: new Date().toISOString(),
  };
  writeToStorage([newEntry, ...existing]);
  return newEntry;
}

export function clearPredictionHistory(): void {
  writeToStorage([]);
}

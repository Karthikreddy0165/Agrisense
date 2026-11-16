'use client';

import type { SavedMarket } from '../types/history.types';

const STORAGE_KEY = 'agri_saved_markets';

function readFromStorage(): SavedMarket[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedMarket[]) : [];
  } catch {
    return [];
  }
}

function writeToStorage(markets: SavedMarket[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(markets));
  } catch {
    // ignore
  }
}

export function getSavedMarkets(): SavedMarket[] {
  return readFromStorage();
}

export function addSavedMarket(market: { mandiId: string; commodityId: string }): void {
  const existing = readFromStorage();
  const alreadyExists = existing.some(
    (m) => m.mandiId === market.mandiId && m.commodityId === market.commodityId
  );
  if (alreadyExists) return;
  writeToStorage([
    ...existing,
    { ...market, savedAt: new Date().toISOString() },
  ]);
}

export function removeSavedMarket(mandiId: string, commodityId: string): void {
  const existing = readFromStorage();
  writeToStorage(
    existing.filter((m) => !(m.mandiId === mandiId && m.commodityId === commodityId))
  );
}

export function isSavedMarket(mandiId: string, commodityId: string): boolean {
  return readFromStorage().some(
    (m) => m.mandiId === mandiId && m.commodityId === commodityId
  );
}

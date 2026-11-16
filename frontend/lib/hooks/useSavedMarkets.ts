'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedMarket } from '../types/history.types';
import {
  getSavedMarkets,
  addSavedMarket,
  removeSavedMarket,
  isSavedMarket,
} from '../services/saved-markets.service';

export function useSavedMarkets() {
  const [savedMarkets, setSavedMarkets] = useState<SavedMarket[]>([]);

  useEffect(() => {
    setSavedMarkets(getSavedMarkets());
  }, []);

  const save = useCallback((mandiId: string, commodityId: string) => {
    addSavedMarket({ mandiId, commodityId });
    setSavedMarkets(getSavedMarkets());
  }, []);

  const remove = useCallback((mandiId: string, commodityId: string) => {
    removeSavedMarket(mandiId, commodityId);
    setSavedMarkets(getSavedMarkets());
  }, []);

  const toggle = useCallback((mandiId: string, commodityId: string) => {
    if (isSavedMarket(mandiId, commodityId)) {
      removeSavedMarket(mandiId, commodityId);
    } else {
      addSavedMarket({ mandiId, commodityId });
    }
    setSavedMarkets(getSavedMarkets());
  }, []);

  const isSaved = useCallback((mandiId: string, commodityId: string): boolean => {
    return savedMarkets.some(
      (m) => m.mandiId === mandiId && m.commodityId === commodityId
    );
  }, [savedMarkets]);

  return { savedMarkets, save, remove, toggle, isSaved };
}

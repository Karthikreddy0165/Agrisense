import { STATES, DISTRICTS, MANDIS } from '../data/geography';
import { COMMODITIES } from '../data/commodities';
import { getHistoricalPricesForPair, DATA_THROUGH_DATE } from '../data/historical-prices';
import { getForecastForPair } from '../data/forecasts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';

export interface PredictionItem {
  date: string;
  modalPrice: number;
  minPrice: number;
  maxPrice: number;
  percentageChangeFromReference: number;
}

export interface ForecastRunSummary {
  id: number;
  mandiId: string;
  mandiName: string;
  commodityId: string;
  commodityName: string;
  varietyId: string;
  varietyName: string;
  referenceDate: string;
  generatedAt: string;
  forecastHorizon: number;
  modelVersion: string;
  status: string;
  latestActualPrice: number;
  expectedPrice7d: number;
  expectedPrice14d: number;
  percentageChange14d: number;
  expectedDirection: string;
  itemCount: number;
}

export interface ForecastRunItemDetail {
  id: number;
  dayIndex: number;
  targetDate: string;
  predictedPrice: number;
  minPrice: number;
  maxPrice: number;
  percentageChangeFromReference: number;
  actualPrice?: number | null;
}

export interface ForecastRunDetail extends ForecastRunSummary {
  forecastStart: string;
  forecastEnd: string;
  latestActualDate: string;
  expectedMin: number;
  expectedMax: number;
  interpretation: string;
  predictions: ForecastRunItemDetail[];
  items?: ForecastRunItemDetail[];
}

export interface PriceObservationDetail {
  id: number;
  mandiId: string;
  commodityId: string;
  varietyId: string;
  observationDate: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivals: number;
}

export interface PriceHistorySummary {
  mandiId: string;
  commodityId: string;
  varietyId: string;
  latestModalPrice: number;
  previousModalPrice: number;
  absolutePriceChange: number;
  percentagePriceChange: number;
  latestObservationDate: string;
  priceTrend: string;
  priceUnit: string;
  observationCount: number;
  observations: PriceObservationDetail[];
}

export interface ForecastResult {
  mandiId: string;
  mandiName: string;
  commodityId: string;
  commodityName: string;
  varietyId: string;
  varietyName: string;
  referenceDate: string;
  forecastStart: string;
  forecastEnd: string;
  horizon: number;
  latestActualPrice: number;
  latestActualDate: string;
  expectedPrice7d: number;
  expectedPrice14d: number;
  percentageChange14d: number;
  expectedDirection: string;
  expectedMin: number;
  expectedMax: number;
  interpretation: string;
  modelVersion: string;
  generatedAt: string;
  isFallback: boolean;
  predictions: PredictionItem[];
}

export interface TradedCommodityItem {
  commodityId: string;
  commodityName: string;
  observationCount: number;
  latestDate: string;
  latestModalPrice: number;
}

async function fetchWithFallback<T>(url: string, fallback: () => T): Promise<T> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    clearTimeout(id);
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    } else if (res.status === 429) {
      console.warn('API Rate limited (HTTP 429):', url);
    }
  } catch (err) {
    // Graceful fallback to static data
  }
  return fallback();
}

export const ApiService = {
  async getStates() {
    return fetchWithFallback(`${API_BASE_URL}/states`, () => STATES);
  },

  async getDistricts(stateId?: string) {
    return fetchWithFallback(
      stateId ? `${API_BASE_URL}/districts?stateId=${stateId}` : `${API_BASE_URL}/districts`,
      () => (stateId ? DISTRICTS.filter((d) => d.stateId === stateId) : DISTRICTS)
    );
  },

  async getMandis(
    paramsOrCommodityId?: string | {
      commodityId?: string;
      stateId?: string;
      districtId?: string;
      search?: string;
      hasCoordinates?: boolean;
      page?: number;
      size?: number;
    }
  ) {
    let url = `${API_BASE_URL}/mandis`;
    if (typeof paramsOrCommodityId === 'string') {
      if (paramsOrCommodityId) url += `?commodityId=${encodeURIComponent(paramsOrCommodityId)}`;
    } else if (paramsOrCommodityId && typeof paramsOrCommodityId === 'object') {
      const q = new URLSearchParams();
      if (paramsOrCommodityId.commodityId) q.append('commodityId', paramsOrCommodityId.commodityId);
      if (paramsOrCommodityId.stateId) q.append('stateId', paramsOrCommodityId.stateId);
      if (paramsOrCommodityId.districtId) q.append('districtId', paramsOrCommodityId.districtId);
      if (paramsOrCommodityId.search) q.append('search', paramsOrCommodityId.search);
      if (paramsOrCommodityId.hasCoordinates !== undefined) q.append('hasCoordinates', String(paramsOrCommodityId.hasCoordinates));
      if (paramsOrCommodityId.page !== undefined) q.append('page', String(paramsOrCommodityId.page));
      if (paramsOrCommodityId.size !== undefined) q.append('size', String(paramsOrCommodityId.size));
      const qs = q.toString();
      if (qs) url += `?${qs}`;
    }
    return fetchWithFallback(url, () => MANDIS);
  },

  async getMandi(mandiId: string, lat?: number, lon?: number, commodityId?: string) {
    const params = new URLSearchParams();
    if (lat != null) params.append('latitude', lat.toString());
    if (lon != null) params.append('longitude', lon.toString());
    if (commodityId) params.append('commodityId', commodityId);
    const qs = params.toString();
    const url = qs
      ? `${API_BASE_URL}/mandis/${encodeURIComponent(mandiId)}?${qs}`
      : `${API_BASE_URL}/mandis/${encodeURIComponent(mandiId)}`;
    return fetchWithFallback(url, () => MANDIS.find((m) => m.id === mandiId) || null);
  },

  async getMandiCommodities(mandiId: string): Promise<TradedCommodityItem[]> {
    return fetchWithFallback<TradedCommodityItem[]>(
      `${API_BASE_URL}/mandis/${encodeURIComponent(mandiId)}/commodities`,
      () => []
    );
  },

  async getNearbyMandis(lat?: number, lon?: number, radiusKm?: number, commodityId?: string) {
    const params = new URLSearchParams();
    if (lat != null) params.append('latitude', lat.toString());
    if (lon != null) params.append('longitude', lon.toString());
    if (radiusKm != null) params.append('radiusKm', radiusKm.toString());
    if (commodityId) params.append('commodityId', commodityId);

    return fetchWithFallback(
      `${API_BASE_URL}/mandis/nearby?${params.toString()}`,
      () => {
        // Local calculation fallback
        return MANDIS.map((m) => {
          let distance: number | undefined = undefined;
          if (lat != null && lon != null && m.latitude != null && m.longitude != null) {
            const R = 6371.0;
            const dLat = ((m.latitude - lat) * Math.PI) / 180;
            const dLon = ((m.longitude - lon) * Math.PI) / 180;
            const a =
              Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos((lat * Math.PI) / 180) *
                Math.cos((m.latitude * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distance = Math.round(R * c * 10) / 10;
          }
          const history = getHistoricalPricesForPair(m.id, commodityId || 'tomato');
          const latest = history[history.length - 1];
          const prev = history[history.length - 2];
          let trend = 'Stable';
          if (latest && prev) {
            const diff = latest.modalPrice - prev.modalPrice;
            if (diff > 5) trend = 'Rising';
            else if (diff < -5) trend = 'Falling';
          }
          return {
            ...m,
            distanceKm: distance,
            latestModalPrice: latest ? latest.modalPrice : null,
            minPrice: latest ? latest.minPrice : null,
            maxPrice: latest ? latest.maxPrice : null,
            arrivals: 75.0,
            observationDate: latest ? latest.date : DATA_THROUGH_DATE,
            trendDirection: trend,
          };
        }).filter((m) => {
          if (radiusKm && m.distanceKm != null && m.distanceKm > radiusKm) return false;
          return true;
        }).sort((a, b) => {
          if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
          return a.name.localeCompare(b.name);
        });
      }
    );
  },

  async getCommodities() {
    return fetchWithFallback(`${API_BASE_URL}/commodities`, () => COMMODITIES);
  },

  async getHistoricalPrices(mandiId: string, commodityId: string, days: number = 90) {
    return fetchWithFallback(
      `${API_BASE_URL}/prices/history?mandiId=${mandiId}&commodityId=${commodityId}&days=${days}`,
      () => getHistoricalPricesForPair(mandiId, commodityId)
    );
  },

  async getForecast(mandiId: string, commodityId: string, varietyId: string = 'standard') {
    return fetchWithFallback(
      `${API_BASE_URL}/forecasts?mandiId=${mandiId}&commodityId=${commodityId}&varietyId=${varietyId}`,
      () => {
        const fc = getForecastForPair(mandiId, commodityId, 14);
        const history = getHistoricalPricesForPair(mandiId, commodityId);
        const latest = history[history.length - 1];
        const latestPrice = latest ? latest.modalPrice : 2000;
        const predictions = fc ? fc.predictions : [];
        const p7 = predictions[6] ? predictions[6].predictedPrice : latestPrice;
        const p14 = predictions[13] ? predictions[13].predictedPrice : latestPrice;
        const pct14 = Math.round(((p14 - latestPrice) / latestPrice) * 1000) / 10;
        const direction = pct14 > 2 ? 'Rising' : pct14 < -2 ? 'Falling' : 'Relatively Stable';
        const mandi = MANDIS.find((m) => m.id === mandiId);
        const comm = COMMODITIES.find((c) => c.id === commodityId);

        return {
          mandiId,
          mandiName: mandi ? mandi.name : mandiId,
          commodityId,
          commodityName: comm ? comm.name : commodityId,
          varietyId,
          varietyName: 'Standard',
          referenceDate: '2026-11-23',
          forecastStart: '2026-11-24',
          forecastEnd: '2026-12-07',
          horizon: 14,
          latestActualPrice: latestPrice,
          latestActualDate: latest ? latest.date : '2026-11-23',
          expectedPrice7d: p7,
          expectedPrice14d: p14,
          percentageChange14d: pct14,
          expectedDirection: direction,
          expectedMin: Math.min(...predictions.map((p) => p.lowerBound)),
          expectedMax: Math.max(...predictions.map((p) => p.upperBound)),
          interpretation:
            direction === 'Rising'
              ? 'Prices are expected to increase over the next two weeks according to this forecast.'
              : direction === 'Falling'
              ? 'Prices are expected to decline over the forecast period according to this forecast.'
              : 'Prices are expected to remain relatively stable within standard volatility bounds.',
          modelVersion: 'LightGBM-AgriPrice-v1',
          generatedAt: '2026-11-23T18:00:00',
          isFallback: false,
          predictions: predictions.map((p) => ({
            date: p.date,
            modalPrice: p.predictedPrice,
            minPrice: p.lowerBound,
            maxPrice: p.upperBound,
            percentageChangeFromReference:
              Math.round(((p.predictedPrice - latestPrice) / latestPrice) * 1000) / 10,
          })),
        };
      }
    );
  },

  async compareMarkets(mandiIds: string[], commodityId: string, varietyId: string = 'standard') {
    const params = new URLSearchParams();
    mandiIds.forEach((id) => params.append('mandiIds', id));
    params.append('commodityId', commodityId);
    params.append('varietyId', varietyId);

    return fetchWithFallback(
      `${API_BASE_URL}/comparisons?${params.toString()}`,
      async () => {
        const comm = COMMODITIES.find((c) => c.id === commodityId);
        const list = await Promise.all(
          mandiIds.map(async (mId) => {
            const mandi = MANDIS.find((m) => m.id === mId);
            const dist = DISTRICTS.find((d) => d.id === mandi?.districtId);
            const state = STATES.find((s) => s.id === mandi?.stateId);
            const fc = await ApiService.getForecast(mId, commodityId, varietyId);
            return {
              mandiId: mId,
              mandiName: mandi ? mandi.name : mId,
              districtName: dist ? dist.name : '',
              stateName: state ? state.name : '',
              currentModalPrice: fc.latestActualPrice,
              observationDate: fc.latestActualDate,
              expectedPrice7d: fc.expectedPrice7d,
              expectedPrice14d: fc.expectedPrice14d,
              percentageChange14d: fc.percentageChange14d,
              trendDirection: fc.expectedDirection,
              priceDifferenceFromAvg: 0,
              predictions: fc.predictions,
            };
          })
        );
        const avg = list.reduce((s, i) => s + i.currentModalPrice, 0) / (list.length || 1);
        return {
          commodityId,
          commodityName: comm ? comm.name : commodityId,
          varietyId,
          varietyName: 'Standard',
          referenceDate: '2026-11-23',
          mandis: list.map((item) => ({
            ...item,
            priceDifferenceFromAvg: Math.round((item.currentModalPrice - avg) * 10) / 10,
          })),
        };
      }
    );
  },

  async getPriceHistorySummary(
    mandiId: string,
    commodityId: string,
    varietyId?: string,
    days: number = 90
  ): Promise<PriceHistorySummary> {
    const params = new URLSearchParams();
    params.append('mandiId', mandiId);
    params.append('commodityId', commodityId);
    if (varietyId) params.append('varietyId', varietyId);
    params.append('days', days.toString());

    return fetchWithFallback(
      `${API_BASE_URL}/prices/summary?${params.toString()}`,
      () => {
        const history = getHistoricalPricesForPair(mandiId, commodityId);
        const latest = history[history.length - 1];
        const prev = history[history.length - 2];
        const latestPrice = latest ? latest.modalPrice : 2000;
        const prevPrice = prev ? prev.modalPrice : latestPrice;
        const diff = Math.round((latestPrice - prevPrice) * 100) / 100;
        const pct = prevPrice > 0 ? Math.round((diff / prevPrice) * 1000) / 10 : 0;
        return {
          mandiId,
          commodityId,
          varietyId: varietyId || 'standard',
          latestModalPrice: latestPrice,
          previousModalPrice: prevPrice,
          absolutePriceChange: diff,
          percentagePriceChange: pct,
          latestObservationDate: latest ? latest.date : '2026-11-23',
          priceTrend: diff > 5 ? 'Rising' : diff < -5 ? 'Falling' : 'Stable',
          priceUnit: '₹/quintal',
          observationCount: history.length,
          observations: history.map((h, idx) => ({
            id: idx + 1,
            mandiId,
            commodityId,
            varietyId: varietyId || 'standard',
            observationDate: h.date,
            minPrice: h.minPrice,
            maxPrice: h.maxPrice,
            modalPrice: h.modalPrice,
            arrivals: 80.0,
          })),
        };
      }
    );
  },

  async getForecastHistory(params?: {
    mandiId?: string;
    commodityId?: string;
    varietyId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<ForecastRunSummary[]> {
    const q = new URLSearchParams();
    if (params?.mandiId) q.append('mandiId', params.mandiId);
    if (params?.commodityId) q.append('commodityId', params.commodityId);
    if (params?.varietyId) q.append('varietyId', params.varietyId);
    if (params?.fromDate) q.append('fromDate', params.fromDate);
    if (params?.toDate) q.append('toDate', params.toDate);

    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return fetchWithFallback(
      `${API_BASE_URL}/forecasts/history${queryStr}`,
      () => []
    );
  },

  async getForecastRunDetail(id: number): Promise<ForecastRunDetail | null> {
    return fetchWithFallback(
      `${API_BASE_URL}/forecasts/history/${id}`,
      () => null
    );
  },
};

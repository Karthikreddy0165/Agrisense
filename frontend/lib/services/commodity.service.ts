import { COMMODITIES } from '../data/commodities';
import type { Commodity } from '../types/commodity.types';

export async function getCommodities(): Promise<Commodity[]> {
  return COMMODITIES;
}

export async function getCommodityById(commodityId: string): Promise<Commodity | null> {
  return COMMODITIES.find((c) => c.id === commodityId) ?? null;
}

export function getCommodityByIdSync(commodityId: string): Commodity | null {
  return COMMODITIES.find((c) => c.id === commodityId) ?? null;
}

export function getCommoditiesByCategory(category: Commodity['category']): Commodity[] {
  return COMMODITIES.filter((c) => c.category === category);
}

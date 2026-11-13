export type CommodityCategory = 'vegetable' | 'grain' | 'oilseed' | 'spice' | 'fibre';

export interface Variety {
  id: string;
  commodityId: string;
  name: string;
}

export interface Commodity {
  id: string;
  name: string;
  category: CommodityCategory;
  unit: string;
  slug: string;
  description: string;
  varieties: Variety[];
}

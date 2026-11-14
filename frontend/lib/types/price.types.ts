export interface PriceObservation {
  mandiId: string;
  commodityId: string;
  date: string; // ISO YYYY-MM-DD
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  arrivalsTonnes?: number;
}

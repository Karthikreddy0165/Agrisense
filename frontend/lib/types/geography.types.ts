export interface State {
  id: string;
  name: string;
  code: string;
}

export interface District {
  id: string;
  stateId: string;
  name: string;
}

export interface Mandi {
  id: string;
  districtId: string;
  stateId: string;
  name: string;
  fullName: string;
  latitude: number | null;
  longitude: number | null;
  coordinateSource?: string;
  coordinateStatus?: string;
  distanceKm?: number;
}

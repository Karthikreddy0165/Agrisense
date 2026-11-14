import { STATES as SEED_STATES, DISTRICTS as SEED_DISTRICTS, MANDIS as SEED_MANDIS } from '../data/geography';
import type { State, District, Mandi } from '../types/geography.types';
import { ApiService } from './api';

const mandiCache = new Map<string, Mandi>();
const stateCache = new Map<string, State>();
const districtCache = new Map<string, District>();

SEED_MANDIS.forEach((m) => mandiCache.set(m.id, m));
SEED_STATES.forEach((s) => stateCache.set(s.id, s));
SEED_DISTRICTS.forEach((d) => districtCache.set(d.id, d));

export async function getStates(): Promise<State[]> {
  try {
    const states = await ApiService.getStates();
    if (states && states.length > 0) {
      states.forEach((s) => stateCache.set(s.id, s));
      return states;
    }
  } catch (e) {
    // fallback
  }
  return SEED_STATES;
}

export async function getDistricts(stateId: string): Promise<District[]> {
  try {
    const districts = await ApiService.getDistricts(stateId);
    if (districts && districts.length > 0) {
      districts.forEach((d) => districtCache.set(d.id, d));
      return districts;
    }
  } catch (e) {
    // fallback
  }
  return SEED_DISTRICTS.filter((d) => d.stateId === stateId);
}

export async function getMandis(districtId: string): Promise<Mandi[]> {
  try {
    const mandis = await ApiService.getMandis({ districtId });
    if (mandis && mandis.length > 0) {
      mandis.forEach((m) => mandiCache.set(m.id, m));
      return mandis;
    }
  } catch (e) {
    // fallback
  }
  return SEED_MANDIS.filter((m) => m.districtId === districtId);
}

export async function getMandiById(mandiId: string): Promise<Mandi | null> {
  if (mandiCache.has(mandiId)) {
    return mandiCache.get(mandiId)!;
  }
  try {
    const mandi = await ApiService.getMandi(mandiId);
    if (mandi) {
      mandiCache.set(mandi.id, mandi);
      return mandi;
    }
  } catch (e) {
    // fallback
  }
  return SEED_MANDIS.find((m) => m.id === mandiId) ?? null;
}

export async function getAllMandis(): Promise<Mandi[]> {
  try {
    const mandis = await ApiService.getMandis();
    if (mandis && mandis.length > 0) {
      mandis.forEach((m) => mandiCache.set(m.id, m));
      return mandis;
    }
  } catch (e) {
    // fallback
  }
  return SEED_MANDIS;
}

export function getMandiByIdSync(mandiId: string): Mandi | null {
  return mandiCache.get(mandiId) ?? SEED_MANDIS.find((m) => m.id === mandiId) ?? null;
}

export function getDistrictByIdSync(districtId: string): District | null {
  return districtCache.get(districtId) ?? SEED_DISTRICTS.find((d) => d.id === districtId) ?? null;
}

export function getStateByIdSync(stateId: string): State | null {
  return stateCache.get(stateId) ?? SEED_STATES.find((s) => s.id === stateId) ?? null;
}

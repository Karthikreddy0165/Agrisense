'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STATES, DISTRICTS, MANDIS } from '@/lib/data/geography';

export type LocationStatus =
  | 'DETECTING'
  | 'DETECTED'
  | 'MANUAL'
  | 'DENIED'
  | 'UNAVAILABLE'
  | 'NOT_SET';

interface Coordinates {
  lat: number;
  lon: number;
}

interface LocationContextType {
  coordinates: Coordinates | null;
  locationLabel: string;
  status: LocationStatus;
  stateId: string | null;
  districtId: string | null;
  mandiId: string | null;
  detectLocation: () => Promise<void>;
  setManualLocation: (stateId: string, districtId?: string, mandiId?: string) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = 'agri_manual_location';

function findNearestMandi(lat: number, lon: number) {
  let nearest = MANDIS[0];
  let minDistance = Infinity;

  for (const m of MANDIS) {
    if (m.latitude == null || m.longitude == null) continue;
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
    const dist = R * c;
    if (dist < minDistance) {
      minDistance = dist;
      nearest = m;
    }
  }

  return { mandi: nearest, distanceKm: Math.round(minDistance * 10) / 10 };
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('Select location');
  const [status, setStatus] = useState<LocationStatus>('NOT_SET');
  const [stateId, setStateId] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [mandiId, setMandiId] = useState<string | null>(null);

  // Initialize from localStorage or leave as NOT_SET (never default silently to Bangalore!)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.stateId) {
          const st = STATES.find((s) => s.id === parsed.stateId);
          const dt = DISTRICTS.find((d) => d.id === parsed.districtId);
          const mn = MANDIS.find((m) => m.id === parsed.mandiId);

          setStateId(parsed.stateId);
          setDistrictId(parsed.districtId || null);
          setMandiId(parsed.mandiId || null);
          if (mn && mn.latitude != null && mn.longitude != null) {
            setCoordinates({ lat: mn.latitude, lon: mn.longitude });
            setLocationLabel(`${mn.name}, ${st?.name || 'India'} (Saved)`);
          } else if (mn) {
            setLocationLabel(`${mn.name}, ${st?.name || 'India'} (Saved)`);
          } else if (dt) {
            setLocationLabel(`${dt.name}, ${st?.name || 'India'} (Saved)`);
          } else if (st) {
            setLocationLabel(`${st.name} (Saved)`);
          }
          setStatus('MANUAL');
        }
      }
    } catch {
      // Ignore
    }
  }, []);

  const detectLocation = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatus('UNAVAILABLE');
      setLocationLabel('Geolocation unavailable');
      return;
    }

    setStatus('DETECTING');
    setLocationLabel('Detecting location…');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setCoordinates({ lat, lon });

        // Resolve closest mandi and state
        const { mandi, distanceKm } = findNearestMandi(lat, lon);
        const st = STATES.find((s) => s.id === mandi.stateId);
        const dt = DISTRICTS.find((d) => d.id === mandi.districtId);

        setStateId(mandi.stateId);
        setDistrictId(mandi.districtId);
        setMandiId(mandi.id);
        setStatus('DETECTED');

        if (distanceKm < 35) {
          setLocationLabel(`${mandi.name}, ${st?.name || ''} (GPS)`);
        } else if (dt) {
          setLocationLabel(`Near ${dt.name}, ${st?.name || ''} (GPS)`);
        } else {
          setLocationLabel(`${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E (GPS)`);
        }
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('DENIED');
          setLocationLabel('Location permission denied');
        } else {
          setStatus('UNAVAILABLE');
          setLocationLabel('Unable to determine location');
        }
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  }, []);

  const setManualLocation = useCallback(
    (sId: string, dId?: string, mId?: string) => {
      setStateId(sId);
      setDistrictId(dId || null);
      setMandiId(mId || null);
      setStatus('MANUAL');

      const st = STATES.find((s) => s.id === sId);
      const dt = DISTRICTS.find((d) => d.id === dId);
      const mn = MANDIS.find((m) => m.id === mId);

      if (mn && mn.latitude != null && mn.longitude != null) {
        setCoordinates({ lat: mn.latitude, lon: mn.longitude });
        setLocationLabel(`${mn.name}, ${st?.name || ''}`);
      } else if (mn) {
        setLocationLabel(`${mn.name}, ${st?.name || ''}`);
      } else if (dt) {
        // Center of district if mandi not selected
        const firstMandi = MANDIS.find((m) => m.districtId === dId && m.latitude != null && m.longitude != null);
        if (firstMandi && firstMandi.latitude != null && firstMandi.longitude != null) {
          setCoordinates({ lat: firstMandi.latitude, lon: firstMandi.longitude });
        }
        setLocationLabel(`${dt.name}, ${st?.name || ''}`);
      } else if (st) {
        const firstStateMandi = MANDIS.find((m) => m.stateId === sId && m.latitude != null && m.longitude != null);
        if (firstStateMandi && firstStateMandi.latitude != null && firstStateMandi.longitude != null) {
          setCoordinates({ lat: firstStateMandi.latitude, lon: firstStateMandi.longitude });
        }
        setLocationLabel(`${st.name}`);
      }

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ stateId: sId, districtId: dId, mandiId: mId })
        );
      } catch {
        // Ignore
      }
    },
    []
  );

  const clearLocation = useCallback(() => {
    setCoordinates(null);
    setLocationLabel('Select location');
    setStatus('NOT_SET');
    setStateId(null);
    setDistrictId(null);
    setMandiId(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return (
    <LocationContext.Provider
      value={{
        coordinates,
        locationLabel,
        status,
        stateId,
        districtId,
        mandiId,
        detectLocation,
        setManualLocation,
        clearLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export const useLocationContext = useLocation;

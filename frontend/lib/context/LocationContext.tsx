'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { STATES as SEED_STATES, DISTRICTS as SEED_DISTRICTS, MANDIS as SEED_MANDIS } from '@/lib/data/geography';
import { ApiService } from '@/lib/services/api';

export type LocationStatus =
  | 'DETECTING'
  | 'DETECTED'
  | 'MANUAL'
  | 'DENIED'
  | 'UNAVAILABLE'
  | 'NOT_SET';

export interface Coordinates {
  lat: number;
  lon: number;
}

export interface LocationContextType {
  coordinates: Coordinates | null;
  locationLabel: string;
  status: LocationStatus;
  stateId: string | null;
  districtId: string | null;
  mandiId: string | null;
  detectLocation: () => Promise<void>;
  setManualLocation: (
    stateId: string,
    districtId?: string,
    mandiId?: string,
    customCoords?: Coordinates,
    customLabel?: string
  ) => void;
  clearLocation: () => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

const STORAGE_KEY = 'agri_manual_location';

interface StoredLocation {
  stateId: string | null;
  districtId: string | null;
  mandiId: string | null;
  coordinates: Coordinates | null;
  locationLabel: string;
  status: LocationStatus;
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [locationLabel, setLocationLabel] = useState<string>('Select location');
  const [status, setStatus] = useState<LocationStatus>('NOT_SET');
  const [stateId, setStateId] = useState<string | null>(null);
  const [districtId, setDistrictId] = useState<string | null>(null);
  const [mandiId, setMandiId] = useState<string | null>(null);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: StoredLocation = JSON.parse(saved);
        if (parsed.stateId) {
          setStateId(parsed.stateId);
          setDistrictId(parsed.districtId || null);
          setMandiId(parsed.mandiId || null);
          setStatus(parsed.status || 'MANUAL');

          // If coordinates were previously saved, restore them immediately
          if (parsed.coordinates && parsed.coordinates.lat != null && parsed.coordinates.lon != null) {
            setCoordinates(parsed.coordinates);
            setLocationLabel(parsed.locationLabel || 'Saved Location');
          } else {
            // Asynchronously resolve coordinates for national mandi or state
            setLocationLabel(parsed.locationLabel || 'Resolving location…');
            if (parsed.mandiId) {
              ApiService.getMandi(parsed.mandiId).then((m) => {
                if (m && m.latitude != null && m.longitude != null) {
                  const coords: Coordinates = { lat: m.latitude, lon: m.longitude };
                  setCoordinates(coords);
                  const lbl = parsed.locationLabel || `${m.name}, ${parsed.stateId?.toUpperCase()} (Saved)`;
                  setLocationLabel(lbl);
                  localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                      ...parsed,
                      coordinates: coords,
                      locationLabel: lbl,
                    })
                  );
                }
              });
            } else if (parsed.stateId) {
              ApiService.getMandis({ stateId: parsed.stateId }).then((mList) => {
                const withCoords = mList?.find((m) => m.latitude != null && m.longitude != null);
                if (withCoords) {
                  const coords: Coordinates = { lat: withCoords.latitude!, lon: withCoords.longitude! };
                  setCoordinates(coords);
                  const lbl = parsed.locationLabel || `${parsed.stateId?.toUpperCase()} (Saved)`;
                  setLocationLabel(lbl);
                  localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({
                      ...parsed,
                      coordinates: coords,
                      locationLabel: lbl,
                    })
                  );
                }
              });
            }
          }
        } else if (parsed.coordinates && parsed.coordinates.lat != null && parsed.coordinates.lon != null) {
          setCoordinates(parsed.coordinates);
          setLocationLabel(parsed.locationLabel || 'GPS Location');
          setStatus(parsed.status || 'DETECTED');
        }
      }
    } catch {
      // Ignore parse errors
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
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        const coords: Coordinates = { lat, lon };
        setCoordinates(coords);

        try {
          const nearby = await ApiService.getNearbyMandis(lat, lon, 100);
          if (nearby && nearby.length > 0) {
            const nearest = nearby[0];
            setStateId(nearest.stateId);
            setDistrictId(nearest.districtId);
            setMandiId(nearest.id);
            setStatus('DETECTED');
            const lbl = `${nearest.name}, ${nearest.stateId ? nearest.stateId.toUpperCase() : 'India'} (GPS)`;
            setLocationLabel(lbl);
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({
                stateId: nearest.stateId,
                districtId: nearest.districtId,
                mandiId: nearest.id,
                coordinates: coords,
                locationLabel: lbl,
                status: 'DETECTED',
              })
            );
            return;
          }
        } catch {
          // Ignore API error and fall back to coordinate display
        }

        const fallbackLbl = `${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E (GPS)`;
        setLocationLabel(fallbackLbl);
        setStatus('DETECTED');
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            stateId: null,
            districtId: null,
            mandiId: null,
            coordinates: coords,
            locationLabel: fallbackLbl,
            status: 'DETECTED',
          })
        );
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
      { timeout: 8000, enableHighAccuracy: true }
    );
  }, []);

  const setManualLocation = useCallback(
    (
      sId: string,
      dId?: string,
      mId?: string,
      customCoords?: Coordinates,
      customLabel?: string
    ) => {
      setStateId(sId);
      setDistrictId(dId || null);
      setMandiId(mId || null);
      setStatus('MANUAL');

      // If coordinates are explicitly provided
      if (customCoords && customCoords.lat != null && customCoords.lon != null) {
        setCoordinates(customCoords);
        const lbl = customLabel || `${sId.toUpperCase()} (Saved)`;
        setLocationLabel(lbl);
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              stateId: sId,
              districtId: dId || null,
              mandiId: mId || null,
              coordinates: customCoords,
              locationLabel: lbl,
              status: 'MANUAL',
            })
          );
        } catch {}
        return;
      }

      // Otherwise resolve coordinates asynchronously from national database
      if (mId) {
        ApiService.getMandi(mId).then((m) => {
          if (m && m.latitude != null && m.longitude != null) {
            const coords: Coordinates = { lat: m.latitude, lon: m.longitude };
            setCoordinates(coords);
            const lbl = customLabel || `${m.name}, ${sId.toUpperCase()} (Saved)`;
            setLocationLabel(lbl);
            try {
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                  stateId: sId,
                  districtId: dId || null,
                  mandiId: mId,
                  coordinates: coords,
                  locationLabel: lbl,
                  status: 'MANUAL',
                })
              );
            } catch {}
          }
        });
      } else if (dId) {
        ApiService.getMandis({ districtId: dId }).then((mList) => {
          const withCoords = mList?.find((m) => m.latitude != null && m.longitude != null);
          if (withCoords) {
            const coords: Coordinates = { lat: withCoords.latitude!, lon: withCoords.longitude! };
            setCoordinates(coords);
            const lbl = customLabel || `${dId.replace(/^[a-z]{2}-/, '')}, ${sId.toUpperCase()} (Saved)`;
            setLocationLabel(lbl);
            try {
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                  stateId: sId,
                  districtId: dId,
                  mandiId: null,
                  coordinates: coords,
                  locationLabel: lbl,
                  status: 'MANUAL',
                })
              );
            } catch {}
          }
        });
      } else if (sId) {
        ApiService.getMandis({ stateId: sId }).then((mList) => {
          const withCoords = mList?.find((m) => m.latitude != null && m.longitude != null);
          if (withCoords) {
            const coords: Coordinates = { lat: withCoords.latitude!, lon: withCoords.longitude! };
            setCoordinates(coords);
            const lbl = customLabel || `${sId.toUpperCase()} (Saved)`;
            setLocationLabel(lbl);
            try {
              localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify({
                  stateId: sId,
                  districtId: null,
                  mandiId: null,
                  coordinates: coords,
                  locationLabel: lbl,
                  status: 'MANUAL',
                })
              );
            } catch {}
          }
        });
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

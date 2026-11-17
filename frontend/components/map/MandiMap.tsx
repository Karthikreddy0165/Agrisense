'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatPrice } from '@/lib/utils/formatters';

// Fix leaflet icon default assets
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const userIcon = L.divIcon({
  className: 'user-loc-marker',
  html: `<div style="background-color: #166534; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.4);"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

interface MapMandi {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  latestPrice?: number | null;
  distanceKm?: number;
}

interface MandiMapProps {
  mandis: MapMandi[];
  selectedMandiId?: string | null;
  userLocation?: { lat: number; lon: number } | null;
  onSelectMandi?: (mandiId: string) => void;
  className?: string;
}

export default function MandiMap({
  mandis,
  selectedMandiId,
  userLocation,
  onSelectMandi,
  className,
}: MandiMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = userLocation?.lat || 20.5937;
    const initialLon = userLocation?.lon || 78.9629;
    const initialZoom = userLocation ? 9 : 5;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: initialZoom,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>Your Location</b>');
      } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lon]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // Update mandi markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current.clear();

    const bounds = L.latLngBounds([]);

    mandis.forEach((mandi) => {
      if (!mandi.latitude || !mandi.longitude) return;

      const isSelected = mandi.id === selectedMandiId;
      const marker = L.marker([mandi.latitude, mandi.longitude], {
        icon: isSelected ? selectedIcon : defaultIcon,
      }).addTo(map);

      const priceHtml = mandi.latestPrice
        ? `<div style="font-size: 13px; font-weight: 700; color: #166534; margin-top: 2px;">${formatPrice(mandi.latestPrice)}/qtl</div>`
        : `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Price observation pending</div>`;

      const distHtml = mandi.distanceKm != null
        ? `<div style="font-size: 11px; color: #475569;">${mandi.distanceKm} km away</div>`
        : '';

      const popupContent = `
        <div style="font-family: inherit; min-width: 150px;">
          <strong style="font-size: 14px; color: #0f172a;">${mandi.name}</strong>
          ${distHtml}
          ${priceHtml}
          <div style="margin-top: 8px;">
            <a href="/market/${mandi.id}" style="display: inline-block; font-size: 11px; font-weight: 600; color: #166534; text-decoration: underline;">
              View Market Profile &rarr;
            </a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectMandi) {
          onSelectMandi(mandi.id);
        }
      });

      markersRef.current.set(mandi.id, marker);
      bounds.extend([mandi.latitude, mandi.longitude]);
    });

    if (userLocation) {
      bounds.extend([userLocation.lat, userLocation.lon]);
    }

    if (mandis.length > 0 && !selectedMandiId) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11 });
    }
  }, [mandis, onSelectMandi]);

  // Handle selected mandi highlighting
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedMandiId) return;

    const marker = markersRef.current.get(selectedMandiId);
    if (marker) {
      marker.setIcon(selectedIcon);
      marker.openPopup();
      map.panTo(marker.getLatLng(), { animate: true, duration: 0.5 });
    }

    // Reset other markers to default
    markersRef.current.forEach((m, id) => {
      if (id !== selectedMandiId) {
        m.setIcon(defaultIcon);
      }
    });
  }, [selectedMandiId]);

  return (
    <div
      ref={mapContainerRef}
      className={className || 'w-full h-full min-h-[400px] rounded-xl overflow-hidden shadow-inner'}
    />
  );
}

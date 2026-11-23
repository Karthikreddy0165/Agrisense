'use client';

import { useEffect, useRef, useCallback } from 'react';
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
  html: `<div style="background-color: #166534; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

function buildPopupHtml(mandi: MapMandi) {
  const priceHtml = mandi.latestPrice
    ? `<div style="font-size: 13px; font-weight: 700; color: #166534; margin-top: 2px;">${formatPrice(mandi.latestPrice)}/qtl</div>`
    : `<div style="font-size: 11px; color: #64748b; margin-top: 2px;">Price observation pending</div>`;

  const distHtml = mandi.distanceKm != null
    ? `<div style="font-size: 11px; color: #475569;">${mandi.distanceKm} km away</div>`
    : '';

  return `
    <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 160px;">
      <strong style="font-size: 14px; color: #0f172a; display: block; line-height: 1.2;">${mandi.name}</strong>
      ${distHtml}
      ${priceHtml}
      <div style="margin-top: 8px;">
        <a href="/market/${mandi.id}" style="display: inline-block; font-size: 11px; font-weight: 600; color: #166534; text-decoration: underline;">
          View Market Profile &rarr;
        </a>
      </div>
    </div>
  `;
}

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
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const selectedHighlightMarkerRef = useRef<L.Marker | null>(null);
  const lastFittedBoundsSignature = useRef<string>('');

  // 1. Initialize map once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = userLocation?.lat || 21.0;
    const initialLon = userLocation?.lon || 78.5;
    const initialZoom = userLocation ? 9 : 5;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: initialZoom,
      zoomControl: true,
      preferCanvas: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const canvas = L.canvas({ padding: 0.5 });
    canvas.addTo(map);
    canvasRendererRef.current = canvas;

    const layerGroup = L.layerGroup().addTo(map);
    layerGroupRef.current = layerGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
      canvasRendererRef.current = null;
    };
  }, []);

  // 2. Update user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation && userLocation.lat != null && userLocation.lon != null) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon, zIndexOffset: 2000 })
          .addTo(map)
          .bindPopup('<b>Your Saved / Detected Location</b>');
      } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lon]);
      }
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  // 3. Batch render mandi markers efficiently
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    const canvas = canvasRendererRef.current;
    if (!map || !layerGroup) return;

    // Clear existing markers from group in 1 operation
    layerGroup.clearLayers();

    const bounds = L.latLngBounds([]);
    const isLargeDataset = mandis.length > 80;

    mandis.forEach((mandi) => {
      if (mandi.latitude == null || mandi.longitude == null) return;

      const isSelected = mandi.id === selectedMandiId;
      const popupHtml = buildPopupHtml(mandi);

      if (isLargeDataset && canvas) {
        // High-performance canvas rendering for large national datasets (0 extra DOM elements)
        const circle = L.circleMarker([mandi.latitude, mandi.longitude], {
          renderer: canvas,
          radius: isSelected ? 8 : 4.5,
          color: isSelected ? '#15803d' : '#166534',
          fillColor: isSelected ? '#22c55e' : '#4ade80',
          fillOpacity: isSelected ? 0.95 : 0.75,
          weight: isSelected ? 2.5 : 1.2,
        });

        circle.bindPopup(popupHtml);
        circle.on('click', () => {
          if (onSelectMandi) onSelectMandi(mandi.id);
        });

        layerGroup.addLayer(circle);
      } else {
        // Standard interactive pin markers for filtered / regional subsets
        const marker = L.marker([mandi.latitude, mandi.longitude], {
          icon: isSelected ? selectedIcon : defaultIcon,
          zIndexOffset: isSelected ? 1000 : 0,
        });

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
          if (onSelectMandi) onSelectMandi(mandi.id);
        });

        layerGroup.addLayer(marker);
      }

      bounds.extend([mandi.latitude, mandi.longitude]);
    });

    if (userLocation && userLocation.lat != null && userLocation.lon != null) {
      bounds.extend([userLocation.lat, userLocation.lon]);
    }

    // Only auto-fit bounds when the set of mandis or location actually changed significantly
    if (bounds.isValid() && mandis.length > 0 && !selectedMandiId) {
      const signature = `${mandis.length}-${bounds.getNorth().toFixed(2)}-${bounds.getSouth().toFixed(2)}`;
      if (signature !== lastFittedBoundsSignature.current) {
        lastFittedBoundsSignature.current = signature;
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 11, animate: true, duration: 0.5 });
      }
    }
  }, [mandis, onSelectMandi]);

  // 4. Highlight and pan to selected mandi
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!selectedMandiId) {
      if (selectedHighlightMarkerRef.current) {
        selectedHighlightMarkerRef.current.remove();
        selectedHighlightMarkerRef.current = null;
      }
      return;
    }

    const selectedMandi = mandis.find((m) => m.id === selectedMandiId);
    if (selectedMandi && selectedMandi.latitude != null && selectedMandi.longitude != null) {
      if (!selectedHighlightMarkerRef.current) {
        selectedHighlightMarkerRef.current = L.marker([selectedMandi.latitude, selectedMandi.longitude], {
          icon: selectedIcon,
          zIndexOffset: 3000,
        }).addTo(map);
      } else {
        selectedHighlightMarkerRef.current.setLatLng([selectedMandi.latitude, selectedMandi.longitude]);
      }

      const popupHtml = buildPopupHtml(selectedMandi);
      selectedHighlightMarkerRef.current.bindPopup(popupHtml).openPopup();
      map.panTo([selectedMandi.latitude, selectedMandi.longitude], { animate: true, duration: 0.5 });
    }
  }, [selectedMandiId, mandis]);

  return (
    <div
      ref={mapContainerRef}
      className={className || 'w-full h-full min-h-[400px] rounded-xl overflow-hidden shadow-inner'}
    />
  );
}

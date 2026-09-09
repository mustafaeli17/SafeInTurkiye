import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Coordinates } from '../services/locationService';
import { RouteGeometryPoint } from '../services/routingService';

interface RouteMapProps {
  originCoords: Coordinates | null;
  destCoords: Coordinates | null;
  geometry: RouteGeometryPoint[] | null;
}

export default function RouteMap({ originCoords, destCoords, geometry }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([41.0082, 28.9784], 11);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();
    const bounds: L.LatLngExpression[] = [];

    // Origin Marker
    if (originCoords) {
      const originIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color:#00A3E0; width:16px; height:16px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([originCoords.lat, originCoords.lng], { icon: originIcon })
        .bindPopup('<b>Start Location</b>')
        .addTo(layerGroup);
      bounds.push([originCoords.lat, originCoords.lng]);
    }

    // Destination Marker
    if (destCoords) {
      const destIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `<div style="background-color:#EF4444; width:16px; height:16px; border-radius:50%; border:3px solid #ffffff; box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });
      L.marker([destCoords.lat, destCoords.lng], { icon: destIcon })
        .bindPopup('<b>Destination</b>')
        .addTo(layerGroup);
      bounds.push([destCoords.lat, destCoords.lng]);
    }

    // Route Polyline
    if (geometry && geometry.length > 0) {
      const latlngs: L.LatLngExpression[] = geometry.map(p => [p.lat, p.lng]);
      L.polyline(latlngs, {
        color: '#00A3E0',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round'
      }).addTo(layerGroup);
    }

    if (bounds.length > 0) {
      map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 15 });
    }
  }, [originCoords, destCoords, geometry]);

  return (
    <div className="w-full h-full min-h-[300px] rounded-2xl overflow-hidden border border-sky-100 shadow-sm relative z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
    </div>
  );
}
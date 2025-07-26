'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface RoutingMachineProps {
  map: L.Map;
  routeCoordinates: L.LatLng[];
}

const RoutingMachine = ({ map, routeCoordinates }: RoutingMachineProps) => {
  const routingLayerRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!map) return;

    if (routingLayerRef.current) {
        map.removeLayer(routingLayerRef.current);
    }
    
    if (routeCoordinates && routeCoordinates.length > 0) {
        const polyline = L.polyline(routeCoordinates, { color: 'hsl(var(--primary))', weight: 6, opacity: 0.8 }).addTo(map);
        routingLayerRef.current = polyline;
        map.fitBounds(L.latLngBounds(routeCoordinates), { padding: [50, 50] });
    }

    return () => {
      if (routingLayerRef.current && map) {
        map.removeLayer(routingLayerRef.current);
      }
    };
  }, [map, routeCoordinates]);

  return null;
};

export default RoutingMachine;

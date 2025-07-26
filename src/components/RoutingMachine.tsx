'use client';
import { useEffect, useRef } from 'react';
import type { Map, Polyline, LatLng } from 'leaflet';

interface RoutingMachineProps {
  map: Map;
  routeCoordinates: LatLng[];
}

const RoutingMachine = ({ map, routeCoordinates }: RoutingMachineProps) => {
  const routingLayerRef = useRef<Polyline | null>(null);

  useEffect(() => {
    if (!map || typeof window === 'undefined') return;
    
    // Dynamically import leaflet only on the client-side
    const L = require('leaflet');

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
        try {
          map.removeLayer(routingLayerRef.current);
        } catch(e) {
          // It might already be removed by the time this runs, so we can ignore the error
        }
      }
    };
  }, [map, routeCoordinates]);

  return null;
};

export default RoutingMachine;

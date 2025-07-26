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

    // Remove the old route layer if it exists
    if (routingLayerRef.current) {
        map.removeLayer(routingLayerRef.current);
    }
    
    // If we have new route coordinates, create and add the new polyline
    if (routeCoordinates && routeCoordinates.length > 1) {
        const polyline = L.polyline(routeCoordinates, { color: 'hsl(var(--primary))', weight: 6, opacity: 0.8 }).addTo(map);
        routingLayerRef.current = polyline;
    }

    // Don't add a cleanup function here, as it can interfere with re-renders
  }, [map, routeCoordinates]); // Rerun this effect if the map instance or route coordinates change

  return null;
};

export default RoutingMachine;

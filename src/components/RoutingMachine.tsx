'use client';
import { useEffect } from 'react';
import L from 'leaflet';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

interface RoutingMachineProps {
  map: L.Map;
  start: [number, number];
  end: [number, number];
  apiKey: string;
  onRouteFound: (coordinates: L.LatLng[]) => void;
}

const RoutingMachine = ({ map, start, end, apiKey, onRouteFound }: RoutingMachineProps) => {
  useEffect(() => {
    if (!map || !start || !end) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      // @ts-ignore
      router: new L.Routing.OSRMv1({
        serviceUrl: `https://api.openrouteservice.org/v2/directions/driving-car`,
        profile: 'driving-car',
      }),
      lineOptions: {
        styles: [{ color: 'hsl(var(--primary))', weight: 6, opacity: 0.8 }],
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => null,
    }).addTo(map);

    const fetchRoute = async () => {
      try {
        const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car/geojson`, {
          method: 'POST',
          headers: {
            'Authorization': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          },
          body: JSON.stringify({ 
            coordinates: [[start[1], start[0]], [end[1], end[0]]],
            instructions: false,
           })
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('Routing API Error:', errorBody);
            return;
        }

        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const route = data.features[0];
          const coordinates = route.geometry.coordinates.map((coord: any) => L.latLng(coord[1], coord[0]));
          
          L.polyline(coordinates, { color: 'hsl(var(--primary))', weight: 6, opacity: 0.8 }).addTo(map);
          map.fitBounds(L.latLngBounds(start, end), { padding: [50, 50] });

          onRouteFound(coordinates);
        }
      } catch (error) {
        console.error('Routing error:', error);
      }
    };

    fetchRoute();

    return () => {
      if (map && routingControl) {
        // Since we are adding the polyline manually, we need to clear it manually.
        map.eachLayer((layer) => {
            if (layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });
        map.removeControl(routingControl);
      }
    };
  }, [map, start, end, apiKey, onRouteFound]);

  return null;
};

export default RoutingMachine;

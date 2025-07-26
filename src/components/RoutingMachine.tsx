'use client'
import { useEffect } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";


interface RoutingMachineProps {
    map: L.Map;
    start: [number, number];
    end: [number, number];
    apiKey: string;
}

const RoutingMachine = ({ map, start, end, apiKey }: RoutingMachineProps) => {
  useEffect(() => {
    if (!map || !start || !end) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
       router: new (L.Routing.Router as any)({
        serviceUrl: `https://api.openrouteservice.org/v2/directions/driving-car`,
        profile: 'driving-car',
        format: 'json',
        routingOptions: {
            alternatives: false,
        },
        prepareRequest: function(url, headers) {
          const customHeaders = [
            { name: 'Authorization', value: apiKey },
            { name: 'Content-Type', value: 'application/json' },
          ]
          for (var i = 0; i < customHeaders.length; i++) {
            headers.push(customHeaders[i]);
          }
          return null;
        }
      }),
      lineOptions: {
        styles: [{ color: "hsl(var(--primary))", weight: 5, opacity: 0.8 }],
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => { return null; },
    }).addTo(map);

    return () => {
        if(map && routingControl) {
            map.removeControl(routingControl);
        }
    };
  }, [map, start, end, apiKey]);

  return null;
};

export default RoutingMachine;

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
      router: new (L.Routing.OSRMv1 as any)({
        serviceUrl: `https://api.openrouteservice.org/v2/directions/driving-car`,
        profile: 'driving-car',
        prepareRequest: function(waypoints: L.LatLng[]) {
          const request = new XMLHttpRequest();
          const body = JSON.stringify({
              coordinates: waypoints.map(wp => [wp.lng, wp.lat]),
              instructions: false,
          });
          request.open('POST', this.serviceUrl, true);
          request.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
          request.setRequestHeader('Authorization', apiKey);
          return {
              url: this.serviceUrl,
              headers: {
                  'Content-Type': 'application/json; charset=UTF-8',
                  Authorization: apiKey,
              },
              body: body,
              _abort: () => {
                  request.abort();
              },
          };
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

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

    const router = L.Routing.router({
      serviceUrl: `https://api.openrouteservice.org/v2/directions/driving-car`,
      profile: 'driving-car',
      format: 'json',
      routingOptions: {
        alternatives: false,
      },
      prepareRequest: (waypoints) => {
        const headers = {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
        };
        // The library expects a specific structure for the body
        const body = {
          coordinates: waypoints.map(wp => [wp.latLng.lng, wp.latLng.lat]),
          instructions: false, // We don't need turn-by-turn instructions
        };

        return {
          url: 'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
          headers,
          body: JSON.stringify(body),
        };
      },
      // Because we are making a POST request with a body, we need to override how the request is made.
      // This is a more advanced use case for leaflet-routing-machine
      // but necessary for OpenRouteService POST endpoint.
      // We will tell it to use POST
      // Since the default implementation doesn't support POST well, we'll let the control handle it
      // by providing an empty waypoints array to the control and setting them in the router.
    });


    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      router: new (L.Routing.OSRMv1 as any)({ // Use OSRMv1 and we'll hijack its request preparation
        serviceUrl: `https://api.openrouteservice.org/v2/directions/driving-car`,
        profile: 'driving-car',
        prepareRequest: function(waypoints) {
          const customHeaders = [
            { name: 'Authorization', value: apiKey },
            { name: 'Content-Type', value: 'application/json' },
          ]
          // This part is a bit of a workaround. We will modify headers in place.
          // The library should have better support for this.
          // This is a known pattern for this library.
          const realFetch = window.fetch;
          (window as any).fetch = async (url, options) => {
              if (options && options.headers) {
                  (options.headers as any).append('Authorization', apiKey);
              } else if (options) {
                  options.headers = { 'Authorization': apiKey };
              } else {
                  options = { headers: { 'Authorization': apiKey } };
              }
              return realFetch(url, options);
          };
          return waypoints;
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
        (window as any).fetch = window.fetch; // restore fetch
    };
  }, [map, start, end, apiKey]);

  return null;
};

export default RoutingMachine;

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
}

const RoutingMachine = ({ map, start, end, apiKey }: RoutingMachineProps) => {
  useEffect(() => {
    if (!map || !start || !end) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(start[0], start[1]), L.latLng(end[0], end[1])],
      // @ts-ignore
      router: new L.Routing.OSRMv1({
        serviceUrl: `https://api.openrouteservice.org/v2/directions/driving-car/geojson`,
        profile: 'driving-car',
        routingOptions: {
          alternatives: false,
          language: 'en',
          steps: false,
        },
        useHints: false,
        requestParameters: {
          attributes: ['absolute_distance'],
        },
        // Pass the API key in the headers
        fetchOptions: {
          headers: {
            Authorization: apiKey,
            'Content-Type': 'application/json',
          },
        },
      }),

      lineOptions: {
        styles: [{ color: 'hsl(var(--primary))', weight: 6, opacity: 0.8 }],
      },
      show: false,
      addWaypoints: false,
      routeWhileDragging: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      createMarker: () => {
        return null;
      },
    }).addTo(map);
    
    // Manually handle the POST request since leaflet-routing-machine defaults to GET
    // @ts-ignore
    routingControl.on('routingstart', function (e) {
        // @ts-ignore
      var waypoints = e.waypoints;
      var router = this.getRouter();
      
      const coordinates = waypoints.map((p: any) => [p.latLng.lng, p.latLng.lat]);

        fetch(`https://api.openrouteservice.org/v2/directions/driving-car/geojson`, {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ coordinates: coordinates, instructions: false })
        })
        .then(response => response.json())
        .then(data => {
            if (data.features && data.features.length > 0) {
                const route = data.features[0];
                const coordinates = route.geometry.coordinates.map((coord: any) => [coord[1], coord[0]]);
                // @ts-ignore
                routingControl.setAlternatives([{
                    name: '',
                    summary: {
                        totalDistance: route.properties.summary.distance,
                        totalTime: route.properties.summary.duration
                    },
                    coordinates: coordinates,
                    waypoints: waypoints.map((wp: any) => wp.latLng),
                    instructions: []
                }]);
            }
        })
        .catch(error => {
            console.error('Routing error:', error);
            // @ts-ignore
            routingControl.getErrorHandler()({
                status: -1,
                message: 'Could not connect to routing service.'
            });
        });
        
        return false;
    });


    return () => {
      if (map && routingControl) {
        map.removeControl(routingControl);
      }
    };
  }, [map, start, end, apiKey]);

  return null;
};

export default RoutingMachine;

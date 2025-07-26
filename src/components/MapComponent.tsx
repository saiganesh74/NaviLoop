'use client';

import 'leaflet/dist/leaflet.css';
import { Icon, LatLngExpression, Map as LeafletMap, map as createMap, tileLayer, marker, icon } from 'leaflet';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import RoutingMachine from './RoutingMachine';

interface Location {
  lat: number;
  lng: number;
}

interface MapComponentProps {
  userLocation: Location | null;
  busLocation: Location | undefined | null;
}

const customBusIcon = new Icon({
  iconUrl: '/bus-pin.svg',
  iconSize: [40, 40],
});

const customUserIcon = new Icon({
    iconUrl: '/user-pin.svg',
    iconSize: [32, 32],
  });

const MapComponent = ({ userLocation, busLocation }: MapComponentProps) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [center, setCenter] = useState<Location>({ lat: 34.0522, lng: -118.2437 });
  
  useEffect(() => {
    if (userLocation) {
      setCenter(userLocation);
    }
  }, [userLocation]);


  useEffect(() => {
    if (mapRef.current === null) {
      const mapElement = document.getElementById('map');
      if (mapElement && !(mapElement as any)._leaflet_id) {
        const leafletMap = createMap('map').setView([center.lat, center.lng], 13);
        mapRef.current = leafletMap;

        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(leafletMap);

        setMapReady(true);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  useEffect(() => {
    if (mapRef.current && userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 15);
    }
  }, [userLocation, mapReady]);


  // Add/Update markers
  useEffect(() => {
    if (mapRef.current && mapReady) {
      // Clear existing markers before adding new ones
      mapRef.current.eachLayer((layer) => {
        if (layer instanceof L.Marker) {
          mapRef.current?.removeLayer(layer);
        }
      });
      
      if (userLocation) {
        marker([userLocation.lat, userLocation.lng], { icon: customUserIcon }).addTo(mapRef.current);
      }
      if (busLocation) {
        marker([busLocation.lat, busLocation.lng], { icon: customBusIcon }).addTo(mapRef.current);
      }
    }
  }, [userLocation, busLocation, mapReady]);


  const apiKey = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjI1ODQ2ZTZjMzg0NjRmZmM4OTNmYmNiZmM3MzljN2NjIiwiaCI6Im11cm11cjY0In0=";

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return (
      <div className="w-full h-full relative bg-muted flex items-center justify-center">
        <Image 
          src="https://placehold.co/1200x800.png" 
          alt="Map placeholder" 
          fill
          style={{objectFit: "cover"}}
          data-ai-hint="street map"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white p-4 bg-black/70 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Map Unavailable</h3>
                <p className="text-sm">Please add an OpenRouteService API key to enable the interactive map.</p>
                <a href="https://openrouteservice.org/dev-login/" target="_blank" rel="noopener noreferrer" className="text-primary underline mt-2 inline-block">Get a free API Key</a>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" id="map">
       {mapReady && mapRef.current && userLocation && busLocation && (
          <RoutingMachine
              map={mapRef.current}
              start={[userLocation.lat, userLocation.lng]}
              end={[busLocation.lat, busLocation.lng]}
              apiKey={apiKey}
          />
       )}
    </div>
  );
};

export default MapComponent;

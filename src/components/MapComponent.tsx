'use client';

import 'leaflet/dist/leaflet.css';
import { Icon, Map as LeafletMap, map as createMap, tileLayer, marker, LatLng } from 'leaflet';
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
  onRouteFound: (coordinates: LatLng[]) => void;
}

const customBusIcon = new Icon({
  iconUrl: '/bus-pin.svg',
  iconSize: [60, 60],
  iconAnchor: [30, 60],
});

const customUserIcon = new Icon({
    iconUrl: '/user-pin.svg',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
  });

const MapComponent = ({ userLocation, busLocation, onRouteFound }: MapComponentProps) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const [mapReady, setMapReady] = useState(false);
  
  useEffect(() => {
    if (mapRef.current === null) {
      const mapElement = document.getElementById('map');
      if (mapElement && !(mapElement as any)._leaflet_id) {
        const initialCenter = userLocation || { lat: 17.3850, lng: 78.4867 };
        const leafletMap = createMap('map').setView([initialCenter.lat, initialCenter.lng], 13);
        mapRef.current = leafletMap;

        tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(leafletMap);

        setMapReady(true);
      }
    }
  }, [userLocation]);

  useEffect(() => {
    if (mapRef.current && userLocation) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = marker([userLocation.lat, userLocation.lng], { icon: customUserIcon }).addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      }
      mapRef.current.setView([userLocation.lat, userLocation.lng], mapRef.current.getZoom() || 15);
    }
  }, [userLocation, mapReady]);


  // Add/Update markers
  useEffect(() => {
    if (mapRef.current && mapReady) {
      if (busLocation) {
        if (!busMarkerRef.current) {
          busMarkerRef.current = marker([busLocation.lat, busLocation.lng], { icon: customBusIcon }).addTo(mapRef.current);
        } else {
          busMarkerRef.current.setLatLng([busLocation.lat, busLocation.lng]);
        }
      }
    }
  }, [busLocation, mapReady]);


  const apiKey = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY;

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
              onRouteFound={onRouteFound}
          />
       )}
    </div>
  );
};

export default MapComponent;

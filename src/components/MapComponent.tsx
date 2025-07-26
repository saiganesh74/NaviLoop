'use client';

import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, LatLngExpression } from 'leaflet';
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

function ChangeView({ center, zoom } : {center: LatLngExpression, zoom: number}) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

const MapComponent = React.memo(function MapComponent({ userLocation, busLocation }: MapComponentProps) {
  const [center, setCenter] = useState<Location>({ lat: 34.0522, lng: -118.2437 });
  
  useEffect(() => {
    if (userLocation) {
      setCenter(userLocation);
    }
  }, [userLocation]);

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
                <p className="text-sm">Please add an OpenRouteService API key to your .env.local file to enable the interactive map.</p>
                <a href="https://openrouteservice.org/dev-login/" target="_blank" rel="noopener noreferrer" className="text-primary underline mt-2 inline-block">Get a free API Key</a>
            </div>
        </div>
      </div>
    );
  }

  const userPosition: LatLngExpression | undefined = userLocation ? [userLocation.lat, userLocation.lng] : undefined;
  const busPosition: LatLngExpression | undefined = busLocation ? [busLocation.lat, busLocation.lng] : undefined;

  return (
    <div className="w-full h-full">
        <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true}>
            <ChangeView center={[center.lat, center.lng]} zoom={15} />
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {userPosition && (
                <Marker position={userPosition} icon={customUserIcon}>
                </Marker>
            )}
            {busPosition && (
                 <Marker position={busPosition} icon={customBusIcon}>
                 </Marker>
            )}
            {userLocation && busLocation && (
                <RoutingMachine
                    start={[userLocation.lat, userLocation.lng]}
                    end={[busLocation.lat, busLocation.lng]}
                    apiKey={apiKey}
                />
            )}
        </MapContainer>
    </div>
  );
});

export default MapComponent;

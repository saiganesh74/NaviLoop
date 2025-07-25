'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import BusIcon from './icons/BusIcon';
import UserIcon from './icons/UserIcon';
import PolylineComponent from './PolylineComponent';

interface Location {
  lat: number;
  lng: number;
}

interface MapComponentProps {
  userLocation: Location | null;
  busLocation: Location | undefined | null;
}

export default function MapComponent({ userLocation, busLocation }: MapComponentProps) {
  const [center, setCenter] = useState<Location>({ lat: 34.0522, lng: -118.2437 }); // Default to LA
  
  useEffect(() => {
    if (userLocation) {
      setCenter(userLocation);
    }
  }, [userLocation]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <p className="text-destructive p-4 text-center">
          Google Maps API key is missing or invalid. Please add it to the .env.local file.
        </p>
      </div>
    );
  }

  const path = [userLocation, busLocation].filter(Boolean) as Location[];

  return (
    <div className="w-full h-full">
      <APIProvider apiKey={apiKey}>
        <Map
          center={center}
          zoom={15}
          mapId="naviloop-map"
          disableDefaultUI={true}
          gestureHandling={'greedy'}
          style={{ width: '100%', height: '100%' }}
        >
          {userLocation && (
            <AdvancedMarker position={userLocation} title="Your Location">
              <UserIcon />
            </AdvancedMarker>
          )}

          {busLocation && (
            <AdvancedMarker position={busLocation} title="Bus Location">
              <BusIcon />
            </AdvancedMarker>
          )}

          {path.length === 2 && (
             <PolylineComponent path={path} />
          )}

        </Map>
      </APIProvider>
    </div>
  );
}

'use client';

import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';
import BusIcon from './icons/BusIcon';
import UserIcon from './icons/UserIcon';
import PolylineComponent from './PolylineComponent';
import Image from 'next/image';

interface Location {
  lat: number;
  lng: number;
}

interface MapComponentProps {
  userLocation: Location | null;
  busLocation: Location | undefined | null;
}

export default function MapComponent({ userLocation, busLocation }: MapComponentProps) {
  const [center, setCenter] = useState<Location>({ lat: 34.0522, lng: -118.2437 });
  
  useEffect(() => {
    if (userLocation) {
      setCenter(userLocation);
    }
  }, [userLocation]);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    return (
      <div className="w-full h-full relative bg-muted flex items-center justify-center">
        <Image 
          src="https://placehold.co/1200x800.png" 
          alt="Map placeholder" 
          layout="fill"
          objectFit="cover"
          data-ai-hint="street map"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white p-4 bg-black/70 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Map Unavailable</h3>
                <p className="text-sm">Please add a Google Maps API key to your .env.local file to enable the interactive map.</p>
            </div>
        </div>
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

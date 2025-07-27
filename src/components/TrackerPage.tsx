'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bus, Clock, LogOut, TrafficCone, AlertTriangle, User as UserIcon } from 'lucide-react';
import { calculateETA } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getRoute } from '@/ai/flows/routing-flow';
import { ThemeToggle } from './ThemeToggle';
import type { LatLng, Map as LeafletMap, Polyline } from 'leaflet';


interface Location {
  lat: number;
  lng: number;
}

interface BusData {
  location: Location;
  status: 'normal' | 'breakdown';
  speed: number; // in km/h
}

interface TrafficData {
  level: 'low' | 'medium' | 'high';
}

const MOCK_USER_LOCATION: Location = { lat: 17.4375, lng: 78.4484 }; // Jubilee Hills
const MOCK_BUS_START_LOCATION: Location = { lat: 17.4262, lng: 78.4552 }; // Approx 2km away, Banjara Hills
const MOCK_TRAFFIC_DATA: TrafficData = { level: 'low' };

export default function TrackerPage({ busId }: { busId: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [busData, setBusData] = useState<BusData | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficData | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<LatLng[]>([]);
  const [map, setMap] = useState<LeafletMap | null>(null);
  
  const routeIndexRef = useRef(0);
  const polylineRef = useRef<Polyline | null>(null);

  const notificationSentRef = useRef(false);
  const { toast } = useToast();

  const MapComponent = useMemo(() => dynamic(() => import('./MapComponent'), { 
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
   }), []);

  const handleRouteFound = useCallback((coordinates: LatLng[]) => {
      if (!map || typeof window.L === 'undefined') return;
      
      setRoute(coordinates);
      
      // Remove old polyline if it exists
      if (polylineRef.current) {
          map.removeLayer(polylineRef.current);
      }
      
      // Add new polyline
      const newPolyline = window.L.polyline(coordinates, { color: 'hsl(var(--primary))', weight: 6, opacity: 0.8 }).addTo(map);
      polylineRef.current = newPolyline;

      // Fit map to route bounds
      const bounds = window.L.latLngBounds(coordinates);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      
      // Set initial bus position at the start of the route
      if (coordinates.length > 0) {
        const startLocation = { lat: coordinates[0].lat, lng: coordinates[0].lng };
        setBusData(prev => prev ? {...prev, location: startLocation} : {
          location: startLocation,
          status: 'normal',
          speed: 40,
        });
        routeIndexRef.current = 0; // Reset route index
      }
  }, [map]);

  useEffect(() => {
    // Geolocation logic
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            () => {
                console.warn("Geolocation failed or was denied. Using mock user location.");
                setUserLocation(MOCK_USER_LOCATION);
            }
        );
    } else {
      console.warn("Geolocation is not supported by this browser. Using mock user location.");
      setUserLocation(MOCK_USER_LOCATION);
    }
    
    // Initial Bus Data
    const seed = parseInt(busId, 10) / 1000;
    const busStartLocation: Location = {
        lat: MOCK_BUS_START_LOCATION.lat + seed,
        lng: MOCK_BUS_START_LOCATION.lng + seed,
    };
    
    setBusData({
      location: busStartLocation,
      status: 'normal',
      speed: 40,
    });
    
    setTrafficData(MOCK_TRAFFIC_DATA);
    setError(null);
  }, [busId]);


  useEffect(() => {
    const fetchAndSetRoute = async () => {
        if (userLocation && busData?.location) {
            try {
                const routeData = await getRoute({ start: busData.location, end: userLocation });
                const leafletRoute = routeData.coordinates.map(c => ({ lat: c.lat, lng: c.lng } as LatLng));
                handleRouteFound(leafletRoute);
            } catch (e: any) {
                console.error("Failed to fetch route via flow", e);
                setError(e.message || "Could not calculate the bus route.");
                toast({
                    variant: "destructive",
                    title: "Routing Error",
                    description: e.message || "Could not calculate the bus route.",
                });
            }
        }
    };
    
    // Fetch route only if we have locations but no route yet.
    if (userLocation && busData?.location && route.length === 0 && map) {
        fetchAndSetRoute();
    }
  }, [userLocation, busData?.location, busId, handleRouteFound, toast, route.length, map]);

   // Bus movement simulation effect
   useEffect(() => {
    if (busData?.status !== 'normal' || route.length === 0) {
      return;
    }

    const intervalId = setInterval(() => {
      routeIndexRef.current += 1;
      
      if (routeIndexRef.current >= route.length) {
        // Bus has reached the end of the route
        routeIndexRef.current = route.length - 1; 
        clearInterval(intervalId); // Stop the simulation
      }
      
      const newPos = route[routeIndexRef.current];
      setBusData(prevBusData => prevBusData ? { ...prevBusData, location: { lat: newPos.lat, lng: newPos.lng } } : null);

    }, 2000); // Update every 2 seconds

    return () => clearInterval(intervalId); // Cleanup on component unmount or when dependencies change

  }, [route, busData?.status]);
  
  
  useEffect(() => {
    if (userLocation && busData && route.length > 0 && typeof window !== 'undefined' && window.L) {
      if (busData.status === 'breakdown') {
        setEta(null);
        return;
      }
      
      let remainingDistance = 0;
      if (routeIndexRef.current < route.length - 1) {
        for (let i = routeIndexRef.current; i < route.length - 1; i++) {
            remainingDistance += window.L.latLng(route[i]).distanceTo(window.L.latLng(route[i+1]));
        }
      }
      remainingDistance = remainingDistance / 1000; // convert to KM

      const calculatedEta = calculateETA(remainingDistance, busData.speed, trafficData?.level);
      setEta(calculatedEta);

      if (calculatedEta !== null && calculatedEta <= 1 && !notificationSentRef.current) {
        toast({
          title: "Bus is Arriving Soon!",
          description: `Bus ${busId} is less than a minute away.`,
        });
        notificationSentRef.current = true;
      }
    }
  }, [userLocation, busData, trafficData, toast, busId, route]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  const handleMapReady = useCallback((mapInstance: LeafletMap) => {
    setMap(mapInstance);
  }, []);

  const renderETA = () => {
    if (busData?.status === 'breakdown') return <span className="text-destructive font-bold">Not Available</span>;
    if (eta === null) return <span>Calculating...</span>;
    if (eta === Infinity) return <span>Bus is not moving</span>;
    if (route.length > 0 && routeIndexRef.current >= route.length -1) return <span className="text-green-600 font-bold">Arrived</span>;
    if (eta < 1/60) return <span className="text-green-600 font-bold">Arriving now</span>;
    const minutes = Math.floor(eta);
    const seconds = Math.floor((eta * 60) % 60);
    return <span>{`${minutes} min ${seconds} sec`}</span>;
  };
  
  return (
    <div className="relative h-screen w-screen overflow-hidden">
        <MapComponent 
            userLocation={userLocation} 
            busLocation={busData?.location}
            onMapReady={handleMapReady}
            routeCoordinates={route}
        />
      
      <div className="absolute top-4 left-4 z-[1000] w-full max-w-sm">
        <Card className="shadow-2xl">
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><Bus className="text-primary"/> Bus {busId} Status</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2"><Clock size={16}/> ETA</span>
              {renderETA()}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2"><TrafficCone size={16}/> Traffic</span>
              <span className="capitalize">{trafficData?.level || 'Normal'}</span>
            </div>
             <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2"><AlertTriangle size={16}/> Bus State</span>
              <span className={`capitalize font-bold ${busData?.status === 'breakdown' ? 'text-destructive' : 'text-green-600'}`}>
                {busData?.status || 'Loading...'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="absolute top-4 right-4 z-[1000] flex gap-2">
         <Button variant="secondary" size="icon" className="shadow-2xl" onClick={() => router.push('/bus-selection')}>
            <Bus size={20} />
            <span className="sr-only">Change Bus</span>
         </Button>
        <Card className="shadow-2xl">
            <CardContent className="p-2 flex items-center gap-2">
                 <Avatar>
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback><UserIcon size={20}/></AvatarFallback>
                </Avatar>
                <div className="text-sm pr-2">
                    <p className="font-semibold">{user?.displayName || user?.email}</p>
                </div>
                <ThemeToggle />
                <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground">
                    <LogOut size={20} />
                </Button>
            </CardContent>
        </Card>
      </div>
      
      {(busData?.status === 'breakdown' || error) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md">
            <Alert variant="destructive" className="shadow-2xl bg-accent text-accent-foreground border-accent">
                <AlertTriangle className="h-4 w-4 !text-accent-foreground" />
                <AlertTitle className="font-bold">{busData?.status === 'breakdown' ? 'Bus Breakdown!' : 'Alert'}</AlertTitle>
                <AlertDescription>
                    {busData?.status === 'breakdown' ? 'The bus has broken down. Please check for updates. ETA is currently unavailable.' : error}
                </AlertDescription>
            </Alert>
        </div>
      )}

      {(!userLocation || !busData) && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-[2000]">
            <Card className="p-8 text-center">
                <CardHeader>
                    <CardTitle>Connecting to NaviLoop...</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2">
                        {!userLocation ? <Skeleton className="h-5 w-40"/> : <span className="text-green-600 font-bold">User Location OK</span>}
                    </div>
                     <div className="flex items-center gap-2">
                        {!busData ? <Skeleton className="h-5 w-40"/> : <span className="text-green-600 font-bold">Bus Feed OK</span>}
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
    </div>
  );
}

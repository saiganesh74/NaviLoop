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
import L from 'leaflet';

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
  const [route, setRoute] = useState<L.LatLng[]>([]);
  
  const routeIndexRef = useRef(0);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const notificationSentRef = useRef(false);
  const { toast } = useToast();

  const MapComponent = useMemo(() => dynamic(() => import('./MapComponent'), { 
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
   }), []);

  const handleRouteFound = useCallback((coordinates: L.LatLng[]) => {
      setRoute(coordinates);
      routeIndexRef.current = 0; 
  }, []);


  useEffect(() => {
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
    
    const seed = parseInt(busId, 10) / 1000;
    const busStartLocation: Location = {
        lat: MOCK_BUS_START_LOCATION.lat + seed,
        lng: MOCK_BUS_START_LOCATION.lng + seed,
    };

    const initialBusData = {
      location: { ...busStartLocation },
      status: 'normal' as 'normal' | 'breakdown',
      speed: 40,
    };
    setBusData(initialBusData);
    setTrafficData(MOCK_TRAFFIC_DATA);
    setError(null);
  }, [busId]);


  const moveBus = useCallback(() => {
    setBusData(prevBusData => {
      if (!prevBusData || !route || route.length === 0) return prevBusData;

      const currentRouteIndex = routeIndexRef.current;
      if (currentRouteIndex < route.length - 1) {
        const nextIndex = currentRouteIndex + 1;
        const newPos = route[nextIndex];
        routeIndexRef.current = nextIndex;
        return { ...prevBusData, location: { lat: newPos.lat, lng: newPos.lng } };
      }
      
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
      return prevBusData;
    });
  }, [route]);


  useEffect(() => {
    if (route.length > 0 && busData?.status === 'normal') {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
      simulationIntervalRef.current = setInterval(moveBus, 1000); 
    }
    
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [route, busData?.status, moveBus]);


  useEffect(() => {
    if (userLocation && busData) {
      if (busData.status === 'breakdown') {
        setEta(null);
        return;
      }
      
      let remainingDistance = 0;
      if (route.length > 0 && routeIndexRef.current < route.length - 1) {
        for (let i = routeIndexRef.current; i < route.length - 1; i++) {
            remainingDistance += route[i].distanceTo(route[i+1]);
        }
      }
      remainingDistance = remainingDistance / 1000; // convert to KM

      const calculatedEta = calculateETA(remainingDistance, busData.speed, trafficData?.level);
      setEta(calculatedEta);

      if (calculatedEta !== null && calculatedEta * 60 <= 40 && !notificationSentRef.current) {
        toast({
          title: "Bus is Arriving Soon!",
          description: `Bus ${busId} is less than 40 seconds away.`,
        });
        notificationSentRef.current = true;
      }
    }
  }, [userLocation, busData, trafficData, toast, busId, route]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const renderETA = () => {
    if (busData?.status === 'breakdown') return <span className="text-destructive font-bold">Not Available</span>;
    if (eta === null) return <span>Calculating...</span>;
    if (eta === Infinity) return <span>Bus is not moving</span>;
    if (routeIndexRef.current >= route.length -1) return <span className="text-green-600 font-bold">Arrived</span>;
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
            onRouteFound={handleRouteFound}
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
            <CardContent className="p-3 flex items-center gap-3">
                 <Avatar>
                    <AvatarImage src={user?.photoURL || undefined} />
                    <AvatarFallback><UserIcon size={20}/></AvatarFallback>
                </Avatar>
                <div className="text-sm">
                    <p className="font-semibold">{user?.displayName || user?.email}</p>
                </div>
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

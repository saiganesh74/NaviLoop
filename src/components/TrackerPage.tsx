'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bus, Clock, LogOut, TrafficCone, AlertTriangle, User as UserIcon, PartyPopper } from 'lucide-react';
import { calculateETA } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getRoute } from '@/ai/flows/routing-flow';
import { ThemeToggle } from './ThemeToggle';
import type { LatLng, Map as LeafletMap, Polyline } from 'leaflet';
import { Separator } from './ui/separator';


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
  const [showArrivalAlert, setShowArrivalAlert] = useState(false);
  
  const routeIndexRef = useRef(0);
  const polylineRef = useRef<Polyline | null>(null);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);


  const notificationSentRef = useRef(false);
  const { toast } = useToast();

  const MapComponent = useMemo(() => dynamic(() => import('./MapComponent'), { 
    ssr: false,
    loading: () => <Skeleton className="h-full w-full" />,
   }), []);
   
   // Cleanup function
   useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const handleRouteFound = useCallback((coordinates: LatLng[]) => {
      if (!map || typeof window.L === 'undefined') return;
      
      setRoute(coordinates);
      
      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
      }
      
      const newPolyline = window.L.polyline(coordinates, { color: 'hsl(var(--primary))', weight: 6, opacity: 0.8 }).addTo(map);
      polylineRef.current = newPolyline;

      const bounds = window.L.latLngBounds(coordinates);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
      
      if (coordinates.length > 0) {
        const startLocation = { lat: coordinates[0].lat, lng: coordinates[0].lng };
        routeIndexRef.current = 0; 
        setShowArrivalAlert(false);

        setBusData({
          location: startLocation,
          status: 'normal',
          speed: 40,
        });

        // Clear any existing simulation before starting a new one
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

        // Start simulation
        simulationIntervalRef.current = setInterval(() => {
            setBusData(prevBusData => {
              if (!prevBusData || prevBusData.status !== 'normal') {
                  if(simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
                  return prevBusData;
              }
      
              if (routeIndexRef.current >= coordinates.length - 1) {
                if(simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
                setShowArrivalAlert(true);
                return { ...prevBusData, speed: 0 };
              }
      
              routeIndexRef.current += 1;
              const newPos = coordinates[routeIndexRef.current];
              return { ...prevBusData, location: { lat: newPos.lat, lng: newPos.lng } };
            });
        }, 2000);

        // Schedule breakdown after a timeout
        const breakdownTimeout = setTimeout(() => {
            setBusData(prev => prev ? { ...prev, status: 'breakdown', speed: 0 } : null);
            if(simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        }, 10000); // Breakdown after 10 seconds

        // Cleanup timeout on unmount
        return () => clearTimeout(breakdownTimeout);
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
    if (busData?.status === 'breakdown') return <span className="font-bold text-destructive">Not Available</span>;
    if (eta === null) return <span>Calculating...</span>;
    if (busData?.speed === 0 && routeIndexRef.current >= route.length -1) return <span className="text-green-600 font-bold">Arrived</span>;
    if (eta === Infinity) return <span>Bus is not moving</span>;
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

      <div className="absolute top-4 right-4 z-[1000] flex gap-2 items-center bg-background/80 backdrop-blur-sm rounded-full shadow-2xl p-1">
         <Button variant="ghost" size="icon" className="rounded-full" onClick={() => router.push('/bus-selection')}>
            <Bus size={20} />
            <span className="sr-only">Change Bus</span>
         </Button>
         <Separator orientation='vertical' className='h-6'/>
         <Button variant="ghost" className='rounded-full p-2 h-auto'>
            <Avatar className='w-7 h-7'>
                <AvatarImage src={user?.photoURL || undefined} />
                <AvatarFallback><UserIcon size={16}/></AvatarFallback>
            </Avatar>
            <div className="text-sm pr-2 pl-2">
                <p className="font-semibold">{user?.displayName || user?.email}</p>
            </div>
        </Button>
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-foreground rounded-full">
            <LogOut size={20} />
        </Button>
      </div>
      
      {showArrivalAlert && (
         <div className="absolute inset-0 bg-black/80 z-[1001] flex items-center justify-center">
            <Card className="w-full max-w-md p-6 text-center shadow-2xl border bg-card">
                <CardHeader>
                    <div className="w-24 h-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4 border">
                        <PartyPopper className="w-12 h-12 text-primary"/>
                    </div>
                    <CardTitle className="text-3xl font-bold">Bus Arrived!</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground">Bus {busId} has reached your location.</p>
                     <Button onClick={() => setShowArrivalAlert(false)} className="mt-6">
                        Awesome!
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}

      {(busData?.status === 'breakdown' || error) && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md">
            <Alert variant="destructive" className="shadow-2xl">
                <AlertTriangle className="h-4 w-4" />
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

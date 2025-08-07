'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bus, Clock, LogOut, TrafficCone, AlertTriangle, User as UserIcon, School } from 'lucide-react';
import { calculateETA } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getRoute } from '@/ai/flows/routing-flow';
import { ThemeToggle } from './ThemeToggle';
import type { LatLng, Map as LeafletMap } from 'leaflet';
import { Separator } from './ui/separator';


interface Location {
  lat: number;
  lng: number;
}

interface BusData {
  location: Location;
  status: 'enroute' | 'finished';
  speed: number; // in km/h
}

interface TrafficData {
  level: 'low' | 'medium' | 'high';
}

const MOCK_BUS_START_LOCATION: Location = { lat: 17.4262, lng: 78.4552 }; // Banjara Hills
const MOCK_USER_LOCATION: Location = { lat: 17.4375, lng: 78.4484 }; // Ameerpet
const COLLEGE_LOCATION: Location = { lat: 17.5927, lng: 78.4358 }; // St. Peters Engineering College

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
  const [journeyStage, setJourneyStage] = useState<'toUser' | 'toCollege'>('toUser');
  const [arrivalStatus, setArrivalStatus] = useState<'user' | 'college' | null>(null);
  
  const routeIndexRef = useRef(0);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationSentRef = useRef({ user: false, college: false });

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
  
  const startSimulation = useCallback((coordinates: LatLng[]) => {
      if (coordinates.length > 0) {
        routeIndexRef.current = 0;
        
        const startLocation = { lat: coordinates[0].lat, lng: coordinates[0].lng };
        
        setBusData({
          location: startLocation,
          status: 'enroute',
          speed: 40,
        });
        
        setShowArrivalAlert(false);

        // Clear any existing simulation before starting a new one
        if (simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);

        // Start simulation
        simulationIntervalRef.current = setInterval(() => {
            setBusData(prevBusData => {
              if (!prevBusData || prevBusData.status !== 'enroute') {
                  if(simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
                  return prevBusData;
              }
      
              if (routeIndexRef.current >= coordinates.length - 1) {
                  if(simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
                  
                  if(journeyStage === 'toUser') {
                    setArrivalStatus('user');
                  } else {
                    setArrivalStatus('college');
                  }

                  return { ...prevBusData, speed: 0, status: journeyStage === 'toCollege' ? 'finished' : 'enroute' };
              }
      
              routeIndexRef.current += 1;
              const newPos = coordinates[routeIndexRef.current];
              return { ...prevBusData, location: { lat: newPos.lat, lng: newPos.lng } };
            });
        }, 1000); // Move to next coordinate every 1 second
      }
  }, [journeyStage]);

  // Fetch route and start simulation
  const fetchAndSetRoute = useCallback(async (start: Location, end: Location) => {
    try {
      const routeData = await getRoute({ start, end });
      const leafletRoute = routeData.coordinates.map(c => ({ lat: c.lat, lng: c.lng } as LatLng));
      setRoute(leafletRoute);
      if (leafletRoute.length > 0) {
        startSimulation(leafletRoute);
      }
    } catch (e: any) {
      console.error("Failed to fetch route via flow", e);
      setError(e.message || "Could not calculate the bus route.");
      toast({
        variant: "destructive",
        title: "Routing Error",
        description: e.message || "Could not calculate the bus route.",
      });
    }
  }, [startSimulation, toast]);

  // Initial setup and journey management
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
    
    setTrafficData(MOCK_TRAFFIC_DATA);
    setError(null);
  }, []);

  // Effect to handle journey stages
  useEffect(() => {
    if (!userLocation || !map) return;
  
    // Only fetch route if it's not already set for the current stage
    if (journeyStage === 'toUser' && route.length === 0) {
      const seed = parseInt(busId, 10) / 1000;
      const busStartLocation: Location = {
          lat: MOCK_BUS_START_LOCATION.lat + seed,
          lng: MOCK_BUS_START_LOCATION.lng + seed,
      };
      fetchAndSetRoute(busStartLocation, userLocation);
    } else if (journeyStage === 'toCollege' && busData?.location && route.length === 0) {
        fetchAndSetRoute(busData.location, COLLEGE_LOCATION);
    }
  }, [journeyStage, userLocation, map, busId, fetchAndSetRoute, busData?.location, route.length]);

  // Effect to handle arrival events
  useEffect(() => {
    if (arrivalStatus === 'user') {
      toast({ title: `Bus ${busId} has arrived at your location!` });
      setShowArrivalAlert(true);
      setJourneyStage('toCollege');
      setRoute([]); // Clear route to trigger next stage
      setArrivalStatus(null); // Reset status
    } else if (arrivalStatus === 'college') {
      toast({ title: `Bus ${busId} has arrived at the college.` });
      setShowArrivalAlert(true);
      setBusData(prev => prev ? { ...prev, status: 'finished' } : null);
      setArrivalStatus(null); // Reset status
    }
  }, [arrivalStatus, toast, busId]);

  
  useEffect(() => {
    if (userLocation && busData && route.length > 0 && typeof window !== 'undefined' && window.L) {
      let remainingDistance = 0;
      if (routeIndexRef.current < route.length - 1) {
        const currentPos = window.L.latLng(busData.location.lat, busData.location.lng);
        const nextPoint = window.L.latLng(route[routeIndexRef.current + 1]);
        remainingDistance += currentPos.distanceTo(nextPoint);

        for (let i = routeIndexRef.current + 1; i < route.length - 1; i++) {
            remainingDistance += window.L.latLng(route[i]).distanceTo(window.L.latLng(route[i+1]));
        }
      }
      remainingDistance = remainingDistance / 1000; // convert to KM

      const calculatedEta = calculateETA(remainingDistance, busData.speed, trafficData?.level);
      setEta(calculatedEta);

      const notificationKey = journeyStage === 'toUser' ? 'user' : 'college';
      if (calculatedEta !== null && calculatedEta <= 1 && !notificationSentRef.current[notificationKey]) {
        toast({
          title: journeyStage === 'toUser' ? "Bus is Arriving Soon!" : "Approaching College!",
          description: journeyStage === 'toUser' 
            ? `Bus ${busId} is less than a minute away from your location.`
            : `Bus ${busId} is less than a minute away from the college.`,
        });
        notificationSentRef.current[notificationKey] = true;
      }
    }
  }, [userLocation, busData, trafficData, toast, busId, route, journeyStage]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  const handleMapReady = useCallback((mapInstance: LeafletMap) => {
    setMap(mapInstance);
  }, []);

  const handleRestartJourney = () => {
    toast({ title: 'New Journey Started', description: `Bus ${busId} has left the college.` });
    notificationSentRef.current = { user: false, college: false };
    setShowArrivalAlert(false);
    setJourneyStage('toUser');
    setRoute([]);
    setBusData(null);
  }

  const renderETA = () => {
    if (busData?.status === 'finished') return <span className="text-green-600 font-bold">Arrived at College</span>;
    if (eta === null) return <span>Calculating...</span>;
    if (busData?.speed === 0 && journeyStage === 'toUser') return <span className="text-green-600 font-bold">Arrived at You</span>;
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
            collegeLocation={COLLEGE_LOCATION}
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
              <span className="font-semibold flex items-center gap-2"><Clock size={16}/> ETA to {journeyStage === 'toUser' ? 'You' : 'College'}</span>
              {renderETA()}
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2"><TrafficCone size={16}/> Traffic</span>
              <span className="capitalize">{trafficData?.level || 'Normal'}</span>
            </div>
             <div className="flex items-center justify-between">
              <span className="font-semibold flex items-center gap-2"><School size={16}/> Destination</span>
              <span className={`capitalize font-bold text-primary`}>
                St. Peter's College
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
                        {busData?.status === 'finished' ? <School className="w-12 h-12 text-primary" /> : <UserIcon className="w-12 h-12 text-primary" />}
                    </div>
                    <CardTitle className="text-3xl font-bold text-card-foreground">
                        {busData?.status === 'finished' ? 'Bus Arrived at College!' : 'Bus Arrived at Your Stop!'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-lg text-muted-foreground">
                        {busData?.status === 'finished'
                            ? `Bus ${busId} has reached its final destination.`
                            : `Bus ${busId} has reached your location. Next stop: College.`
                        }
                    </p>
                     <Button 
                        onClick={() => {
                            if (busData?.status === 'finished') {
                                handleRestartJourney();
                            } else {
                                setShowArrivalAlert(false);
                            }
                        }}
                        className="mt-6"
                    >
                        {busData?.status === 'finished' ? 'Start New Journey' : 'Awesome!'}
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}

      {error && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md">
            <Card className="shadow-2xl bg-destructive/90 text-destructive-foreground">
                <CardContent className="p-4 flex items-center gap-4">
                    <AlertTriangle className="h-6 w-6 text-destructive-foreground flex-shrink-0" />
                    <div>
                        <p className="font-bold">
                           Alert
                        </p>
                        <p className="text-sm">
                            {error}
                        </p>
                    </div>
                </CardContent>
            </Card>
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

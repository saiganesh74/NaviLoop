'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bus, Clock, LogOut, TrafficCone, AlertTriangle, User as UserIcon, School } from 'lucide-react';
import { calculateETA, AlertState, hasExitedCollegeBoundary, shouldShowFiveMinuteAlert } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getRoute } from '@/ai/flows/routing-flow';
import { ThemeToggle } from './ThemeToggle';
import AlertSystem from './AlertSystem';
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
  const [remainingRoute, setRemainingRoute] = useState<LatLng[]>([]);
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [showArrivalAlert, setShowArrivalAlert] = useState(false);
  const [journeyStage, setJourneyStage] = useState<'toUser' | 'toCollege'>('toUser');
  const [arrivalStatus, setArrivalStatus] = useState<'user' | 'college' | null>(null);
  
  // Enhanced alert state management
  const [alertState, setAlertState] = useState<AlertState>({
    fiveMinuteWarning: false,
    oneMinuteWarning: false,
    arrivalWarning: false,
    collegeExitWarning: false,
  });
  const [showFiveMinuteAlert, setShowFiveMinuteAlert] = useState(false);
  const [showCollegeExitAlert, setShowCollegeExitAlert] = useState(false);
  const previousBusLocationRef = useRef<Location | null>(null);
  
  const routeIndexRef = useRef(0);
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationSentRef = useRef({ user: false, college: false, fiveMin: false });

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

  // Update remaining route as bus moves
  useEffect(() => {
    if (route.length > 0 && busData && routeIndexRef.current < route.length) {
      // Create remaining route from current bus position to destination
      const remaining = route.slice(routeIndexRef.current);
      setRemainingRoute(remaining);
    }
  }, [route, busData, routeIndexRef.current]);

  // Enhanced ETA calculation and alert system
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

      // Enhanced 5-minute warning popup (only for user pickup)
      if (calculatedEta !== null && calculatedEta <= 5 && calculatedEta > 3 && journeyStage === 'toUser' && !alertState.fiveMinuteWarning) {
        setShowFiveMinuteAlert(true);
        setAlertState(prev => ({ ...prev, fiveMinuteWarning: true }));
        toast({
          title: "Bus Approaching!",
          description: `Bus ${busId} is about ${Math.round(calculatedEta)} minutes away from your location. Check the popup for details!`,
        });
      }

      // One minute warning
      if (calculatedEta !== null && calculatedEta <= 1 && !alertState.oneMinuteWarning) {
        setAlertState(prev => ({ ...prev, oneMinuteWarning: true }));
        toast({
          title: journeyStage === 'toUser' ? "Bus is Arriving Soon!" : "Approaching College!",
          description: journeyStage === 'toUser' 
            ? `Bus ${busId} is less than a minute away from your location.`
            : `Bus ${busId} is less than a minute away from the college.`,
        });
      }
    }
  }, [userLocation, busData, trafficData, toast, busId, route, journeyStage, alertState]);

  // College boundary exit detection
  useEffect(() => {
    if (busData?.location) {
      // Check if bus has exited college boundary
      if (hasExitedCollegeBoundary(busData.location, previousBusLocationRef.current) && !alertState.collegeExitWarning) {
        setShowCollegeExitAlert(true);
        setAlertState(prev => ({ ...prev, collegeExitWarning: true }));
        toast({
          title: "Bus Departed from College",
          description: `Bus ${busId} has left the college and is now on route!`,
        });
      }
      
      // Update previous location for next comparison
      previousBusLocationRef.current = busData.location;
    }
  }, [busData?.location, alertState.collegeExitWarning, busId, toast]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };
  
  const handleMapReady = useCallback((mapInstance: LeafletMap) => {
    setMap(mapInstance);
  }, []);

  const handleRestartJourney = () => {
    toast({ title: 'New Journey Started', description: `Bus ${busId} has left the college.` });
    notificationSentRef.current = { user: false, college: false, fiveMin: false };
    setShowArrivalAlert(false);
    setJourneyStage('toUser');
    setRoute([]);
    setBusData(null);
    
    // Reset all alert states
    setAlertState({
      fiveMinuteWarning: false,
      oneMinuteWarning: false,
      arrivalWarning: false,
      collegeExitWarning: false,
    });
    setShowFiveMinuteAlert(false);
    setShowCollegeExitAlert(false);
    previousBusLocationRef.current = null;
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
          onMapReady={setMap}
          routeCoordinates={route}
          remainingRoute={remainingRoute}
          busSpeed={busData?.speed}
          eta={eta || undefined}
        />
      
      {/* Mobile-optimized main info card */}
      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 md:top-6 md:left-6 md:right-auto z-[1000] md:w-full md:max-w-sm">
        <Card className="bg-background/95 backdrop-blur-md border-0 shadow-xl">
          <CardHeader className="pb-2 sm:pb-3 md:pb-4">
            <CardTitle className="text-base sm:text-lg md:text-xl font-bold flex items-center gap-1.5 sm:gap-2 md:gap-3">
              <div className="p-1 sm:p-1.5 md:p-2 bg-primary/10 rounded-lg sm:rounded-xl">
                <Bus className="text-primary w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="truncate text-sm sm:text-base">Bus {busId}</span>
                  <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${busData?.status === 'finished' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`} />
                </div>
                <p className="text-[10px] sm:text-xs md:text-sm font-normal text-muted-foreground mt-0.5 md:mt-1 truncate">
                  {journeyStage === 'toUser' ? 'Coming to you' : 'Heading to college'}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5 sm:space-y-3 md:space-y-4">
            <div className="grid grid-cols-1 gap-2 sm:gap-2.5 md:gap-3">
              <div className="p-2 sm:p-2.5 md:p-3 bg-muted/30 rounded-lg sm:rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">ETA to {journeyStage === 'toUser' ? 'You' : 'College'}</span>
                  <Clock size={12} className="text-muted-foreground sm:hidden"/>
                  <Clock size={14} className="text-muted-foreground hidden sm:block"/>
                </div>
                <div className="text-sm sm:text-base md:text-lg font-bold">
                  {renderETA()}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3">
                <div className="p-2 sm:p-2.5 md:p-3 bg-muted/30 rounded-lg sm:rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Speed</span>
                    <TrafficCone size={10} className="text-muted-foreground sm:hidden"/>
                    <TrafficCone size={14} className="text-muted-foreground hidden sm:block"/>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold">{busData?.speed || 0} km/h</div>
                </div>
                
                <div className="p-2 sm:p-2.5 md:p-3 bg-muted/30 rounded-lg sm:rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Traffic</span>
                  </div>
                  <div className="text-xs sm:text-sm font-semibold capitalize">{trafficData?.level || 'Normal'}</div>
                </div>
              </div>
              
              <div className="p-2 sm:p-2.5 md:p-3 bg-primary/5 rounded-lg sm:rounded-xl border border-primary/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">Destination</span>
                  <School size={10} className="text-primary sm:hidden"/>
                  <School size={14} className="text-primary hidden sm:block"/>
                </div>
                <div className="text-xs sm:text-sm font-bold text-primary">St. Peter's College</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile-optimized top header */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 md:top-6 md:right-6 z-[1000] flex gap-2 md:gap-3 items-start">
        {/* Mobile: Ultra-compact header */}
        <div className="md:hidden flex gap-0.5 sm:gap-1 items-center bg-background/95 backdrop-blur-md rounded-xl sm:rounded-2xl shadow-xl p-1 sm:p-1.5 border-0">
          <Button variant="ghost" size="sm" className="rounded-lg sm:rounded-xl h-7 w-7 sm:h-8 sm:w-8 p-0" onClick={() => router.push('/bus-selection')} title="Change Bus">
            <Bus size={12} className="sm:hidden"/>
            <Bus size={14} className="hidden sm:block"/>
          </Button>
          
          <Avatar className='w-6 h-6 sm:w-7 sm:h-7 ring-1 ring-background'>
            <AvatarImage src={user?.photoURL || undefined} />
            <AvatarFallback className='bg-primary/10'>
              <UserIcon size={10} className="sm:hidden"/>
              <UserIcon size={12} className="hidden sm:block"/>
            </AvatarFallback>
          </Avatar>
          
          <div className="scale-75 sm:scale-100 origin-center">
            <ThemeToggle />
          </div>
          
          {/* Mobile debug buttons - smaller */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              setShowFiveMinuteAlert(true);
            }} 
            className="text-orange-500 hover:text-orange-600 rounded-lg sm:rounded-xl h-7 w-7 sm:h-8 sm:w-8 p-0"
            title="Test 5min Alert"
            type="button"
          >
            <Clock size={9} className="sm:hidden"/>
            <Clock size={10} className="hidden sm:block"/>
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => {
              e.preventDefault();
              setShowCollegeExitAlert(true);
            }} 
            className="text-blue-500 hover:text-blue-600 rounded-lg sm:rounded-xl h-7 w-7 sm:h-8 sm:w-8 p-0"
            title="Test College Exit"
            type="button"
          >
            <School size={9} className="sm:hidden"/>
            <School size={10} className="hidden sm:block"/>
          </Button>
          
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground rounded-lg sm:rounded-xl h-7 w-7 sm:h-8 sm:w-8 p-0">
            <LogOut size={10} className="sm:hidden"/>
            <LogOut size={12} className="hidden sm:block"/>
          </Button>
        </div>
        
        {/* Desktop: Full header */}
        <div className="hidden md:flex gap-2 items-center bg-background/95 backdrop-blur-md rounded-2xl shadow-xl p-2 border-0">
          <Button variant="ghost" size="sm" className="rounded-xl h-9 px-3 gap-2" onClick={() => router.push('/bus-selection')}>
            <Bus size={16} />
            <span className="text-sm font-medium">Change Bus</span>
          </Button>
          
          <Separator orientation='vertical' className='h-6 mx-1'/>
          
          <div className="flex items-center gap-2 px-2">
            <Avatar className='w-8 h-8 ring-2 ring-background'>
              <AvatarImage src={user?.photoURL || undefined} />
              <AvatarFallback className='bg-primary/10'><UserIcon size={14}/></AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold leading-none">{user?.displayName?.split(' ')[0] || 'Student'}</p>
              <p className="text-xs text-muted-foreground mt-1">Online</p>
            </div>
          </div>
          
          <Separator orientation='vertical' className='h-6 mx-1'/>
          
          <div className="flex gap-1">
            <ThemeToggle />
            {/* Debug buttons - remove in production */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                console.log('🧪 Test 5-minute alert clicked!');
                setShowFiveMinuteAlert(true);
              }} 
              className="text-orange-500 hover:text-orange-600 rounded-xl h-9 w-9 p-0"
              title="Test 5min Alert"
              type="button"
            >
              <Clock size={12} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => {
                e.preventDefault();
                console.log('🧪 Test college exit alert clicked!');
                setShowCollegeExitAlert(true);
              }} 
              className="text-blue-500 hover:text-blue-600 rounded-xl h-9 w-9 p-0"
              title="Test College Exit Alert"
              type="button"
            >
              <School size={12} />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-foreground rounded-xl h-9 w-9 p-0">
              <LogOut size={16} />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </div>
      </div>
      
      {showArrivalAlert && (
         <div className="absolute inset-0 bg-black/80 z-[1001] flex items-center justify-center p-2 sm:p-4">
            <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-2 sm:mx-4 p-3 sm:p-4 md:p-6 text-center shadow-2xl border bg-card">
                <CardHeader className="pb-3 sm:pb-4">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-2 sm:mb-3 md:mb-4 border">
                        {busData?.status === 'finished' ? <School className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-primary" /> : <UserIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-primary" />}
                    </div>
                    <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-card-foreground leading-tight">
                        {busData?.status === 'finished' ? 'Bus Arrived at College!' : 'Bus Arrived at Your Stop!'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                    <p className="text-xs sm:text-sm md:text-base lg:text-lg text-muted-foreground mb-3 sm:mb-4 md:mb-6">
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
                        className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base"
                        size="default"
                    >
                        {busData?.status === 'finished' ? 'Start New Journey' : 'Awesome!'}
                    </Button>
                </CardContent>
            </Card>
        </div>
      )}

      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] w-full max-w-md mx-6">
            <Card className="bg-destructive/95 backdrop-blur-md border-0 shadow-xl text-destructive-foreground">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-destructive-foreground/10 rounded-xl">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm mb-1">Connection Error</p>
                            <p className="text-xs opacity-90">{error}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}

      {(!userLocation || !busData) && (
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm flex items-center justify-center z-[2000] p-2 sm:p-4">
            <Card className="bg-background/50 backdrop-blur-md border-0 shadow-2xl max-w-xs sm:max-w-sm w-full mx-2 sm:mx-4">
                <CardContent className="p-4 sm:p-6 md:p-8 text-center">
                    <div className="p-3 sm:p-4 bg-primary/10 rounded-xl sm:rounded-2xl w-fit mx-auto mb-4 sm:mb-6">
                        <Bus className="h-6 w-6 sm:h-8 sm:w-8 text-primary animate-pulse" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2">Connecting to NaviLoop</h3>
                    <p className="text-muted-foreground text-xs sm:text-sm mb-4 sm:mb-6">Setting up your real-time tracking...</p>
                    
                    <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg sm:rounded-xl">
                            <span className="text-xs sm:text-sm font-medium">Location Services</span>
                            {!userLocation ? (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] sm:text-xs text-muted-foreground">Connecting...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
                                    <span className="text-[10px] sm:text-xs font-medium text-green-600">Connected</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex items-center justify-between p-2 sm:p-3 bg-muted/30 rounded-lg sm:rounded-xl">
                            <span className="text-xs sm:text-sm font-medium">Bus Tracking</span>
                            {!busData ? (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-500 rounded-full animate-pulse" />
                                    <span className="text-[10px] sm:text-xs text-muted-foreground">Connecting...</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 sm:gap-2">
                                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
                                    <span className="text-[10px] sm:text-xs font-medium text-green-600">Connected</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      )}
      
      {/* Enhanced Alert System */}
      <AlertSystem
        busId={busId}
        fiveMinuteAlert={showFiveMinuteAlert}
        onFiveMinuteAlertClose={() => setShowFiveMinuteAlert(false)}
        collegeExitAlert={showCollegeExitAlert}
        onCollegeExitAlertClose={() => setShowCollegeExitAlert(false)}
        eta={eta || 5}
      />
    </div>
  );
}

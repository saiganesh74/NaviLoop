'use client';

import 'leaflet/dist/leaflet.css';
import { Icon, Map as LeafletMap, map as createMap, tileLayer, marker, LatLng, latLngBounds, polyline } from 'leaflet';
import React, { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

declare global {
  interface Window {
    L: typeof import('leaflet');
  }
}

interface Location {
  lat: number;
  lng: number;
}

interface MapComponentProps {
  userLocation: Location | null;
  busLocation: Location | undefined | null;
  collegeLocation: Location | null;
  onMapReady: (map: LeafletMap) => void;
  routeCoordinates: LatLng[];
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

const customCollegeIcon = new Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2641/2641334.png',
  iconSize: [50, 50],
  iconAnchor: [25, 50],
});


const MapComponent = ({ userLocation, busLocation, collegeLocation, onMapReady, routeCoordinates }: MapComponentProps) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const collegeMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { theme } = useTheme();

  const lightTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
        const L = require('leaflet');
         // Check if the map is already initialized
        if (mapRef.current === null) {
            const mapElement = document.getElementById('map');
            if (mapElement && !(mapElement as any)._leaflet_id) {
                const initialCenter = userLocation || { lat: 17.3850, lng: 78.4867 };
                const leafletMap = createMap('map').setView([initialCenter.lat, initialCenter.lng], 13);
                mapRef.current = leafletMap;
                onMapReady(leafletMap);
            }
        }
    }
  }, [userLocation, onMapReady]);

  // Update tile layer based on theme
  useEffect(() => {
    if (!mapRef.current) return;
  
    const tileUrl = theme === 'dark' ? darkTileUrl : lightTileUrl;
    const attribution = theme === 'dark' 
      ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl);
    } else {
      tileLayerRef.current = tileLayer(tileUrl, { attribution }).addTo(mapRef.current);
    }
  
  }, [theme, mapRef.current]);

  // Update user marker
  useEffect(() => {
    if (mapRef.current && userLocation) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = marker([userLocation.lat, userLocation.lng], { icon: customUserIcon }).addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      }
    }
  }, [userLocation, mapRef.current]);

  // Update bus marker
  useEffect(() => {
    if (mapRef.current && busLocation) {
      if (!busMarkerRef.current) {
        busMarkerRef.current = marker([busLocation.lat, busLocation.lng], { icon: customBusIcon }).addTo(mapRef.current);
      } else {
        busMarkerRef.current.setLatLng([busLocation.lat, busLocation.lng]);
      }
    }
  }, [busLocation, mapRef.current]);

  // Update college marker
  useEffect(() => {
    if (mapRef.current && collegeLocation) {
      if (!collegeMarkerRef.current) {
        collegeMarkerRef.current = marker([collegeLocation.lat, collegeLocation.lng], { icon: customCollegeIcon }).addTo(mapRef.current)
          .bindPopup("St. Peter's Engineering College");
      } else {
        collegeMarkerRef.current.setLatLng([collegeLocation.lat, collegeLocation.lng]);
      }
    }
  }, [collegeLocation, mapRef.current]);
  
  // Draw route
  useEffect(() => {
    if (mapRef.current) {
      // Remove old polyline if it exists
      if (routePolylineRef.current) {
        mapRef.current.removeLayer(routePolylineRef.current);
      }
      
      if(routeCoordinates.length > 0) {
        // Add new polyline
        const route = polyline(routeCoordinates, { color: 'hsl(var(--primary))', weight: 6, opacity: 0.8 });
        route.addTo(mapRef.current);
        routePolylineRef.current = route;
        
        // Fit map to the entire route
        const bounds = latLngBounds(routeCoordinates);
        if (bounds.isValid()) {
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
      }
    }
  }, [routeCoordinates, mapRef.current]);

  const apiKey = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY;

  if (!apiKey) {
    return (
      <div className="w-full h-full relative bg-muted flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="text-center text-white p-4 bg-black/70 rounded-lg">
                <h3 className="font-bold text-lg mb-2">Map Unavailable</h3>
                <p className="text-sm">Please add an OpenRouteService API key to enable the interactive map.</p>
                <a href="https://openrouteservice.org/dashboard/" target="_blank" rel="noopener noreferrer" className="text-primary underline mt-2 inline-block">Get a free API Key</a>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full" id="map" />
  );
};

export default React.memo(MapComponent);

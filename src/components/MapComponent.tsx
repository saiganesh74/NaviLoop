'use client';

import 'leaflet/dist/leaflet.css';
import { Icon, Map as LeafletMap, map as createMap, tileLayer, marker, LatLng, latLngBounds } from 'leaflet';
import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
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

const MapComponent = ({ userLocation, busLocation, onMapReady, routeCoordinates }: MapComponentProps) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const { theme } = useTheme();

  const lightTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_matter/{z}/{x}/{y}{r}.png';
  
  useEffect(() => {
    if (mapRef.current === null && typeof window !== 'undefined') {
      window.L = require('leaflet');
      const mapElement = document.getElementById('map');
      if (mapElement && !(mapElement as any)._leaflet_id) {
        const initialCenter = userLocation || { lat: 17.3850, lng: 78.4867 };
        const leafletMap = createMap('map').setView([initialCenter.lat, initialCenter.lng], 13);
        mapRef.current = leafletMap;
        onMapReady(leafletMap);
      }
    }
  }, [userLocation, onMapReady]);

  useEffect(() => {
    if (mapRef.current) {
      const tileUrl = theme === 'dark' ? darkTileUrl : lightTileUrl;
      if (tileLayerRef.current) {
        tileLayerRef.current.setUrl(tileUrl);
      } else {
        tileLayerRef.current = tileLayer(tileUrl, {
          attribution: theme === 'dark' 
            ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(mapRef.current);
      }
    }
  }, [theme, mapRef, onMapReady, darkTileUrl, lightTileUrl]);

  useEffect(() => {
    if (mapRef.current && userLocation) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = marker([userLocation.lat, userLocation.lng], { icon: customUserIcon }).addTo(mapRef.current);
      } else {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      }
    }
  }, [userLocation]);


  // Add/Update markers
  useEffect(() => {
    if (mapRef.current) {
      if (busLocation) {
        if (!busMarkerRef.current) {
          busMarkerRef.current = marker([busLocation.lat, busLocation.lng], { icon: customBusIcon }).addTo(mapRef.current);
        } else {
          busMarkerRef.current.setLatLng([busLocation.lat, busLocation.lng]);
        }
      }
    }
  }, [busLocation]);
  
  // Fit map to the entire route when available
  useEffect(() => {
      if (mapRef.current && routeCoordinates.length > 0) {
        const bounds = latLngBounds(routeCoordinates);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
  }, [routeCoordinates]);


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
    </div>
  );
};

export default MapComponent;

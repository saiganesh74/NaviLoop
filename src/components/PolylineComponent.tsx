'use client';

import { useMap } from '@vis.gl/react-google-maps';
import { useEffect, useState } from 'react';

interface Location {
    lat: number;
    lng: number;
}

interface PolylineComponentProps {
    path: Location[];
}

export default function PolylineComponent({ path }: PolylineComponentProps) {
    const map = useMap();
    const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);

    useEffect(() => {
        if (!map) return;

        if (!polyline) {
            const newPolyline = new google.maps.Polyline({
                path,
                strokeColor: "#2E9AFE",
                strokeOpacity: 0.8,
                strokeWeight: 5,
            });
            newPolyline.setMap(map);
            setPolyline(newPolyline);
        } else {
            polyline.setPath(path);
        }

        return () => {
            if (polyline) {
                polyline.setMap(null);
            }
        };
    }, [map, path, polyline]);

    return null;
}

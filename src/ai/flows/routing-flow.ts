'use server';
/**
 * @fileOverview A server-side flow to fetch route data from OpenRouteService.
 * This acts as a proxy to avoid client-side CORS issues.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GetRouteInputSchema, GetRouteOutputSchema } from '../schemas/routing-schema';
import fetch from 'node-fetch';

export async function getRoute(input: z.infer<typeof GetRouteInputSchema>) {
    return getRouteFlow(input);
}

const getRouteFlow = ai.defineFlow(
  {
    name: 'getRouteFlow',
    inputSchema: GetRouteInputSchema,
    outputSchema: GetRouteOutputSchema,
  },
  async ({ start, end }) => {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouteService API key is not configured.');
    }

    const startCoords = `${start.lng},${start.lat}`;
    const endCoords = `${end.lng},${end.lat}`;
    
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startCoords}&end=${endCoords}`;

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
            },
        });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('OpenRouteService API Error:', errorBody);
        throw new Error(`API request failed with status ${response.status}: ${errorBody}`);
      }
      
      const data: any = await response.json();
      
      if (data && data.features && data.features.length > 0) {
        const route = data.features[0];
        // The API returns [lng, lat], so we need to reverse for Leaflet which expects [lat, lng]
        const coordinates = route.geometry.coordinates.map((coord: [number, number]) => ({ lat: coord[1], lng: coord[0] }));
        return { coordinates };
      } else {
        return { coordinates: [] };
      }
    } catch (e: any) {
        console.error('Failed to fetch route from OpenRouteService', e);
        throw new Error('Failed to fetch route.');
    }
  }
);

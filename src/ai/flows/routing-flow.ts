'use server';
/**
 * @fileOverview A routing agent that uses OpenRouteService.
 *
 * - getRoute - A function that fetches a route between two points.
 */

import { ai } from '@/ai/genkit';
import {
  GetRouteInputSchema,
  GetRouteOutputSchema,
  type GetRouteInput,
  type GetRouteOutput,
} from '@/ai/schemas/routing-schema';
import fetch from 'node-fetch';

export async function getRoute(input: GetRouteInput): Promise<GetRouteOutput> {
  return getRouteFlow(input);
}

const getRouteFlow = ai.defineFlow(
  {
    name: 'getRouteFlow',
    inputSchema: GetRouteInputSchema,
    outputSchema: GetRouteOutputSchema,
  },
  async (input) => {
    const apiKey = process.env.NEXT_PUBLIC_OPENROUTESERVICE_API_KEY;

    if (!apiKey) {
      throw new Error('OpenRouteService API key not configured.');
    }

    const startCoords = `${input.start.lng},${input.start.lat}`;
    const endCoords = `${input.end.lng},${input.end.lat}`;
    
    // The API expects the destination first, then the source for driving directions.
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${endCoords}&end=${startCoords}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        }
      });

      if (!response.ok) {
        let errorBody;
        try {
            errorBody = await response.json();
        } catch (e) {
            errorBody = await response.text();
        }
        console.error('OpenRouteService API Error:', errorBody);
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      // The API returns coordinates in [lng, lat] format, and the route from destination to source.
      // We need to reverse the coordinates to get the path from source to destination.
      if (data.features && data.features[0]) {
          data.features[0].geometry.coordinates.reverse();
      }
      return data;

    } catch (e: any) {
        console.error('Failed to fetch route from OpenRouteService', e);
        throw new Error('Failed to fetch route.');
    }
  }
);

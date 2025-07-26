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
    
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${startCoords}&end=${endCoords}`;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorBody = await response.json();
        console.error('OpenRouteService API Error:', errorBody);
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      return await response.json();
    } catch (e: any) {
        console.error('Failed to fetch route from OpenRouteService', e);
        throw new Error('Failed to fetch route.');
    }
  }
);

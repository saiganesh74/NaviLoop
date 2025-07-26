/**
 * @fileOverview Schemas for the routing flow.
 *
 * - GetRouteInputSchema - The Zod schema for the getRoute function input.
 * - GetRouteInput - The TypeScript type for the getRoute function input.
 * - GetRouteOutputSchema - The Zod schema for the getRoute function output.
 * - GetRouteOutput - The TypeScript type for the getRoute function output.
 */

import { z } from 'zod';

const LatLngSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

export const GetRouteInputSchema = z.object({
  start: LatLngSchema,
  end: LatLngSchema,
});

export type GetRouteInput = z.infer<typeof GetRouteInputSchema>;

// The output can be anything since we're just proxying the response
export const GetRouteOutputSchema = z.any();

export type GetRouteOutput = z.infer<typeof GetRouteOutputSchema>;

// This file provides the Schema type for client-side usage
// It avoids importing any CDK or backend dependencies

import type { Schema as ClientSchema } from './client-schema';

// Re-export for client usage
export type { ClientSchema as Schema };

// Helper type to extract model types
export type ModelTypes<S, T extends string, U> = S;